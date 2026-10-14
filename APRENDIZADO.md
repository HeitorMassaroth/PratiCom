# 📚 Aprendizado do Projeto e Diagnóstico Técnico Completo — Praticom ERP

**Projeto:** Praticom ERP — Sistema Integrado de Gestão Condominial  
**Ambiente:** Node.js v24 + Express 4 + better-sqlite3 | React 18 + Vite 5 + Vanilla CSS  
**Data da Revisão Técnica:** Outubro de 2026  
**Status do Repositório:** Persistência Relacional SQLite Concluída | Multi-Tenancy Lógico Validado | Modularização por Condomínio Ativa | GoF Patterns 100% Integrados  

---

## 1. Visão Geral da Arquitetura e Decisões de Projeto

O **Praticom ERP** adota uma arquitetura desacoplada moderna (Decoupled SPA + RESTful API + SQLite Relacional), sem acoplamentos em formato de arquivo JSON local para persistência de dados.

```
                      +---------------------------------------+
                      |       CLIENTE (React 18 + Vite 5)     |
                      |   - Vanilla CSS + Design Tokens       |
                      |   - Lucide React Ícones               |
                      |   - Seletor de Condomínio Ativo       |
                      |   - Sidebar com Módulos Dinâmicos     |
                      +---------------------------------------+
                                          |
                              HTTP REST + JSON Fetch
                        Header: X-Condominium-Id: <id>
                                          v
                      +---------------------------------------+
                      |        SERVIDOR (Express 4.18)        |
                      |   - Middleware Tenant Context         |
                      |   - Middleware Module Guard           |
                      |   - Feature Flags LPS (Singleton)     |
                      |   - Template Method (Reports/Pay/Notif)
                      +---------------------------------------+
                                          |
                                   DAO Factory
                                          v
                      +---------------------------------------+
                      |         CAMADA DAO (better-sqlite3)   |
                      |   - CondominiumDAO   - ResidentDAO    |
                      |   - DeliveryDAO      - FinancialDAO   |
                      |   - OperationsDAO    - ReservationDAO |
                      |   - MarketDAO                         |
                      +---------------------------------------+
                                          |
                           DatabaseSingleton (WAL + FK ON)
                                          v
                      +---------------------------------------+
                      |   SQLITE 3 (condo_database.sqlite)    |
                      |   - 17 Tabelas Relacionais            |
                      |   - Chaves Primárias e Estrangeiras   |
                      |   - Índices de Desempenho             |
                      +---------------------------------------+
```

