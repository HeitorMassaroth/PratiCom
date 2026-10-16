import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class DeliveriesTable extends BaseTable {
  static tableName = 'deliveries';

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
    courier: { type: 'TEXT', notNull: true },
    tracking_code: { type: 'TEXT' },
    description: { type: 'TEXT' },
    status: { 
      type: 'TEXT', 
      notNull: true, 
      defaultValue: 'PENDING', 
      check: "status IN ('PENDING', 'PICKED_UP', 'CANCELLED')" 
    },
    pickup_code: { type: 'TEXT', notNull: true },
    notes: { type: 'TEXT' },
    received_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    picked_up_at: { type: 'DATETIME' },
    picked_up_by: { type: 'TEXT' },
    cancelled_at: { type: 'DATETIME' },
    cancellation_reason: { type: 'TEXT' }
  };

  static indexes = [
    { name: 'idx_deliveries_unit_status', columns: ['unit_id', 'status'] },
    { name: 'idx_deliveries_pickup_code', columns: ['pickup_code'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.courier !== undefined && (!data.courier || data.courier.trim().length === 0)) {
      throw new DomainValidationError('courier', 'Transportadora ou entregador é obrigatório', this.tableName);
    }

    if (data.status !== undefined && !['PENDING', 'PICKED_UP', 'CANCELLED'].includes(data.status)) {
      throw new DomainValidationError('status', "Status deve ser 'PENDING', 'PICKED_UP' ou 'CANCELLED'", this.tableName);
    }

    return true;
  }

  static beforeInsert(data) {
    const clean = super.beforeInsert(data);
    // Geração segura de PIN de 4 dígitos caso não fornecido
    if (!clean.pickup_code) {
      clean.pickup_code = String(Math.floor(1000 + Math.random() * 9000));
    }
    return clean;
  }
}
