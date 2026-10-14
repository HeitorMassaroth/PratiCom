import { BaseDomainEntity } from '../BaseDomainEntity.js';

/**
 * Entidade de Domínio: Vehicle (Veículo)
 * Representa um veículo vinculado a uma unidade residencial e morador.
 */
export class Vehicle extends BaseDomainEntity {
  constructor(data = {}) {
    super(data);
    this._unitId = data.unit_id !== undefined ? Number(data.unit_id) : (data.unitId !== undefined ? Number(data.unitId) : null);
    this._residentId = data.resident_id !== undefined && data.resident_id !== null ? Number(data.resident_id) : (data.residentId !== undefined && data.residentId !== null ? Number(data.residentId) : null);
    this._plate = data.plate ? String(data.plate).trim().toUpperCase() : '';
    this._model = data.model ? String(data.model).trim() : '';
    this._color = data.color ? String(data.color).trim() : '';
    this._type = data.type ? String(data.type).trim().toUpperCase() : 'CAR';
    this._parkingSpot = data.parking_spot || data.parkingSpot || null;
  }

  get unitId() { return this._unitId; }
  get residentId() { return this._residentId; }
  get plate() { return this._plate; }
  get model() { return this._model; }
  get color() { return this._color; }
  get type() { return this._type; }
  get parkingSpot() { return this._parkingSpot; }

  normalizePlate() {
    return this._plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  }

  isCar() {
    return this._type === 'CAR' || this._type === 'CARRO';
  }

  isMotorcycle() {
    return this._type === 'MOTORCYCLE' || this._type === 'MOTO';
  }

  validate() {
    if (!this._unitId) {
      throw new Error('Unidade é obrigatória para o veículo.');
    }
    if (!this._plate) {
      throw new Error('Placa é obrigatória.');
    }
    if (!this._model) {
      throw new Error('Modelo é obrigatório.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      unit_id: this._unitId,
      resident_id: this._residentId,
      plate: this._plate,
      model: this._model,
      color: this._color,
      type: this._type,
      parking_spot: this._parkingSpot
    };
  }

  static fromDatabase(row) {
    if (!row) return null;
    return new Vehicle(row);
  }
}
