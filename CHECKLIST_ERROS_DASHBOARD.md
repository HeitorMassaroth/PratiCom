# CHECKLIST DE ERROS E DISCREPÂNCIAS — DASHBOARD PRATICOM ERP

Este documento lista todos os problemas, riscos e inconsistências identificados durante a auditoria detalhada do Dashboard do Praticom ERP.

---

## 1. Problemas Críticos (Prioridade P0)

### [x] Problema 1: Mismatch de chave e omissão do Saldo em Caixa (`metrics.balance`)
- **Classificação:** Erro confirmado
- **Local:** `server/server.js` (linhas 103, 110-116) e `client/src/views/DashboardView.jsx` (linhas 69-72).
- **Evidência:**
  - No backend (`server.js`):
    ```javascript
    const summary = hasFinancial ? financialDAO.getSummary({ condominiumId }) : { default_amount: 0, default_rate: 0 };
    const data = {
      metrics: {
        pendingDeliveries: hasDeliveries ? pendingDeliveries.length : null,
        activeAccess: hasAccess ? activeAccess.length : null,
        overdueAmount: hasFinancial ? (summary.default_amount || 0) : null,
        defaultRate: hasFinancial ? (summary.default_rate || 0) : null
      },
      ...
    };
    ```
  - No frontend (`DashboardView.jsx`):
    ```jsx
    <div className="value" style={{ color: 'var(--accent-mint-text)' }}>
      R$ {(metrics.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </div>
    ```
- **Valor esperado:** Para o Condomínio 1, o saldo real calculado é `R$ 6.037,20` (ou o saldo efetivo deduzido de despesas próprias).
- **Valor encontrado:** O card sempre exibe `R$ 0,00`.
- **Causa confirmada:** O backend não inclui `balance` (ou `currentBalance`) no objeto `metrics`. A variável `metrics.balance` chega como `undefined` ao frontend, caindo no fallback `|| 0`.
- **Impacto:** O indicador financeiro mais importante do painel inicial fica zerado permanentemente.
- **Prioridade:** P0 (Crítico).
- **Correção recomendada:**
  1. No backend (`server.js`), incluir `balance: hasFinancial ? (summary.currentBalance || 0) : null` dentro de `data.metrics`.
  2. No frontend, aceitar `metrics.balance ?? metrics.currentBalance ?? 0`.
- **Teste de validação:** Fazer requisição a `GET /api/dashboard` com `X-Condominium-Id: 1` e verificar se `data.metrics.balance` retorna valor numérico positivo que é formatado como moeda na interface.

---

### [x] Problema 2: Vazamento de isolamento multi-tenancy no resumo financeiro do Condomínio 1
- **Classificação:** Erro confirmado
- **Local:** `server/dao/FinancialDAO.js` (linhas 20-31 e 41-45).
- **Evidência:**
  - Código SQL gerado em `FinancialDAO.js`:
    ```javascript
    if (cId === 1) {
      whereClause += ' AND (f.condominium_id = 1 OR f.condominium_id IS NULL OR b.condominium_id = 1 OR u.block_id IS NULL)';
      unitWhereClause += ' AND (b.condominium_id = 1 OR u.block_id IS NULL)';
    }
    ```
  - Resultado no banco de dados SQLite:
    Transações corporativas que não possuem unidade vinculada (`unit_id IS NULL`, como contas de luz da Enel ID 8 no valor de R$ 2.430,80 ou Sabesp ID 9 no valor de R$ 1.980,40 marcadas com `condominium_id = 2`, ou transação ID 24 com `condominium_id = 6`) possuem `u.block_id IS NULL = TRUE`. Como a condição usa `OR u.block_id IS NULL` sem checar se `f.condominium_id` pertence a outro condomínio, todas essas despesas são somadas ao Condomínio 1!
