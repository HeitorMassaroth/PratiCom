# 🗺️ MAPA DE PADRÕES DE PROJETO (GoF) — PRATICOM ERP

Este documento detalha a localização, finalidade e justificativa técnica de cada Padrão de Projeto implementado no backend do **Praticom ERP**.

---

## 1. Padrão Criacional: SINGLETON (2 Exemplos Funcionais)

### Exemplo 1: `DatabaseSingleton`
* **Localização:** `server/config/DatabaseSingleton.js`
* **Finalidade:** Garante uma única instância da conexão física com o banco de dados SQLite (`condo_database.sqlite`) para toda a aplicação Node.js.
* **Benefício:** Evita múltiplas aberturas concorrentes do arquivo de banco no SO e habilita chaves estrangeiras globalmente (`PRAGMA foreign_keys = ON;`).

```javascript
// Trecho de código em DatabaseSingleton.js
class DatabaseSingleton {
  constructor() {
    if (DatabaseSingleton.instance) {
      return DatabaseSingleton.instance;
    }
    this.db = new Database(dbPath);
    this.db.pragma('foreign_keys = ON');
    DatabaseSingleton.instance = this;
  }
}
```

### Exemplo 2: `AppConfigSingleton`
* **Localização:** `server/config/AppConfigSingleton.js`
* **Finalidade:** Gerenciador global de configurações e Feature Flags da Linha de Produtos de Software (LPS).
* **Benefício:** Permite alterar dinamicamente o status de recursos (`ENABLE_MARKETPLACE`, `ENABLE_ADVANCED_DELIVERIES`) de forma centralizada e síncrona.

---

## 2. Padrão Comportamental: TEMPLATE METHOD (3 Exemplos Funcionais)

### Exemplo 1: `AbstractReportGenerator`
* **Localização:** `server/services/templates/ReportTemplate.js`
* **Classe Concreta:** `FinancialReportGenerator`
* **Estrutura Algorítmica:** `generateReport()` orquestra `fetchData()` -> `formatHeader()` -> `formatContent()` -> `formatSummary()`.

### Exemplo 2: `AbstractPaymentProcessor`
* **Localização:** `server/services/templates/PaymentTemplate.js`
* **Classes Concretas:** `PixPaymentProcessor`, `CondoFeePaymentProcessor`
* **Estrutura Algorítmica:** `processPayment()` orquestra `validateAmount()` -> `authorizePayment()` -> `recordTransaction()` -> `generateReceipt()`.

### Exemplo 3: `AbstractNotificationDispatcher`
* **Localização:** `server/services/templates/NotificationTemplate.js`
* **Classes Concretas:** `DeliveryNotificationDispatcher`, `AnnouncementNotificationDispatcher`
* **Estrutura Algorítmica:** `sendNotification()` orquestra `buildRecipient()` -> `formatMessage()` -> `deliver()` -> `logNotification()`.

---

## 3. Padrão Estrutural / Criacional: DAO & FACTORY METHOD (3 Exemplos Funcionais)

### Exemplo 1: `ResidentDAO` (Moradores & Unidades)
* **Localização:** `server/dao/ResidentDAO.js`
* **Responsabilidade:** Abstrai consultas SQL com JOINs complexos entre `residents`, `units`, `vehicles` e `pets`.

### Exemplo 2: `DeliveryDAO` (Encomendas)
* **Localização:** `server/dao/DeliveryDAO.js`
* **Responsabilidade:** Abstrai ciclo de vida de entregas, geração de código PIN de retirada e despacho de notificações.

### Exemplo 3: `FinancialDAO` (Transações Financeiras)
* **Localização:** `server/dao/FinancialDAO.js`
* **Responsabilidade:** Abstrai fluxo de caixa, cálculo de inadimplência e chamadas ao gerador de relatórios.

### Fabrica de DAOs: `DAOFactory`
* **Localização:** `server/dao/DAOFactory.js`
* **Responsabilidade:** Instancia o DAO solicitado através do método estático `DAOFactory.getDAO(type)`.
