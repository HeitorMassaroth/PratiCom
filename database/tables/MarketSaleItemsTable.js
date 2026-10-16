import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class MarketSaleItemsTable extends BaseTable {
  static tableName = 'market_sale_items';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    sale_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'market_sales', column: 'id', onDelete: 'CASCADE' } 
    },
    product_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'market_products', column: 'id', onDelete: 'CASCADE' } 
    },
    quantity: { 
      type: 'INTEGER', 
      notNull: true, 
      check: "quantity > 0" 
    },
    unit_price: { type: 'REAL', notNull: true },
    subtotal: { type: 'REAL', notNull: true }
  };

  static indexes = [
    { name: 'idx_sale_items_sale_id', columns: ['sale_id'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.quantity !== undefined && Number(data.quantity) <= 0) {
      throw new DomainValidationError('quantity', 'Quantidade vendida deve ser no mínimo 1', this.tableName);
    }

    if (data.unit_price !== undefined && Number(data.unit_price) < 0) {
      throw new DomainValidationError('unit_price', 'Preço unitário não pode ser negativo', this.tableName);
    }

    return true;
  }
}
