// ============================================================================
// PratiCom ERP - BaseTable (Abstração Concreta para Tabelas SQLite DDD)
// Fornece geração declarativa de DDL, validação de invariantes e operações CRUD
// ============================================================================

export class DomainValidationError extends Error {
  constructor(field, message, entityName) {
    super(`[${entityName || 'DomainValidation'}] Campo '${field}': ${message}`);
    this.name = 'DomainValidationError';
    this.field = field;
    this.entityName = entityName;
  }
}

export class BaseTable {
  /**
   * Nome físico da tabela no SQLite (deve ser sobrescrito pelas subclasses)
   */
  static tableName = '';

  /**
   * Dicionário de colunas com suas especificações e constraints
   */
  static columns = {};

  /**
   * Constraints de unicidade composta (ex: [['condominium_id', 'name']])
   */
  static compositeUnique = [];

  /**
   * Índices otimizados para busca e ordenação
   */
  static indexes = [];

  /**
   * Triggers associados para auditoria ou integridade
   */
  static triggers = [];

  /**
   * Referência à instância do banco de dados registrada
   */
  static db = null;

  /**
   * Vincula a instância ativa do SQLite à classe da tabela
   */
  static bindDatabase(databaseInstance) {
    this.db = databaseInstance;
  }

  /**
   * Gera a instrução SQL DDL completa (CREATE TABLE) a partir das definições da classe
   */
  static generateCreateTableSQL() {
    if (!this.tableName) {
      throw new Error('A classe da tabela deve definir static tableName');
    }

    const columnDefs = [];
    const foreignKeyDefs = [];

    for (const [colName, spec] of Object.entries(this.columns)) {
      let def = `"${colName}" ${spec.type || 'TEXT'}`;

      if (spec.primaryKey) {
        def += ' PRIMARY KEY';
        if (spec.autoIncrement) {
          def += ' AUTOINCREMENT';
        }
      }

      if (spec.notNull && !spec.primaryKey) {
        def += ' NOT NULL';
      }

      if (spec.unique && !spec.primaryKey) {
        def += ' UNIQUE';
      }

      if (spec.defaultValue !== undefined) {
        if (typeof spec.defaultValue === 'string' && spec.defaultValue.startsWith('(') && spec.defaultValue.endsWith(')')) {
          def += ` DEFAULT ${spec.defaultValue}`;
        } else if (typeof spec.defaultValue === 'string' && ['CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME', 'NULL'].includes(spec.defaultValue)) {
          def += ` DEFAULT ${spec.defaultValue}`;
        } else if (typeof spec.defaultValue === 'string') {
          def += ` DEFAULT '${spec.defaultValue.replace(/'/g, "''")}'`;
        } else if (spec.defaultValue === null) {
          def += ' DEFAULT NULL';
        } else {
          def += ` DEFAULT ${spec.defaultValue}`;
        }
      }

      if (spec.check) {
        def += ` CHECK(${spec.check})`;
      }

      columnDefs.push(def);

      // Tratamento de Foreign Keys declarativas
      const fkSpec = spec.foreignKey || spec.references;
      if (fkSpec) {
        const { table, column, onDelete, onUpdate } = fkSpec;
        let fkClause = `FOREIGN KEY ("${colName}") REFERENCES "${table}"("${column || 'id'}")`;
        if (onDelete) fkClause += ` ON DELETE ${onDelete.toUpperCase()}`;
        if (onUpdate) fkClause += ` ON UPDATE ${onUpdate.toUpperCase()}`;
        foreignKeyDefs.push(fkClause);
      }
    }

    // Constraints compostas
    if (Array.isArray(this.compositeUnique)) {
      for (const uniqueGroup of this.compositeUnique) {
        const cols = uniqueGroup.map(c => `"${c}"`).join(', ');
        columnDefs.push(`UNIQUE(${cols})`);
      }
    }

    const allClauses = [...columnDefs, ...foreignKeyDefs].join(',\n  ');
    return `CREATE TABLE IF NOT EXISTS "${this.tableName}" (\n  ${allClauses}\n);`;
  }

  /**
   * Gera todas as instruções CREATE INDEX para a tabela
   */
  static generateIndexesSQL() {
    const sqlStatements = [];
    if (!Array.isArray(this.indexes)) return sqlStatements;

    for (const idx of this.indexes) {
      const idxName = idx.name || `idx_${this.tableName}_${idx.columns.join('_')}`;
      const uniqueStr = idx.unique ? 'UNIQUE ' : '';
      const cols = idx.columns.map(c => `"${c}"`).join(', ');
      const whereClause = idx.where ? ` WHERE ${idx.where}` : '';
      sqlStatements.push(`CREATE ${uniqueStr}INDEX IF NOT EXISTS "${idxName}" ON "${this.tableName}" (${cols})${whereClause};`);
    }

    return sqlStatements;
  }

  /**
   * Validação de Domínio (DDD) pré-persistência
   * Deve ser sobrescrito ou complementado pelas subclasses
   */
  static validate(data, isUpdate = false) {
    if (!data || typeof data !== 'object') {
      throw new DomainValidationError('payload', 'Objeto de dados inválido ou ausente', this.tableName);
    }

    // Validação estrutural básica de NOT NULL
    for (const [colName, spec] of Object.entries(this.columns)) {
      if (spec.primaryKey && spec.autoIncrement) continue;

      if (!isUpdate && spec.notNull && (data[colName] === undefined || data[colName] === null || data[colName] === '')) {
        if (spec.defaultValue === undefined) {
          throw new DomainValidationError(colName, 'é um campo obrigatório que não pode ser nulo ou vazio', this.tableName);
        }
      }
    }

    return true;
  }

