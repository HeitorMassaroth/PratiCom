# 🏗️ AUDITORIA DE ARQUIVOS E PLANO DE REFATORAÇÃO DO PRATICOM ERP

**Projeto:** Praticom ERP (Sistema Integrado de Gestão Condominial)  
**Status da Auditoria:** Concluída com Sucesso (Somente Análise e Planejamento)  
**Regra Crítica:** Nenhuma alteração foi realizada no código, frontend ou banco nesta etapa.

---

## 1. Resumo Executivo

A auditoria do repositório **Praticom ERP** revelou uma arquitetura backend moderna baseada em **Node.js, Express 4, SQLite3 (`better-sqlite3`), DAOs e Padrões GoF**, convivendo com **artefatos legados da versão anterior baseada em JSON**.

### Oportunidades Principais de Simplificação:
1. **Código Legado Substituído (`server/database.js`):** O arquivo de 789 linhas que gerenciava a persistência em memória/JSON foi 100% substituído pelas DAOs relacionais e pela conexão `DatabaseSingleton.js`. Não possui mais nenhuma referência ou import no backend ativo.
2. **Dados Legados e Duplicados (`server/condo_store.json`):** O arquivo JSON servia como banco antigo. Com a migração para SQLite concluída e validada em `condo_database.sqlite`, ele e seu backup temporário podem ser arquivados.
3. **Consolidação de Módulos DAO (`server/dao/*`):** Atualmente existem 7 arquivos DAO individuais. Módulos com pouca complexidade (como `AnnouncementDAO.js` e `AccessDAO.js`) podem ser agrupados em domínios funcionais coesos, reduzindo a dispersão de arquivos sem ferir os requisitos acadêmicos.

---

## 2. Inventário do Projeto

Quantidade total de arquivos identificados por categoria no repositório:

```text
Praticom ERP/
├── Frontend (React 18 + Vite 5)        : 14 arquivos (Components, Views, Services, CSS, HTML, Config)
├── Backend e API (Node + Express)       : 1 arquivo  (server.js)
├── Banco de Dados e Migração           : 3 arquivos (schema.sql, migrate.js, condo_database.sqlite)
├── Configuração Backend (Singleton/LPS): 3 arquivos (DatabaseSingleton.js, AppConfigSingleton.js, features.json)
├── DAOs (Acesso a Dados & Factory)     : 8 arquivos (7 DAOs + DAOFactory.js)
├── Serviços / Templates (GoF)          : 3 arquivos (ReportTemplate.js, PaymentTemplate.js, NotificationTemplate.js)
├── Artefatos Legados e Backups         : 2 arquivos (database.js, condo_store.json / condo_store.json.bak)
├── Scripts Scratch / Testes            : 2 arquivos (scratch/test_api.js, scratch/test_crud.js)
├── Documentação e Planos Markdown      : 7 arquivos (README, APRENDIZADO, PLANO_ACAO, RELATORIO_*, MIGRACAO_*, MAPA_*, REQUISITOS_*)
└── Script de Inicialização             : 1 arquivo  (start_app.ps1)
```

---

## 3. Arquivos Candidatos à Remoção ou Arquivamento

| Arquivo | Evidência de desuso | Risco | Recomendação |
| :--- | :--- | :--- | :--- |
| `server/database.js` | **Nenhuma referência.** Não possui `import` ou `require` em `server.js`, `migrate.js` ou qualquer DAO. Subvertido pelas classes em `server/dao/` e `DatabaseSingleton.js`. | **Baixo** | **Possível Remoção / Arquivamento** (Código morto de 789 linhas da versão antiga em JSON). |
| `server/condo_store.json` | **Não sofre mutação ou leitura.** Subvertido pelo banco de dados relacional `condo_database.sqlite`. | **Baixo** | **Arquivar** (Mover para pasta `server/legacy/` ou manter apenas `condo_store.json.bak`). |
| `scratch/test_api.js` | Script temporário de validação HTTP gerado pelo agente durante o desenvolvimento. | **Baixo** | **Consolidar em pasta de testes** (`tests/test_api.js`). |
| `scratch/test_crud.js` | Script temporário de validação de operações CRUD e LPS. | **Baixo** | **Consolidar em pasta de testes** (`tests/test_crud.js`). |

---

## 4. Arquivos que Podem Ser Consolidados

| Arquivos Atuais | Responsabilidade Comum | Organização Proposta | Benefício | Risco |
| :--- | :--- | :--- | :--- | :--- |
| `server/dao/AnnouncementDAO.js`<br>`server/dao/AccessDAO.js` | Operações de Comunicação e Portaria de baixa complexidade. | Consolidar em `server/dao/OperationsDAO.js`. | Reduz 2 arquivos na pasta `server/dao/` mantendo os métodos e contratos. | **Baixo** |
| `scratch/test_api.js`<br>`scratch/test_crud.js` | Scripts de validação e verificação de endpoints. | Agrupar em `server/tests/suite.js`. | Centraliza a suíte de testes automatizados do backend. | **Baixo** |

---

## 5. Funções e Classes Redundantes

1. **`models.getDashboardData()` (em `server/database.js`):**
   - **Substituído por:** Agregação direta das DAOs em `server/server.js` (`/api/dashboard`).
   - **Ação:** Remover junto com o arquivo `server/database.js`.
