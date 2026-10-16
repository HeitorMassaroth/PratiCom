import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class CondoSettingsTable extends BaseTable {
  static tableName = 'condo_settings';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    condominium_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'condominiums', column: 'id', onDelete: 'CASCADE' } 
    },
    setting_key: { type: 'TEXT', notNull: true },
    setting_value: { type: 'TEXT', notNull: true },
    setting_type: { 
      type: 'TEXT', 
      notNull: true, 
      defaultValue: 'string',
      check: "setting_type IN ('string', 'number', 'boolean', 'json')" 
    },
    description: { type: 'TEXT' },
    updated_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' }
  };

  static compositeUnique = [
    ['condominium_id', 'setting_key']
  ];

  static indexes = [
    { name: 'idx_condo_settings_key', columns: ['condominium_id', 'setting_key'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.setting_key !== undefined) {
      if (typeof data.setting_key !== 'string' || data.setting_key.trim().length === 0) {
        throw new DomainValidationError('setting_key', 'Chave de configuração é obrigatória', this.tableName);
      }
    }

    return true;
  }
}
