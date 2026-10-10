import DatabaseSingleton from '../config/DatabaseSingleton.js';
import { FinancialReportGenerator } from '../services/templates/ReportTemplate.js';

/**
 * Padrão de Projeto: DAO (Data Access Object - 3/3)
 * Abstração e persistência relacional de dados financeiros condominiais no SQLite.
 */
export class FinancialDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
    this.reportGenerator = new FinancialReportGenerator(this.db);
  }

  getSummary({ condominiumId } = {}) {
    let whereClause = 'WHERE 1=1';
    let unitWhereClause = 'WHERE 1=1';
    const params = [];
    const unitParams = [];

    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      if (cId === 1) {
        whereClause += ' AND (condominium_id = 1 OR condominium_id IS NULL)';
        unitWhereClause += ' AND (b.condominium_id = 1 OR u.block_id IS NULL)';
      } else {
        whereClause += ' AND condominium_id = ?';
        params.push(cId);
        unitWhereClause += ' AND b.condominium_id = ?';
        unitParams.push(cId);
      }
    }

    const totalBalanceRow = this.db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'INCOME' AND status = 'PAID' THEN amount ELSE 0 END) -
        SUM(CASE WHEN type = 'EXPENSE' AND status = 'PAID' THEN amount ELSE 0 END) as balance,
        SUM(CASE WHEN type = 'INCOME' AND status = 'PAID' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'EXPENSE' AND status = 'PAID' THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN type = 'INCOME' AND status = 'OVERDUE' THEN amount ELSE 0 END) as default_amount
      FROM financial_transactions
      ${whereClause}
    `).get(...params);

    const overdueCount = this.db.prepare(`
      SELECT COUNT(DISTINCT unit_id) as count FROM financial_transactions ${whereClause} AND status = 'OVERDUE'
    `).get(...params).count;

    const totalUnits = this.db.prepare(`
      SELECT COUNT(*) as count FROM units u LEFT JOIN blocks b ON u.block_id = b.id ${unitWhereClause}
    `).get(...unitParams).count;

    const defaultRate = totalUnits > 0 ? (overdueCount / totalUnits) * 100 : 0;

    return {
      total_balance: totalBalanceRow?.balance || 0,
      monthly_income: totalBalanceRow?.income || 0,
      monthly_expenses: totalBalanceRow?.expense || 0,
      default_rate: parseFloat(defaultRate.toFixed(1)),
      default_amount: totalBalanceRow?.default_amount || 0
    };
  }

  getTransactions({ condominiumId, status, type, search } = {}) {
    let sql = `
      SELECT f.*, u.block, u.number as unit_number
      FROM financial_transactions f
      LEFT JOIN units u ON f.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      if (cId === 1) {
        sql += ' AND (f.condominium_id = 1 OR f.condominium_id IS NULL OR b.condominium_id = 1 OR u.block_id IS NULL)';
      } else {
        sql += ' AND (f.condominium_id = ? OR b.condominium_id = ?)';
        params.push(cId, cId);
      }
    }

    if (status) {
      sql += ' AND f.status = ?';
      params.push(status);
    }

    if (type) {
      sql += ' AND f.type = ?';
      params.push(type);
    }

    if (search) {
      sql += ' AND LOWER(f.description) LIKE ?';
      params.push(`%${search.toLowerCase()}%`);
    }

    sql += ' ORDER BY f.due_date DESC';
    return this.db.prepare(sql).all(params);
  }

  createTransaction(data) {
    const stmt = this.db.prepare(`
      INSERT INTO financial_transactions (condominium_id, unit_id, description, amount, type, category, status, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      data.condominium_id ? parseInt(data.condominium_id, 10) : null,
      data.unit_id ? parseInt(data.unit_id, 10) : null,
      data.description,
      parseFloat(data.amount),
      data.type,
      data.category || 'Outros',
      data.status || 'PENDING',
      data.due_date || new Date().toISOString().split('T')[0]
    );

    return this.db.prepare('SELECT * FROM financial_transactions WHERE id = ?').get(info.lastInsertRowid);
  }

  payTransaction(id) {
    const stmt = this.db.prepare(`
      UPDATE financial_transactions
      SET status = 'PAID', paid_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(parseInt(id, 10));
    return this.db.prepare('SELECT * FROM financial_transactions WHERE id = ?').get(parseInt(id, 10));
  }

  generateReport() {
    return this.reportGenerator.generateReport();
  }
}
