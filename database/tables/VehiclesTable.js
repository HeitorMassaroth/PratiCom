import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class VehiclesTable extends BaseTable {
  static tableName = 'vehicles';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    unit_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'units', column: 'id', onDelete: 'CASCADE' } 
    },
    resident_id: { 
      type: 'INTEGER', 
      foreignKey: { table: 'residents', column: 'id', onDelete: 'SET NULL' } 
    },
    plate: { type: 'TEXT', notNull: true },
    model: { type: 'TEXT', notNull: true },
    color: { type: 'TEXT' },
    type: { type: 'TEXT', defaultValue: 'Carro' },
    parking_spot: { type: 'TEXT' },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'DATETIME' }
  };

  static indexes = [
    { name: 'idx_vehicles_plate', columns: ['plate'] },
    { name: 'idx_vehicles_unit_id', columns: ['unit_id'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.plate !== undefined) {
      const sanitized = String(data.plate).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (sanitized.length !== 7) {
        throw new DomainValidationError('plate', 'Placa veicular deve conter exatamente 7 caracteres alfanuméricos', this.tableName);
      }
    }

    if (data.model !== undefined && (!data.model || data.model.trim().length === 0)) {
      throw new DomainValidationError('model', 'Marca e modelo do veículo são obrigatórios', this.tableName);
    }

    return true;
  }

  static beforeInsert(data) {
    const clean = super.beforeInsert(data);
    if (clean.plate) {
      clean.plate = String(clean.plate).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    }
    return clean;
  }
}
