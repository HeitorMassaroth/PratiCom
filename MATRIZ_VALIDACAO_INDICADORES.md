# MATRIZ DE VALIDAÇÃO E RASTREAMENTO DE INDICADORES — PRATICOM ERP

Este documento apresenta o rastreamento ponta a ponta de cada elemento e indicador visual do Dashboard:
**Banco de Dados → Consulta SQL / DAO → Endpoint Backend → Serviço Frontend → Componente Visual**.

---

## 1. Matriz Geral de Rastreabilidade e Diagnóstico

| Indicador / Elemento | Origem no Banco de Dados | Camada DAO | Endpoint / API | Camada Frontend | Valor Esperado (Condo 1) | Valor Atual Encontrado | Situação |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Nome do Condomínio no Banner** | Tabela `condominiums.name` | `CondominiumDAO.getCondominiumById` | N/A (não enviado ao Dashboard) | `DashboardView.jsx` (L32: texto literal) | `"Condomínio Alpha Praticom"` | `"Condomínio Residencial Parque das Flores"` | **Erro Confirmado** (Hardcoded) |
| **2. Encomendas Pendentes** | Tabela `deliveries` (status `pending`, `PENDING`, `RECEBIDA`) | `DeliveryDAO.getDeliveries({ condominiumId })` | `GET /api/dashboard` (`metrics.pendingDeliveries`) | `api.getDashboard` → `DashboardView.jsx` (L59) | `2` encomendas | `2` | **Verificado sem Problema** |
| **3. Saldo em Caixa** | `financial_transactions` (`income` pago - `expense` pago) | `FinancialDAO.getSummary` (`summary.currentBalance`) | `GET /api/dashboard` (`metrics` não inclui `balance`) | `api.getDashboard` → `DashboardView.jsx` (L71: `metrics.balance`) | `R$ 6.037,20` (ou saldo depurado) | `R$ 0,00` | **Erro Confirmado** (Chave ausente) |
| **4. Unidades em Atraso** | `financial_transactions` (`status = 'OVERDUE'`) | `FinancialDAO.getSummary` (calcula `overdueCount`, mas não expõe) | `GET /api/dashboard` (`metrics` não inclui `overdueCount`) | `api.getDashboard` → `DashboardView.jsx` (L74: `metrics.overdueCount`) | `0` (ou contagem de unidades devedoras) | `Taxas em dia` (fixo por ser undefined) | **Erro Confirmado** (Omitido no DAO) |
| **5. Pessoas no Condomínio** | `access_logs` (status `inside` ou `IN_PROPERTY`) | `AccessDAO.getAccessLogs({ condominiumId })` | `GET /api/dashboard` (`metrics.activeAccess`) | `api.getDashboard` → `DashboardView.jsx` (L85: `metrics.activeVisitors`) | `1` pessoa no prédio | `0` | **Erro Confirmado** (Mismatch de chave) |
| **6. Reservas de Hoje** | `reservations` (`reservation_date = CURRENT_DATE`) | `ReservationDAO.getReservations` | `GET /api/dashboard` (`metrics` não calcula `todayReservations`) | `api.getDashboard` → `DashboardView.jsx` (L96: `metrics.todayReservations`) | `1` reserva para hoje | `0` | **Erro Confirmado** (Não calculado) |
| **7. Estoque do Mercadinho** | `market_products` (`stock_quantity <= min_stock`) | `MarketDAO.getProducts({ condominiumId })` | `GET /api/dashboard` (`MarketDAO` não é chamado) | `api.getDashboard` → `DashboardView.jsx` (L108: `metrics.lowStockItems`) | `1` item abaixo do mínimo | `0` ("Estoque abastecido") | **Erro Confirmado** (Módulo não integrado) |
| **8. Tabela de Fluxo de Portaria** | `access_logs` (entradas e saídas recentes) | `AccessDAO.getAccessLogs` | `GET /api/dashboard` (`recentAccess: activeAccess.slice(0, 5)`) | `DashboardView.jsx` (L134-177) | Badge "No Condomínio" para presentes | Badge "Saiu" para novos cadastros | **Erro Confirmado** (Inversão visual) |
| **9. Tabela de Últimas Encomendas** | `deliveries` (pacotes recebidos) | `DeliveryDAO.getDeliveries` | `GET /api/dashboard` (`recentDeliveries: pendingDeliveries.slice(0, 5)`) | `DashboardView.jsx` (L193-234) | Lista das últimas encomendas recebidas | Apenas pacotes pendentes (entregues/cancelados nunca aparecem) | **Risco Identificado** (Filtro restritivo) |
| **10. Avisos em Destaque** | `announcements` (comunicados urgentes) | `AnnouncementDAO.getAnnouncements` | `GET /api/dashboard` (`urgentAnnouncements`) | `DashboardView.jsx` (L241-280) | Comunicados com prioridade urgente | Descarta comunicados criados com `priority='urgent'` | **Erro Confirmado** (Filtro de casing/idioma) |
| **11. Próximas Reservas** | `reservations` (agendamentos futuros) | `ReservationDAO.getReservations` | `GET /api/dashboard` (`upcomingReservations: reservations.slice(0, 5)`) | `DashboardView.jsx` (L284-328) | Reservas futuras em ordem cronológica ascendente | Exibe reservas passadas de meses anteriores em ordem decrescente | **Erro Confirmado** (Ordenação e filtro) |
| **12. Badges da Barra Lateral (Sidebar)** | Métricas consolidadas do Dashboard | Vários DAOs | `GET /api/dashboard` (`metrics`) | `Sidebar.jsx` (L20-27: `stats?.pendingDeliveries`, etc.) | Badges numéricas nas abas correspondentes | 4 de 5 badges nunca acendem | **Erro Confirmado** (Efeito cascata) |

