# PLANO DE CORREÇÃO — DASHBOARD E ATUALIZAÇÃO DE BLOCOS
**Praticom ERP — Implementação e Justificativas Técnicas**

Este plano documenta as correções implementadas para sanar os problemas do Dashboard e garantir a sincronização imediata e persistente da alteração de nomes de blocos com as unidades vinculadas.

---

## 1. Arquitetura das Correções

### 1.1. Sincronização Atômica de Nomes de Blocos e Unidades
* **Decisão Arquitetural:**
  A tabela `units` armazena tanto o vínculo relacional (`block_id`) quanto o nome textual desnormalizado (`block`) para compatibilidade com relatórios, filtros legados e consultas diretas.
* **Ação Corretiva:**
  1. No `CondominiumDAO.updateBlock`, encapsular a atualização em uma transação SQLite:
     - Atualizar a tabela `blocks` com o novo nome (`UPDATE blocks SET name = ? ...`).
     - Atualizar em cascata a coluna `units.block` de todas as unidades pertencentes àquele `block_id` (`UPDATE units SET block = ? WHERE block_id = ?`).
  2. No `ResidentDAO.js` (em `getUnits` e `getUnit`), projetar `COALESCE(b.name, u.block) AS block` para garantir resiliência caso alguma unidade ainda possua inconsistência textual.
  3. Nos demais DAOs (`DeliveryDAO`, `AccessDAO`, `ReservationDAO`, `FinancialDAO`), manter a projeção `COALESCE(b.name, u.block) AS block` nos joins com `blocks`.
* **Benefício:**
  - O novo nome é persistido fisicamente no SQLite.
  - Sobrevive a recarregamento de página e reinicialização do servidor.
  - Todas as unidades do bloco exibem o nome atualizado instantaneamente.
  - Vínculos entre blocos e unidades permanecem 100% intactos.
  - Nenhum impacto em blocos ou unidades de outros condomínios.

---

### 1.2. Dashboard — Reservas de Hoje
* **Decisão Arquitetural:**
  O backend passa a calcular o total de reservas para a data local atual do condomínio.
* **Ação Corretiva:**
  1. No `server/server.js`, calcular a data corrente no padrão local (`YYYY-MM-DD`).
  2. Filtrar as reservas do condomínio ativo por data (`r.reservation_date === todayStr`) e status ativo (`['CONFIRMED', 'Confirmada'].includes(r.status)`).
  3. Expor `todayReservations` no objeto `data.metrics`.
  4. No `DashboardView.jsx` e `Sidebar.jsx`, as métricas e badges passam a exibir o valor real.
  5. Nas operações de agendamento e cancelamento em `ReservationsView.jsx`, emitir o evento `dashboard-refresh` para atualização reativa instantânea.

---

### 1.3. Dashboard — Saldo em Caixa e Inadimplência
* **Decisão Arquitetural:**
  Alinhar os campos retornados pela API com o que o `DashboardView.jsx` consome e sanar o vazamento multi-tenant de despesas no Condomínio 1.
* **Ação Corretiva:**
  1. Em `FinancialDAO.js` (`getSummary`):
     - Corrigir a cláusula SQL do Condomínio 1 para exigir que despesas corporativas sem unidade (`unit_id IS NULL`) pertençam de fato ao condomínio 1 (`f.condominium_id = 1 OR (f.condominium_id IS NULL AND ...)`).
     - Incluir `overdueCount` no objeto retornado por `getSummary()`.
     - Garantir arredondamento monetário de duas casas decimais no `currentBalance` (`parseFloat((incomePaid - expensePaid).toFixed(2))`).
  2. Em `server/server.js` (`GET /api/dashboard`):
     - Mapear `balance` e `currentBalance` como `hasFinancial ? summary.currentBalance : null`.
     - Mapear `overdueCount` como `hasFinancial ? summary.overdueCount : null`.
     - Mapear `overdueAmount` como `hasFinancial ? (summary.income?.overdue || 0) : null`.
  3. No `DashboardView.jsx`:
     - O card exibirá o saldo real em reais e o subtítulo mostrará "X unidades em atraso" ou "Taxas em dia".