- **Valor esperado:** O Condomínio 1 deve contabilizar apenas transações com `f.condominium_id = 1` ou registros legados sem condomínio (`f.condominium_id IS NULL` onde a unidade pertença ao condomínio 1). Transações com `f.condominium_id` preenchido com outro ID (ex: 2, 3, 6) NUNCA podem ser somadas.
- **Valor encontrado:** O Condomínio 1 absorve R$ 6.261,20 de despesas marcadas explicitamente com `condominium_id = 2` e receitas marcadas com `condominium_id = 6`.
- **Causa confirmada:** A cláusula `OR u.block_id IS NULL` anula a restrição de condomínio para qualquer registro contábil de despesa comum que não esteja amarrado a um apartamento individual.
- **Impacto:** Distorção grave dos cálculos de receitas, despesas e saldo do condomínio principal. Violação de isolamento multi-tenant.
- **Prioridade:** P0 (Crítico).
- **Correção recomendada:** Ajustar a cláusula em `FinancialDAO.js` para exigir estritamente que registros com `f.condominium_id` diferente de 1 sejam excluídos:
  ```sql
  WHERE (f.condominium_id = 1 OR (f.condominium_id IS NULL AND (b.condominium_id = 1 OR u.block_id IS NULL)))
  ```
- **Teste de validação:** Executar `financialDAO.getSummary({ condominiumId: 1 })` e comprovar que transações com `condominium_id = 2` ou `6` não aparecem na lista de correspondências.

---

## 2. Problemas de Alta Prioridade (Prioridade P1)

### [x] Problema 3: Mismatch de nomenclatura no contador de visitantes no condomínio
- **Classificação:** Erro confirmado
- **Local:** `server/server.js` (linha 113), `client/src/views/DashboardView.jsx` (linha 85) e `client/src/components/Sidebar.jsx` (linha 22).
- **Evidência:**
  - Backend retorna (`server.js`):
    `metrics: { activeAccess: hasAccess ? activeAccess.length : null }`
  - Frontend busca (`DashboardView.jsx`):
    `<div className="value">{metrics.activeVisitors ?? 0}</div>`
  - Sidebar busca (`Sidebar.jsx`):
    `badge: stats?.activeVisitors ? ...`
- **Valor esperado:** Para o Condomínio 1, existem 1 prestador ativo no prédio (`EletroServ Manutenções`, status `inside`). O card deveria exibir `1`.
- **Valor encontrado:** O card exibe sempre `0`. A badge na Sidebar nunca é renderizada.
- **Causa confirmada:** Divergência de chaves (`activeAccess` no backend vs `activeVisitors` no frontend).
- **Impacto:** O KPI "Pessoas no Condomínio" falha silenciosamente exibindo zero.
- **Prioridade:** P1 (Alta).
- **Correção recomendada:** Alinhar a API para retornar `activeVisitors: hasAccess ? activeAccess.length : null` (ou retornar ambas as chaves para compatibilidade).
- **Teste de validação:** Inserir ou verificar visitante com status ativo e checar se o número `1` é exibido no card e no badge do menu.

---

### [x] Problema 4: Inversão de status na tabela "Fluxo da Portaria em Tempo Real"
- **Classificação:** Erro confirmado
- **Local:** `client/src/views/DashboardView.jsx` (linhas 166-170) e `server/dao/OperationsDAO.js` (linha 65).
- **Evidência:**
  - No cadastro de entrada (`AccessDAO.registerEntry`):
    `INSERT INTO access_logs (...) VALUES (..., 'IN_PROPERTY', ...)`
  - No frontend (`DashboardView.jsx`):
    ```jsx
    {log.status === 'inside' ? (
      <span className="badge badge-warning">No Condomínio</span>
    ) : (
      <span className="badge badge-success">Saiu</span>
    )}
    ```
- **Valor esperado:** Qualquer registro que represente uma pessoa atualmente no prédio deve exibir o badge amarelo/alerta "No Condomínio".
- **Valor encontrado:** Visitantes cadastrados com status `'IN_PROPERTY'` recebem o badge verde "Saiu", mesmo estando presentes no imóvel.
- **Causa confirmada:** O frontend só reconhece a string literal `'inside'`. Todas as entradas cadastradas no sistema moderno recebem `'IN_PROPERTY'`. Como `'IN_PROPERTY' !== 'inside'`, o ternário cai no ramo de saída ("Saiu").
- **Impacto:** Falsa indicação de segurança na portaria. O síndico e o porteiro veem visitantes ativos marcados como se já tivessem saído.
- **Prioridade:** P1 (Alta).
- **Correção recomendada:** Atualizar a verificação para aceitar ambos os formatos e normalizar:
  ```jsx
  {['inside', 'IN_PROPERTY'].includes(log.status) ? (
    <span className="badge badge-warning">No Condomínio</span>
  ) : (
    <span className="badge badge-success">Saiu</span>
  )}
  ```