2. **`saveDatabase()` e `loadDatabase()` (em `server/database.js`):**
   - **Substituído por:** Transações ACID síncronas do `better-sqlite3` gerenciadas por `DatabaseSingleton.js`.
   - **Ação:** Código descontinuado.

---

## 6. Análise de Dependências

* **`better-sqlite3` (`^11.8.0`):** **ESSENCIAL.** Driver do banco de dados relacional SQLite ativo.
* **`express` (`^4.22.2`):** **ESSENCIAL.** Framework do servidor HTTP REST.
* **`cors` (`^2.8.6`):** **ESSENCIAL.** Middleware de integração cross-origin com o Vite frontend.
* **Resultado:** O backend **não possui dependências desnecessárias ou não utilizadas** declaradas em `server/package.json`.

---

## 7. Plano de Execução por Fases

### **Fase 1 — Baixo Risco (Isolamento de Código Legado e Testes)**
- **Arquivos Envolvidos:** `server/database.js`, `scratch/*`.
- **Alteração Proposta:** Mover `server/database.js` para `server/legacy/database.js.bak` e organizar scripts scratch na pasta `server/tests/`.
- **Dependências Afetadas:** Nenhuma.
- **Testes Necessários:** Rodar `node server.js` e executar a suíte HTTP `test_api.js`.
- **Critério de Conclusão:** Servidor inicia sem erros e todos os 14 endpoints respondem `200 OK`.
- **Estratégia de Reversão:** Mover o arquivo de volta à raiz de `server/`.

### **Fase 2 — Risco Moderado (Consolidação de Módulos DAO Menores)**
- **Arquivos Envolvidos:** `server/dao/AnnouncementDAO.js`, `server/dao/AccessDAO.js`, `server/dao/DAOFactory.js`.
- **Alteração Proposta:** Agrupar DAOs de operações auxiliares em `OperationsDAO.js` mantendo a interface pública para `DAOFactory`.
- **Dependências Afetadas:** `DAOFactory.js` e `server.js`.
- **Testes Necessários:** Testar cadastro de comunicados e registro de entrada de visitantes.
- **Critério de Conclusão:** Endpoints `/api/announcements` e `/api/access` operando normalmente.
- **Estratégia de Reversão:** Manter os arquivos DAO individuais originais via Git.

### **Fase 3 — Risco Elevado (Limpeza Final de Artefatos de Dados Legados)**
- **Arquivos Envolvidos:** `server/condo_store.json`.
- **Alteração Proposta:** Mover `condo_store.json` para a pasta de arquivos históricos `server/legacy/`.
- **Dependências Afetadas:** Nenhuma no backend ativo.
- **Testes Necessários:** Reiniciar o servidor backend e o frontend React e validar criação/persistência no SQLite.
- **Critério de Conclusão:** O sistema funciona 100% lendo e gravando apenas no SQLite.

---

## 8. Estrutura Final Proposta (Árvore Simplificada)

```text
Praticom/
├── start_app.ps1
├── README.md
├── APRENDIZADO.md
├── PLANO_REFATORACAO.md
├── client/                      # 100% INTACTO (Frontend React 18 + Vite 5)
│   └── src/
└── server/                      # Backend Estruturado e Limpo
    ├── server.js                # API REST Express (Endpoints + LPS)
    ├── schema.sql               # Schema DDL SQL Relacional
    ├── migrate.js              # Script de Migração JSON -> SQLite
    ├── condo_database.sqlite    # Banco Relacional SQLite Ativo
    ├── config/
    │   ├── DatabaseSingleton.js # Singleton Conexão SQLite
    │   ├── AppConfigSingleton.js# Singleton Feature Flags LPS
    │   └── features.json        # Configuração LPS
    ├── dao/
    │   ├── DAOFactory.js        # Factory Method para DAOs
    │   ├── ResidentDAO.js       # DAO Moradores, Unidades, Veículos, Pets
    │   ├── DeliveryDAO.js       # DAO Encomendas
    │   ├── FinancialDAO.js      # DAO Transações Financeiras
    │   ├── ReservationDAO.js    # DAO Espaços e Reservas
    │   ├── MarketDAO.js         # DAO Mercadinho e Vendas PDV
    │   └── OperationsDAO.js     # DAO Consolidado (Portaria e Comunicados)
    ├── services/
    │   └── templates/           # Template Method (Relatórios, Pagamentos, Notificações)
    ├── tests/
    │   └── suite.js             # Suíte Integrada de Testes HTTP/CRUD
    └── legacy/                  # Pasta de Arquivo Histórico (Isolada)
        ├── database.js.bak
        └── condo_store.json.bak
```

---

## 9. Critérios de Segurança

1. **Preservação do Frontend:** O diretório `client/src/` **NUNCA será modificado**.
2. **Preservação de Dados:** O arquivo `condo_store.json.bak` e o banco `condo_database.sqlite` serão mantidos e protegidos antes de qualquer ajuste.
3. **Validação Contínua:** Após cada fase de refatoração, a suíte de testes HTTP (`test_api.js`) e CRUD (`test_crud.js`) deve ser executada com 100% de taxa de aprovação.

---

## 10. Pendências e Incertezas

* **Requisitos Acadêmicos dos Padrões GoF:** Qualquer consolidação na pasta `server/dao/` deve preservar os contratos do **Factory Method (`DAOFactory`)** e dos **DAOs** para não comprometer os critérios de avaliação acadêmica.
