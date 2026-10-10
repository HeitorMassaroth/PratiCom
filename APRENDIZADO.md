# Aprendizado do Projeto

## 1. Estado atual

O **Praticom ERP** opera em uma arquitetura desacoplada (Decoupled SPA + REST API):
* **Frontend:** SPA em **React 18** e **Vite 5**, estilizada com variáveis de Vanilla CSS (`client/src/*`), mantida 100% inalterada.
* **Backend:** API RESTful em **Node.js + Express 4** (`server/server.js`), integrando o banco de dados relacional **SQLite 3** (`server/condo_database.sqlite`) via o driver nativo `better-sqlite3`.
* **Persistência Relacional:** O sistema opera exclusivamente via **Data Access Objects (DAOs)** e **Singleton** sobre SQLite, com suporte a transações ACID e integridade referencial enforçada (`PRAGMA foreign_keys = ON;`). Feature flags e itens de venda também são tabelas relacionais.

---

## 2. O que foi feito na prática

| Arquivo / Módulo | Objetivo da Alteração | Status de Execução |
| :--- | :--- | :--- |
| [`server/schema.sql`](file:///c:/Users/Heitor/Praticom/server/schema.sql) | Definição do schema DDL SQL com 12 tabelas relacional, PKs, FKs, restrições e índices otimizados. | ✅ Implementado |
| [`server/config/DatabaseSingleton.js`](file:///c:/Users/Heitor/Praticom/server/config/DatabaseSingleton.js) | Instância única Singleton da conexão com o banco relacional SQLite. | ✅ Implementado |
| [`server/config/AppConfigSingleton.js`](file:///c:/Users/Heitor/Praticom/server/config/AppConfigSingleton.js) | Gerenciador Singleton de Feature Flags e configurações da Linha de Produtos de Software (LPS). | ✅ Implementado |
| `app_features` (SQLite) | Configuração de ativação/desativação dinâmica dos módulos (`ENABLE_MARKETPLACE`, `ENABLE_ADVANCED_DELIVERIES`). | ✅ Implementado |
| [`server/services/templates/*`](file:///c:/Users/Heitor/Praticom/server/services/templates/) | Três implementações do padrão **Template Method** (`ReportTemplate.js`, `PaymentTemplate.js`, `NotificationTemplate.js`). | ✅ Implementado |
| [`server/dao/*`](file:///c:/Users/Heitor/Praticom/server/dao/) | Sete DAOs relacional (`ResidentDAO`, `DeliveryDAO`, `FinancialDAO`, `AccessDAO`, `ReservationDAO`, `MarketDAO`, `AnnouncementDAO`) e a fábrica `DAOFactory.js` (Padrão Factory Method). | ✅ Implementado |
| Migração histórica | A importação do legado já foi concluída; não há importador JSON ativo no repositório. | ✅ Concluído |
| [`server/server.js`](file:///c:/Users/Heitor/Praticom/server/server.js) | Refatoração dos 14 endpoints da API RESTful para consumir os DAOs relacionais e verificar Feature Flags da LPS, mantendo 100% dos contratos da API. | ✅ Implementado |
| [`start_app.ps1`](file:///c:/Users/Heitor/Praticom/start_app.ps1) | Torna o script PowerShell portável utilizando `$PSScriptRoot` e comandos globais `node`/`npm`. | ✅ Implementado |

---

## 3. O que ainda falta

1. **Gravação do Vídeo Acadêmico:** Produção do vídeo demonstrativo com explicação técnica da reutilização de código, padrões de projeto e banco relacional (com publicação Não Listada no YouTube).
2. **Autenticação JWT (Expansão Futura):** O sistema opera com acesso aberto; controle de sessão e papéis de usuário (Síndico, Morador, Portaria) via tokens JWT permanecem como item opcional de melhoria.

---

## 4. Arquivos e código redundantes

| Arquivo ou Módulo | Situação Identificada | Motivo | Recomendação |
| :--- | :--- | :--- | :--- |
| [`server/database.js`](file:///c:/Users/Heitor/Praticom/server/database.js) | Obsoleto / Sem uso ativo | Continha a camada de persistência em memória e gravação no `condo_store.json`. O backend atual consome exclusivamente `DatabaseSingleton.js` e as classes em `server/dao/`. | **Investigar / Possível Remoção** (Pode ser arquivado ou removido se não houver dependências de fallback). |
| [`server/condo_store.json`](file:///c:/Users/Heitor/Praticom/server/condo_store.json) | Dados Legados / Sem mutação | Arquivo JSON original utilizado antes da migração para o SQLite. O backend não lê nem grava mais nele. | **Manter como Backup Histórico** (Ou renomear para `condo_store.json.old`). |
| [`server/condo_store.json.bak`](file:///c:/Users/Heitor/Praticom/server/condo_store.json.bak) | Backup de Segurança | Cópia criada antes da migração para SQLite. | **Manter** (Garante a recuperabilidade dos dados originais). |

---

## 5. Oportunidades de simplificação

1. **Consolidação de DAOs Menores:** 
   - **Situação:** Atualmente existem 7 arquivos DAO em `server/dao/`. DAOs menores como `AnnouncementDAO.js` e `AccessDAO.js` possuem pouca complexidade.
   - **Benefício:** Reduz o número de arquivos e simplifica a navegação no projeto backend.
   - **Risco:** Pequeno aumento de linhas por arquivo se agrupados em módulos por domínio funcional.

2. **Remoção de Código Morto em `database.js`:**
   - **Situação:** O arquivo `database.js` possui quase 800 linhas de código legado que não é mais executado pelo Express.
   - **Benefício:** Elimina ambiguidades sobre onde o banco de dados é manipulado.

---

## 6. Testes e evidências

* **Teste de Integridade de APIs (14 Endpoints RESTful):**
  - **Executado:** Via script HTTP `test_api.js` consultando o banco SQLite ativo na porta `5000`.
  - **Resultado:** **14/14 Endpoints aprovados (`200 OK`)** com dados estruturados retornados do SQLite.
* **Teste de Operações CRUD (Moradores, Portaria e Mercadinho):**
  - **Executado:** Via script `test_crud.js`.
  - **Resultado:** Inserções, consultas, baixas e exclusões persistidas 100% no SQLite com respostas `201 Created` e `200 OK`.
* **Teste de Linha de Produtos (LPS - Feature Flags):**
  - **Executado:** Alteração síncrona da flag `ENABLE_MARKETPLACE`.
  - **Resultado:** O bloqueio gerou código `403 Forbidden` quando desativada e `200 OK` quando reativada.
* **Teste de Preservação do Frontend:**
  - **Verificação:** Inspeção via `git status` no diretório `client/src/`.
  - **Resultado:** **0 arquivos modificados**, garantindo conformidade com a restrição técnica.

---

## 7. Próximos passos

1. **Gravar e publicar o vídeo demonstrativo acadêmico** (YouTube Não Listado) conforme o roteiro do plano.
2. **Avaliar a remoção ou arquivamento do arquivo legado `server/database.js`** para manter o diretório do servidor limpo.
3. **Parametrizar portas de rede via variáveis de ambiente (`.env`)** no servidor Node.js.
