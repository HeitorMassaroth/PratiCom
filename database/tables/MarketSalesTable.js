import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class MarketSalesTable extends BaseTable {
  static tableName = 'market_sales';

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
    resident_id: { 
      type: 'INTEGER', 
      foreignKey: { table: 'residents', column: 'id', onDelete: 'SET NULL' } 
    },
    total_amount: { type: 'REAL', notNull: true },
    payment_method: { type: 'TEXT', notNull: true },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' }
  };

  static indexes = [
    { name: 'idx_market_sales_condo_date', columns: ['condominium_id', 'created_at'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.total_amount !== undefined) {
      const t = Number(data.total_amount);
      if (isNaN(t) || t < 0) {
        throw new DomainValidationError('total_amount', 'Total da venda deve ser um valor numérico válido', this.tableName);
      }
    }

    if (data.payment_method !== undefined && (!data.payment_method || data.payment_method.trim().length === 0)) {
      throw new DomainValidationError('payment_method', 'Forma de pagamento é obrigatória', this.tableName);
    }

    return true;
  }
}
