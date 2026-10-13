import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'condo_database.sqlite');
const schemaPath = path.join(__dirname, '..', 'schema.sql');

/**
 * Padrão de Projeto: SINGLETON (1/2)
 * Classe DatabaseSingleton garante uma única instância da conexão com o banco de dados SQLite.
 */
class DatabaseSingleton {
  constructor() {
    if (DatabaseSingleton.instance) {
      return DatabaseSingleton.instance;
    }

    console.log('🔌 Inicializando instância Singleton do banco de dados SQLite...');
    this.db = new Database(dbPath);
    this.db.pragma('foreign_keys = ON');

    // Compatibiliza bancos existentes antes de criar índices do schema novo.
    this.applyCompatibilityMigrations();

    // Executa schema DDL se o banco foi criado
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      this.db.exec(schemaSql);
    }

    DatabaseSingleton.instance = this;
  }

  getDb() {
    return this.db;
  }

  applyCompatibilityMigrations() {
    const addColumnIfMissing = (table, definition) => {
      const column = definition.split(/\s+/)[0];
      const tableExists = this.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
      if (!tableExists) return;
      const exists = this.db.prepare(`SELECT 1 FROM pragma_table_info('${table}') WHERE name = ?`).get(column);
      if (!exists) this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
    };

    // Colunas anuláveis preservam o legado até o administrador confirmar os vínculos reais.
    addColumnIfMissing('units', 'block_id INTEGER');
    addColumnIfMissing('spaces', 'condominium_id INTEGER');
    addColumnIfMissing('financial_transactions', 'condominium_id INTEGER');
    addColumnIfMissing('announcements', 'condominium_id INTEGER');
    addColumnIfMissing('announcements', 'block_id INTEGER');
    addColumnIfMissing('market_products', 'condominium_id INTEGER');
    addColumnIfMissing('access_logs', 'company TEXT');
    addColumnIfMissing('access_logs', 'vehicle_plate TEXT');
    addColumnIfMissing('access_logs', 'authorized_by TEXT');
    addColumnIfMissing('market_products', 'cost_price REAL');
    addColumnIfMissing('market_products', 'min_stock INTEGER DEFAULT 5');
    addColumnIfMissing('market_products', 'image_url TEXT');

    // Padroniza status de encomendas gravados em maiúsculas por versões anteriores do DAO.
    const deliveriesExists = this.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'deliveries'").get();
    if (deliveriesExists) {
      this.db.exec(`
        UPDATE deliveries SET status = 'pending' WHERE status = 'PENDING';
        UPDATE deliveries SET status = 'delivered' WHERE status = 'PICKED_UP';
      `);
    }

    // Módulos ativáveis por condomínio
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS condominium_modules (
          condominium_id INTEGER NOT NULL,
          module_key TEXT NOT NULL CHECK (module_key IN ('dashboard', 'access', 'deliveries', 'reservations', 'financial', 'market')),
          enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (condominium_id, module_key),
          FOREIGN KEY (condominium_id) REFERENCES condominiums(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_condo_modules_lookup 
      ON condominium_modules(condominium_id, module_key, enabled);
    `);

    // Seed de retrocompatibilidade para condomínios existentes sem módulos
    const condos = this.db.prepare("SELECT id FROM condominiums").all();
    const defaultModules = ['dashboard', 'access', 'deliveries', 'reservations', 'financial', 'market'];
    const insertModule = this.db.prepare(`
      INSERT OR IGNORE INTO condominium_modules (condominium_id, module_key, enabled)
      VALUES (?, ?, 1)
    `);
    for (const c of condos) {
      for (const m of defaultModules) {
        insertModule.run(c.id, m);
      }
    }
  }
}

const instance = new DatabaseSingleton();
Object.freeze(instance);

export default instance;
