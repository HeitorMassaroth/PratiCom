import { BaseDomainEntity } from '../BaseDomainEntity.js';

/**
 * Entidade de Domínio: FinancialTransaction (Transação Financeira / Lançamento)
 * Representa receitas (taxas condominiais) e despesas (manutenção, contas de consumo).
 */
export class FinancialTransaction extends BaseDomainEntity {
  constructor(data = {}) {
    super(data);
    this._condominiumId = data.condominium_id !== undefined ? Number(data.condominium_id) : (data.condominiumId !== undefined ? Number(data.condominiumId) : null);
    this._unitId = data.unit_id !== undefined && data.unit_id !== null ? Number(data.unit_id) : (data.unitId !== undefined && data.unitId !== null ? Number(data.unitId) : null);
    this._description = data.description ? String(data.description).trim() : '';
    this._amount = data.amount !== undefined && data.amount !== null ? Number(data.amount) : 0;
    this._type = data.type ? String(data.type).trim().toUpperCase() : 'EXPENSE';
    this._category = data.category ? String(data.category).trim() : 'Geral';
    this._status = data.status ? String(data.status).trim().toUpperCase() : 'PENDING';
    this._dueDate = data.due_date || data.dueDate || '';
    this._paymentDate = data.payment_date || data.paymentDate || null;
  }

  get condominiumId() { return this._condominiumId; }
  get unitId() { return this._unitId; }
  get description() { return this._description; }
  get amount() { return this._amount; }
  get type() { return this._type; }
  get category() { return this._category; }
  get status() { return this._status; }
  get dueDate() { return this._dueDate; }
  get paymentDate() { return this._paymentDate; }

  isIncome() {
    return this._type === 'INCOME' || this._type === 'RECEITA';
  }

  isExpense() {
    return this._type === 'EXPENSE' || this._type === 'DESPESA';
  }

  isPaid() {
    return this._status === 'PAID' || this._status === 'PAGO';
  }

  isPending() {
    return this._status === 'PENDING' || this._status === 'PENDENTE';
  }

  markAsPaid(paymentDate = new Date().toISOString().split('T')[0]) {
    this._status = 'PAID';
    this._paymentDate = paymentDate;
  }

  validate() {
    if (!this._condominiumId) {
      throw new Error('ID do condomínio é obrigatório para a transação financeira.');
    }
    if (!this._description) {
      throw new Error('Descrição da transação é obrigatória.');
    }
    if (this._amount <= 0) {
      throw new Error('Valor da transação deve ser positivo.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      condominium_id: this._condominiumId,
      unit_id: this._unitId,
      description: this._description,
      amount: this._amount,
      type: this._type,
      category: this._category,
      status: this._status,
      due_date: this._dueDate,
      payment_date: this._paymentDate
    };
  }

  static fromDatabase(row) {
    if (!row) return null;
    return new FinancialTransaction(row);
  }
}
