// ============================================================================
// PratiCom ERP - Domain Service: FinancialHealthService
// Balanço sintético, DRE condominial e cálculo de inadimplência com Money VO
// ============================================================================

import { Money } from '../value-objects/Money.js';

export class FinancialHealthService {
  /**
   * Processa uma lista de lançamentos contábeis e gera o balancete sintético
   * @param {Array} transactions - [{ type: 'income'|'expense', amount: number, status: 'PAID'|'PENDING' }]
   * @param {number} totalUnits - total de unidades para cálculo de adimplência
   */
  static calculateMonthlyBalance(transactions = [], totalUnits = 1) {
    let totalIncomeCents = 0;
    let totalExpenseCents = 0;
    let paidQuotaUnitsCount = 0;
    let pendingQuotaUnitsCount = 0;

    for (const tx of transactions) {
      const money = Money.fromReais(Number(tx.amount || 0));

      if (tx.type === 'income') {
        if (tx.status === 'PAID') {
          totalIncomeCents += money.cents;
          paidQuotaUnitsCount++;
        } else if (tx.status === 'PENDING') {
          pendingQuotaUnitsCount++;
        }
      } else if (tx.type === 'expense') {
        if (tx.status === 'PAID') {
          totalExpenseCents += money.cents;
        }
      }
    }

    const totalIncome = new Money(totalIncomeCents);
    const totalExpense = new Money(totalExpenseCents);
    const netResult = totalIncome.subtract(totalExpense);

    const billedUnits = paidQuotaUnitsCount + pendingQuotaUnitsCount;
    const delinquencyRatePct = billedUnits > 0 ? (pendingQuotaUnitsCount / billedUnits) * 100 : 0;

    return {
      totalIncome: totalIncome.formatBRL(),
      totalIncomeValue: totalIncome.value,
      totalExpense: totalExpense.formatBRL(),
      totalExpenseValue: totalExpense.value,
      netResult: netResult.formatBRL(),
      netResultValue: netResult.value,
      isSurplus: netResult.isPositive(),
      delinquencyRate: Number(delinquencyRatePct.toFixed(1)),
      paidUnits: paidQuotaUnitsCount,
      pendingUnits: pendingQuotaUnitsCount
    };
  }
}
