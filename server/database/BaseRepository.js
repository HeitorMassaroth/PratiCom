import db from '../config/database.js';

export class BaseRepository {
  constructor(tableName, options = {}) {
    this.table = tableName;
    this.primaryKey = options.primaryKey || 'id';
    this.tenantColumn = options.tenantColumn || 'condominium_id';
    this.hasDirectTenant = options.hasDirectTenant !== undefined ? options.hasDirectTenant : true;
    this.db = db;
  }

  findById(id) {
    return this.db.prepare(`SELECT * FROM ${this.table} WHERE ${this.primaryKey} = ?`).get(id);
  }

  findAll(filters = {}) {
    const conditions = [];
    const params = [];

    for (const [key, val] of Object.entries(filters)) {
      if (val !== undefined && val !== null && val !== '') {
        conditions.push(`${key} = ?`);
        params.push(val);
      }
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM ${this.table} ${where} ORDER BY ${this.primaryKey} DESC`;
    return this.db.prepare(sql).all(...params);
  }

  create(data) {
    const fields = Object.keys(data).filter(k => data[k] !== undefined);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(k => data[k]);

    const sql = `INSERT INTO ${this.table} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = this.db.prepare(sql).run(...values);
    return this.findById(result.lastInsertRowid);
  }

  update(id, data) {
    const fields = Object.keys(data).filter(k => k !== this.primaryKey && data[k] !== undefined);
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map(k => `${k} = ?`).join(', ');
    const values = fields.map(k => data[k]);
    values.push(id);

    const sql = `UPDATE ${this.table} SET ${setClause} WHERE ${this.primaryKey} = ?`;
    this.db.prepare(sql).run(...values);
    return this.findById(id);
  }

  delete(id) {
    const sql = `DELETE FROM ${this.table} WHERE ${this.primaryKey} = ?`;
    const result = this.db.prepare(sql).run(id);
    return result.changes > 0;
  }

  count(filters = {}) {
    const conditions = [];
    const params = [];

    for (const [key, val] of Object.entries(filters)) {
      if (val !== undefined && val !== null && val !== '') {
        conditions.push(`${key} = ?`);
        params.push(val);
      }
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*) as count FROM ${this.table} ${where}`;
    return this.db.prepare(sql).get(...params)?.count || 0;
  }
}
