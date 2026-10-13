# CHECKLIST DE TESTES — DASHBOARD E ATUALIZAÇÃO DE BLOCOS
**Praticom ERP — Rastreabilidade, Execução e Resultados de Testes**

Este documento detalha todos os testes executados para validar as correções do Dashboard e a sincronização do nome dos Blocos com as Unidades no Praticom ERP, categorizando os erros confirmados, hipóteses investigadas, resultados das suítes de testes e instruções de reprodução manual.

---

## 1. Classificação das Evidências

### 1.1. Erros Confirmados
1. **Omissão do cálculo de `todayReservations` no backend:** No endpoint `GET /api/dashboard`, as reservas eram buscadas do banco, mas nenhuma filtragem por data do dia atual (`todayStr`) era feita, resultando em `undefined` no frontend e exibição de `0`.
2. **Omissão de `balance` / `currentBalance` no endpoint do Dashboard:** O backend chamava `financialDAO.getSummary()`, mas não incluía a propriedade `balance` no objeto `data.metrics`. O frontend lia `metrics.balance` e caía no fallback `R$ 0,00`.
3. **Vazamento Multi-Tenant Contábil no Condomínio 1:** A cláusula SQL de despesas sem unidade vinculada (`u.block_id IS NULL`) não exigia isolamento estrito de `condominium_id`, atribuindo faturas corporativas de outros condomínios ao Condomínio 1.
4. **Ausência de integração do Mercadinho no Dashboard:** O endpoint `/api/dashboard` não chamava o `MarketDAO`, omitindo produtos em falta (`stock_quantity <= 0`) e produtos abaixo do estoque mínimo (`stock_quantity <= min_stock`).
5. **Divergência de case no filtro de Avisos Urgentes:** O backend filtrava por `'URGENTE'` ou `'high'`, enquanto o formulário de cadastro e o banco de dados gravavam `'urgent'` (minúsculo em inglês), descartando todos os avisos urgentes.
6. **Desconexão entre `blocks.name` e `units.block` ao renomear bloco:** O método `CondominiumDAO.updateBlock` atualizava apenas a tabela `blocks`, sem sincronizar a coluna `units.block` das unidades associadas, e as consultas SQL com `SELECT u.*` ignoravam `blocks.name`.

### 1.2. Hipóteses Descartadas
1. **Hipótese de perda de integridade referencial nas unidades:** Suspeitou-se que alterar o bloco pudesse quebrar a chave estrangeira `block_id`. **Descartado:** a chave estrangeira permaneceu intacta (`block_id` aponta para o ID numérico do bloco).
2. **Hipótese de incompatibilidade de formato de data no SQLite:** Suspeitou-se de divergência de formato entre `YYYY-MM-DD` e timestamps ISO com fuso horário. **Descartado:** o SQLite armazena `YYYY-MM-DD` em formato texto; a causa real do descasamento era o cálculo de `new Date().toISOString()` em UTC após as 21:00 (Brasília), corrigido para cálculo com base na data local.

### 1.3. Limitações de Validação
- **Ambiente de Teste Local:** Os testes foram executados com o banco de dados de desenvolvimento SQLite (`server/condo_database.sqlite`), preservando o estado prévio com backup de segurança (`server/condo_database_pre_audit_fix_backup.sqlite`).

---

## 2. Checklist de Testes Automatizados Executados

### 2.1. Suíte Específica: `test_dashboard_blocks_fix.mjs`
Comando executado: `node server/tests/test_dashboard_blocks_fix.mjs`

| ID | Teste | Cenário Avaliado | Resultado |
| :--- | :--- | :--- | :--- |
| **TEST-01** | `1.1 Saldo em Caixa` | Endpoint `/api/dashboard` retorna `balance` idêntico ao `currentBalance` do FinancialDAO | **✅ APROVADO** |
| **TEST-02** | `1.2 Isolamento Contábil` | Faturas corporativas sem unidade vinculada não vazam para o Condomínio 1 | **✅ APROVADO** |
| **TEST-03** | `2.1 Reservas de Hoje` | Endpoint `/api/dashboard` calcula `todayReservations` com data local e status ativo | **✅ APROVADO** |
| **TEST-04** | `2.2 Ciclo de Vida da Reserva` | Criar e cancelar reserva atualiza dinamicamente o contador `todayReservations` | **✅ APROVADO** |
| **TEST-05** | `3.1 Integração do Mercadinho` | Endpoint `/api/dashboard` calcula e retorna total de produtos e métricas de estoque | **✅ APROVADO** |
| **TEST-06** | `3.2 Estoque Baixo vs Falta` | Diferenciação estrita entre `stock_quantity <= 0` e `0 < stock <= min_stock` | **✅ APROVADO** |
| **TEST-07** | `4.1 Mural de Avisos Urgentes` | Avisos com prioridade `'urgent'`, `'URGENTE'`, fixados e válidos aparecem no destaque | **✅ APROVADO** |
| **TEST-08** | `5.1 Renomeação de Bloco` | Ao alterar nome do bloco, todas as unidades vinculadas refletem o novo nome | **✅ APROVADO** |
| **TEST-09** | `5.2 Isolamento de Blocos` | Renomear bloco do Condomínio 1 não altera blocos ou unidades do Condomínio 2 | **✅ APROVADO** |

