// ============================================================================
// PratiCom ERP - DDD Aggregate Root: Reservation (Reserva de Área Comum)
// Encapsula validação de horários, regras de antecedência e cancelamento
// ============================================================================

import { Entity } from '../common/Entity.js';
import { TimeRange } from '../value-objects/TimeRange.js';
import { ReservationConfirmedEvent } from '../events/AppEvents.js';

export class Reservation extends Entity {
  constructor(id, props) {
    super(id, props);

    this._spaceId = props.spaceId;
    this._residentId = props.residentId;
    this._unitId = props.unitId;
    this._reservationDate = props.reservationDate;
    this._timeRange = props.timeRange instanceof TimeRange 
      ? props.timeRange 
      : new TimeRange(props.startTime, props.endTime);
    this._status = props.status || 'CONFIRMED';
    this._notes = props.notes || null;
  }

  get spaceId() { return this._spaceId; }
  get residentId() { return this._residentId; }
  get unitId() { return this._unitId; }
  get reservationDate() { return this._reservationDate; }
  get timeRange() { return this._timeRange; }
  get startTime() { return this._timeRange.startTime; }
  get endTime() { return this._timeRange.endTime; }
  get status() { return this._status; }
  get notes() { return this._notes; }

  static create(props) {
    if (!props.spaceId) throw new Error('Espaço comum obrigatório para reserva.');
    if (!props.unitId) throw new Error('Unidade/Apartamento obrigatório para reserva.');
    if (!props.reservationDate) throw new Error('Data da reserva é obrigatória.');

    const timeRange = props.timeRange instanceof TimeRange 
      ? props.timeRange 
      : new TimeRange(props.startTime, props.endTime);

    // Validação de data não no passado
    const today = new Date().toISOString().split('T')[0];
    if (props.reservationDate < today) {
      throw new Error(`Data da reserva (${props.reservationDate}) não pode ser retroativa.`);
    }

    const reservation = new Reservation(props.id || null, {
      ...props,
      timeRange,
      status: 'CONFIRMED'
    });

    reservation.addDomainEvent(new ReservationConfirmedEvent(
      reservation.id,
      reservation.spaceId,
      reservation.unitId,
      reservation.reservationDate,
      reservation.timeRange.toString()
    ));

    return reservation;
  }

  cancel(cancelledByRole = 'MORADOR') {
    if (this._status === 'CANCELLED') {
      throw new Error('Esta reserva já está cancelada.');
    }

    const today = new Date().toISOString().split('T')[0];
    if (this._reservationDate < today) {
      throw new Error('Não é possível cancelar uma reserva de data passada.');
    }

    this._status = 'CANCELLED';
    this._notes = (this._notes ? `${this._notes} | ` : '') + `Cancelado por ${cancelledByRole} em ${new Date().toLocaleDateString('pt-BR')}`;
    this.markModified();
    return this;
  }

  conflictsWith(otherReservation) {
    if (this._spaceId !== otherReservation.spaceId) return false;
    if (this._reservationDate !== otherReservation.reservationDate) return false;
    if (this._status === 'CANCELLED' || otherReservation.status === 'CANCELLED') return false;

    return this._timeRange.overlaps(otherReservation.timeRange);
  }
}
