import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'condo_database.sqlite');

console.log('🚀 Iniciando Migração Multi-Tenant - Alternativa C (Banco Compartilhado)...');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

function addColumnIfMissing(table, columnDefinition) {
  const columnName = columnDefinition.split(/\s+/)[0];
  const tableExists = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
  if (!tableExists) return;
  const colExists = db.prepare(`SELECT 1 FROM pragma_table_info('${table}') WHERE name = ?`).get(columnName);
  if (!colExists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnDefinition}`);
    console.log(`  + Coluna '${columnName}' adicionada à tabela '${table}'`);
  }
}

// Step 1: Add missing condominium_id columns
console.log('📌 Passso 1: Adequando Colunas no Banco...');
addColumnIfMissing('units', 'condominium_id INTEGER REFERENCES condominiums(id) ON DELETE RESTRICT');
addColumnIfMissing('spaces', 'condominium_id INTEGER REFERENCES condominiums(id) ON DELETE RESTRICT');
addColumnIfMissing('financial_transactions', 'condominium_id INTEGER REFERENCES condominiums(id) ON DELETE RESTRICT');
addColumnIfMissing('announcements', 'condominium_id INTEGER REFERENCES condominiums(id) ON DELETE RESTRICT');
addColumnIfMissing('market_products', 'condominium_id INTEGER REFERENCES condominiums(id) ON DELETE RESTRICT');

// Step 2: Ensure tables system_users and user_condominium_access
console.log('📌 Passo 2: Criando tabelas de Autenticação e Vínculo Multi-Tenant...');
db.exec(`
  CREATE TABLE IF NOT EXISTS system_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    global_role TEXT DEFAULT 'USER' CHECK (global_role IN ('SUPER_ADMIN', 'USER')),
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_condominium_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    condominium_id INTEGER NOT NULL,
    role TEXT DEFAULT 'RESIDENT' CHECK (role IN ('SYNDIC', 'DOORMAN', 'RESIDENT', 'FINANCIAL_ADMIN')),
    unit_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, condominium_id),
    FOREIGN KEY (user_id) REFERENCES system_users(id) ON DELETE CASCADE,
    FOREIGN KEY (condominium_id) REFERENCES condominiums(id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
  );
`);

// Step 3: Ensure default Condominium
console.log('📌 Passo 3: Verificando/Criando Condomínio Padrão...');
let defaultCondo = db.prepare('SELECT * FROM condominiums ORDER BY id ASC LIMIT 1').get();
if (!defaultCondo) {
  const result = db.prepare(`
    INSERT INTO condominiums (name, cnpj, address, city, state, status)
    VALUES ('Condomínio Alpha Praticom', '00.000.000/0001-00', 'Av. Principal, 1000', 'São Paulo', 'SP', 'ACTIVE')
  `).run();
  defaultCondo = db.prepare('SELECT * FROM condominiums WHERE id = ?').get(result.lastInsertRowid);
  console.log(`  + Condomínio Padrão criado: ${defaultCondo.name} (ID: ${defaultCondo.id})`);
} else {
  console.log(`  ✓ Condomínio Padrão Existente: ${defaultCondo.name} (ID: ${defaultCondo.id})`);
}

const condoId = defaultCondo.id;

// Step 4: Ensure default Block
console.log('📌 Passo 4: Verificando/Criando Bloco Padrão...');
let defaultBlock = db.prepare('SELECT * FROM blocks WHERE condominium_id = ? ORDER BY id ASC LIMIT 1').get(condoId);
if (!defaultBlock) {
  const result = db.prepare(`
    INSERT INTO blocks (condominium_id, name, description, status)
    VALUES (?, 'Bloco A', 'Bloco Principal', 'ACTIVE')
  `).run(condoId);
  defaultBlock = db.prepare('SELECT * FROM blocks WHERE id = ?').get(result.lastInsertRowid);
  console.log(`  + Bloco Padrão criado: ${defaultBlock.name} (ID: ${defaultBlock.id})`);
} else {
  console.log(`  ✓ Bloco Padrão Existente: ${defaultBlock.name} (ID: ${defaultBlock.id})`);
}

const blockId = defaultBlock.id;

// Step 5: Associate legacy orphan data to condoId / blockId
console.log('📌 Passo 5: Vinculando Dados Legados...');

const resUnitsBlock = db.prepare('UPDATE units SET block_id = ? WHERE block_id IS NULL').run(blockId);
console.log(`  - Unidades vinculadas ao Bloco ${blockId}: ${resUnitsBlock.changes}`);

const resUnitsCondo = db.prepare('UPDATE units SET condominium_id = ? WHERE condominium_id IS NULL').run(condoId);
console.log(`  - Unidades vinculadas ao Condomínio ${condoId}: ${resUnitsCondo.changes}`);

const resSpaces = db.prepare('UPDATE spaces SET condominium_id = ? WHERE condominium_id IS NULL').run(condoId);
console.log(`  - Espaços vinculados ao Condomínio ${condoId}: ${resSpaces.changes}`);

const resFinancial = db.prepare('UPDATE financial_transactions SET condominium_id = ? WHERE condominium_id IS NULL').run(condoId);
console.log(`  - Transações Financeiras vinculadas ao Condomínio ${condoId}: ${resFinancial.changes}`);

const resAnnouncements = db.prepare('UPDATE announcements SET condominium_id = ? WHERE condominium_id IS NULL').run(condoId);
console.log(`  - Comunicados vinculados ao Condomínio ${condoId}: ${resAnnouncements.changes}`);

const resProducts = db.prepare('UPDATE market_products SET condominium_id = ? WHERE condominium_id IS NULL').run(condoId);
console.log(`  - Produtos do Mercado vinculados ao Condomínio ${condoId}: ${resProducts.changes}`);

// Step 6: Create performance indexes for tenant queries
console.log('📌 Passo 6: Criando Índices de Performance por Tenant...');
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_units_condo ON units(condominium_id);
  CREATE INDEX IF NOT EXISTS idx_spaces_condo ON spaces(condominium_id);
  CREATE INDEX IF NOT EXISTS idx_financial_condo ON financial_transactions(condominium_id);
  CREATE INDEX IF NOT EXISTS idx_announcements_condo ON announcements(condominium_id);
  CREATE INDEX IF NOT EXISTS idx_market_products_condo ON market_products(condominium_id);
  CREATE INDEX IF NOT EXISTS idx_user_access_user ON user_condominium_access(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_access_condo ON user_condominium_access(condominium_id);
`);

console.log('✅ Migração Multi-Tenant (Alternativa C) Concluída com Sucesso!');
db.close();
