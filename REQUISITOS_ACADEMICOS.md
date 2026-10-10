# 🎓 MATRIZ DE REQUISITOS ACADÊMICOS — PRATICOM ERP

Este documento apresenta a matriz de rastreabilidade de todos os requisitos acadêmicos exigidos para o projeto **Praticom**.

---

## 1. Rastreabilidade dos Requisitos

| Requisito Acadêmico | Exigência Mínima | Implementação no Praticom | Arquivos de Evidência | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Banco de Dados Relacional** | Mínimo 3 tabelas relacionadas | **12 tabelas relacionais** modeladas no SQLite com PKs, FKs, restrições e índices. | `server/schema.sql`, `server/condo_database.sqlite` | ✅ **100% Atendido** |
| **Migração Transacional** | Importar dados com segurança | Script automatizado em bloco transacional ACID com preservação do JSON em `.bak`. | `server/migrate.js`, `server/condo_store.json.bak` | ✅ **100% Atendido** |
| **Padrões GoF: Singleton** | 2 exemplos funcionais | **1. `DatabaseConnectionSingleton`** (Conexão física SQLite)<br>**2. `AppConfigSingleton`** (Configurações e LPS) | `server/config/DatabaseSingleton.js`<br>`server/config/AppConfigSingleton.js` | ✅ **100% Atendido** |
| **Padrões GoF: Template Method** | 3 exemplos funcionais | **1. `AbstractReportGenerator`** (Relatórios)<br>**2. `AbstractPaymentProcessor`** (Pagamentos)<br>**3. `AbstractNotificationDispatcher`** (Notificações) | `server/services/templates/ReportTemplate.js`<br>`server/services/templates/PaymentTemplate.js`<br>`server/services/templates/NotificationTemplate.js` | ✅ **100% Atendido** |
| **Padrões GoF: DAO / Factory** | 3 exemplos funcionais | **1. `ResidentDAO`** (Moradores)<br>**2. `DeliveryDAO`** (Encomendas)<br>**3. `FinancialDAO`** (Financeiro)<br>+ `DAOFactory` (Factory Method) | `server/dao/ResidentDAO.js`<br>`server/dao/DeliveryDAO.js`<br>`server/dao/FinancialDAO.js`<br>`server/dao/DAOFactory.js` | ✅ **100% Atendido** |
| **Linha de Produtos (LPS)** | 2 recursos opcionais por configuração | **1. `ENABLE_MARKETPLACE`** (Mercadinho PDV)<br>**2. `ENABLE_ADVANCED_DELIVERIES`** (PIN Encomendas) | `server/config/features.json`, `server/server.js` | ✅ **100% Atendido** |
| **Telas CRUD Conectadas** | Pelo menos 2 por integrante da equipe | **8 visões operacionais** (Moradores, Portaria, Encomendas, Reservas, Financeiro, Comunicados, Mercado, Dashboard) | `client/src/views/*` | ✅ **100% Atendido** |
| **Preservação do Frontend** | **NÃO MODIFICAR O FRONTEND** | **0 alterações** nos arquivos de interface (`client/src/*` inalterado). | Git diff limpo em `client/src/` | ✅ **100% Atendido** |
| **Vídeo Demonstrativo** | Roteiro + Link YouTube | Roteiro preparado para apresentação dos padrões de projeto e banco relacional. | `README.md` | 📌 **Aguardando Gravação** |

---

## 2. Instruções para Inicialização Rápida pelo Avaliador

1. **Navegar até a raiz do projeto e rodar o script PowerShell:**
   ```powershell
   .\start_app.ps1
   ```
2. **Acessar a aplicação no navegador:**
   - **Interface Frontend:** `http://localhost:5173`
   - **API Backend (SQLite + GoF):** `http://localhost:5000/api/dashboard`
