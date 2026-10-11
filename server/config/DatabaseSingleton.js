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
  }
}

const instance = new DatabaseSingleton();
Object.freeze(instance);

export default instance;
