# 🧪 RELATÓRIO DE TESTES E COMPATIBILIDADE — PRATICOM ERP

> Nota de histórico: este relatório registra a validação anterior. A validação posterior à remoção dos usos internos de JSON está registrada em `0md.md`.

**Data:** 09/10/2026  
**Ambiente de Testes:** Node.js v24.14.0 | SQLite (`better-sqlite3`) | Windows  
**Status dos Testes:** 100% de Aprovação

---

## 1. Bateria de Testes nos Endpoints da API REST

Executou-se uma suíte de testes HTTP programáticos validando a resposta de todos os 14 endpoints da API RESTful conectados ao banco de dados relacional SQLite:

| Endpoint | Método | Status Retornado | Registros Retornados | Resultado |
| :--- | :--- | :--- | :--- | :--- |
| `/api/dashboard` | GET | `200 OK` | Métricas consolidadas, últimos acessos e reservas | ✅ PASSOU |
| `/api/deliveries` | GET | `200 OK` | 6 encomendas relativas a unidades | ✅ PASSOU |
| `/api/access` | GET | `200 OK` | 4 registros de acesso à portaria | ✅ PASSOU |
| `/api/units` | GET | `200 OK` | 12 unidades condominiais com contadores de moradores/veículos | ✅ PASSOU |
| `/api/residents` | GET | `200 OK` | 10 moradores cadastrados com JOIN de bloco/unidade | ✅ PASSOU |
| `/api/vehicles` | GET | `200 OK` | 6 veículos registrados com JOIN de moradores | ✅ PASSOU |
| `/api/pets` | GET | `200 OK` | 4 pets registrados | ✅ PASSOU |
| `/api/spaces` | GET | `200 OK` | 6 áreas comuns | ✅ PASSOU |
| `/api/reservations` | GET | `200 OK` | 7 reservas efetuadas com validação de conflito de horário | ✅ PASSOU |
| `/api/financial/summary` | GET | `200 OK` | Métricas de saldo, receitas, despesas e inadimplência | ✅ PASSOU |
| `/api/financial/transactions` | GET | `200 OK` | 11 transações financeiras | ✅ PASSOU |
| `/api/announcements` | GET | `200 OK` | 4 comunicados do mural | ✅ PASSOU |
| `/api/market/products` | GET | `200 OK` | 12 produtos no estoque | ✅ PASSOU |
| `/api/market/sales` | GET | `200 OK` | Histórico de vendas PDV com descompactação de itens | ✅ PASSOU |

---

## 2. Testes de Operações CRUD e Persistência

### 2.1 Moradores (`ResidentsView`)
* **Operação POST:** Cadastro de novo morador com nome, unidade e telefone. **Resultado:** Retornou `201 Created` e salvou a linha no SQLite.
* **Operação DELETE:** Removido morador cadastrado por ID. **Resultado:** Retornou `200 OK` e confirmou remoção imediata no banco.

### 2.2 Controle de Acesso Portaria (`AccessControlView`)
* **Operação POST (Entrada):** Registrada entrada de visitante com documento e unidade de destino. **Resultado:** Salvo com status `IN_PROPERTY`.
* **Operação PATCH (Saída):** Registrada saída do visitante por ID. **Resultado:** Atualizado status para `EXITED` e preenchido `exit_time`.

### 2.3 Mercadinho Autônomo e Transações ACID (`MarketInventoryView`)
* **Operação POST (Checkout):** Realizada venda PDV com 2 itens com pagamento por cota condominial (`CONDO_FEE`).
* **Resultado:** Transação ACID SQLite deduziu o estoque dos produtos e gerou automaticamente o débito na tabela `financial_transactions`.

---

## 3. Testes de Feature Flags (Linha de Produtos de Software - LPS)

1. **Desativação de Módulo (`ENABLE_MARKETPLACE = false`):**
   - Requisição para `/api/market/products` retornou `403 Forbidden` com mensagem informativa de funcionalidade desativada via LPS.
2. **Reativação de Módulo (`ENABLE_MARKETPLACE = true`):**
   - Requisição para `/api/market/products` retornou `200 OK` liberando acesso normal aos dados.
