import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class CondominiumModulesTable extends BaseTable {
  static tableName = 'condominium_modules';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    condominium_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'condominiums', column: 'id', onDelete: 'CASCADE' } 
    },
    module_key: { type: 'TEXT', notNull: true },
    is_enabled: { type: 'INTEGER', notNull: true, defaultValue: 1 }
  };

  static compositeUnique = [
    ['condominium_id', 'module_key']
  ];

  static indexes = [
    { name: 'idx_modules_condo', columns: ['condominium_id'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.module_key !== undefined && (!data.module_key || data.module_key.trim().length === 0)) {
      throw new DomainValidationError('module_key', 'Chave identificadora do módulo é obrigatória', this.tableName);
    }

    return true;
  }
}
