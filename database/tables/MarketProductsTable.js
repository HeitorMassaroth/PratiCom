import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class MarketProductsTable extends BaseTable {
  static tableName = 'market_products';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    condominium_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'condominiums', column: 'id', onDelete: 'CASCADE' } 
    },
    name: { type: 'TEXT', notNull: true },
    category: { type: 'TEXT', defaultValue: 'Geral' },
    price: { 
      type: 'REAL', 
      notNull: true, 
      check: "price >= 0" 
    },
    stock_quantity: { 
      type: 'INTEGER', 
      defaultValue: 0, 
      check: "stock_quantity >= 0" 
    },
    min_stock: { type: 'INTEGER', defaultValue: 5 },
    barcode: { type: 'TEXT' },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' }
  };

  static indexes = [
    { name: 'idx_market_products_condo', columns: ['condominium_id'] },
    { name: 'idx_market_barcode', columns: ['barcode'], where: 'barcode IS NOT NULL' }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.price !== undefined) {
      const p = Number(data.price);
      if (isNaN(p) || p < 0) {
        throw new DomainValidationError('price', 'Preço deve ser um valor numérico positivo ou zero', this.tableName);
      }
    }

    if (data.stock_quantity !== undefined) {
      const q = Number(data.stock_quantity);
      if (isNaN(q) || q < 0) {
        throw new DomainValidationError('stock_quantity', 'Estoque não pode ser negativo em nenhuma circunstância', this.tableName);
      }
    }

    return true;
  }
}
