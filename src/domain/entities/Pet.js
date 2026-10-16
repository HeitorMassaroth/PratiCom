// ============================================================================
// PratiCom ERP - DDD Entity: Pet (Animal de Estimação)
// Controle sanitário, vacinação antirrábica e regras de convivência
// ============================================================================

import { Entity } from '../common/Entity.js';

export class Pet extends Entity {
  constructor(id, props) {
    super(id, props);

    this._condominiumId = props.condominiumId;
    this._unitId = props.unitId;
    this._name = props.name;
    this._species = props.species || 'Cão';
    this._breed = props.breed || 'Indefinida';
    this._size = props.size || 'Médio';
    this._vaccineStatus = props.vaccineStatus || 'VACCINATED';
    this._vaccineDate = props.vaccineDate || null;
    this._notes = props.notes || null;
  }

  get condominiumId() { return this._condominiumId; }
  get unitId() { return this._unitId; }
  get name() { return this._name; }
  get species() { return this._species; }
  get breed() { return this._breed; }
  get size() { return this._size; }
  get vaccineStatus() { return this._vaccineStatus; }
  get vaccineDate() { return this._vaccineDate; }
  get notes() { return this._notes; }

  static create(props) {
    if (!props.unitId) throw new Error('Pet deve estar vinculado a uma unidade residencial.');
    if (!props.name || props.name.trim().length < 2) throw new Error('Nome do pet deve ter no mínimo 2 caracteres.');

    return new Pet(props.id || null, {
      ...props
    });
  }

  recordVaccination(date) {
    this._vaccineStatus = 'VACCINATED';
    this._vaccineDate = date || new Date().toISOString().split('T')[0];
    this.markModified();
    return this;
  }

  isCompliant() {
    return this._vaccineStatus === 'VACCINATED';
  }
}
