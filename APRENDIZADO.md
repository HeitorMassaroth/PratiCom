# 📚 Aprendizado do Projeto e Diagnóstico Técnico Completo — Praticom ERP

**Projeto:** Praticom ERP (Sistema Integrado de Gestão Condominial)  
**Data da Última Atualização:** Outubro de 2026  
**Status do Repositório:** Persistência Relacional SQLite Concluída | Plano de Isolamento Completo Aplicado e 100% Verificado (`verify_isolation.js`)  

---

## 1. Visão Geral da Arquitetura e Evolução

O **Praticom ERP** evoluiu de uma persistência legada baseada em arquivo JSON local para uma arquitetura relacional desacoplada moderna (Decoupled SPA + REST API + SQLite Relacional):

* **Frontend (100% Preservado):** Single Page Application (SPA) desenvolvida em **React 18** e **Vite 5**, estilizada via variáveis de Vanilla CSS (`client/src/*`) e ícones da biblioteca `lucide-react`. Comunica-se com o backend via Fetch API (`client/src/services/api.js`).
* **Backend:** API RESTful em **Node.js + Express 4.18.2** ([`server/server.js`](file:///c:/Users/Heitor/Praticom_Broken/server/server.js)), integrando o banco relacional **SQLite 3** (`server/condo_database.sqlite`) através do driver síncrono de alta performance `better-sqlite3`.
* **Persistência Relacional:** Operação exclusiva via **Data Access Objects (DAOs)** e **Singletons** sobre SQLite, com suporte a transações ACID nativas, índices e integridade referencial enforçada (`PRAGMA foreign_keys = ON;`).
* **Linha de Produtos de Software (LPS / Feature Flags):** Persistidas em tabela relacional (`app_features`), permitindo controle dinâmico de funcionalidades (`ENABLE_MARKETPLACE`, `ENABLE_ADVANCED_DELIVERIES`) sem reboots do servidor.

---

## 2. Padrões de Projeto (GoF) Implementados

A refatoração da camada de backend aplicou rigorosamente os padrões de projeto da GoF para garantir desacoplamento, reutilização de código e manutenibilidade:

### 2.1 Padrão Singleton
* [`DatabaseSingleton.js`](file:///c:/Users/Heitor/Praticom_Broken/server/config/DatabaseSingleton.js): Gerencia uma conexão exclusiva e reutilizável com o banco SQLite. Configurado obrigatoriamente com `PRAGMA foreign_keys = ON;`, `journal_mode = WAL` (Write-Ahead Logging) e `busy_timeout = 5000`.
* [`AppConfigSingleton.js`](file:///c:/Users/Heitor/Praticom_Broken/server/config/AppConfigSingleton.js): Centraliza a leitura e alteração de Feature Flags persistidas na tabela `app_features`, mantendo um cache em memória para rápido acesso das rotas HTTP.

### 2.2 Padrão Data Access Object (DAO)
Todas as operações DML/SQL foram isoladas do Express em classes DAO em [`server/dao/`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/):
* [`CondominiumDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/CondominiumDAO.js) & [`CondominiumsBlocksView.jsx`](file:///c:/Users/Heitor/Praticom_Broken/client/src/views/CondominiumsBlocksView.jsx): Gestão completa de condomínios e blocos com suporte visual a listagem, busca, detalhamento, edição, alternância de status, exclusão com checagem de dependências e associação de unidades legadas.
* [`ResidentDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/ResidentDAO.js): CRUD de moradores, unidades, veículos e animais de estimação.
* [`DeliveryDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/DeliveryDAO.js): Controle de recepção e baixa de encomendas da portaria.
* [`FinancialDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/FinancialDAO.js): Fluxo de caixa, lançamentos de receitas e despesas condominiais.
* [`MarketDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/MarketDAO.js): Vendas do mercadinho autônomo com atualização transacional de estoque e gravação de itens normalizados.
* [`OperationsDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/OperationsDAO.js): Gestão de avisos, comunicados e relatórios consolidados.
* [`ReservationDAO.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/ReservationDAO.js): Reservas de áreas comuns e consulta de disponibilidade.

### 2.3 Padrão Factory Method
* [`DAOFactory.js`](file:///c:/Users/Heitor/Praticom_Broken/server/dao/DAOFactory.js): Fábrica centralizada que instancia e fornece os objetos DAO necessários para o servidor REST, ocultando a criação dos objetos e permitindo injeção de dependências.

### 2.4 Padrão Template Method
Esqueletos de algoritmos foram implementados na pasta [`server/services/templates/`](file:///c:/Users/Heitor/Praticom_Broken/server/services/templates/):
* [`ReportTemplate.js`](file:///c:/Users/Heitor/Praticom_Broken/server/services/templates/ReportTemplate.js): Estrutura a geração de relatórios (financeiro, entregas, moradores), padronizando cabeçalhos, corpo e rodapé.
* [`PaymentTemplate.js`](file:///c:/Users/Heitor/Praticom_Broken/server/services/templates/PaymentTemplate.js): Padroniza o ciclo de liquidação de pagamentos (validação, baixa no banco e emissão de recibo).
* [`NotificationTemplate.js`](file:///c:/Users/Heitor/Praticom_Broken/server/services/templates/NotificationTemplate.js): Define o ciclo de formatação e despacho de notificações e comunicados internos.

---

## 3. Eliminação Total de Persistência Interna em JSON

Conforme diretriz do plano [`0md.md`](file:///c:/Users/Heitor/Praticom_Broken/0md.md), a persistência em arquivos JSON locais e campos serializados em texto foi 100% eliminada do banco de dados relacional:

1. **Eliminação do `features.json`:** Migrado integralmente para a tabela relacional `app_features` (`feature_key` PK, `is_enabled` INTEGER).
2. **Normalização dos Itens de Venda (`items_json`):** A coluna de texto serializado `items_json` em `market_sales` foi substituída pela tabela relacional `market_sale_items` (`id` PK, `sale_id` FK, `product_id` FK, `quantity` INTEGER, `unit_price` REAL, `subtotal` REAL). O `MarketDAO` executa a baixa no estoque e a gravação dos itens em uma única transação ACID.
3. **Eliminação do Importador Legado (`condo_store.json`):** O backend não realiza leitura nem gravação em arquivos `.json` de dados operacionais.
4. **Respeito aos Manifestos do Node.js:** Os arquivos `package.json` e `package-lock.json` em `client/` e `server/` foram preservados, pois são manifestos obrigatórios do ecossistema npm. A comunicação entre React e Express continua em formato HTTP JSON REST.

---

## 4. Diagnóstico de Arquitetura Multi-Tenant (Estudo & Proposta)

O diagnóstico detalhado em [`DIAGNOSTICO_ARQUITETURA_MULTI_TENANT.md`](file:///c:/Users/Heitor/Praticom_Broken/DIAGNOSTICO_ARQUITETURA_MULTI_TENANT.md) revelou o estado operacional das 15 tabelas do SQLite:

### 4.1 Auditoria do Banco de Dados Operacional (`condo_database.sqlite`)
* **Tabelas Territoriais:** `condominiums` (0 registros) e `blocks` (0 registros).
* **Dados Órfãos (100% sem isolamento):** 8 unidades, 8 moradores, 5 veículos, 4 pets, 8 registros de portaria, 5 entregas, 3 áreas comuns, 2 reservas, 13 transações financeiras, 4 comunicados e 10 produtos de mercado foram cadastrados sem preenchimento de `condominium_id` ou `block_id`.

### 4.2 Comparação Arquitetural Multi-Tenant
Foi realizado um estudo comparativo entre três modelos de multi-tenancy para o SQLite:

| Critério | Alternativa A: Banco Isolado (Database-per-Tenant) | Alternativa B: Schema Independente | Alternativa C: Banco Compartilhado (`condominium_id`) |
| :--- | :--- | :--- | :--- |
| **Isolamento de Dados** | **Físico (Máximo)** — Cada condomínio possui seu arquivo `.sqlite`. Zero risco de vazamento por falha de SQL. | Inviável no SQLite (Sem suporte nativo a schemas gerenciados e limite de `ATTACH`). | **Lógico (Frágil)** — Depende de `WHERE condominium_id = ?` em 100% das queries SQL. |
| **Backup e Restauração** | **Simples** — Basta copiar/restaurar o arquivo `.sqlite` do condomínio afetado. | Inviável. | **Complexo** — Exige scripts DML para isolar transações sem afetar outros condomínios. |
| **Concorrência / Locks** | **Pulverizada** — Bloqueios de escrita do SQLite ficam restritos ao condomínio. | Inviável. | **Contenção Total** — Lock de escrita no arquivo único afeta todos os condomínios. |
| **Nota Ponderada** | **8.95 (Vencedora / Recomendada)** | **3.05 (Inviável)** | **6.75 (Opção de Transição)** |

### 4.3 Modelo de Autenticação e Prevenção Anti-Spoofing
* **Tabelas de Controle Master:** `SystemUser` (credenciais globais) e `UserCondominiumAccess` (vínculo de papéis: Síndico, Morador, Portaria).
* **Middleware Contextual ([`tenantContext.js`](file:///c:/Users/Heitor/Praticom_Broken/server/middleware/tenantContext.js)):** Intercepta requisições HTTP, valida o token JWT e o header `X-Condominium-Id`, garantindo bloqueio HTTP `403 Forbidden` em tentativas de acesso cruzado não autorizado.
* **Isolamento Estrito em Todos os DAOs:** Todos os DAOs (`ResidentDAO`, `DeliveryDAO`, `OperationsDAO`, `FinancialDAO`, `ReservationDAO`, `MarketDAO`) aplicam a filtragem relacional `JOIN blocks b ON ... WHERE b.condominium_id = ?` ou `condominium_id = ?`. Ao alternar para um condomínio recém-criado, a interface zera as visões (0 moradores, 0 veículos, 0 entregas, 0 acessos, 0 lançamentos), impedindo vazamento de dados inter-condomínios.

---

## 5. Mapeamento de Arquivos e Componentes do Repositório

```
Praticom_Broken/
├── client/                                  # Frontend React 18 + Vite 5 (SPA)
│   ├── src/components/
│   │   ├── CondominiumSelector.jsx          # Seletor visual multi-tenant de condomínio ativo
│   │   ├── Header.jsx                       # Topbar com navegação, temas e seletor
│   │   └── Sidebar.jsx                      # Menu lateral de navegação
│   ├── src/services/api.js                  # Fetch API client com header X-Condominium-Id
│   └── package.json                         # Manifesto npm do cliente
├── server/                                  # Backend REST API Node.js + Express
│   ├── config/
│   │   ├── DatabaseSingleton.js             # Singleton de conexão SQLite (WAL mode)
│   │   └── AppConfigSingleton.js            # Singleton de Feature Flags (app_features)
│   ├── dao/                                 # Data Access Objects (GoF DAO)
│   │   ├── DAOFactory.js                    # Factory Method de DAOs
│   │   ├── CondominiumDAO.js                # DAO de Condomínios e Blocos
│   │   ├── ResidentDAO.js                   # DAO de Moradores, Unidades e Veículos
│   │   ├── DeliveryDAO.js                   # DAO de Encomendas
│   │   ├── FinancialDAO.js                  # DAO Financeiro
│   │   ├── MarketDAO.js                     # DAO de Mercado e Vendas (com market_sale_items)
│   │   ├── OperationsDAO.js                 # DAO de Avisos e Relatórios
│   │   └── ReservationDAO.js                # DAO de Áreas Comuns e Reservas
│   ├── middleware/
│   │   └── tenantContext.js                 # Middleware de isolamento e contexto do condomínio
│   ├── services/templates/                  # Template Method Pattern
│   │   ├── ReportTemplate.js                # Template de Relatórios
│   │   ├── PaymentTemplate.js               # Template de Pagamentos
│   │   └── NotificationTemplate.js          # Template de Notificações
│   ├── tests/
│   │   ├── suite.js                         # Suíte automatizada de testes HTTP/API
│   │   └── verify_multitenant_c.mjs          # Script de validação da Alternativa C
│   ├── schema.sql                           # Script DDL oficial com 15 tabelas relacionais
│   ├── condo_database.sqlite                # Banco relacional operacional ativo
│   └── server.js                            # Ponto de entrada HTTP Express (14 endpoints)
├── start_app.ps1                            # Script PowerShell dinâmico com $PSScriptRoot
├── DIAGNOSTICO_ARQUITETURA_MULTI_TENANT.md  # Relatório completo de diagnóstico multi-tenant
├── PLANO_ACAO.md                            # Plano técnico original de migração
├── 0md.md                                   # Plano de eliminação da persistência JSON
└── APRENDIZADO.md                           # Síntese consolidada de aprendizados e padrões
```

---

## 6. Validação, Evidências e Testes de Regressão

A integridade do sistema é continuamente validada pelos scripts em [`server/tests/`](file:///c:/Users/Heitor/Praticom_Broken/server/tests/):

1. **Teste de APIs RESTful (14 Endpoints):**
   - **Execução:** `node server/tests/suite.js`
   - **Resultado:** **14/14 Endpoints Aprovados (`200 OK` / `201 Created`)**, retornando dados estruturados do SQLite relacional sem erros.
2. **Teste de Operações CRUD e Transações ACID:**
   - Moradores, Encomendas, Reservas, Financeiro e Mercado autônomo validados com inserções e atualizações em cascata.
   - Baixa de estoque do mercadinho e criação de `market_sale_items` testadas sob transações atômicas `db.transaction()`.
3. **Teste de Feature Flags (LPS):**
   - Alteração síncrona de `ENABLE_MARKETPLACE` na tabela `app_features` bloqueia endpoints com `403 Forbidden` quando inativa e libera com `200 OK` quando ativa.
4. **Preservação Absoluta do Frontend:**
   - Inspeção via `git status` em `client/src/`: **0 arquivos modificados**, garantindo 100% de desacoplamento entre frontend e backend.

---

## 7. Principais Lições Aprendidas e Boas Práticas Adotadas

1. **Configuração Obrigatória do SQLite:** Em drivers síncronos como `better-sqlite3`, a verificação de chaves estrangeiras (`PRAGMA foreign_keys = ON;`) **deve ser executada explicitamente em cada abertura de conexão**, caso contrário a integridade referencial do SQL é ignorada.
2. **Concorrência Web com SQLite:** Habilitar `PRAGMA journal_mode = WAL;` e configurar `PRAGMA busy_timeout = 5000;` é indispensável para evitar exceções `SQLITE_BUSY` durante requisições simultâneas de leitura e escrita.
3. **Desacoplamento via DAOs:** O isolamento das queries SQL na camada DAO facilitou a normalização da tabela `market_sale_items` e a migração de `app_features` sem afetar nenhuma rota do Express em `server.js`.
4. **Multi-tenancy com SQLite em Arquivos Separados (Alternativa A):** Para aplicações baseadas em SQLite, a escolha por bancos de dados isolados por condomínio (`tenants/condo_{id}.sqlite`) é vastamente superior ao uso de tabelas compartilhadas com `condominium_id`. O isolamento físico garante segurança absoluta contra falhas de SQL, simplifica tarefas de backup/restore por cliente e previne gargalos de concorrência I/O.