- **Teste de validação:** Registrar uma entrada de visitante pela tela de portaria e conferir no Dashboard se a linha correspondente exibe "No Condomínio".

---

### [x] Problema 5: Omissão da métrica "Reservas de Hoje" no backend
- **Classificação:** Erro confirmado
- **Local:** `server/server.js` (linhas 108-116) e `client/src/views/DashboardView.jsx` (linha 96).
- **Evidência:**
  - No backend, `metrics` só inclui `pendingDeliveries`, `activeAccess`, `overdueAmount`, `defaultRate`. Nenhuma contagem de reservas do dia é calculada ou injetada no JSON.
  - No frontend, o card lê `metrics.todayReservations ?? 0`.
- **Valor esperado:** Contagem das reservas confirmadas agendadas para a data atual (`CURRENT_DATE`). No banco de dados, para 2026-10-13, existe 1 reserva confirmada (Reserva ID 8, Churrasqueira 1).
- **Valor encontrado:** O card exibe sempre `0`.
- **Causa confirmada:** A propriedade `todayReservations` não é calculada no endpoint `/api/dashboard`.
- **Impacto:** O KPI "Reservas de Hoje" fica zerado permanentemente, mesmo com áreas comuns reservadas para o dia.
- **Prioridade:** P1 (Alta).
- **Correção recomendada:** No backend (`server.js`), calcular `todayReservations`:
  ```javascript
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReservations = reservations.filter(r => r.reservation_date === todayStr && ['CONFIRMED', 'Confirmada'].includes(r.status));
  ```
  E incluir `todayReservations: hasReservations ? todayReservations.length : null` dentro de `data.metrics`.
- **Teste de validação:** Criar uma reserva para a data de hoje e comprovar que o contador no KPI do Dashboard exibe `1`.

---

### [x] Problema 6: Omissão da métrica "Estoque do Mercadinho" no backend
- **Classificação:** Erro confirmado
- **Local:** `server/server.js` (linhas 88-121) e `client/src/views/DashboardView.jsx` (linhas 106-113).
- **Evidência:**
  - `server.js` não importa nem instancia `marketDAO`, não checa `condominiumDAO.isModuleEnabled(condominiumId, 'market')` e não inclui `lowStockItems` no objeto `metrics`.
  - No frontend, o card lê `metrics.lowStockItems ?? 0`.
  - No banco de dados, para o Condomínio 1, o produto "Pizza Congelada Sadia Calabresa 460g" está com estoque 5 (igual ao estoque mínimo 5), configurando 1 item com alerta de reposição.
- **Valor esperado:** O card deveria exibir `1` com subtítulo "1 itens abaixo do estoque mínimo".
- **Valor encontrado:** O card exibe sempre `0` ("Estoque abastecido").
- **Causa confirmada:** Ausência total de integração do minimercado no endpoint `/api/dashboard`.
- **Impacto:** Falha no alerta operacional de desabastecimento de produtos para a gestão do condomínio.
- **Prioridade:** P1 (Alta).
- **Correção recomendada:**
  1. Verificar permissão de módulo `const hasMarket = condominiumDAO.isModuleEnabled(condominiumId, 'market')`.
  2. Buscar produtos via `marketDAO.getProducts({ condominiumId })`.
  3. Filtrar `products.filter(p => p.stock_quantity <= (p.min_stock || 5)).length`.
  4. Retornar `lowStockItems: hasMarket ? lowStockCount : null` em `data.metrics`.
- **Teste de validação:** Chamar `/api/dashboard` e verificar se `data.metrics.lowStockItems` retorna `1`.

---

