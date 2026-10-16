import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class FinancialTransactionsTable extends BaseTable {
  static tableName = 'financial_transactions';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    condominium_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'condominiums', column: 'id', onDelete: 'CASCADE' } 
    },
    unit_id: { 
      type: 'INTEGER', 
      foreignKey: { table: 'units', column: 'id', onDelete: 'SET NULL' } 
    },
    type: { 
      type: 'TEXT', 
      notNull: true, 
      check: "type IN ('income', 'expense')" 
    },
    category: { type: 'TEXT', notNull: true },
    description: { type: 'TEXT', notNull: true },
    amount: { 
      type: 'REAL', 
      notNull: true, 
      check: "amount > 0" 
    },
    due_date: { type: 'TEXT', notNull: true },
    status: { 
      type: 'TEXT', 
      notNull: true, 
      defaultValue: 'PENDING', 
      check: "status IN ('PENDING', 'PAID')" 
    },
    payment_date: { type: 'TEXT' },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' }
  };

  static indexes = [
    { name: 'idx_financial_condo_date', columns: ['condominium_id', 'due_date'] },
    { name: 'idx_financial_status', columns: ['status'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.type !== undefined && !['income', 'expense'].includes(data.type)) {
      throw new DomainValidationError('type', "Tipo financeiro deve ser 'income' (receita) ou 'expense' (despesa)", this.tableName);
    }

    if (data.amount !== undefined) {
      const val = Number(data.amount);
      if (isNaN(val) || val <= 0) {
        throw new DomainValidationError('amount', 'Valor do lançamento deve ser maior que zero', this.tableName);
      }
    }

    if (data.status !== undefined && !['PENDING', 'PAID'].includes(data.status)) {
      throw new DomainValidationError('status', "Status deve ser 'PENDING' ou 'PAID'", this.tableName);
    }

    return true;
  }
}
