# DIAGNÓSTICO DE ERROS — DASHBOARD E ATUALIZAÇÃO DE BLOCOS
**Praticom ERP — Auditoria e Análise de Causas Raízes**

Este documento detalha o diagnóstico completo dos problemas de integração, lógica, cálculo e apresentação identificados no Dashboard e na sincronização de Blocos com Unidades no Praticom ERP.

---

## 1. Problemas do Dashboard

### 1.1. Reservas de Hoje
* **Situação Encontrada:** O indicador de "Reservas de Hoje" exibia permanentemente `0`, mesmo havendo reservas confirmadas agendadas para o dia atual no banco de dados.
* **Causa Raiz Confirmada:**
  1. No backend (`server/server.js`, rota `GET /api/dashboard`), a lista geral de reservas era recuperada via `spaceDAO.getReservations({ condominiumId })`, porém **o cálculo de reservas do dia atual (`todayReservations`) não era realizado**.
  2. O objeto retornado `data.metrics` omitia a chave `todayReservations`.
  3. No frontend (`client/src/views/DashboardView.jsx` L96), o componente lia `metrics.todayReservations ?? 0`, recebendo `undefined` e caindo no fallback `0`.
  4. Na barra lateral (`client/src/components/Sidebar.jsx` L25), a badge lia `stats?.todayReservations`, ficando permanentemente apagada.
  5. **Fuso Horário:** No fuso horário de Brasília (UTC-3), chamadas a `new Date().toISOString().split('T')[0]` após as 21:00 retornam a data UTC do dia seguinte, causando descasamento com a data local do usuário e com as reservas do dia.
  6. **Filtro de Status:** Reservas canceladas (`status = 'CANCELLED'`) precisam ser estritamente excluídas da contagem, contabilizando apenas status ativos (`'CONFIRMED'` e `'Confirmada'`).

---

### 1.2. Saldo em Caixa
* **Situação Encontrada:** O card de "Saldo em Caixa" no Dashboard exibia fixamente `R$ 0,00` e o subtítulo sempre "Taxas em dia".
* **Causa Raiz Confirmada:**
  1. No backend (`server/server.js`), o endpoint chamava `financialDAO.getSummary({ condominiumId })`. O DAO calculava `currentBalance = incomePaid - expensePaid`, porém **o endpoint `/api/dashboard` não repassava `balance` nem `currentBalance`** para dentro do objeto `metrics`.
  2. No frontend (`DashboardView.jsx` L71), a expressão `R$ {(metrics.balance || 0).toLocaleString('pt-BR', ...)}` avaliava `metrics.balance` como `undefined`, exibindo `R$ 0,00`.
  3. No `FinancialDAO.js` (L47-53 e L72-86), a contagem de inadimplência `overdueCount` era calculada na query SQL, mas **não era incluída no objeto de retorno de `getSummary()`**.
  4. No `server.js` L114, o endpoint tentava ler `summary.default_amount`, que não existe (o valor real de inadimplência no DAO é `summary.income.overdue`).
  5. **Vazamento Multi-Tenant:** Em `FinancialDAO.js` (L23), para o Condomínio 1, a cláusula `AND (f.condominium_id = 1 OR f.condominium_id IS NULL OR b.condominium_id = 1 OR u.block_id IS NULL)` fazia com que qualquer despesa corporativa sem apartamento associado (`unit_id IS NULL`, como água e luz) fosse atribuída ao Condomínio 1, mesmo pertencendo a outros condomínios (`condominium_id = 2` ou `6`).

---

### 1.3 e 1.5. Estoque do Mercadinho e Estoque Baixo (Produtos em Falta)
* **Situação Encontrada:** O indicador de estoque no Dashboard sempre exibia `0` ("Estoque abastecido"), não refletindo produtos em falta ou itens abaixo do mínimo.
* **Causa Raiz Confirmada:**
  1. No backend (`server/server.js`), o endpoint `/api/dashboard` **não consultava `marketDAO`**, não verificava permissão de módulo e não calculava nenhuma métrica de estoque.
  2. No frontend (`DashboardView.jsx` L108), lia-se `metrics.lowStockItems ?? 0`, sempre `undefined`.
  3. **Ausência de Diferenciação de Regras de Negócio:**
     - **Produtos sem estoque (Em falta):** `stock_quantity <= 0`.
     - **Produtos com estoque baixo:** `stock_quantity > 0 AND stock_quantity <= (min_stock ?? 5)`.
     - **Alerta de Reposição Crítica:** soma de produtos sem estoque e com estoque baixo.
     - **Produtos ativos:** produtos pertencentes ao condomínio ativo no catálogo do mercadinho.

