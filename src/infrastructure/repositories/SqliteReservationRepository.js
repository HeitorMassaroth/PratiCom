// ============================================================================
// PratiCom ERP - Infrastructure Adapter: SqliteReservationRepository
// Persistência de reservas com integração do ReservationConflictDetector DDD
// ============================================================================

import { Reservation } from '../../domain/entities/Reservation.js';
import { TimeRange } from '../../domain/value-objects/TimeRange.js';
import { DomainEvents } from '../../domain/events/DomainEvents.js';
import { ReservationConflictDetector } from '../../domain/services/ReservationConflictDetector.js';

export class SqliteReservationRepository {
  constructor(databaseEngine) {
    this.table = databaseEngine.getTable('reservations');
  }

  _toDomain(row) {
    if (!row) return null;
    return new Reservation(row.id, {
      spaceId: row.space_id,
      residentId: row.resident_id,
      unitId: row.unit_id,
      reservationDate: row.reservation_date,
      timeRange: new TimeRange(row.start_time, row.end_time),
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  _toPersistence(res) {
    return {
      space_id: res.spaceId,
      resident_id: res.residentId,
      unit_id: res.unitId,
      reservation_date: res.reservationDate,
      start_time: res.startTime,
      end_time: res.endTime,
      status: res.status,
      notes: res.notes
    };
  }

  findById(id) {
    const row = this.table.findById(id);
    return this._toDomain(row);
  }

  findAllBySpaceAndDate(spaceId, date) {
    const rows = this.table.findAll({ space_id: spaceId, reservation_date: date });
    return rows.map(r => this._toDomain(r));
  }

  save(reservation) {
    // Validação de conflito de horário no mesmo espaço
    const existingReservations = this.findAllBySpaceAndDate(reservation.spaceId, reservation.reservationDate);
    const conflictResult = ReservationConflictDetector.detectConflict(reservation, existingReservations);

    if (conflictResult.hasConflict) {
      throw new Error(conflictResult.message);
    }

    const data = this._toPersistence(reservation);

    let savedRow;
    if (reservation.id) {
      savedRow = this.table.update(reservation.id, data);
    } else {
      savedRow = this.table.insert(data);
    }

    const savedEntity = this._toDomain(savedRow);
    DomainEvents.dispatchEventsForAggregate(reservation);

    return savedEntity;
  }

  delete(id) {
    return this.table.delete(id);
  }
}
