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

    // Cria tabelas ausentes depois de aplicar compatibilidade ao banco legado.
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      this.db.exec(schemaSql);
    }

    this.seedCondominiumModules();

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
    addColumnIfMissing('deliveries', 'registered_at DATETIME');
    addColumnIfMissing('deliveries', 'registered_by TEXT');
    addColumnIfMissing('deliveries', 'received_by TEXT');
    addColumnIfMissing('deliveries', 'cancelled_at DATETIME');
    addColumnIfMissing('deliveries', 'cancelled_by TEXT');
    addColumnIfMissing('deliveries', 'cancellation_reason TEXT');
    addColumnIfMissing('market_products', 'cost_price REAL');
    addColumnIfMissing('market_products', 'min_stock INTEGER DEFAULT 5');
    addColumnIfMissing('market_products', 'image_url TEXT');
    addColumnIfMissing('reservations', 'guests_count INTEGER DEFAULT 0');
    addColumnIfMissing('reservations', 'notes TEXT');

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

    this.ensureUnitUniquenessConstraint();
  }

  ensureUnitUniquenessConstraint() {
    const tableExists = this.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'units'").get();
    if (!tableExists) return;

    // Saneamento de duplicidades legadas no Condomínio 1 se existirem
    const dupUnits = this.db.prepare(`
      SELECT block_id, number, COUNT(*) as count 
      FROM units 
      WHERE block_id IS NOT NULL 
      GROUP BY block_id, number 
      HAVING count > 1
    `).all();

    if (dupUnits.length > 0) {
      let torreB = this.db.prepare("SELECT id FROM blocks WHERE condominium_id = 1 AND LOWER(name) = 'torre b'").get();
      if (!torreB) {
        const info = this.db.prepare("INSERT INTO blocks (condominium_id, name, description, status) VALUES (1, 'Torre B', 'Bloco B Residencial', 'ACTIVE')").run();
        torreB = { id: info.lastInsertRowid };
      }
      this.db.prepare("UPDATE blocks SET name = 'Torre A' WHERE id = 3 AND name = 'Bloco A'").run();
      this.db.prepare("UPDATE units SET block_id = ?, block = 'Torre B' WHERE block = 'Torre B' OR id IN (7, 8, 9, 10, 11, 12)").run(torreB.id);
    }

    // Verifica se a tabela units ainda possui o índice antigo baseado em (block, number)
    const unitIndexes = this.db.prepare("PRAGMA index_list('units')").all();
    let hasOldIndex = false;
    for (const idx of unitIndexes) {
      if (idx.unique) {
        const cols = this.db.prepare(`PRAGMA index_info('${idx.name}')`).all().map(c => c.name);
        if (cols.includes('block') && !cols.includes('block_id')) {
          hasOldIndex = true;
          break;
        }
      }
    }

    if (hasOldIndex) {
      this.db.exec(`
        PRAGMA foreign_keys = OFF;
        CREATE TABLE units_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            block TEXT NOT NULL,
            number TEXT NOT NULL,
            floor INTEGER,
            type TEXT DEFAULT 'Residencial',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            block_id INTEGER,
            UNIQUE(block_id, number),
            FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE RESTRICT
        );
        INSERT INTO units_new (id, block, number, floor, type, created_at, block_id)
        SELECT id, block, number, floor, type, created_at, block_id FROM units;
        DROP TABLE units;
        ALTER TABLE units_new RENAME TO units;
        CREATE INDEX IF NOT EXISTS idx_units_block ON units(block_id);
        PRAGMA foreign_keys = ON;
      `);
    }
  }

  seedCondominiumModules() {
    // O schema cria e popula condominiums; só então é seguro semear seus módulos.
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

export const db = instance.getDb();
export { DatabaseSingleton };
export default instance;
