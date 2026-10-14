import { BaseDomainEntity } from '../BaseDomainEntity.js';

/**
 * Entidade de Domínio: Reservation (Reserva de Área Comum)
 * Representa o agendamento de espaços de lazer (salão de festas, churrasqueira, etc.).
 */
export class Reservation extends BaseDomainEntity {
  constructor(data = {}) {
    super(data);
    this._spaceId = data.space_id !== undefined ? Number(data.space_id) : (data.spaceId !== undefined ? Number(data.spaceId) : null);
    this._unitId = data.unit_id !== undefined && data.unit_id !== null ? Number(data.unit_id) : (data.unitId !== undefined && data.unitId !== null ? Number(data.unitId) : null);
    this._residentId = data.resident_id !== undefined && data.resident_id !== null ? Number(data.resident_id) : (data.residentId !== undefined && data.residentId !== null ? Number(data.residentId) : null);
    this._reservationDate = data.reservation_date || data.reservationDate || '';
    this._startTime = data.start_time || data.startTime || '';
    this._endTime = data.end_time || data.endTime || '';
    this._guestsCount = data.guests_count !== undefined && data.guests_count !== null ? Number(data.guests_count) : (data.guestsCount !== undefined && data.guestsCount !== null ? Number(data.guestsCount) : 0);
    this._notes = data.notes || null;
    this._totalPrice = data.total_price !== undefined && data.total_price !== null ? Number(data.total_price) : (data.totalPrice !== undefined && data.totalPrice !== null ? Number(data.totalPrice) : 0);
    this._status = data.status ? String(data.status).toUpperCase() : 'CONFIRMED';
  }

  get spaceId() { return this._spaceId; }
  get unitId() { return this._unitId; }
  get residentId() { return this._residentId; }
  get reservationDate() { return this._reservationDate; }
  get startTime() { return this._startTime; }
  get endTime() { return this._endTime; }
  get guestsCount() { return this._guestsCount; }
  get notes() { return this._notes; }
  get totalPrice() { return this._totalPrice; }
  get status() { return this._status; }

  isConfirmed() {
    return this._status === 'CONFIRMED' || this._status === 'CONFIRMADA';
  }

  isCancelled() {
    return this._status === 'CANCELLED' || this._status === 'CANCELADA';
  }

  confirm() {
    this._status = 'CONFIRMED';
  }

  cancel() {
    this._status = 'CANCELLED';
  }

  calculateDurationHours() {
    if (!this._startTime || !this._endTime) return 0;
    const [startH, startM] = this._startTime.split(':').map(Number);
    const [endH, endM] = this._endTime.split(':').map(Number);
    const startMinutes = (startH || 0) * 60 + (startM || 0);
    const endMinutes = (endH || 0) * 60 + (endM || 0);
    return Math.max(0, (endMinutes - startMinutes) / 60);
  }

  hasConflictWith(other) {
    if (this._spaceId !== other.spaceId) return false;
    if (this._reservationDate !== other.reservationDate) return false;
    if (this.isCancelled() || other.isCancelled()) return false;
    return this._startTime < other.endTime && this._endTime > other.startTime;
  }

  validate() {
    if (!this._spaceId) {
      throw new Error('Espaço comum é obrigatório para a reserva.');
    }
    if (!this._unitId) {
      throw new Error('Unidade é obrigatória para a reserva.');
    }
    if (!this._reservationDate) {
      throw new Error('Data da reserva é obrigatória.');
    }
    if (!this._startTime || !this._endTime) {
      throw new Error('Horários de início e fim são obrigatórios.');
    }
    if (this._startTime >= this._endTime) {
      throw new Error('O horário de início deve ser anterior ao horário de término.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      space_id: this._spaceId,
      unit_id: this._unitId,
      resident_id: this._residentId,
      reservation_date: this._reservationDate,
      start_time: this._startTime,
      end_time: this._endTime,
      guests_count: this._guestsCount,
      notes: this._notes,
      total_price: this._totalPrice,
      status: this._status
    };
  }

  static fromDatabase(row) {
    if (!row) return null;
    return new Reservation(row);
  }
}
