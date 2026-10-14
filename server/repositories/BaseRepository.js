import { AbstractTenantDAO } from '../dao/AbstractTenantDAO.js';

/**
 * Padrão Arquitetural: REPOSITORY PATTERN (BaseRepository)
 * Técnica de Engenharia: Compactação de Código Focada em Reuso
 *
 * BaseRepository unifica e compacta as operações fundamentais de persistência
 * (Create, Read, Update, Delete, Count, Exists) para qualquer entidade relacional.
 * Elimina a duplicação de dezenas de Prepared Statements SQL manuais através da
 * construção dinâmica e segura de queries parametrizadas.
 */
export class BaseRepository extends AbstractTenantDAO {
  constructor(tableName, { primaryKey = 'id', tenantColumn = 'condominium_id', isTenantDirect = true } = {}) {
    super();
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.tenantColumn = tenantColumn;
    this.isTenantDirect = isTenantDirect;
  }

  /**
   * Compacta a busca por chave primária com escopo multi-tenant.
   */
  findById(id, { condominiumId } = {}) {
    const parsedId = parseInt(id, 10);
    if (!Number.isInteger(parsedId)) return null;

    let sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    const params = [parsedId];

    if (condominiumId && this.isTenantDirect) {
      const scope = this.directTenantScope(condominiumId, { columnName: this.tenantColumn });
      sql += ` AND ${scope.sql}`;
      params.push(...scope.params);
    }

    return this.db.prepare(sql).get(...params) || null;
  }

  /**
   * Compacta a consulta de listagem com filtros dinâmicos seguros e paginação.
   */
  findAll({ condominiumId, where = {}, orderBy = '', limit = null, offset = null } = {}) {
    let sql = `SELECT * FROM ${this.tableName} WHERE 1=1`;
    const params = [];

    if (condominiumId && this.isTenantDirect) {
      const scope = this.directTenantScope(condominiumId, { columnName: this.tenantColumn });
      sql += ` AND ${scope.sql}`;
      params.push(...scope.params);
    }

    for (const [col, val] of Object.entries(where)) {
      if (val !== undefined && val !== null) {
        sql += ` AND ${col} = ?`;
        params.push(val);
      }
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    if (Number.isInteger(limit) && limit > 0) {
      sql += ` LIMIT ${limit}`;
      if (Number.isInteger(offset) && offset >= 0) {
        sql += ` OFFSET ${offset}`;
      }
    }

    return this.db.prepare(sql).all(...params);
  }

  /**
   * Compacta a inserção de registros gerando colunas e placeholders dinamicamente.
   */
  create(data) {
    if (!data || typeof data !== 'object') {
      throw new Error(`Dados inválidos para inserção em ${this.tableName}.`);
    }

    const filteredEntries = Object.entries(data).filter(([_, v]) => v !== undefined);
    if (filteredEntries.length === 0) {
      throw new Error(`Nenhum campo fornecido para inserção em ${this.tableName}.`);
    }

    const columns = filteredEntries.map(([k]) => k);
    const placeholders = columns.map(() => '?').join(', ');
    const values = filteredEntries.map(([_, v]) => v);

    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    const info = this.db.prepare(sql).run(...values);

    return this.findById(info.lastInsertRowid);
  }

  /**
   * Compacta a atualização parcial (PATCH/PUT) de registros.
   */
  update(id, data, { condominiumId } = {}) {
    const existing = this.findById(id, { condominiumId });
    if (!existing) {
      throw new Error(`Registro com ID ${id} não encontrado em ${this.tableName}.`);
    }

    const filteredEntries = Object.entries(data).filter(([k, v]) => v !== undefined && k !== this.primaryKey);
    if (filteredEntries.length === 0) {
      return existing;
    }

    const setClauses = filteredEntries.map(([k]) => `${k} = ?`).join(', ');
    const values = filteredEntries.map(([_, v]) => v);
    values.push(existing[this.primaryKey]);

    const sql = `UPDATE ${this.tableName} SET ${setClauses} WHERE ${this.primaryKey} = ?`;
    this.db.prepare(sql).run(...values);

    return this.findById(id);
  }

  /**
   * Compacta a exclusão física com proteção multi-tenant.
   */
  delete(id, { condominiumId } = {}) {
    const existing = this.findById(id, { condominiumId });
    if (!existing) return false;

    const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    const info = this.db.prepare(sql).run(existing[this.primaryKey]);
    return info.changes > 0;
  }

  /**
   * Compacta a contagem de registros agregados.
   */
  count({ condominiumId, where = {} } = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE 1=1`;
    const params = [];

    if (condominiumId && this.isTenantDirect) {
      const scope = this.directTenantScope(condominiumId, { columnName: this.tenantColumn });
      sql += ` AND ${scope.sql}`;
      params.push(...scope.params);
    }

    for (const [col, val] of Object.entries(where)) {
      if (val !== undefined && val !== null) {
        sql += ` AND ${col} = ?`;
        params.push(val);
      }
    }

    const result = this.db.prepare(sql).get(...params);
    return result ? result.count : 0;
  }

  /**
   * Compacta verificação de existência rápida.
   */
  exists(conditions, { condominiumId } = {}) {
    return this.count({ condominiumId, where: conditions }) > 0;
  }
}