**Resultado Geral:** **9 Aprovados, 0 Falhas (100% de Sucesso).**

---

### 2.2. Suíte de Regressão: `suite.js` (Backend Integrado)
Comando executado: `node server/tests/suite.js`

- **GET Endpoints RESTful:** 14/14 endpoints respondendo 200 OK com payload estruturado.
- **CRUD e Persistência:** Morador, Portaria, Acessos com busca por placa e exclusão limpa.
- **CRUD de Encomendas:** Criação, edição, validação de PIN de segurança, baixa e exclusão.
- **Unicidade Territorial:** Bloqueio de duplicidade no mesmo condomínio e liberação em condomínios diferentes.
- **LPS / Feature Flags:** Bloqueio/liberação com 403 Forbidden para `ENABLE_MARKETPLACE`.
- **Resultado:** **37 Sucessos, 0 Falhas.**

---

### 2.3. Suíte de Isolamento Cross-Tenant: `verify_isolation.js`
Comando executado: `node server/tests/verify_isolation.js`

- Novo condomínio de teste criado inicia 100% zerado em todas as 8 entidades.
- Criação de bloco e morador no condomínio de teste não interfere nas entidades do condomínio padrão.
- Limpeza segura após teste concluída com sucesso.
- **Resultado:** **Isolamento Cross-Tenant 100% Verificado.**

---

### 2.4. Suíte de Módulos Ativáveis por Condomínio: `verify_modules.mjs`
Comando executado: `node server/tests/verify_modules.mjs`

- Retrocompatibilidade total dos 6 módulos no Condomínio 1.
- Áreas obrigatórias (Pessoas, Blocos, Avisos) sempre liberadas.
- Condomínio com módulos desligados bloqueia rotas com 403 e mantém Dashboard resiliente sem quebra.
- **Resultado:** **26 Aprovados, 0 Falhas.**

---

### 2.5. Suíte de Fluxo de Veículos: `test_vehicles_flow.mjs`
Comando executado: `node server/tests/test_vehicles_flow.mjs`

- Normalização de placa, vínculo com unidade e isolamento em operações PATCH e DELETE.
- **Resultado:** **17 Aprovados, 0 Falhas.**

---

## 3. Roteiro para Validação Manual Passo a Passo

Para conferir o funcionamento no ambiente gráfico (navegador):

### 3.1. Validação de Alteração de Nome de Bloco
1. Acesse o sistema e abra o menu **"Condomínios & Blocos"**.
2. Na aba **Blocos**, localize o bloco `Torre A` e clique no botão de edição (ícone de lápis).
3. Altere o nome para `Torre Alpha Principal` e salve.
4. Navegue até a tela **"Cadastro de Pessoas"** (ou **"Unidades"**):
   - **Resultado Esperado:** Todas as unidades vinculadas (ex: Apt 101, Apt 102) exibem imediatamente `Bloco: Torre Alpha Principal`.
5. Pressione `F5` para recarregar a página e confira novamente.
   - **Resultado Esperado:** O nome permanece persistido como `Torre Alpha Principal`.
6. Altere de volta para `Torre A` para manter os dados no estado original.

### 3.2. Validação do Dashboard — Saldo em Caixa
1. Acesse a tela principal do **"Dashboard"**.
2. Observe o card **"Saldo em Caixa"**:
   - **Resultado Esperado:** Exibe o valor numérico real formatado (ex: `R$ 4.700,00` ou similar), não mais `R$ 0,00`.
   - No subtítulo, exibe a situação real da carteira (ex: "X unidades em atraso" ou "Taxas em dia").

### 3.3. Validação do Dashboard — Reservas de Hoje
1. Acesse o módulo **"Espaços & Reservas"**.
2. Crie uma nova reserva para um espaço comum para a **data de hoje**.
3. Retorne ao **Dashboard**:
   - **Resultado Esperado:** O card "Reservas de Hoje" incrementa imediatamente.
4. Cancele a reserva criada:
   - **Resultado Esperado:** O indicador decrementa em tempo real.

### 3.4. Validação do Dashboard — Estoque do Mercadinho
1. Observe o card **"Estoque do Mercadinho"** no Dashboard:
   - **Resultado Esperado:** Exibe a quantidade total de itens que requerem atenção de reposição.
   - No subtítulo, discrimina a quantidade em falta (`0 em estoque`) e itens abaixo do mínimo.
2. Acesse o menu **"Mercadinho & Estoque"**, faça um ajuste de estoque de um item para `0` e veja o dashboard atualizar o alerta.

### 3.5. Validação do Mural de Avisos em Destaque
1. Acesse o menu **"Mural de Avisos"**.
2. Crie um comunicado com prioridade **"Urgente"** ou marque a opção **"Fixar no topo"**.
3. Retorne ao **Dashboard**:
   - **Resultado Esperado:** O comunicado aparece imediatamente na lista lateral de "Avisos em Destaque".

---

## 4. Status de Pendências
- **Nenhuma pendência identificada.**
- Todos os 5 itens do Dashboard e o problema de renomeação de blocos foram diagnosticados, corrigidos, testados automaticamente e documentados.
