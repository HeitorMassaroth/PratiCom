// ============================================================================
// PratiCom ERP - DDD Entity: Vehicle (Veículo Cadastrado)
// Placa Mercosul/Cinza com ValueObject LicensePlate e vaga de garagem vinculada
// ============================================================================

import { Entity } from '../common/Entity.js';
import { LicensePlate } from '../value-objects/LicensePlate.js';

export class Vehicle extends Entity {
  constructor(id, props) {
    super(id, props);

    this._unitId = props.unitId;
    this._residentId = props.residentId || null;
    this._plate = props.plate instanceof LicensePlate ? props.plate : new LicensePlate(props.plate);
    this._model = props.model;
    this._color = props.color || null;
    this._type = props.type || 'Carro';
    this._parkingSpot = props.parkingSpot || null;
  }

  get unitId() { return this._unitId; }
  get residentId() { return this._residentId; }
  get plate() { return this._plate; }
  get plateNumber() { return this._plate.value; }
  get formattedPlate() { return this._plate.formatted; }
  get isMercosul() { return this._plate.isMercosul; }
  get model() { return this._model; }
  get color() { return this._color; }
  get type() { return this._type; }
  get parkingSpot() { return this._parkingSpot; }

  static create(props) {
    if (!props.unitId) throw new Error('O veículo deve estar vinculado a uma unidade residencial.');
    if (!props.plate) throw new Error('Placa veicular é obrigatória.');
    if (!props.model) throw new Error('Modelo do veículo é obrigatório.');

    const plate = props.plate instanceof LicensePlate ? props.plate : new LicensePlate(props.plate);

    return new Vehicle(props.id || null, {
      ...props,
      plate
    });
  }

  assignParkingSpot(spot) {
    this._parkingSpot = spot ? spot.trim().toUpperCase() : null;
    this.markModified();
    return this;
  }
}
