import { BaseRepository } from './BaseRepository.js';

/**
 * Repositório especializado para a entidade FinancialTransaction.
 * Reutiliza os métodos CRUD unificados de BaseRepository.
 */
export class FinancialRepository extends BaseRepository {
  constructor() {
    super('financial_transactions', { primaryKey: 'id', tenantColumn: 'condominium_id', isTenantDirect: true });
  }

  /**
   * Consolidação agregada de receitas, despesas e saldo líquido por condomínio.
   */
  getFinancialSummary(condominiumId) {
    const scope = this.directTenantScope(condominiumId);
    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'INCOME' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' AND status = 'COMPLETED' THEN amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN type = 'INCOME' AND status = 'PENDING' THEN amount ELSE 0 END), 0) as pending_income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' AND status = 'PENDING' THEN amount ELSE 0 END), 0) as pending_expenses
      FROM financial_transactions
      WHERE ${scope.sql}
    `;
    const row = this.db.prepare(sql).get(...scope.params);
    const totalBalance = (row.total_income || 0) - (row.total_expenses || 0);
    return {
      ...row,
      total_balance: totalBalance
    };
  }
}