### [x] Problema 7: Omissão e inconsistência do indicador de unidades em atraso (`overdueCount`)
- **Classificação:** Erro confirmado
- **Local:** `server/dao/FinancialDAO.js` (linhas 47-53, 72-86) e `server/server.js` (linhas 103, 114).
- **Evidência:**
  - Em `FinancialDAO.js`, a variável `overdueCount` é calculada na linha 47:
    `const overdueCount = this.db.prepare(...).get(...params).count;`
    Porém, no `return` de `getSummary`, essa variável NÃO é exposta no objeto retornado!
  - Em `server.js`, tenta-se ler `summary.default_amount`, que não existe no objeto de retorno de `FinancialDAO` (o campo correto é `summary.income.overdue`).
  - No frontend (`DashboardView.jsx` linha 74):
    `{metrics.overdueCount > 0 ? `${metrics.overdueCount} unidades em atraso` : 'Taxas em dia'}`
- **Valor esperado:** Se houver unidades com boletos vencidos, deve exibir o número exato de unidades inadimplentes no subtítulo do card de saldo e nos badges da barra lateral.
- **Valor encontrado:** Exibe sempre "Taxas em dia", pois `metrics.overdueCount` é `undefined`.
- **Causa confirmada:** `FinancialDAO` não exporta `overdueCount` no resumo financeiro e `server.js` não injeta em `metrics`.
- **Impacto:** Gestor é induzido a acreditar que a inadimplência é zero.
- **Prioridade:** P1 (Alta).
- **Correção recomendada:**
  1. No `FinancialDAO.getSummary`, incluir `overdueCount` no retorno.
  2. No `server.js`, mapear `overdueCount: hasFinancial ? (summary.overdueCount || 0) : null` e `overdueAmount: hasFinancial ? (summary.income?.overdue || 0) : null`.
- **Teste de validação:** Criar transação de receita com status `OVERDUE` e comprovar que o subtítulo exibe `1 unidades em atraso`.

---

## 3. Problemas de Média Prioridade (Prioridade P2)

### [x] Problema 8: Nome do condomínio estático/hardcoded no Banner de Boas-Vindas
- **Classificação:** Erro confirmado
- **Local:** `client/src/views/DashboardView.jsx` (linha 32).
- **Evidência:**
  Trecho no JSX:
  ```jsx
  <span className="welcome-banner-condo">Condomínio Residencial Parque das Flores</span>
  ```
- **Valor esperado:** Exibir o nome real do condomínio ativo selecionado no seletor do Header (ex: "Condomínio Alpha Praticom", "Condomínio Beta Praticom", etc.).
- **Valor encontrado:** Exibe fixamente "Condomínio Residencial Parque das Flores", condomínio fictício inexistente no banco de dados.
- **Causa confirmada:** Texto fixo no componente React; `DashboardView` sequer recebe como prop o condomínio ativo.
- **Impacto:** Confusão do usuário em ambientes multi-condomínio.
- **Prioridade:** P2 (Média).
- **Correção recomendada:** Passar o objeto do condomínio selecionado ou buscar o condomínio ativo via `api.getActiveCondominiumId()` e renderizar dinamicamente.
- **Teste de validação:** Alternar o condomínio no Header e conferir se o título no banner superior muda instantaneamente para o condomínio selecionado.

---

### [x] Problema 9: Filtro de comunicados urgentes descarta prioridade `'urgent'`
- **Classificação:** Erro confirmado
- **Local:** `server/server.js` (linha 106).
- **Evidência:**
  - No `server.js`:
    ```javascript
    const urgentAnnouncements = announcements.filter(a => a.priority === 'URGENTE' || a.priority === 'high');
    ```
  - Em `AnnouncementsView.jsx` (linha 118):
    `<option value="urgent">Urgente</option>`
  - No banco de dados (`schema.sql` / seed):
    Registro ID 2 possui `priority = 'urgent'`.
