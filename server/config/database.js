import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../condo_database.sqlite');
const SCHEMA_PATH = path.resolve(__dirname, '../database/schema.sql');

class DatabaseConnection {
  static #instance = null;

  static getInstance() {
    if (!this.#instance) {
      const db = new Database(DB_PATH);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      db.pragma('busy_timeout = 5000');

      // Executa schema na inicialização
      if (fs.existsSync(SCHEMA_PATH)) {
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        db.exec(schema);
      }

      this.#instance = db;
    }
    return this.#instance;
  }
}

export const db = DatabaseConnection.getInstance();
export default db;