### 1.1 Camada Frontend
* **Tecnologia:** Single Page Application (SPA) em **React 18** construída sobre o bundler **Vite 5**.
* **Estilização:** Vanilla CSS modularizado (`client/src/index.css`) com sistema robusto de variáveis CSS (`--bg-primary`, `--text-primary`, `--primary`, `--border`, etc.), garantindo suporte nativo instantâneo a alternância de temas **Claro / Escuro** (`[data-theme="dark"]` e `[data-theme="light"]`).
* **Comunicação:** Cliente centralizado em [`client/src/services/api.js`](file:///c:/Users/Heitor/Praticom_Broken/client/src/services/api.js), que injeta automaticamente o header `X-Condominium-Id` em todas as requisições HTTP Fetch, sincronizado com o `localStorage` do navegador.

### 1.2 Camada Backend
* **Tecnologia:** API RESTful em **Node.js** com framework **Express 4.18.2** em [`server/server.js`](file:///c:/Users/Heitor/Praticom_Broken/server/server.js).
* **Driver de Banco de Dados:** `better-sqlite3`, operando de forma síncrona de alta performance, com suporte integral a transações atômicas nativas do motor C do SQLite.
* **Middlewares Centrais:**
  * [`tenantContextMiddleware`](file:///c:/Users/Heitor/Praticom_Broken/server/middleware/tenantContext.js): Valida a autenticidade e o status (`ACTIVE`) do condomínio informado no header `X-Condominium-Id`.
  * [`checkModuleAvailability`](file:///c:/Users/Heitor/Praticom_Broken/server/middleware/moduleGuard.js): Bloqueia requisições a rotas de módulos não contratados pelo condomínio com status HTTP `403 Forbidden`.
  * `checkFeature`: Intercepta rotas condicionadas à Linha de Produtos de Software (LPS).

### 1.3 Camada de Banco de Dados
* **Arquivo Físico:** `server/condo_database.sqlite`.
* **Pragmas Obrigatórios:**
  * `PRAGMA foreign_keys = ON;` — enforce mandatório em cada conexão aberta.
  * `PRAGMA journal_mode = WAL;` — Write-Ahead Logging para concorrência de leitura e escrita simultâneas sem bloqueios.
  * `PRAGMA busy_timeout = 5000;` — tolerância de 5 segundos contra locks temporários em escrita concorrente.

---

## 2. Padrões de Projeto (GoF) Implementados

A arquitetura do backend segue rigorosamente padrões da Gang of Four (GoF) para desacoplamento e extensão:

### 2.1 Padrão SINGLETON (2 Exemplos Funcionais)
1. [`DatabaseSingleton.js`](file:///c:/Users/Heitor/Praticom_Broken/server/config/DatabaseSingleton.js):
   * **Objetivo:** Garante uma única instância física da conexão SQLite para toda a aplicação Node.js.
   * **Execução:** Configura pragmas de integridade, aplica migrações de compatibilidade dinâmica (`applyCompatibilityMigrations`) e executa o `schema.sql` na inicialização caso necessário.
2. [`AppConfigSingleton.js`](file:///c:/Users/Heitor/Praticom_Broken/server/config/AppConfigSingleton.js):
   * **Objetivo:** Gerenciador global de Feature Flags da Linha de Produtos de Software (LPS).
   * **Funcionamento:** Mantém cache em memória das flags persistidas na tabela `app_features` (`ENABLE_MARKETPLACE`, `ENABLE_ADVANCED_DELIVERIES`), permitindo leitura sem overhead de disco e atualização síncrona em runtime.

### 2.2 Padrão DATA ACCESS OBJECT (DAO - 8 DAOs Especializados)
Todas as queries SQL e manipulações DML estão encapsuladas em classes DAO em [`server/dao/`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/):
* [`CondominiumDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/CondominiumDAO.js): Gestão de condomínios, blocos territoriais, associação de unidades legadas e ativação de módulos por tenant (`condominium_modules`).
* [`ResidentDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/ResidentDAO.js): CRUD completo de unidades, moradores, veículos e animais de estimação (pets).
* [`DeliveryDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/DeliveryDAO.js): Recepção, controle e baixa de encomendas, com suporte a PIN de segurança.
* [`FinancialDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/FinancialDAO.js): Extrato financeiro, cálculo dinâmico de receitas, despesas, saldo e taxa de inadimplência, quitação de transações.
* [`MarketDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/MarketDAO.js): Catálogo de produtos, ajuste de estoque, transações ACID de checkout do PDV com inserção normalizada em `market_sale_items`.
* [`OperationsDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/OperationsDAO.js): Mural de avisos/comunicados e logs de portaria (controle de acesso de visitantes e prestadores).
* [`ReservationDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/ReservationDAO.js): Espaços comuns, agendamento de reservas com validação de horários e cancelamento.

### 2.3 Padrão FACTORY METHOD (1 Exemplo Funcional)
* [`DAOFactory.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/DAOFactory.js): Fornece um ponto centralizado para instanciação e injeção dos DAOs através do método estático `DAOFactory.getDAO(type)`. Oculta as dependências de instanciação das rotas do Express.

### 2.4 Padrão TEMPLATE METHOD (3 Exemplos Funcionais)
Localizados em [`server/services/templates/`](file:///c:/Users/Heitor/Praticom_Broken/server/services/templates/):
1. [`ReportTemplate.js`](file:///c:/Users/Heitor/Praticom_Broken/server/services/templates/ReportTemplate.js):
   * **Algoritmo Base:** `generateReport()` orquestra `fetchData()` -> `formatHeader()` -> `formatContent()` -> `formatSummary()`.
   * **Implementação:** `FinancialReportGenerator` implementa os passos concretos para o balanço financeiro do condomínio.
2. [`PaymentTemplate.js`](file:///c:/Users/Heitor/Praticom_Broken/server/services/templates/PaymentTemplate.js):
   * **Algoritmo Base:** `processPayment()` orquestra `validateAmount()` -> `authorizePayment()` -> `recordTransaction()` -> `generateReceipt()`.
   * **Implementações:** `PixPaymentProcessor` e `CondoFeePaymentProcessor`.
3. [`NotificationTemplate.js`](file:///c:/Users/Heitor/Praticom_Broken/server/services/templates/NotificationTemplate.js):
   * **Algoritmo Base:** `sendNotification()` orquestra `buildRecipient()` -> `formatMessage()` -> `deliver()` -> `logNotification()`.
   * **Implementações:** `DeliveryNotificationDispatcher` e `AnnouncementNotificationDispatcher`.

---

## 3. Banco de Dados Relacional SQLite (17 Tabelas)

O banco de dados relacional oficial do Praticom ERP é definido em [`server/schema.sql`](file:///c:/Users/Heitor/Praticom_Broken/server/schema.sql):

| # | Tabela | Chave Primária | Chaves Estrangeiras (FKs) | Restrições Relevantes | Finalidade |
|---|---|---|---|---|---|
| 1 | `condominiums` | `id` (AUTO) | — | `status IN ('ACTIVE','INACTIVE')` | Condomínios clientes cadastrados |
| 2 | `blocks` | `id` (AUTO) | `condominium_id -> condominiums(id)` | `UNIQUE(condominium_id, name)` | Blocos ou torres territoriais |
| 3 | `units` | `id` (AUTO) | `block_id -> blocks(id)` | `UNIQUE(block, number)` | Apartamentos e salas |
| 4 | `residents` | `id` (AUTO) | `unit_id -> units(id)` ON DELETE CASCADE | — | Moradores associados a unidades |
| 5 | `vehicles` | `id` (AUTO) | `unit_id -> units(id)`, `resident_id -> residents(id)` | ON DELETE CASCADE (unidade) / SET NULL (morador) | Veículos dos moradores |
| 6 | `pets` | `id` (AUTO) | `unit_id -> units(id)`, `resident_id -> residents(id)` | ON DELETE CASCADE (unidade) / SET NULL (morador) | Animais de estimação |
| 7 | `deliveries` | `id` (AUTO) | `unit_id -> units(id)`, `resident_id -> residents(id)` | `status`, `pickup_code` NOT NULL | Encomendas na portaria |
| 8 | `access_logs` | `id` (AUTO) | `destination_unit_id -> units(id)` | ON DELETE CASCADE | Fluxo de visitantes e prestadores |
| 9 | `spaces` | `id` (AUTO) | `condominium_id -> condominiums(id)` | — | Churrasqueiras, salões de festas |
| 10 | `reservations` | `id` (AUTO) | `space_id`, `unit_id`, `resident_id` | ON DELETE CASCADE | Agendamento de áreas comuns |
| 11 | `financial_transactions` | `id` (AUTO) | `condominium_id`, `unit_id` | `amount`, `due_date`, `type` | Contas a pagar e a receber |
| 12 | `announcements` | `id` (AUTO) | `condominium_id`, `block_id` | — | Mural de comunicados do condomínio |
| 13 | `market_products` | `id` (AUTO) | `condominium_id -> condominiums(id)` | `price NOT NULL`, `stock_quantity` | Catálogo de produtos do mercadinho |
| 14 | `market_sales` | `id` (AUTO) | `unit_id`, `resident_id` | ON DELETE CASCADE | Vendas realizadas no PDV autônomo |
| 15 | `market_sale_items` | `id` (AUTO) | `sale_id -> market_sales(id)`, `product_id` | `quantity > 0`, `line_total` | Itens normalizados de cada venda |
| 16 | `app_features` | `feature` (PK) | — | `enabled IN (0, 1)` | Feature Flags da LPS (em SQLite) |
| 17 | `condominium_modules` | `(condominium_id, module_key)` | `condominium_id -> condominiums(id)` | ON DELETE CASCADE, chaves restritas | Módulos ativos por condomínio |

### 3.1 Índices Otimizados do Schema
* `idx_residents_unit` em `residents(unit_id)`
* `idx_deliveries_status` em `deliveries(status)`
* `idx_access_status` em `access_logs(status)`
* `idx_reservations_date` em `reservations(reservation_date)`
* `idx_financial_status` em `financial_transactions(status)`
* `idx_market_sale_items_sale` em `market_sale_items(sale_id)`
* `idx_blocks_condominium` em `blocks(condominium_id)`
* `idx_units_block` em `units(block_id)`
* `idx_condo_modules_lookup` em `condominium_modules(condominium_id, module_key, enabled)`

---

## 4. Arquitetura Multi-Tenant e Isolamento de Dados

O Praticom ERP utiliza um modelo de **Multi-Tenancy Lógico com Chave Particionadora (`condominium_id`)**, validado e garantido em nível de aplicação e persistência:

### 4.1 Identificação do Condomínio Ativo
1. **Frontend:** O componente [`CondominiumSelector.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/components/CondominiumSelector.jsx) lista condomínios ativos e armazena a seleção no `localStorage`.
2. **Requisição HTTP:** O arquivo [`api.js`](file:///c:/Users/Heitor/Praticom_Broken/client/src/services/api.js) adiciona automaticamente o header `X-Condominium-Id: <id>` em toda chamada Fetch.
3. **Backend Middleware ([`tenantContext.js`](file:///c:/Users/Heitor/Praticom_Broken/server/middleware/tenantContext.js)):**
   - Intercepta a requisição e extrai o ID do cabeçalho ou parâmetro `condominium_id`.
   - Caso omitido, assume o condomínio padrão (ID 1) por retrocompatibilidade.
   - Consulta o banco SQLite para confirmar se o condomínio existe e possui `status = 'ACTIVE'`.
   - Se inativo, responde `403 Forbidden`; se inexistente, responde `404 Not Found`.
   - Injeta `req.condominiumId` e `req.condominiumName` para consumo seguro das rotas e DAOs.

### 4.2 Filtragem Relacional nos DAOs
* **Filtragem Direta:** Tabelas com chave direta `condominium_id` (`spaces`, `financial_transactions`, `announcements`, `market_products`, `blocks`, `condominium_modules`) executam `WHERE condominium_id = ?`.
* **Filtragem Hierárquica:** Tabelas associadas a unidades físicas (`units`, `residents`, `vehicles`, `pets`, `deliveries`, `access_logs`) realizam `JOIN` com blocos:
  ```sql
  SELECT u.* FROM units u
  LEFT JOIN blocks b ON u.block_id = b.id
  WHERE b.condominium_id = ?
  ```
  *Nota de retrocompatibilidade para Condomínio 1:* Unidades legadas sem `block_id` associado são atendidas via `(b.condominium_id = 1 OR u.block_id IS NULL)`.

### 4.3 Comprovação de Isolamento
O script de validação automatizada [`server/tests/verify_isolation.js`](file:///c:/Users/Heitor/Praticom_Broken/server/tests/verify_isolation.js) comprova em tempo de execução:
* Criação de um condomínio de teste isolado ("Condomínio Gama").
* Verificação de estado inicial: zero unidades, moradores, veículos, encomendas, acessos, lançamentos financeiros e produtos vazados de outros condomínios.
* Criação de registros exclusivos e validação de que condomínios adjacentes não enxergam esses dados.
* Exclusão limpa do condomínio após a auditoria.

---

## 5. Sistema de Módulos Ativáveis por Condomínio

O administrador do sistema pode configurar quais módulos de negócio estão contratados e operacionais para cada condomínio cliente:

### 5.1 Categorização dos Módulos

```
                                  +------------------------------------+
                                  |         PRATICOM ERP - NAVEGAÇÃO   |
                                  +------------------------------------+
                                            /                \
                                           /                  \
              +--------------------------------+          +--------------------------------+
              |    3 ÁREAS OBRIGATÓRIAS        |          |     6 MÓDULOS OPCIONAIS        |
              |    (Sempre Ativas no Sistema)  |          |   (Ativáveis por Condomínio)   |
              +--------------------------------+          +--------------------------------+
              | 1. Cadastro de Pessoas         |          | 1. Dashboard (dashboard)       |
              | 2. Condomínios & Blocos        |          | 2. Portaria/Acesso (access)    |
              | 3. Mural de Comunicados        |          | 3. Encomendas (deliveries)     |
              +--------------------------------+          | 4. Reservas (reservations)     |
                                                          | 5. Financeiro (financial)      |
                                                          | 6. Mercadinho (market)         |
                                                          +--------------------------------+
```

1. **3 Áreas Obrigatórias (Indispensáveis e Não-Desativáveis):**
   * **Cadastro de Pessoas (`residents`):** Gestão de moradores, unidades, veículos e animais de estimação.
   * **Condomínios & Blocos (`territory`):** Gestão cadastral de condomínios, blocos e mapeamento territorial.
   * **Mural de Comunicados (`announcements`):** Avisos gerais e comunicação institucional com moradores.
2. **6 Módulos Opcionais Ativáveis:**
   * `dashboard`: Painel com indicadores operacionais consolidados.
   * `access`: Controle de portaria, entradas, saídas e visitantes.
   * `deliveries`: Gestão e recebimento de encomendas.
   * `reservations`: Espaços comuns e agendamentos.
   * `financial`: Fluxo de caixa, extrato e lançamentos.
   * `market`: Mercadinho autônomo e autoatendimento PDV.

### 5.2 Mecanismo de Proteção e Resiliência
* **Persistência Relacional:** Tabela `condominium_modules` com chave composta `(condominium_id, module_key)`.
* **Proteção Backend ([`moduleGuard.js`](file:///c:/Users/Heitor/Praticom_Broken/server/middleware/moduleGuard.js)):** Middleware `checkModuleAvailability(moduleKey)` intercepta as rotas protegidas e retorna `403 Forbidden` (`{ error: "Acesso negado: o módulo '...' está desativado...", disabled: true }`).
* **Adaptação Dinâmica do Frontend:**
  * [`Sidebar.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/components/Sidebar.jsx): Oculta visualmente os botões de menu dos módulos inativos.
  * [`App.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/App.jsx): Carrega os módulos ativos ao inicializar ou trocar de condomínio. Se o usuário estiver em uma tela cujo módulo foi desativado, é redirecionado suavemente para `dashboard` ou `residents`.
  * [`DashboardView.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/views/DashboardView.jsx): Resiliente a submódulos inativos; quando `deliveries` ou `financial` estão desativados, as métricas retornam `null` e os cards exibem estado desabilitado sem falhas de JavaScript.
  * [`CondominiumsBlocksView.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/views/CondominiumsBlocksView.jsx): Disponibiliza o modal administrativo com toggles individuais para o síndico ativar/desativar módulos de cada condomínio.

---

## 6. Linha de Produtos de Software (LPS / Feature Flags)

O Praticom ERP implementa conceitos de Linha de Produtos de Software através de Feature Flags persistidas na tabela `app_features` e gerenciadas por [`AppConfigSingleton.js`](file:///c:/Users/Heitor/Praticom_Broken/server/config/AppConfigSingleton.js):

1. **`ENABLE_MARKETPLACE` (Mercadinho Autônomo):**
   * Controla a disponibilidade do catálogo de produtos e vendas no PDV.
   * Interceptado pelo middleware `checkFeature('ENABLE_MARKETPLACE')` nas rotas `/api/market/*`.
2. **`ENABLE_ADVANCED_DELIVERIES` (Retirada de Encomendas com Código PIN):**
   * Quando ativado, a rota `PATCH /api/deliveries/:id/pickup` exige a conferência estrita do `pickup_code`.
   * Quando inativo, a liberação ocorre de forma simplificada sem a exigência do código PIN.

---

## 7. Catálogo Completo de Endpoints REST (34 Endpoints)

| Método | Rota | Middlewares / Proteções | Finalidade | DAO Responsável |
|---|---|---|---|---|
| `GET` | `/api/condominiums` | `tenantContext` | Lista todos os condomínios cadastrados | `CondominiumDAO` |
| `POST` | `/api/condominiums` | `tenantContext` | Cadastra novo condomínio | `CondominiumDAO` |
| `GET` | `/api/condominiums/:id` | `tenantContext` | Detalhes do condomínio | `CondominiumDAO` |
| `PATCH` | `/api/condominiums/:id` | `tenantContext` | Atualiza dados do condomínio | `CondominiumDAO` |
| `PATCH` | `/api/condominiums/:id/status` | `tenantContext` | Altera status (ACTIVE/INACTIVE) | `CondominiumDAO` |
| `DELETE` | `/api/condominiums/:id` | `tenantContext` | Exclui condomínio (com checagem de FK) | `CondominiumDAO` |
| `GET` | `/api/condominiums/:id/blocks` | `tenantContext` | Lista blocos do condomínio | `CondominiumDAO` |
| `POST` | `/api/condominiums/:id/blocks` | `tenantContext` | Cria novo bloco no condomínio | `CondominiumDAO` |
| `GET` | `/api/blocks/:id` | `tenantContext` | Detalhes do bloco | `CondominiumDAO` |
| `PATCH` | `/api/blocks/:id` | `tenantContext` | Atualiza dados do bloco | `CondominiumDAO` |
| `PATCH` | `/api/blocks/:id/status` | `tenantContext` | Altera status do bloco | `CondominiumDAO` |
| `DELETE` | `/api/blocks/:id` | `tenantContext` | Exclui bloco | `CondominiumDAO` |
| `GET` | `/api/territory/pending-units` | `tenantContext` | Unidades pendentes de associação a bloco | `CondominiumDAO` |
| `PATCH` | `/api/blocks/:id/map-legacy-units` | `tenantContext` | Associa unidades legadas ao bloco | `CondominiumDAO` |
| `GET` | `/api/condominiums/active/modules` | `tenantContext` | Lista módulos do condomínio ativo | `CondominiumDAO` |
| `GET` | `/api/condominiums/:id/modules` | `tenantContext` | Lista módulos de um condomínio específico | `CondominiumDAO` |
| `PUT` | `/api/condominiums/:id/modules` | `tenantContext` | Atualiza seleção de módulos do condomínio | `CondominiumDAO` |
| `GET` | `/api/dashboard` | `moduleGuard('dashboard')` | Métricas operacionais consolidadas | Vários DAOs |
| `GET` | `/api/deliveries` | `moduleGuard('deliveries')` | Lista encomendas com filtro | `DeliveryDAO` |
| `POST` | `/api/deliveries` | `moduleGuard('deliveries')` | Registra nova encomenda na portaria | `DeliveryDAO` |
| `PATCH` | `/api/deliveries/:id/pickup` | `moduleGuard('deliveries')` | Baixa de encomenda (valida PIN via LPS) | `DeliveryDAO` |
| `GET` | `/api/access` | `moduleGuard('access')` | Histórico e logs de controle de acesso | `OperationsDAO` |
| `POST` | `/api/access/entry` | `moduleGuard('access')` | Registra entrada de visitante/prestador | `OperationsDAO` |
| `PATCH` | `/api/access/:id/exit` | `moduleGuard('access')` | Registra saída de visitante | `OperationsDAO` |
| `DELETE` | `/api/access/:id` | `moduleGuard('access')` | Remove registro de acesso | `OperationsDAO` |
| `GET` | `/api/units` | `tenantContext` | Lista unidades do condomínio | `ResidentDAO` |
| `POST` | `/api/units` | `tenantContext` | Cadastra nova unidade | `ResidentDAO` |
| `GET` | `/api/units/:id` | `tenantContext` | Detalhes de uma unidade | `ResidentDAO` |
| `PATCH` | `/api/units/:id` | `tenantContext` | Atualiza dados da unidade | `ResidentDAO` |
| `DELETE` | `/api/units/:id` | `tenantContext` | Exclui unidade | `ResidentDAO` |
| `GET` | `/api/residents` | `tenantContext` | Lista moradores filtrados por unidade/busca | `ResidentDAO` |
| `POST` | `/api/residents` | `tenantContext` | Cadastra novo morador | `ResidentDAO` |
| `PATCH` | `/api/residents/:id` | `tenantContext` | Atualiza morador existente | `ResidentDAO` |
| `DELETE` | `/api/residents/:id` | `tenantContext` | Remove cadastro de morador | `ResidentDAO` |
| `GET` | `/api/vehicles` | `tenantContext` | Lista veículos cadastrados no condomínio | `ResidentDAO` |
| `GET` | `/api/vehicles/:id` | `tenantContext` | Detalhes de um veículo específico | `ResidentDAO` |
| `POST` | `/api/vehicles` | `tenantContext` | Cadastra veículo e vincula à unidade/morador | `ResidentDAO` |
| `PATCH` | `/api/vehicles/:id` | `tenantContext` | Atualiza dados do veículo cadastrado | `ResidentDAO` |
| `DELETE` | `/api/vehicles/:id` | `tenantContext` | Exclui somente o veículo (preserva unidade/morador) | `ResidentDAO` |
| `GET` | `/api/pets` | `tenantContext` | Lista animais de estimação cadastrados | `ResidentDAO` |
| `GET` | `/api/spaces` | `moduleGuard('reservations')` | Lista espaços comuns do condomínio | `ReservationDAO` |
| `GET` | `/api/reservations` | `moduleGuard('reservations')` | Lista reservas agendadas por data/espaço | `ReservationDAO` |
| `POST` | `/api/reservations` | `moduleGuard('reservations')` | Registra agendamento de espaço | `ReservationDAO` |
| `PATCH` | `/api/reservations/:id/cancel` | `moduleGuard('reservations')` | Cancela reserva agendada | `ReservationDAO` |
| `GET` | `/api/financial/transactions`| `moduleGuard('financial')` | Lista transações e lançamentos | `FinancialDAO` |
| `GET` | `/api/financial/summary` | `moduleGuard('financial')` | Balanço, receitas, despesas e inadimplência| `FinancialDAO` |
| `POST` | `/api/financial/transactions`| `moduleGuard('financial')` | Cria novo lançamento financeiro | `FinancialDAO` |
| `PATCH` | `/api/financial/transactions/:id` | `moduleGuard('financial')` | Edita lançamento não pago no condomínio ativo | `FinancialDAO` |
| `DELETE` | `/api/financial/transactions/:id` | `moduleGuard('financial')` | Exclui lançamento não pago; pagos são preservados | `FinancialDAO` |
| `PATCH` | `/api/financial/transactions/:id/pay` | `moduleGuard('financial')` | Registra quitação/baixa do lançamento | `FinancialDAO` |
| `GET` | `/api/financial/report` | `moduleGuard('financial')` | Gera relatório consolidado (Template Method)| `FinancialDAO` |
| `GET` | `/api/announcements` | `tenantContext` | Lista avisos e comunicados | `OperationsDAO` |
| `POST` | `/api/announcements` | `tenantContext` | Cria novo comunicado no mural | `OperationsDAO` |
| `PATCH` | `/api/announcements/:id` | `tenantContext` | Edita comunicado do condomínio ativo | `OperationsDAO` |
| `DELETE` | `/api/announcements/:id` | `tenantContext` | Exclui comunicado | `OperationsDAO` |
| `GET` | `/api/market/products` | `moduleGuard('market')` + LPS | Catálogo de produtos do mercadinho | `MarketDAO` |
| `POST` | `/api/market/products` | `moduleGuard('market')` + LPS | Cadastra novo produto no mercadinho | `MarketDAO` |
| `PATCH` | `/api/market/products/:id/stock` | `moduleGuard('market')` + LPS | Atualiza quantidade de estoque | `MarketDAO` |
| `POST` | `/api/market/checkout` | `moduleGuard('market')` + LPS | Venda no PDV (baixa no estoque + itens) | `MarketDAO` |
| `GET` | `/api/market/sales` | `moduleGuard('market')` + LPS | Histórico de vendas realizadas | `MarketDAO` |
| `GET` | `/api/config/features` | `tenantContext` | Consulta status das Feature Flags da LPS | `AppConfigSingleton` |
| `PATCH` | `/api/config/features` | `tenantContext` | Atualiza status de Feature Flag em runtime | `AppConfigSingleton` |

---

## 8. Mapeamento dos Componentes e Visões do Frontend

A aplicação cliente está estruturada em 9 visões principais e componentes de suporte:

### 8.1 Componentes de Layout e Navegação
* [`Header.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/components/Header.jsx): Barra superior com título da tela ativa, botão de alternância de tema Claro/Escuro (`Sun`/`Moon`), perfil do usuário logado e inclusão do [`CondominiumSelector.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/components/CondominiumSelector.jsx).
* [`Sidebar.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/components/Sidebar.jsx): Menu lateral de navegação com badges, ícones e filtragem reativa que oculta itens dos módulos desativados para o condomínio corrente.
* [`CondominiumSelector.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/components/CondominiumSelector.jsx): Dropdown que busca a lista de condomínios ativos via `api.getCondominiums({ status: 'ACTIVE' })`, persiste o condomínio ativo no `localStorage` e emite evento `condoChanged` para sincronizar toda a UI.

### 8.2 Visões do Sistema
1. [`DashboardView.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/views/DashboardView.jsx): Painel de indicadores com contadores em tempo real (encomendas pendentes, visitantes no local, valor em atraso, taxa de inadimplência), avisos urgentes e próximas reservas.
2. [`DeliveriesView.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/views/DeliveriesView.jsx): Recepção e controle de encomendas com código PIN de retirada, filtros por status e modal de baixa.
3. [`AccessControlView.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/views/AccessControlView.jsx): Portaria em tempo real para controle de visitantes e prestadores de serviço, registro de entrada e saída.
4. [`ResidentsView.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/views/ResidentsView.jsx): Cadastro de pessoas com busca por morador, filtro por unidade, botões de ação para novo morador e cadastro de veículos.
5. [`ReservationsView.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/views/ReservationsView.jsx): Catálogo de espaços comuns com grade de horários, conferência de conflito e cancelamento de agendamentos.
6. [`FinancialView.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/views/FinancialView.jsx): Balanço de receitas e despesas, cálculo de saldo, lista de transações com filtros e quitação imediata de débitos.
7. [`AnnouncementsView.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/views/AnnouncementsView.jsx): Mural de comunicados com publicação por categoria, prioridade (Urgente/Normal), fixação no topo e exclusão.
8. [`MarketInventoryView.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/views/MarketInventoryView.jsx): Mercadinho inteligente com catálogo de produtos, controle de estoque, terminal de autoatendimento PDV e histórico de vendas.
9. [`CondominiumsBlocksView.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/views/CondominiumsBlocksView.jsx): Gestão territorial de condomínios e blocos, associação de unidades legadas e gerenciamento de módulos contratados por condomínio.

---

## 9. Diagnóstico Técnico de Vulnerabilidades e Pontos de Atenção

Durante a auditoria arquitetural completa, foram identificados pontos críticos que exigem acompanhamento técnico:

### 9.1 Vulnerabilidade BOLA / IDOR em Métodos de Mutação
* **Cenário:** Algumas operações de exclusão e atualização, como `DELETE /api/access/:id`, `DELETE /api/residents/:id` e `PATCH /api/reservations/:id/cancel`, ainda precisam garantir que o registro pertence ao condomínio informado no header `X-Condominium-Id`. Avisos e operações financeiras de edição/exclusão agora aplicam escopo por condomínio.
* **Risco:** Um usuário malicioso com acesso ao Condomínio A pode potencialmente excluir ou alterar registros do Condomínio B forjando o ID numérico.
* **Solução:** Aplicar validação de escopo territorial em todas as operações de mutação nas DAOs, considerando também relações hierárquicas e registros legados.

### 9.2 Restrição de Unicidade de Unidades (`units`)
* **Cenário:** O schema define `UNIQUE(block, number)`. Como o campo `block` é uma string textual, dois condomínios diferentes que possuam um "Bloco A - Apto 101" colidem na restrição única do banco.
* **Solução:** Migrar a restrição de unicidade para chave composta referenciando a chave estrangeira: `UNIQUE(block_id, number)`.

### 9.3 Isolamento no Checkout do Mercadinho PDV
* **Cenário:** Ao realizar checkout no mercadinho (`MarketDAO.checkout`), o método cria um lançamento financeiro na tabela `financial_transactions` sem preencher a coluna `condominium_id` explicitamente.
* **Risco:** O lançamento pode ficar sem vínculo ou ser assumido incorretamente pelo condomínio padrão.
* **Solução:** Receber o `condominium_id` na requisição de checkout e gravá-lo no lançamento financeiro.

---

## 10. Validação, Testes Automatizados e Comandos de Operação

### 10.1 Scripts de Teste Disponíveis no Repositório
* **Isolamento Multi-Tenant:**
  ```powershell
  node server/tests/verify_isolation.js
  ```
  *Valida criação dinâmica de condomínio, isolamento estrito de tabelas territoriais e limpeza automática.*
* **Validação de Módulos por Condomínio:**
  ```powershell
  node server/tests/verify_modules.mjs
  ```
  *Valida retrocompatibilidade, bloqueio 403 Forbidden em rotas inativas, resiliência do dashboard e preservação de dados.*
* **Isolamento de Comunicados e Financeiro:**
  ```powershell
  node server/tests/verify_multitenant_c.mjs
  ```
* **Suíte Integrada de APIs e CRUD:**
  ```powershell
  node server/tests/suite.js
  ```

### 10.2 Como Executar o Projeto Localmente
1. **Via Script Automatizado:**
   ```powershell
   .\start_app.ps1
   ```
2. **Execução Manual dos Processos:**
   - **Backend:**
     ```powershell
     cd server
     npm run dev
     # API disponível em: http://localhost:5000
     ```
   - **Frontend:**
     ```powershell
     cd client
     npm run dev
     # Interface disponível em: http://localhost:5173
     ```