---

### 1.4. Dashboard — Estoque do Mercadinho e Produtos em Falta
* **Decisão Arquitetural:**
  Integrar o `MarketDAO` ao endpoint `/api/dashboard`, diferenciando produtos em falta (quantidade zero) de produtos abaixo do estoque mínimo.
* **Ação Corretiva:**
  1. No `server/server.js`:
     - Verificar se o módulo `market` está habilitado (`condominiumDAO.isModuleEnabled(condominiumId, 'market')`).
     - Consultar `marketDAO.getProducts({ condominiumId })`.
     - Calcular:
       - `outOfStockItems`: produtos com `stock_quantity <= 0`.
       - `lowStockItems`: produtos com `stock_quantity > 0` e `stock_quantity <= (min_stock || 5)`.
       - `criticalStockItems`: total que necessita de reposição (`stock_quantity <= (min_stock || 5)`).
       - `totalMarketProducts`: total de produtos no catálogo do condomínio.
     - Injetar essas métricas em `data.metrics`.
  2. No `DashboardView.jsx`:
     - Exibir o número total de itens críticos.
     - No subtítulo, explicitar a quantidade em falta vs quantidade abaixo do mínimo.
  3. No `Sidebar.jsx`:
     - Badge do mercadinho acende com a quantidade crítica de reposição.

---

### 1.5. Dashboard — Mural de Avisos em Destaque
* **Decisão Arquitetural:**
  Ajustar o filtro de comunicados no backend para aceitar prioridades urgentes em todos os casings (`'urgent'`, `'URGENTE'`, `'high'`) e considerar avisos fixados e não expirados.
* **Ação Corretiva:**
  1. No `server/server.js`:
     - Considerar ativo apenas avisos não expirados (`!a.expires_at || a.expires_at >= todayStr`).
     - Filtrar avisos em destaque: aqueles que forem fixados (`a.is_pinned === 1`) OU possuírem prioridade urgente/alta (`['URGENTE', 'URGENT', 'HIGH'].includes(String(a.priority).toUpperCase())`).
     - Injetar `activeAnnouncements` e `urgentAnnouncementsCount` em `data.metrics`.
  2. No `AnnouncementsView.jsx`:
     - Emitir evento de atualização ao criar ou remover avisos.

---

### 1.6. Correção Complementar: Entrega de Encomendas (`DeliveryDAO.cancelDelivery`)
* **Ação Corretiva:**
  Implementar o método `cancelDelivery` faltante em `DeliveryDAO.js` para garantir 100% de aprovação na suíte de testes integrada do backend.

---

## 2. Tabela de Arquivos e Modificações

| Arquivo | Camada | Modificação Principal |
| :--- | :--- | :--- |
| `server/dao/CondominiumDAO.js` | DAO | Atualização transacional de `blocks.name` e `units.block` em `updateBlock`. |
| `server/dao/ResidentDAO.js` | DAO | Projeção `COALESCE(b.name, u.block) AS block` em `getUnits` e `getUnit`. |
| `server/dao/FinancialDAO.js` | DAO | Correção de vazamento multi-tenant contábil e exportação de `overdueCount`. |
| `server/dao/DeliveryDAO.js` | DAO | Implementação do método `cancelDelivery`. |
| `server/server.js` | API | Cálculo e injeção de todas as métricas em `/api/dashboard` (reservas hoje, saldo, estoque baixo, avisos). |
| `client/src/views/DashboardView.jsx` | Frontend | Exibição de saldo real, status da portaria (`IN_PROPERTY`), estoque em falta vs baixo e banner dinâmico. |
| `client/src/App.jsx` | Frontend | Escuta de evento global `dashboard-refresh` e passagem do condomínio ativo ao Dashboard. |
| `client/src/views/ReservationsView.jsx` | Frontend | Disparo de evento `dashboard-refresh` após agendar/cancelar. |
| `client/src/views/AnnouncementsView.jsx` | Frontend | Disparo de evento `dashboard-refresh` após publicar/excluir aviso. |
