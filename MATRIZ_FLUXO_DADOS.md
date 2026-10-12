# MATRIZ COMPLETA DE FLUXO DE DADOS — PRATICOM ERP

Esta matriz mapeia o fluxo completo de dados de ponta a ponta para cada funcionalidade real do **Praticom ERP**:
`Tela / Componente → Serviço Frontend → Endpoint HTTP → Middleware → Backend / DAO → Tabela SQLite → Operações → Status Operacional`.

---

| Funcionalidade | Tela | Serviço frontend | Endpoint | Backend/DAO | Tabela | Operações | Status |
|---|---|---|---|---|---|---|---|
| **Gestão de Condomínios** | `CondominiumsBlocksView` | `api.getCondominiums` | `GET /api/condominiums` | `CondominiumDAO.getCondominiums` | `condominiums`, `blocks`, `units` | READ, LIST | Operacional |
| **Cadastro de Condomínio** | `CondominiumsBlocksView` | `api.createCondominium` | `POST /api/condominiums` | `CondominiumDAO.createCondominium` | `condominiums`, `condominium_modules` | CREATE | Operacional |
| **Edição de Condomínio** | `CondominiumsBlocksView` | `api.updateCondominium` | `PATCH /api/condominiums/:id` | `CondominiumDAO.updateCondominium` | `condominiums` | UPDATE | Operacional |
| **Ativação / Inativação de Condomínio** | `CondominiumsBlocksView` | `api.updateCondominiumStatus` | `PATCH /api/condominiums/:id/status` | `CondominiumDAO.setCondominiumStatus` | `condominiums` | UPDATE | Operacional |
| **Exclusão de Condomínio** | `CondominiumsBlocksView` | `api.deleteCondominium` | `DELETE /api/condominiums/:id` | `CondominiumDAO.deleteCondominium` | `condominiums` | DELETE | Parcial (Risco de orfandade sem checar tabelas filhas) |
| **Gestão de Blocos** | `CondominiumsBlocksView` | `api.getBlocks` | `GET /api/condominiums/:id/blocks` | `CondominiumDAO.getBlocks` | `blocks`, `units` | READ, LIST | Operacional |
| **Cadastro de Bloco** | `CondominiumsBlocksView` | `api.createBlock` | `POST /api/condominiums/:id/blocks` | `CondominiumDAO.createBlock` | `blocks` | CREATE | Operacional |
| **Edição de Bloco** | `CondominiumsBlocksView` | `api.updateBlock` | `PATCH /api/blocks/:id` | `CondominiumDAO.updateBlock` | `blocks` | UPDATE | Operacional |
| **Exclusão de Bloco** | `CondominiumsBlocksView` | `api.deleteBlock` | `DELETE /api/blocks/:id` | `CondominiumDAO.deleteBlock` | `blocks` | DELETE | Operacional |
| **Mapeamento de Unidades Pendentes** | `CondominiumsBlocksView` | `api.getPendingUnits`, `api.mapLegacyUnits` | `GET /api/territory/pending-units`, `PATCH /api/blocks/:id/map-legacy-units` | `CondominiumDAO.mapPendingUnits` | `units`, `blocks` | READ, UPDATE | Operacional |
| **Gestão de Módulos por Condomínio** | `CondominiumsBlocksView` | `api.getCondominiumModules`, `api.updateCondominiumModules` | `GET /api/condominiums/:id/modules`, `PUT /api/condominiums/:id/modules` | `CondominiumDAO.getModules`, `CondominiumDAO.setModules` | `condominium_modules` | READ, UPDATE (Upsert) | Operacional |
| **Painel de Métricas do Dashboard** | `DashboardView`, `Sidebar` | `api.getDashboard` | `GET /api/dashboard` | Agregação múltipla em `server.js` via DAOs | `deliveries`, `access_logs`, `financial_transactions`, `announcements`, `reservations` | READ | Inconsistente (Chaves de retorno divergem do esperado na view - BUG-006) |
| **Recepção de Encomendas** | `DeliveriesView` | `api.createDelivery` | `POST /api/deliveries` | `DeliveryDAO.createDelivery` | `deliveries`, `units`, `residents` | CREATE | Inseguro (Aceita `unit_id` de outro condomínio - BUG-004) |
| **Listagem de Encomendas** | `DeliveriesView` | `api.getDeliveries` | `GET /api/deliveries` | `DeliveryDAO.getDeliveries` | `deliveries`, `units`, `blocks` | READ, LIST, FILTER | Operacional |
| **Retirada de Encomenda (PIN)** | `DeliveriesView` | `api.pickupDelivery` | `PATCH /api/deliveries/:id/pickup` | `DeliveryDAO.pickupDelivery` | `deliveries` | UPDATE | Inseguro (Falta validação de tenant no ID - BUG-003) |
| **Registro de Entrada na Portaria** | `AccessControlView` | `api.registerEntry` | `POST /api/access/entry` | `AccessDAO.registerEntry` | `access_logs` | CREATE | Inseguro (Aceita `destination_unit_id` de outro condomínio - BUG-004) |
| **Listagem de Acessos da Portaria** | `AccessControlView` | `api.getAccessLogs` | `GET /api/access` | `AccessDAO.getAccessLogs` | `access_logs`, `units`, `blocks` | READ, LIST, FILTER | Operacional |
| **Registro de Saída da Portaria** | `AccessControlView` | `api.registerExit` | `PATCH /api/access/:id/exit` | `AccessDAO.registerExit` | `access_logs` | UPDATE | Inseguro (Falta validação de tenant no ID - BUG-003) |
| **Exclusão de Registro de Acesso** | `AccessControlView` | `api.deleteAccess` | `DELETE /api/access/:id` | `AccessDAO.deleteAccess` | `access_logs`, `units`, `blocks` | DELETE | Operacional |
| **Cadastro de Unidades** | `CondominiumsBlocksView` | `api.createUnit` | `POST /api/units` | `ResidentDAO.createUnit` | `units`, `blocks` | CREATE | Falha (Constraint `UNIQUE(block, number)` colide cross-condomínio - BUG-001) |
| **Listagem de Unidades** | `ResidentsView`, `CondominiumsBlocksView` | `api.getUnits` | `GET /api/units` | `ResidentDAO.getUnits` | `units`, `blocks`, `residents`, `vehicles`, `pets` | READ, LIST | Operacional |
| **Edição de Unidades** | `CondominiumsBlocksView` | `api.updateUnit` | `PATCH /api/units/:id` | `ResidentDAO.updateUnit` | `units`, `blocks` | UPDATE | Operacional |
| **Exclusão de Unidades** | `CondominiumsBlocksView` | `api.deleteUnit` | `DELETE /api/units/:id` | `ResidentDAO.deleteUnit` | `units` | DELETE | Inseguro (Falta validação de tenant no ID - BUG-003) |
| **Cadastro de Moradores** | `ResidentsView` | `api.createResident` | `POST /api/residents` | `ResidentDAO.createResident` | `residents` | CREATE | Inseguro (Aceita `unit_id` de outro condomínio - BUG-004) |
| **Listagem de Moradores** | `ResidentsView` | `api.getResidents` | `GET /api/residents` | `ResidentDAO.getResidents` | `residents`, `units`, `blocks` | READ, LIST, SEARCH | Operacional |
| **Edição de Moradores** | `ResidentsView` | `api.updateResident` | `PATCH /api/residents/:id` | `ResidentDAO.updateResident` | `residents` | UPDATE | Operacional |
| **Exclusão de Moradores** | `ResidentsView` | `api.deleteResident` | `DELETE /api/residents/:id` | `ResidentDAO.deleteResident` | `residents` | DELETE | Inseguro (Falta validação de tenant no ID - BUG-003) |
| **Cadastro de Veículos** | `ResidentsView` | `api.createVehicle` | `POST /api/vehicles` | `ResidentDAO.createVehicle` | `vehicles` | CREATE | Inseguro (Sem validação territorial - BUG-004) |
| **Listagem de Veículos** | `ResidentsView` | `api.getVehicles` | `GET /api/vehicles` | `ResidentDAO.getVehicles` | `vehicles`, `units`, `residents` | READ, LIST | Operacional |
| **Listagem de Animais (Pets)** | `ResidentsView` | `api.getPets` | `GET /api/pets` | `ResidentDAO.getPets` | `pets`, `units`, `residents` | READ, LIST | Operacional |
| **Listagem de Espaços Comuns** | `ReservationsView` | `api.getSpaces` | `GET /api/spaces` | `ReservationDAO.getSpaces` | `spaces` | READ, LIST | Operacional |
| **Grade e Agendamento de Reservas** | `ReservationsView` | `api.getReservations`, `api.createReservation` | `GET /api/reservations`, `POST /api/reservations` | `ReservationDAO.createReservation` | `reservations`, `spaces`, `units` | READ, CREATE | Quebrado (Enum `'CONFIRMED'` vs `'Confirmada'` inutiliza slots na UI - BUG-005) |
| **Cancelamento de Reserva** | `ReservationsView` | `api.cancelReservation` | `PATCH /api/reservations/:id/cancel` | `ReservationDAO.cancelReservation` | `reservations` | UPDATE | Inseguro (Falta validação de tenant no ID - BUG-003) |
| **Balanço e Inadimplência** | `FinancialView` | `api.getFinancialSummary` | `GET /api/financial/summary` | `FinancialDAO.getSummary` | `financial_transactions`, `units`, `blocks` | READ, CALC | Operacional |
| **Lançamentos e Extrato Financeiro**| `FinancialView` | `api.getFinancialTransactions`| `GET /api/financial/transactions`| `FinancialDAO.getTransactions` | `financial_transactions`, `units`, `blocks` | READ, LIST, FILTER | Operacional |
| **Criação de Lançamento Financeiro**| `FinancialView` | `api.createFinancialTransaction`| `POST /api/financial/transactions`| `FinancialDAO.createTransaction` | `financial_transactions` | CREATE | Operacional |
| **Baixa / Quitação Financeira** | `FinancialView` | `api.payFinancialTransaction` | `PATCH /api/financial/transactions/:id/pay` | `FinancialDAO.payTransaction` | `financial_transactions` | UPDATE | Operacional (Possui escopo de condomínio implementado) |
| **Mural de Comunicados (Listagem)** | `AnnouncementsView` | `api.getAnnouncements` | `GET /api/announcements` | `AnnouncementDAO.getAnnouncements`| `announcements` | READ, LIST | Parcial (Filtro por prioridade é ignorado no backend - BUG-008) |
| **Publicação de Comunicados** | `AnnouncementsView` | `api.createAnnouncement` | `POST /api/announcements` | `AnnouncementDAO.createAnnouncement`| `announcements` | CREATE | Operacional |
| **Exclusão de Comunicados** | `AnnouncementsView` | `api.deleteAnnouncement` | `DELETE /api/announcements/:id` | `AnnouncementDAO.deleteAnnouncement`| `announcements` | DELETE | Inseguro (Falta validação de tenant no ID - BUG-003) |
| **Catálogo de Produtos do Mercadinho**| `MarketInventoryView` | `api.getMarketProducts` | `GET /api/market/products` | `MarketDAO.getProducts` | `market_products` | READ, LIST, FILTER | Operacional (Condicionado a `ENABLE_MARKETPLACE`) |
| **Cadastro de Produtos** | `MarketInventoryView` | `api.createMarketProduct` | `POST /api/market/products` | `MarketDAO.createProduct` | `market_products` | CREATE | Operacional |
| **Ajuste de Estoque** | `MarketInventoryView` | `api.updateMarketStock` | `PATCH /api/market/products/:id/stock` | `MarketDAO.updateStock` | `market_products` | UPDATE | Inseguro (Falta validação de tenant no ID - BUG-003) |
| **Terminal de Autoatendimento PDV** | `MarketInventoryView` | `api.checkoutMarket` | `POST /api/market/checkout` | `MarketDAO.checkout` | `market_sales`, `market_sale_items`, `market_products`, `financial_transactions` | CREATE, UPDATE (ACID) | Falha Crítica (Cota condominial não grava `condominium_id` e vaza para Condomínio 1 - BUG-002) |
| **Histórico de Vendas do PDV** | `MarketInventoryView` | `api.getMarketSales` | `GET /api/market/sales` | `MarketDAO.getSales` | `market_sales`, `market_sale_items`, `units`, `residents` | READ, LIST | Operacional |
| **Gestão de Feature Flags da LPS** | `MarketInventoryView`, `CondominiumsBlocksView` | `api.getFeatures`, `api.updateFeature` | `GET /api/config/features`, `PATCH /api/config/features` | `AppConfigSingleton.getFeatures`, `AppConfigSingleton.updateFeature` | `app_features` | READ, UPDATE | Operacional |
