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

  getSummary() {
    const totalBalanceRow = this.db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'INCOME' AND status = 'PAID' THEN amount ELSE 0 END) -
        SUM(CASE WHEN type = 'EXPENSE' AND status = 'PAID' THEN amount ELSE 0 END) as balance,
        SUM(CASE WHEN type = 'INCOME' AND status = 'PAID' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'EXPENSE' AND status = 'PAID' THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN type = 'INCOME' AND status = 'OVERDUE' THEN amount ELSE 0 END) as default_amount
      FROM financial_transactions
    `).get();

    const overdueCount = this.db.prepare(`
      SELECT COUNT(DISTINCT unit_id) as count FROM financial_transactions WHERE status = 'OVERDUE'
    `).get().count;

    const totalUnits = this.db.prepare('SELECT COUNT(*) as count FROM units').get().count;
    const defaultRate = totalUnits > 0 ? (overdueCount / totalUnits) * 100 : 0;

    return {
      total_balance: totalBalanceRow.balance || 0,
      monthly_income: totalBalanceRow.income || 0,
      monthly_expenses: totalBalanceRow.expense || 0,
      default_rate: parseFloat(defaultRate.toFixed(1)),
      default_amount: totalBalanceRow.default_amount || 0
    };
  }

  getTransactions({ status, type, search } = {}) {
    let sql = `
      SELECT f.*, u.block, u.number as unit_number
      FROM financial_transactions f
      LEFT JOIN units u ON f.unit_id = u.id
      WHERE 1=1
    `;
    const params = [];

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
      INSERT INTO financial_transactions (unit_id, description, amount, type, category, status, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
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
