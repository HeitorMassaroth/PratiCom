import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class AccessLogsTable extends BaseTable {
  static tableName = 'access_logs';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    destination_unit_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'units', column: 'id', onDelete: 'CASCADE' } 
    },
    visitor_name: { type: 'TEXT', notNull: true },
    document: { type: 'TEXT', notNull: true },
    type: { type: 'TEXT', defaultValue: 'Visitante' },
    status: { 
      type: 'TEXT', 
      notNull: true, 
      defaultValue: 'IN_PROPERTY', 
      check: "status IN ('IN_PROPERTY', 'EXITED')" 
    },
    company: { type: 'TEXT' },
    vehicle_plate: { type: 'TEXT' },
    entered_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    exited_at: { type: 'DATETIME' }
  };

  static indexes = [
    { name: 'idx_access_status', columns: ['status'] },
    { name: 'idx_access_unit_id', columns: ['destination_unit_id'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.visitor_name !== undefined && (!data.visitor_name || data.visitor_name.trim().length === 0)) {
      throw new DomainValidationError('visitor_name', 'Nome do visitante ou prestador é obrigatório', this.tableName);
    }

    if (data.document !== undefined && (!data.document || data.document.trim().length === 0)) {
      throw new DomainValidationError('document', 'Documento de identificação (RG/CPF) é obrigatório', this.tableName);
    }

    if (data.status !== undefined && !['IN_PROPERTY', 'EXITED'].includes(data.status)) {
      throw new DomainValidationError('status', "Status deve ser 'IN_PROPERTY' ou 'EXITED'", this.tableName);
    }

    return true;
  }
}
