import { BaseDomainEntity } from '../BaseDomainEntity.js';

/**
 * Entidade de Domínio: Delivery (Encomenda / Pacote)
 * Representa uma encomenda recebida na portaria aguardando retirada segura por PIN.
 */
export class Delivery extends BaseDomainEntity {
  constructor(data = {}) {
    super(data);
    this._unitId = data.unit_id !== undefined ? Number(data.unit_id) : (data.unitId !== undefined ? Number(data.unitId) : null);
    this._residentId = data.resident_id !== undefined && data.resident_id !== null ? Number(data.resident_id) : (data.residentId !== undefined && data.residentId !== null ? Number(data.residentId) : null);
    this._courier = data.courier ? String(data.courier).trim() : '';
    this._trackingCode = data.tracking_code || data.trackingCode || null;
    this._description = data.description ? String(data.description).trim() : '';
    this._status = data.status || 'pending';
    this._pickupCode = data.pickup_code || data.pickupCode || null;
    this._notes = data.notes || null;
  }

  get unitId() { return this._unitId; }
  get residentId() { return this._residentId; }
  get courier() { return this._courier; }
  get trackingCode() { return this._trackingCode; }
  get description() { return this._description; }
  get status() { return this._status; }
  get pickupCode() { return this._pickupCode; }
  get notes() { return this._notes; }

  isPending() {
    return this._status === 'pending';
  }

  isDelivered() {
    return this._status === 'delivered';
  }

  isCanceled() {
    return this._status === 'canceled';
  }

  verifyPin(providedPin) {
    if (!this._pickupCode) return false;
    return String(this._pickupCode).trim() === String(providedPin).trim();
  }

  markAsDelivered(providedPin) {
    if (!this.verifyPin(providedPin)) {
      throw new Error('Código PIN incorreto para retirada da encomenda.');
    }
    this._status = 'delivered';
  }

  cancel(reason) {
    this._status = 'canceled';
    if (reason) {
      this._notes = this._notes ? `${this._notes} | Cancelamento: ${reason}` : `Cancelamento: ${reason}`;
    }
  }

  validate() {
    if (!this._unitId) {
      throw new Error('Unidade de destino é obrigatória para a encomenda.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      unit_id: this._unitId,
      resident_id: this._residentId,
      courier: this._courier,
      tracking_code: this._trackingCode,
      description: this._description,
      status: this._status,
      pickup_code: this._pickupCode,
      notes: this._notes
    };
  }

  static fromDatabase(row) {
    if (!row) return null;
    return new Delivery(row);
  }
}
