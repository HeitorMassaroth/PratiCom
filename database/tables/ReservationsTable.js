import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class ReservationsTable extends BaseTable {
  static tableName = 'reservations';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    space_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'spaces', column: 'id', onDelete: 'CASCADE' } 
    },
    resident_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'residents', column: 'id', onDelete: 'CASCADE' } 
    },
    unit_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'units', column: 'id', onDelete: 'CASCADE' } 
    },
    reservation_date: { type: 'TEXT', notNull: true },
    start_time: { type: 'TEXT', notNull: true },
    end_time: { type: 'TEXT', notNull: true },
    status: { 
      type: 'TEXT', 
      notNull: true, 
      defaultValue: 'CONFIRMED', 
      check: "status IN ('CONFIRMED', 'CANCELLED')" 
    },
    notes: { type: 'TEXT' },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' }
  };

  static indexes = [
    { name: 'idx_reservations_space_date', columns: ['space_id', 'reservation_date', 'status'] },
    { name: 'idx_reservations_resident', columns: ['resident_id'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.reservation_date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.reservation_date)) {
        throw new DomainValidationError('reservation_date', 'Data da reserva deve estar no padrão YYYY-MM-DD', this.tableName);
      }
    }

    if (data.start_time !== undefined && data.end_time !== undefined) {
      if (data.start_time >= data.end_time) {
        throw new DomainValidationError('start_time', 'Horário de início deve ser estritamente anterior ao horário de término', this.tableName);
      }
    }

    // Regra DDD de Não-Sobreposição Temporal (Conflito de Reservas)
    if (this.db && data.space_id && data.reservation_date && data.start_time && data.end_time) {
      const excludeIdClause = isUpdate && data.id ? `AND "id" != ${Number(data.id)}` : '';
      const conflictSql = `
        SELECT id FROM "${this.tableName}"
        WHERE "space_id" = ?
          AND "reservation_date" = ?
          AND "status" = 'CONFIRMED'
          ${excludeIdClause}
          AND NOT ("end_time" <= ? OR "start_time" >= ?)
        LIMIT 1;
      `;
      const conflict = this.db.prepare(conflictSql).get(data.space_id, data.reservation_date, data.start_time, data.end_time);
      if (conflict) {
        throw new DomainValidationError('start_time', `Já existe uma reserva confirmada para este espaço no horário solicitado (${data.start_time} às ${data.end_time})`, this.tableName);
      }
    }

    return true;
  }
}
