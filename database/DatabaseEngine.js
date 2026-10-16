// ============================================================================
// PratiCom ERP - DatabaseEngine
// Motor de Banco de Dados SQLite Nativo com Registro Dinâmico de Classes de Tabela,
// Suporte a WAL, Foreign Keys estritas, Transações ACID e Oportunidade de Crescimento
// ============================================================================

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

export class DatabaseEngine {
  constructor(options = {}) {
    this.filePath = options.filePath || path.resolve(process.cwd(), 'database', 'condo_database.sqlite');
    this.verbose = options.verbose ?? true;
    this.registeredTables = new Map();
    this.db = null;
  }

  /**
   * Conecta ao arquivo SQLite e configura PRAGMAs corporativos de alta performance e integridade
   */
  connect() {
    if (this.db) return this.db;

    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (this.verbose) {
      console.log(`[DatabaseEngine] Conectando ao SQLite: ${this.filePath}`);
    }

    this.db = new DatabaseSync(this.filePath);

    // ========================================================================
    // PRAGMAs de Alta Performance, Integridade e Oportunidade de Crescimento
    // ========================================================================
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA synchronous = NORMAL;');
    this.db.exec('PRAGMA busy_timeout = 5000;');
    this.db.exec('PRAGMA cache_size = -64000;'); // 64 MB de cache em memória
    this.db.exec('PRAGMA temp_store = MEMORY;');

    return this.db;
  }

  /**
   * Registra uma classe de tabela individual no motor do banco de dados
   */
  registerTable(TableClass) {
    if (!TableClass || !TableClass.tableName) {
      throw new Error('[DatabaseEngine] Classe de tabela inválida ou sem static tableName.');
    }

    this.connect();
    TableClass.bindDatabase(this.db);
    this.registeredTables.set(TableClass.tableName, TableClass);

    return this;
  }

  /**
   * Registra uma coleção de classes de tabela
   */
  registerTables(TableClasses = []) {
    for (const TableClass of TableClasses) {
      this.registerTable(TableClass);
    }
    return this;
  }

  /**
   * Obtém uma classe de tabela registrada pelo nome
   */
  getTable(tableName) {
    const table = this.registeredTables.get(tableName);
    if (!table) {
      throw new Error(`[DatabaseEngine] Tabela '${tableName}' não registrada.`);
    }
    return table;
  }

  /**
   * Inicializa o esquema de todas as tabelas registradas no SQLite
   */
  initializeSchema() {
    this.connect();

    if (this.verbose) {
      console.log(`[DatabaseEngine] Inicializando esquema para ${this.registeredTables.size} tabelas registradas...`);
    }

    for (const [tableName, TableClass] of this.registeredTables.entries()) {
      // 1. Gera e executa o CREATE TABLE da classe
      const createTableSQL = TableClass.generateCreateTableSQL();
      try {
        this.db.exec(createTableSQL);
      } catch (err) {
        console.error(`[DatabaseEngine] Erro ao criar tabela ${tableName}:`, err);
        throw err;
      }

      // 2. Gera e executa os CREATE INDEX da classe
      const indexStatements = TableClass.generateIndexesSQL();
      for (const idxSQL of indexStatements) {
        try {
          this.db.exec(idxSQL);
        } catch (err) {
          console.error(`[DatabaseEngine] Erro ao criar índice na tabela ${tableName}:`, err);
          throw err;
        }
      }
    }

    if (this.verbose) {
      console.log('[DatabaseEngine] Esquema SQLite e índices gerados com sucesso.');
    }

    return this;
  }

  /**
   * Executa operações dentro de uma transação atômica ACID
   */
  transaction(callback) {
    this.connect();
    this.db.exec('BEGIN TRANSACTION;');
    try {
      const result = callback(this);
      this.db.exec('COMMIT;');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK;');
      console.error('[DatabaseEngine] Transação abortada (ROLLBACK realizado):', error.message);
      throw error;
    }
  }

  /**
   * Sistema de Migrações Versionadas para Crescimento do Banco
   */
  runMigration(version, name, upCallback) {
    this.connect();

    // Garante que a tabela de migrações exista
    const MigrationsTable = this.registeredTables.get('schema_migrations');
    if (!MigrationsTable) {
      throw new Error("[DatabaseEngine] MigrationsTable ('schema_migrations') deve estar registrada.");
    }

    const applied = MigrationsTable.findOne({ version });
    if (applied) {
      return false; // Migração já executada previamente
    }

    if (this.verbose) {
      console.log(`[DatabaseEngine] Aplicando migração v${version} - ${name}...`);
    }

    const startTime = Date.now();
    this.transaction(() => {
      upCallback(this.db, this);
      MigrationsTable.insert({
        version,
        name,
        applied_at: new Date().toISOString(),
        execution_time_ms: Date.now() - startTime
      });
    });

    if (this.verbose) {
      console.log(`[DatabaseEngine] Migração v${version} aplicada com sucesso em ${Date.now() - startTime}ms.`);
    }

    return true;
  }

  /**
   * Retorna estatísticas de armazenamento e contagem de registros de todas as tabelas
   */
  getStats() {
    this.connect();
    const stats = {
      filePath: this.filePath,
      fileSizeBytes: fs.existsSync(this.filePath) ? fs.statSync(this.filePath).size : 0,
      journalMode: this.db.prepare('PRAGMA journal_mode;').get()?.journal_mode,
      foreignKeys: this.db.prepare('PRAGMA foreign_keys;').get()?.foreign_keys,
      tables: {}
    };

    for (const [name, TableClass] of this.registeredTables.entries()) {
      stats.tables[name] = {
        totalRows: TableClass.count()
      };
    }

    return stats;
  }

  /**
   * Otimiza páginas do SQLite
   */
  vacuum() {
    this.connect();
    this.db.exec('VACUUM;');
    if (this.verbose) console.log('[DatabaseEngine] VACUUM executado com sucesso.');
  }

  /**
   * Fecha a conexão com o banco de dados
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      if (this.verbose) console.log('[DatabaseEngine] Conexão SQLite encerrada.');
    }
  }
}