---

### 1.4. Mural de Avisos em Destaque
* **Situação Encontrada:** Comunicados urgentes cadastrados no mural não apareciam no card "Avisos em Destaque" do Dashboard.
* **Causa Raiz Confirmada:**
  1. No backend (`server/server.js` L106), o filtro executava:
     `announcements.filter(a => a.priority === 'URGENTE' || a.priority === 'high')`
  2. No formulário de cadastro (`AnnouncementsView.jsx` L118), o valor da opção "Urgente" é `'urgent'` (minúsculo em inglês), e os dados do banco utilizam `'urgent'`. Como `'urgent' !== 'URGENTE'` e `'urgent' !== 'high'`, **todos os avisos urgentes eram descartados**.
  3. Não havia verificação de expiração (`expires_at < data_atual`).
  4. Avisos fixados (`is_pinned = 1`) não eram considerados no destaque.

---

## 2. Problema Territorial: Alteração do Nome do Bloco

### Problema Diagnosticado
Ao alterar o nome de um bloco em **Condomínios & Blocos** (ex: renomear de `Torre A` para `Torre A - Sul`), as unidades associadas a ele continuavam exibindo o nome antigo nas telas de **Cadastro de Pessoas & Unidades**, **Controle de Encomendas**, **Portaria & Acessos** e **Reservas**.

### Causa Raiz Confirmada
1. A tabela `units` possui uma coluna relacional `block_id` (FOREIGN KEY para `blocks.id`) e uma coluna textual legada denormalizada `block` (TEXT).
2. No DAO `CondominiumDAO.js` (método `updateBlock`), a operação executava exclusivamente:
   ```sql
   UPDATE blocks SET name = ?, description = ? WHERE id = ?
   ```
   **Nenhum comando atualizava a coluna `units.block`** das unidades vinculadas àquele `block_id`.
3. Nas consultas do `ResidentDAO.js` (como `getUnits` e `getUnit`), a projeção SQL utilizava:
   ```sql
   SELECT u.* FROM units u LEFT JOIN blocks b ON u.block_id = b.id
   ```
   A projeção `u.*` retornava o valor gravado na coluna `u.block` (o nome antigo), ignorando o nome atualizado presente em `b.name`.
4. Consultas em outros módulos (`DeliveryDAO`, `AccessDAO`, `ReservationDAO`, `FinancialDAO`) também faziam `SELECT ..., u.block, ...`, recuperando o valor desatualizado da coluna estática da unidade.

---

## 3. Resumo da Matriz de Diagnóstico

| Módulo / Recurso | Sintoma | Causa Raiz | Classificação |
| :--- | :--- | :--- | :--- |
| **Reservas de Hoje** | Exibe sempre 0 | Omissão de cálculo no endpoint `/api/dashboard` | **Erro Confirmado** |
| **Saldo em Caixa** | Exibe sempre R$ 0,00 | Chave `balance` omitida no payload + vazamento SQL multi-tenant | **Erro Confirmado** |
| **Estoque do Mercadinho** | Exibe sempre 0 | `marketDAO` não é consultado em `/api/dashboard` | **Erro Confirmado** |
| **Estoque Baixo** | Não diferencia falta vs baixo | Regra ausente no endpoint do dashboard | **Erro Confirmado** |
| **Avisos em Destaque** | Card vazio | Filtro de casing incompatível (`'urgent'` vs `'URGENTE'`) | **Erro Confirmado** |
| **Atualização de Bloco** | Nome não reflete nas unidades | `updateBlock` não sincroniza `units.block` e `SELECT u.*` ignora `b.name` | **Erro Confirmado** |