- **Valor esperado:** Comunicados com prioridade `'urgent'`, `'URGENTE'` ou `'high'` devem aparecer no card "Avisos em Destaque".
- **Valor encontrado:** Comunicados criados com a opção padrão "Urgente" (`urgent`) do formulário são ignorados pela verificação do backend e nunca aparecem no Dashboard.
- **Causa confirmada:** O backend compara com `'URGENTE'` (português maiúsculo) em vez de normalizar para maiúsculas e aceitar `'URGENT'`.
- **Impacto:** Avisos urgentes postados pelo síndico não aparecem no painel principal.
- **Prioridade:** P2 (Média).
- **Correção recomendada:** Normalizar o campo com `['URGENTE', 'URGENT', 'HIGH'].includes(String(a.priority).toUpperCase())`.
- **Teste de validação:** Publicar aviso com prioridade "Urgente" e validar sua aparição imediata no card "Avisos em Destaque" do Dashboard.

---

### [x] Problema 10: "Próximas Reservas" exibe agendamentos passados em ordem invertida
- **Classificação:** Erro confirmado
- **Local:** `server/dao/ReservationDAO.js` (linha 58) e `server/server.js` (linha 120).
- **Evidência:**
  - Em `ReservationDAO.js`:
    `sql += ' ORDER BY r.reservation_date DESC, r.start_time ASC';`
  - Em `server.js`:
    `upcomingReservations: reservations.slice(0, 5)`
  - Resultado no teste da API:
    O card exibiu reservas de agosto de 2026 (`2026-08-24`, `2026-08-23`, `2026-08-22`), que já haviam passado em relação a outubro de 2026.
- **Valor esperado:** O card "Próximas Reservas" deve exibir apenas reservas a partir da data de hoje (`reservation_date >= CURRENT_DATE`), ordenadas cronologicamente (`ASC` por data e hora), com status confirmado.
- **Valor encontrado:** Exibe as 5 reservas mais recentes registradas na história, incluindo eventos já ocorridos, em ordem decrescente.
- **Causa confirmada:** Ausência de filtro temporal (`>= CURRENT_DATE`) e ordenação invertida (`DESC` em vez de `ASC`).
- **Impacto:** O síndico vê agendamentos passados em vez dos eventos que acontecerão hoje ou nos próximos dias.
- **Prioridade:** P2 (Média).
- **Correção recomendada:** Criar método ou filtro em `ReservationDAO` para `upcoming: true`, adicionando `AND r.reservation_date >= CURRENT_DATE AND UPPER(r.status) IN ('CONFIRMED', 'CONFIRMADA') ORDER BY r.reservation_date ASC, r.start_time ASC`.
- **Teste de validação:** Criar reservas para o passado e para o futuro; comprovar que apenas as reservas futuras aparecem no card lateral em ordem crescente.

---

### [x] Problema 11: Inconsistência nos badges da Sidebar
- **Classificação:** Erro confirmado
- **Local:** `client/src/components/Sidebar.jsx` (linhas 20-27).
- **Evidência:**
  ```javascript
  { id: 'deliveries', badge: stats?.pendingDeliveries, badgeAlert: stats?.pendingDeliveries > 0 },
  { id: 'financial', badge: stats?.overdueCount ? `${stats.overdueCount} pendentes` : null, badgeAlert: stats?.overdueCount > 0 },
  { id: 'access', badge: stats?.activeVisitors ? `${stats.activeVisitors} no prédio` : null },
  { id: 'reservations', badge: stats?.todayReservations ? `${stats.todayReservations} hoje` : null },
  { id: 'market', badge: stats?.lowStockItems ? `${stats.lowStockItems} repor` : null, badgeAlert: stats?.lowStockItems > 0 },
  ```
- **Valor esperado:** Os menus laterais devem exibir badges de alerta com contadores em tempo real.
- **Valor encontrado:** Apenas o menu de Encomendas exibe badge. Os menus Financeiro, Portaria, Reservas e Mercadinho nunca exibem badges porque as propriedades em `stats` (`dashboardData.metrics`) estão ausentes ou com nomes incompatíveis.
- **Causa confirmada:** Efeito cascata dos problemas 1, 3, 5, 6 e 7.
- **Impacto:** Prejuízo na navegabilidade e perda de visibilidade das pendências operacionais.
- **Prioridade:** P2 (Média).
- **Correção recomendada:** A correção dos campos na API REST resolverá automaticamente os badges da Sidebar sem necessidade de alterar a lógica do componente.
- **Teste de validação:** Verificar se todos os 5 itens com pendências exibem badges correspondentes na barra lateral.