  /**
   * Hook executado antes do INSERT (pode sanitizar ou enriquecer dados)
   */
  static beforeInsert(data) {
    return { ...data };
  }

  /**
   * Hook executado após o INSERT
   */
  static afterInsert(row) {
    return row;
  }

  /**
   * Hook executado antes do UPDATE
   */
  static beforeUpdate(id, data) {
    return { ...data };
  }

  // ==========================================================================
  // OPERAÇÕES DE DADOS ATÔMICAS (CRUD)
  // ==========================================================================

  static insert(data) {
    if (!this.db) throw new Error(`Tabela ${this.tableName} não vinculada a uma instância de banco de dados.`);
    
    this.validate(data, false);
    let preparedData = this.beforeInsert(data);

    // Se a tabela tiver updated_at ou created_at sem valor, preenche
    if (this.columns.created_at && !preparedData.created_at) {
      preparedData.created_at = new Date().toISOString();
    }
    if (this.columns.updated_at && !preparedData.updated_at) {
      preparedData.updated_at = new Date().toISOString();
    }

    const keys = Object.keys(preparedData).filter(k => this.columns[k] !== undefined);
    if (keys.length === 0) throw new Error(`Nenhum campo válido para inserção na tabela ${this.tableName}`);

    const cols = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => preparedData[k]);

    const sql = `INSERT INTO "${this.tableName}" (${cols}) VALUES (${placeholders});`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...values);

    const insertedId = result.lastInsertRowid;
    const insertedRow = this.findById(insertedId);
    return this.afterInsert(insertedRow);
  }

  static insertMany(rows) {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const results = [];
    for (const row of rows) {
      results.push(this.insert(row));
    }
    return results;
  }

  static findById(id) {
    if (!this.db) throw new Error(`Tabela ${this.tableName} não vinculada ao banco.`);
    const sql = `SELECT * FROM "${this.tableName}" WHERE "id" = ? LIMIT 1;`;
    const stmt = this.db.prepare(sql);
    const row = stmt.get(id);
    return row || null;
  }

  static findOne(conditions = {}) {
    const rows = this.findAll(conditions, { limit: 1 });
    return rows.length > 0 ? rows[0] : null;
  }

  static findAll(conditions = {}, options = {}) {
    if (!this.db) throw new Error(`Tabela ${this.tableName} não vinculada ao banco.`);

    let sql = `SELECT * FROM "${this.tableName}"`;
    const params = [];
    const whereClauses = [];

    // Suporte a soft-delete automático se existir deleted_at e não for expressamente requisitado
    if (this.columns.deleted_at && conditions.deleted_at === undefined && !options.includeDeleted) {
      whereClauses.push('"deleted_at" IS NULL');
    }

    for (const [key, value] of Object.entries(conditions)) {
      if (this.columns[key] === undefined) continue;

      if (value === null) {
        whereClauses.push(`"${key}" IS NULL`);
      } else if (Array.isArray(value)) {
        const inPlaceholders = value.map(() => '?').join(', ');
        whereClauses.push(`"${key}" IN (${inPlaceholders})`);
        params.push(...value);
      } else {
        whereClauses.push(`"${key}" = ?`);
        params.push(value);
      }
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit !== undefined) {
      sql += ` LIMIT ${Number(options.limit)}`;
      if (options.offset !== undefined) {
        sql += ` OFFSET ${Number(options.offset)}`;
      }
    }

    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }

  static update(id, data) {
    if (!this.db) throw new Error(`Tabela ${this.tableName} não vinculada ao banco.`);
    if (!id) throw new Error('ID obrigatório para atualização');

    this.validate(data, true);
    let preparedData = this.beforeUpdate(id, data);

    if (this.columns.updated_at && !preparedData.updated_at) {
      preparedData.updated_at = new Date().toISOString();
    }

    const keys = Object.keys(preparedData).filter(k => this.columns[k] !== undefined && k !== 'id');
    if (keys.length === 0) return this.findById(id);

    const setClauses = keys.map(k => `"${k}" = ?`).join(', ');
    const values = [...keys.map(k => preparedData[k]), id];

    const sql = `UPDATE "${this.tableName}" SET ${setClauses} WHERE "id" = ?;`;
    const stmt = this.db.prepare(sql);
    stmt.run(...values);

    return this.findById(id);
  }

  static delete(id) {
    if (!this.db) throw new Error(`Tabela ${this.tableName} não vinculada ao banco.`);
    const existing = this.findById(id);
    if (!existing) return false;

    const sql = `DELETE FROM "${this.tableName}" WHERE "id" = ?;`;
    const stmt = this.db.prepare(sql);
    stmt.run(id);
    return true;
  }

  static softDelete(id) {
    if (!this.columns.deleted_at) {
      return this.delete(id);
    }
    return this.update(id, { deleted_at: new Date().toISOString() });
  }

  static count(conditions = {}) {
    if (!this.db) throw new Error(`Tabela ${this.tableName} não vinculada ao banco.`);

    let sql = `SELECT COUNT(*) as total FROM "${this.tableName}"`;
    const params = [];
    const whereClauses = [];

    if (this.columns.deleted_at && conditions.deleted_at === undefined) {
      whereClauses.push('"deleted_at" IS NULL');
    }

    for (const [key, value] of Object.entries(conditions)) {
      if (this.columns[key] === undefined) continue;
      whereClauses.push(`"${key}" = ?`);
      params.push(value);
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const stmt = this.db.prepare(sql);
    const res = stmt.get(...params);
    return res ? res.total : 0;
  }

  static exists(conditions = {}) {
    return this.count(conditions) > 0;
  }
}
