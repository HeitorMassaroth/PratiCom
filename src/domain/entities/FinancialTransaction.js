// ============================================================================
// PratiCom ERP - DDD Aggregate Root: FinancialTransaction (Lançamento Financeiro)
// Contas a pagar, a receber, taxas condominiais com precisão em Money VO
// ============================================================================

import { Entity } from '../common/Entity.js';
import { Money } from '../value-objects/Money.js';

export class FinancialTransaction extends Entity {
  constructor(id, props) {
    super(id, props);

    this._condominiumId = props.condominiumId || props.condominium_id;
    this._unitId = props.unitId || props.unit_id || null;
    this._type = props.type; // 'income' ou 'expense'
    this._category = props.category;
    this._description = props.description;
    this._amount = props.amount instanceof Money ? props.amount : Money.fromReais(Number(props.amount || 0));
    this._dueDate = props.dueDate || props.due_date;
    this._paymentDate = props.paymentDate || props.payment_date || null;
    this._status = props.status || 'PENDING';
  }

  get condominiumId() { return this._condominiumId; }
  get unitId() { return this._unitId; }
  get type() { return this._type; }
  get category() { return this._category; }
  get description() { return this._description; }
  get amount() { return this._amount; }
  get amountValue() { return this._amount.value; }
  get amountFormatted() { return this._amount.formatBRL(); }
  get dueDate() { return this._dueDate; }
  get paymentDate() { return this._paymentDate; }
  get status() { return this._status; }
  get isPaid() { return this._status === 'PAID'; }

  static create(props) {
    if (!props.condominiumId && !props.condominium_id) {
      throw new Error('Lançamento deve estar vinculado a um condomínio.');
    }
    if (!['income', 'expense'].includes(props.type)) {
      throw new Error("Tipo financeiro deve ser 'income' (receita) ou 'expense' (despesa).");
    }
    if (!props.description || props.description.trim().length === 0) {
      throw new Error('Descrição do lançamento financeiro é obrigatória.');
    }
    if (!props.dueDate && !props.due_date) {
      throw new Error('Data de vencimento é obrigatória.');
    }

    const amount = props.amount instanceof Money ? props.amount : Money.fromReais(Number(props.amount));
    if (!amount.isPositive()) {
      throw new Error('O valor do lançamento financeiro deve ser positivo.');
    }

    return new FinancialTransaction(props.id || null, {
      ...props,
      amount,
      status: props.status || 'PENDING'
    });
  }

  markAsPaid(paymentDate = null) {
    if (this._status === 'PAID') {
      throw new Error('Este lançamento já foi liquidado.');
    }

    this._status = 'PAID';
    this._paymentDate = paymentDate || new Date().toISOString().split('T')[0];
    this.markModified();
    return this;
  }

  isOverdue() {
    if (this._status === 'PAID') return false;
    const today = new Date().toISOString().split('T')[0];
    return this._dueDate < today;
  }

  applyFineAndInterest(finePercentage = 2.0, monthlyInterestPercentage = 1.0) {
    if (!this.isOverdue()) return this._amount;

    const fine = this._amount.percentage(finePercentage);
    const interest = this._amount.percentage(monthlyInterestPercentage);
    return this._amount.add(fine).add(interest);
  }
}