---

## 4. Riscos Identificados e Oportunidades de Melhoria (Prioridade P3)

### [x] Problema 12: Ausência de estado visual para submódulos inativos no Dashboard
- **Classificação:** Risco identificado
- **Local:** `client/src/views/DashboardView.jsx` (linhas 52-115).
- **Evidência:**
  Quando um módulo está desativado no condomínio (ex: `financial` desativado), o backend envia `null` nas métricas. O frontend executa `metrics.balance || 0`, exibindo `R$ 0,00` e mantendo o card clicável.
- **Impacto:** O usuário não sabe se o valor é realmente zero ou se o condomínio não contratou o módulo. Ao clicar, pode ser redirecionado de volta ou encontrar erro de rota.
- **Prioridade:** P3 (Baixa).
- **Correção recomendada:** Passar `availableModules` para o `DashboardView`. Quando um módulo estiver inativo, exibir o card com estilo atenuado e texto "Módulo Desativado", desabilitando o clique.

---

### [x] Problema 13: Risco de dízima e precisão de ponto flutuante no saldo financeiro
- **Classificação:** Risco identificado
- **Local:** `server/dao/FinancialDAO.js` (linha 83).
- **Evidência:**
  `currentBalance: incomePaid - expensePaid` gerou `6037.199999999999` durante o teste de auditoria.
- **Impacto:** Risco de inconsistências em comparações numéricas no backend ou arredondamento incorreto.
- **Prioridade:** P3 (Baixa).
- **Correção recomendada:** Aplicar `parseFloat((incomePaid - expensePaid).toFixed(2))`.

---

### [x] Problema 14: Formatação de data não localizada no card de Reservas
- **Classificação:** Risco identificado
- **Local:** `client/src/views/DashboardView.jsx` (linha 319).
- **Evidência:**
  Renderiza diretamente `{res.reservation_date}`, que exibe formato `2026-10-13` (ISO padrão).
- **Impacto:** Experiência de usuário subótima para o público brasileiro.
- **Prioridade:** P3 (Baixa).
- **Correção recomendada:** Formatar usando helper para `DD/MM/YYYY`.

---

### [x] Problema 15: Ausência de totalizadores estruturais (Moradores, Veículos, Blocos)
- **Classificação:** Oportunidade identificada
- **Local:** `client/src/views/DashboardView.jsx` e `server/server.js`.
- **Evidência:**
  O sistema gerencia pessoas, veículos, blocos e apartamentos, mas o Dashboard atual possui foco estritamente operacional imediato (encomendas pendentes, saldo, visitantes hoje, reservas hoje, estoque baixo). Não existem cards consolidados de total de moradores ou total de unidades ocupadas.
- **Impacto:** Síndicos e administradores não conseguem visualizar a taxa de ocupação ou o total de residentes sem navegar para a tela de moradores.
- **Prioridade:** P3 (Baixa).
- **Correção recomendada:** Avaliar inclusão opcional de mini-cards com totais de cadastros (Total de Unidades, Moradores Cadastrados, Veículos Registrados).

---

## 5. Itens Verificados Sem Problema

| Item Verificado | Resultado da Auditoria | Evidência |
| :--- | :--- | :--- |
| **Codificação de caracteres UTF-8** | **Sem problemas** | Registros no SQLite, respostas HTTP com charset=utf-8 e meta tag HTML funcionam perfeitamente sem caracteres corrompidos. |
| **Formatação de Moeda Brasileira** | **Sem problemas** | `toLocaleString('pt-BR', { minimumFractionDigits: 2 })` aplica `R$` com vírgula decimal e ponto de milhar corretamente quando recebe número válido. |
| **Contador de Encomendas Pendentes** | **Sem problemas** | Mapeamento e contagem de encomendas por condomínio conferem com os registros do banco de dados. |
| **Segregação por Condomínio de Encomendas** | **Sem problemas** | `DeliveryDAO` filtra corretamente as unidades do condomínio selecionado. |
| **Segregação por Condomínio de Mercadinho** | **Sem problemas** | `MarketDAO` isola adequadamente os produtos pelo `condominium_id`. |