---

## 2. Rastreamento Detalhado por Indicador

### Indicador 1: Nome do Condomínio no Banner Superior
```
[Banco de Dados]
  Tabela: condominiums
  Coluna: name ('Condomínio Alpha Praticom')
       │
[DAO]
  CondominiumDAO.getCondominiums() ou CondominiumDAO.getCondominiumById(id)
       │
[Backend API]
  GET /api/condominiums ou GET /api/dashboard
  * O endpoint /api/dashboard NÃO injeta os dados do condomínio ativo no payload.
       │
[Frontend Service]
  api.getDashboard() recebe apenas métricas e listas operacionais.
       │
[Componente Visual: DashboardView.jsx]
  Linha 32: <span className="welcome-banner-condo">Condomínio Residencial Parque das Flores</span>
  * Resultado: Nome estático gravado no código JSX, ignorando o banco de dados.
```

---

### Indicador 2: Encomendas Pendentes
```
[Banco de Dados]
  Tabela: deliveries
  Condição: u.block_id vinculado ao Condomínio 1 e status IN ('pending', 'PENDING', 'RECEBIDA').
  Registros reais: Delivery ID 8 ('PENDING'), Delivery ID 3 ('pending') -> Total = 2.
       │
[DAO]
  DeliveryDAO.getDeliveries({ condominiumId: 1 })
  Query: SELECT d.*, ... FROM deliveries d LEFT JOIN units u ... LEFT JOIN blocks b ...
       │
[Backend API]
  server.js (linhas 97-98, 112)
  pendingDeliveries = deliveries.filter(d => ['pending', 'PENDING', 'RECEBIDA'].includes(d.status))
  metrics.pendingDeliveries = 2
       │
[Frontend Service]
  api.getDashboard() retorna { metrics: { pendingDeliveries: 2 } }
       │
[Componente Visual: DashboardView.jsx]
  Linha 59: <div className="value">{metrics.pendingDeliveries ?? 0}</div>
  * Resultado: Exibe corretamente "2".
```

---

### Indicador 3: Saldo em Caixa
```
[Banco de Dados]
  Tabela: financial_transactions
  Receitas Pagas (Income Paid) - Despesas Pagas (Expense Paid).
  Valores reais no banco:
    - Receitas Pagas = R$ 12.298,40
    - Despesas Pagas = R$ 6.261,20 (contaminadas por despesas de outros condomínios)
    - Saldo = R$ 6.037,20
       │
[DAO]
  FinancialDAO.getSummary({ condominiumId: 1 })
  Retorna: { currentBalance: 6037.199999999999, income: {...}, expense: {...} }
       │
[Backend API: server.js]
  Linhas 111-116:
  metrics: {
    pendingDeliveries: ...,
    activeAccess: ...,
    overdueAmount: ...,
    defaultRate: ...
    // FALHA: summary.currentBalance NÃO é incluído em metrics!
  }
       │
[Frontend Service]
  api.getDashboard() recebe data.metrics sem a propriedade balance.
       │
[Componente Visual: DashboardView.jsx]
  Linha 71: R$ {(metrics.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
  * metrics.balance é undefined -> avalia para 0 -> Formata como "R$ 0,00".
  * Resultado: Sempre zerado.
```

---

### Indicador 4: Unidades em Atraso (Subtexto do Card Financeiro)
```
[Banco de Dados]
  Tabela: financial_transactions
  Query: COUNT(DISTINCT unit_id) WHERE type = 'INCOME' AND status = 'OVERDUE'
       │
[DAO: FinancialDAO.js]
  Linha 47: const overdueCount = this.db.prepare(...).get(...).count;
  Linha 72: return { income, expense, currentBalance, default_rate, delinquencyByUnit };
  * FALHA: A variável overdueCount NÃO é colocada no objeto retornado!
       │
[Backend API: server.js]
  Linha 103: summary = financialDAO.getSummary(...)
  Linha 114: summary.default_amount (campo inexistente em summary)
  * FALHA: overdueCount não é injetado em data.metrics.
       │
[Componente Visual: DashboardView.jsx]
  Linha 74: {metrics.overdueCount > 0 ? `${metrics.overdueCount} unidades em atraso` : 'Taxas em dia'}
  * metrics.overdueCount é undefined -> condição falsa -> Exibe sempre "Taxas em dia".
```

---

