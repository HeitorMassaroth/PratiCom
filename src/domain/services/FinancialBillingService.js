// ============================================================================
// PratiCom ERP - Domain Service: FinancialBillingService
// Emissão de boletos/lançamentos de cota condominial e fundo de reserva por unidade
// ============================================================================

import { FinancialTransaction } from '../entities/FinancialTransaction.js';
import { Money } from '../value-objects/Money.js';

export class FinancialBillingService {
  /**
   * Emite a cota condominial mensal para uma lista de unidades
   * @param {Object} params - { condominiumId, units: Array, baseQuotaAmount: number, reserveFundPercentage: number, dueDate: string }
   */
  static generateMonthlyQuotas({ condominiumId, units = [], baseQuotaAmount, reserveFundPercentage = 10, dueDate }) {
    if (!condominiumId) throw new Error('ID do condomínio obrigatório.');
    if (!units || units.length === 0) throw new Error('Nenhuma unidade fornecida para emissão de cotas.');
    if (!dueDate) throw new Error('Data de vencimento é obrigatória.');

    const baseMoney = Money.fromReais(Number(baseQuotaAmount));
    const reserveFundMoney = baseMoney.percentage(reserveFundPercentage);
    const totalUnitQuota = baseMoney.add(reserveFundMoney);

    const transactions = [];

    for (const unit of units) {
      const tx = FinancialTransaction.create({
        condominiumId,
        unitId: unit.id,
        type: 'income',
        category: 'Cota Condominial',
        description: `Taxa Ordinária (${baseMoney.formatBRL()}) + Fundo de Reserva (${reserveFundMoney.formatBRL()})`,
        amount: totalUnitQuota,
        dueDate,
        status: 'PENDING'
      });
      transactions.push(tx);
    }

    return {
      transactions,
      unitCount: units.length,
      unitAmount: totalUnitQuota.formatBRL(),
      totalProjectedRevenue: totalUnitQuota.multiply(units.length).formatBRL()
    };
  }
}
