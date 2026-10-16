// ============================================================================
// PratiCom ERP - DDD Aggregate Root: Unit (Unidade / Apartamento)
// Encapsula o agregado da moradia com moradores, veículos e pets vinculados
// ============================================================================

import { Entity } from '../common/Entity.js';

export class Unit extends Entity {
  constructor(id, props) {
    super(id, props);

    this._blockId = props.blockId || props.block_id;
    this._number = String(props.number || '').trim();
    this._floor = props.floor !== undefined ? Number(props.floor) : null;
    this._type = props.type || 'Residencial';
    this._residents = Array.isArray(props.residents) ? [...props.residents] : [];
    this._vehicles = Array.isArray(props.vehicles) ? [...props.vehicles] : [];
    this._pets = Array.isArray(props.pets) ? [...props.pets] : [];
  }

  get blockId() { return this._blockId; }
  get number() { return this._number; }
  get floor() { return this._floor; }
  get type() { return this._type; }
  get residents() { return [...this._residents]; }
  get vehicles() { return [...this._vehicles]; }
  get pets() { return [...this._pets]; }

  static create(props) {
    if (!props.blockId && !props.block_id) {
      throw new Error('A unidade deve estar vinculada a um bloco ou torre.');
    }
    if (!props.number || String(props.number).trim().length === 0) {
      throw new Error('O número da unidade/apartamento é obrigatório.');
    }

    return new Unit(props.id || null, {
      ...props
    });
  }

  addResident(resident) {
    this._residents.push(resident);
    this.markModified();
    return this;
  }

  addVehicle(vehicle) {
    this._vehicles.push(vehicle);
    this.markModified();
    return this;
  }

  addPet(pet) {
    this._pets.push(pet);
    this.markModified();
    return this;
  }

  getPrimaryResident() {
    return this._residents.find(r => r.role === 'Proprietário') || this._residents[0] || null;
  }

  isOccupied() {
    return this._residents.length > 0;
  }
}
