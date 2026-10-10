# 🗄️ GUIA DE MIGRAÇÃO E ESTRUTURA DO BANCO DE DADOS — PRATICOM ERP

**Tecnologia:** SQLite 3 (via `better-sqlite3`)  
**Arquivo de Banco:** `server/condo_database.sqlite`  
**Arquivo de Backup:** `server/condo_store.json.bak`

---

## 1. Estrutura do Schema Relacional DDL (`schema.sql`)

O banco de dados relacional foi modelado contendo 12 tabelas ligadas por chaves estrangeiras com integridade referencial ativa (`PRAGMA foreign_keys = ON;`):

1. **`units`**: Tabela de unidades condominiais (`id`, `block`, `number`, `floor`, `type`, `created_at`). `UNIQUE(block, number)`.
2. **`residents`**: Tabela de moradores (`id`, `unit_id`, `name`, `email`, `phone`, `cpf`, `role`, `emergency_contact`, `created_at`). `FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE`.
3. **`vehicles`**: Tabela de veículos (`id`, `unit_id`, `resident_id`, `plate`, `model`, `color`, `type`, `parking_spot`).
4. **`pets`**: Tabela de animais de estimação (`id`, `unit_id`, `resident_id`, `name`, `species`, `breed`, `size`).
5. **`deliveries`**: Tabela de encomendas (`id`, `unit_id`, `resident_id`, `courier`, `tracking_code`, `description`, `status`, `pickup_code`, `notes`, `received_at`, `picked_up_at`, `picked_up_by`).
6. **`access_logs`**: Tabela de acessos da portaria (`id`, `visitor_name`, `document`, `type`, `destination_unit_id`, `entry_time`, `exit_time`, `status`, `notes`).
7. **`spaces`**: Tabela de espaços comuns (`id`, `name`, `description`, `capacity`, `price_per_hour`, `rules`).
8. **`reservations`**: Tabela de agendamentos (`id`, `space_id`, `unit_id`, `resident_id`, `reservation_date`, `start_time`, `end_time`, `total_price`, `status`, `created_at`).
9. **`financial_transactions`**: Tabela de fluxo de caixa (`id`, `unit_id`, `description`, `amount`, `type`, `category`, `status`, `due_date`, `paid_at`).
10. **`announcements`**: Tabela de comunicados (`id`, `title`, `content`, `category`, `priority`, `created_at`, `created_by`).
11. **`market_products`**: Tabela de produtos do inventário (`id`, `name`, `category`, `price`, `stock_quantity`, `barcode`).
12. **`market_sales`**: Tabela de histórico de vendas PDV (`id`, `unit_id`, `resident_id`, `total_amount`, `payment_method`, `created_at`, `items_json`).

---

## 2. Procedimento de Migração Automática

A migração dos dados contidos no formato JSON para o banco SQLite é executada via script Node.js:

```powershell
cd server
node migrate.js
```

### Características do Script de Migração (`migrate.js`)
* **Execução Transacional:** Executada dentro de um bloco `db.transaction()`, garantindo que todas as tabelas sejam populadas atomicamente.
* **Fallbacks Flexíveis:** Mapeia variações de nomes de atributos do JSON legado para os nomes oficiais das colunas do banco.
* **Idempotência:** Utiliza a instrução `INSERT OR REPLACE INTO`, permitindo a re-execução do script sem duplicar registros ou violar chaves primárias.

---

## 3. Estratégia de Backup e Recuperação

1. **Backup da Persistência JSON:** O arquivo original `server/condo_store.json` foi preservado em `server/condo_store.json.bak`.
2. **Restauração do Banco:** Para resetar o banco de dados e recriá-lo a partir do backup:
   ```powershell
   cd server
   Remove-Item condo_database.sqlite
   node migrate.js
   ```
