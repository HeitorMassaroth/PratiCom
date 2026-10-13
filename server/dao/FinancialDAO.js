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
        whereClause += ' AND (f.condominium_id = 1 OR (f.condominium_id IS NULL AND (b.condominium_id = 1 OR u.block_id IS NULL)))';
        unitWhereClause += ' AND (b.condominium_id = 1 OR u.block_id IS NULL)';
      } else {
        whereClause += ' AND (f.condominium_id = ? OR (f.condominium_id IS NULL AND b.condominium_id = ?))';
        params.push(cId, cId);
        unitWhereClause += ' AND b.condominium_id = ?';
        unitParams.push(cId);
      }
    }

    const totals = this.db.prepare(`
      SELECT
        SUM(CASE WHEN UPPER(f.type) = 'INCOME' AND UPPER(f.status) = 'PAID' THEN f.amount ELSE 0 END) AS income_paid,
        SUM(CASE WHEN UPPER(f.type) = 'INCOME' AND UPPER(f.status) IN ('PENDING', 'OVERDUE') THEN f.amount ELSE 0 END) AS income_pending,
        SUM(CASE WHEN UPPER(f.type) = 'INCOME' AND UPPER(f.status) = 'OVERDUE' THEN f.amount ELSE 0 END) AS income_overdue,
        SUM(CASE WHEN UPPER(f.type) = 'EXPENSE' AND UPPER(f.status) = 'PAID' THEN f.amount ELSE 0 END) AS expense_paid,
        SUM(CASE WHEN UPPER(f.type) = 'EXPENSE' AND UPPER(f.status) IN ('PENDING', 'OVERDUE') THEN f.amount ELSE 0 END) AS expense_pending,
        SUM(CASE WHEN UPPER(f.type) = 'EXPENSE' AND UPPER(f.status) = 'OVERDUE' THEN f.amount ELSE 0 END) AS expense_overdue
      FROM financial_transactions f
      LEFT JOIN units u ON f.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      ${whereClause}
    `).get(...params);

    const overdueCount = this.db.prepare(`
      SELECT COUNT(DISTINCT f.unit_id) AS count
      FROM financial_transactions f
      LEFT JOIN units u ON f.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      ${whereClause} AND UPPER(f.type) = 'INCOME' AND UPPER(f.status) = 'OVERDUE'
    `).get(...params).count;

    const totalUnits = this.db.prepare(`
      SELECT COUNT(*) as count FROM units u LEFT JOIN blocks b ON u.block_id = b.id ${unitWhereClause}
    `).get(...unitParams).count;

    const defaultRate = totalUnits > 0 ? (overdueCount / totalUnits) * 100 : 0;
    const delinquencyByUnit = this.db.prepare(`
      SELECT COALESCE(b.name, u.block) as block, u.number AS unit_number, SUM(f.amount) AS total_debt
      FROM financial_transactions f
      JOIN units u ON f.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      ${whereClause} AND UPPER(f.type) = 'INCOME' AND UPPER(f.status) = 'OVERDUE'
      GROUP BY u.id
      ORDER BY total_debt DESC
    `).all(...params);
    const incomePaid = totals?.income_paid || 0;
    const expensePaid = totals?.expense_paid || 0;

    return {
      income: {
        paid: incomePaid,
        pending: totals?.income_pending || 0,
        overdue: totals?.income_overdue || 0
      },
      expense: {
        paid: expensePaid,
        pending: totals?.expense_pending || 0,
        overdue: totals?.expense_overdue || 0
      },
      currentBalance: parseFloat((incomePaid - expensePaid).toFixed(2)),
      default_rate: parseFloat(defaultRate.toFixed(1)),
      overdueCount: overdueCount || 0,
      delinquencyByUnit
    };
  }

  getTransactions({ condominiumId, status, type, category, search } = {}) {
    let sql = `
      SELECT f.*, f.id AS document_number, f.paid_at AS payment_date,
        COALESCE(b.name, u.block) as block, u.number as unit_number
      FROM financial_transactions f
      LEFT JOIN units u ON f.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      if (cId === 1) {
        sql += ' AND (f.condominium_id = 1 OR (f.condominium_id IS NULL AND (b.condominium_id = 1 OR u.block_id IS NULL)))';
      } else {
        sql += ' AND (f.condominium_id = ? OR (f.condominium_id IS NULL AND b.condominium_id = ?))';
        params.push(cId, cId);
      }
    }

    if (status) {
      sql += ' AND UPPER(f.status) = ?';
      params.push(status.toUpperCase());
    }

    if (type) {
      sql += ' AND UPPER(f.type) = ?';
      params.push(type.toUpperCase());
    }

    if (category) {
      sql += ' AND f.category = ?';
      params.push(category);
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
      data.type.toUpperCase(),
      data.category || 'Outros',
      (data.status || 'PENDING').toUpperCase(),
      data.due_date || new Date().toISOString().split('T')[0]
    );

    return this.db.prepare(`
      SELECT f.*, f.id AS document_number, f.paid_at AS payment_date,
        u.block, u.number AS unit_number
      FROM financial_transactions f
      LEFT JOIN units u ON f.unit_id = u.id
      WHERE f.id = ?
    `).get(info.lastInsertRowid);
  }

  payTransaction(id, condominiumId) {
    let scope = '';
    const params = [parseInt(id, 10)];
    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      if (cId === 1) {
        scope = ' AND (scoped.condominium_id = 1 OR scoped.condominium_id IS NULL OR b.condominium_id = 1 OR u.block_id IS NULL)';
      } else {
        scope = ' AND (scoped.condominium_id = ? OR b.condominium_id = ?)';
        params.push(cId, cId);
      }
    }
    const stmt = this.db.prepare(`
      UPDATE financial_transactions AS f
      SET status = 'PAID', paid_at = CURRENT_TIMESTAMP
      WHERE f.id = ?
        AND EXISTS (
          SELECT 1 FROM financial_transactions scoped
          LEFT JOIN units u ON scoped.unit_id = u.id
          LEFT JOIN blocks b ON u.block_id = b.id
          WHERE scoped.id = f.id${scope}
        )
    `);
    const result = stmt.run(...params);
    if (result.changes === 0) return null;
    return this.db.prepare(`
      SELECT f.*, f.id AS document_number, f.paid_at AS payment_date,
        u.block, u.number AS unit_number
      FROM financial_transactions f
      LEFT JOIN units u ON f.unit_id = u.id
      WHERE f.id = ?
    `).get(parseInt(id, 10));
  }

  generateReport() {
    return this.reportGenerator.generateReport();
  }
}