### Indicador 5: Pessoas no Condomínio
```
[Banco de Dados]
  Tabela: access_logs
  Registros: EletroServ Manutenções (ID 2, status 'inside') -> Total = 1 pessoa presente.
       │
[DAO]
  AccessDAO.getAccessLogs({ condominiumId: 1 })
       │
[Backend API: server.js]
  Linha 101: activeAccess = accessLogs.filter(a => a.status === 'IN_PROPERTY' || a.status === 'inside')
  Linha 113: metrics.activeAccess = activeAccess.length (Valor = 1)
  * FALHA: Backend nomeia o campo como "activeAccess".
       │
[Frontend: DashboardView.jsx & Sidebar.jsx]
  DashboardView.jsx L85: <div className="value">{metrics.activeVisitors ?? 0}</div>
  Sidebar.jsx L22: badge: stats?.activeVisitors ? ...
  * FALHA: Frontend e Sidebar buscam "activeVisitors".
  * Resultado: metrics.activeVisitors é undefined -> Exibe sempre "0".
```

---

### Indicador 6: Reservas de Hoje
```
[Banco de Dados]
  Tabela: reservations
  Registro: Reserva ID 8 (Churrasqueira 1, data '2026-10-13', status 'CONFIRMED') -> Total = 1 reserva hoje.
       │
[DAO]
  ReservationDAO.getReservations({ condominiumId: 1 })
       │
[Backend API: server.js]
  Linha 108: reservations = spaceDAO.getReservations({ condominiumId })
  Linhas 111-116: metrics {}
  * FALHA: Nenhuma contagem de reservas para o dia corrente é feita ou inserida em metrics.
       │
[Frontend: DashboardView.jsx & Sidebar.jsx]
  DashboardView.jsx L96: <div className="value">{metrics.todayReservations ?? 0}</div>
  Sidebar.jsx L25: badge: stats?.todayReservations ? ...
  * Resultado: metrics.todayReservations é undefined -> Exibe sempre "0".
```

---

### Indicador 7: Estoque do Mercadinho
```
[Banco de Dados]
  Tabela: market_products
  Registro: 'Pizza Congelada Sadia' (stock_quantity = 5, min_stock = 5) -> Total = 1 item precisando reposição.
       │
[DAO]
  MarketDAO.getProducts({ condominiumId: 1 })
       │
[Backend API: server.js]
  * FALHA: marketDAO não é importado nem consultado na rota /api/dashboard.
       │
[Frontend: DashboardView.jsx & Sidebar.jsx]
  DashboardView.jsx L108: <div className="value">{metrics.lowStockItems ?? 0}</div>
  Sidebar.jsx L27: badge: stats?.lowStockItems ? ...
  * Resultado: metrics.lowStockItems é undefined -> Exibe sempre "0" ("Estoque abastecido").
```

---

### Indicador 8: Tabela "Fluxo da Portaria em Tempo Real"
```
[Banco de Dados]
  Tabela: access_logs
  Novos registros inseridos via AccessDAO.registerEntry possuem status 'IN_PROPERTY'.
       │
[Backend API: server.js]
  Linha 101: activeAccess = accessLogs.filter(a => a.status === 'IN_PROPERTY' || a.status === 'inside')
  Linha 117: recentAccess = activeAccess.slice(0, 5)
  * Passa apenas registros ativos.
       │
[Componente Visual: DashboardView.jsx]
  Linha 166:
  {log.status === 'inside' ? (
    <span className="badge badge-warning">No Condomínio</span>
  ) : (
    <span className="badge badge-success">Saiu</span>
  )}
  * FALHA: Compara apenas com a string 'inside'.
  * Como o status gravado pelo DAO é 'IN_PROPERTY', avalia para falso e renderiza o badge verde "Saiu" para visitantes que estão dentro do condomínio!
```

---

### Indicador 9: Avisos em Destaque
```
[Banco de Dados]
  Tabela: announcements
  Avisos urgentes cadastrados no sistema possuem prioridade gravada como 'urgent' (minúsculo em inglês).
       │
[Backend API: server.js]
  Linha 106:
  urgentAnnouncements = announcements.filter(a => a.priority === 'URGENTE' || a.priority === 'high');
  * FALHA: Não compara com 'urgent'.
  * Resultado: Avisos com prioridade 'urgent' são descartados e a lista chega vazia ao frontend.
```

---

### Indicador 10: Próximas Reservas
```
[Banco de Dados]
  Tabela: reservations
  Possui reservas de agosto de 2026 (passadas) e reservas de outubro de 2026 (atuais/futuras).
       │
[DAO: ReservationDAO.js]
  Linha 58: ORDER BY r.reservation_date DESC, r.start_time ASC
  * Não há cláusula WHERE reservation_date >= CURRENT_DATE.
  * A ordenação DESC traz primeiro as datas mais tardias e depois as mais antigas.
       │
[Backend API: server.js]
  Linha 120: upcomingReservations = reservations.slice(0, 5)
  * Pega as primeiras 5 da lista sem filtrar datas passadas.
  * Resultado: O card exibe reservas passadas de meses anteriores, rotuladas como "Próximas Reservas".
```
