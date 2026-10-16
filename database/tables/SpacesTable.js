import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class SpacesTable extends BaseTable {
  static tableName = 'spaces';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    condominium_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'condominiums', column: 'id', onDelete: 'CASCADE' } 
    },
    name: { type: 'TEXT', notNull: true },
    capacity: { type: 'INTEGER', defaultValue: 30 },
    description: { type: 'TEXT' },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' }
  };

  static compositeUnique = [
    ['condominium_id', 'name']
  ];

  static indexes = [
    { name: 'idx_spaces_condo_id', columns: ['condominium_id'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      throw new DomainValidationError('name', 'Nome da área comum é obrigatório', this.tableName);
    }

    if (data.capacity !== undefined && Number(data.capacity) <= 0) {
      throw new DomainValidationError('capacity', 'Capacidade deve ser maior que zero', this.tableName);
    }

    return true;
  }
}
