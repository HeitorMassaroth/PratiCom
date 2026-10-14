import { BaseDomainEntity } from '../BaseDomainEntity.js';

/**
 * Entidade de Domínio: AccessLog (Registro de Portaria / Acesso)
 * Representa o controle de entrada e saída de visitantes, prestadores e entregadores.
 */
export class AccessLog extends BaseDomainEntity {
  constructor(data = {}) {
    super(data);
    this._condominiumId = data.condominium_id !== undefined ? Number(data.condominium_id) : (data.condominiumId !== undefined ? Number(data.condominiumId) : null);
    this._visitorName = data.visitor_name || data.visitorName || '';
    this._visitorDocument = data.visitor_document || data.visitorDocument || null;
    this._destinationUnitId = data.destination_unit_id !== undefined && data.destination_unit_id !== null ? Number(data.destination_unit_id) : (data.destinationUnitId !== undefined && data.destinationUnitId !== null ? Number(data.destinationUnitId) : null);
    this._type = data.type ? String(data.type).trim().toUpperCase() : 'VISITOR';
    this._vehiclePlate = data.vehicle_plate || data.vehiclePlate || null;
    this._company = data.company ? String(data.company).trim() : null;
    this._authorizedBy = data.authorized_by || data.authorizedBy || null;
    this._entryTime = data.entry_time || data.entryTime || new Date().toISOString();
    this._exitTime = data.exit_time || data.exitTime || null;
    this._status = data.status || 'IN_PROPERTY';
  }

  get condominiumId() { return this._condominiumId; }
  get visitorName() { return this._visitorName; }
  get visitorDocument() { return this._visitorDocument; }
  get destinationUnitId() { return this._destinationUnitId; }
  get type() { return this._type; }
  get vehiclePlate() { return this._vehiclePlate; }
  get company() { return this._company; }
  get authorizedBy() { return this._authorizedBy; }
  get entryTime() { return this._entryTime; }
  get exitTime() { return this._exitTime; }
  get status() { return this._status; }

  isInProperty() {
    return this._status === 'IN_PROPERTY' && !this._exitTime;
  }

  registerExit(exitTime = new Date().toISOString()) {
    if (!this.isInProperty()) {
      throw new Error('Registro de acesso já possui saída registrada.');
    }
    this._exitTime = exitTime;
    this._status = 'EXITED';
  }

  calculateStayDurationMinutes() {
    if (!this._entryTime || !this._exitTime) return null;
    const start = new Date(this._entryTime).getTime();
    const end = new Date(this._exitTime).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return 0;
    return Math.round((end - start) / 60000);
  }

  validate() {
    if (!this._visitorName) {
      throw new Error('Nome do visitante/prestador é obrigatório.');
    }
    if (!this._destinationUnitId) {
      throw new Error('Unidade de destino é obrigatória.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      condominium_id: this._condominiumId,
      visitor_name: this._visitorName,
      visitor_document: this._visitorDocument,
      destination_unit_id: this._destinationUnitId,
      type: this._type,
      vehicle_plate: this._vehiclePlate,
      company: this._company,
      authorized_by: this._authorizedBy,
      entry_time: this._entryTime,
      exit_time: this._exitTime,
      status: this._status
    };
  }

  static fromDatabase(row) {
    if (!row) return null;
    return new AccessLog(row);
  }
}
