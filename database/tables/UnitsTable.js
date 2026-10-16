import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class UnitsTable extends BaseTable {
  static tableName = 'units';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    block_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'blocks', column: 'id', onDelete: 'CASCADE' } 
    },
    number: { type: 'TEXT', notNull: true },
    floor: { type: 'INTEGER' },
    type: { type: 'TEXT', defaultValue: 'Residencial' },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'DATETIME' }
  };

  static compositeUnique = [
    ['block_id', 'number']
  ];

  static indexes = [
    { name: 'idx_units_block_id', columns: ['block_id'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.block_id !== undefined) {
      if (!Number.isInteger(Number(data.block_id)) || Number(data.block_id) <= 0) {
        throw new DomainValidationError('block_id', 'ID do bloco deve ser um número inteiro positivo', this.tableName);
      }
    }

    if (data.number !== undefined) {
      if (typeof data.number !== 'string' || data.number.trim().length === 0) {
        throw new DomainValidationError('number', 'Número da unidade/apartamento é obrigatório', this.tableName);
      }
    }

    return true;
  }
}
