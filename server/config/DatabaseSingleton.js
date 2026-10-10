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
}

const instance = new DatabaseSingleton();
Object.freeze(instance);

export default instance;
