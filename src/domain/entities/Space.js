// ============================================================================
// PratiCom ERP - DDD Entity: Space (Área Comum do Condomínio)
// Salões de festas, churrasqueiras, quadras e espaços compartilhados
// ============================================================================

import { Entity } from '../common/Entity.js';

export class Space extends Entity {
  constructor(id, props) {
    super(id, props);

    this._condominiumId = props.condominiumId || props.condominium_id;
    this._name = props.name;
    this._capacity = Number(props.capacity || 0);
    this._description = props.description || null;
    this._rules = props.rules || null;
  }

  get condominiumId() { return this._condominiumId; }
  get name() { return this._name; }
  get capacity() { return this._capacity; }
  get description() { return this._description; }
  get rules() { return this._rules; }

  static create(props) {
    if (!props.condominiumId && !props.condominium_id) {
      throw new Error('A área comum deve pertencer a um condomínio.');
    }
    if (!props.name || props.name.trim().length < 3) {
      throw new Error('Nome do espaço deve ter no mínimo 3 caracteres.');
    }
    if (!props.capacity || Number(props.capacity) <= 0) {
      throw new Error('Capacidade do espaço deve ser maior que zero.');
    }

    return new Space(props.id || null, {
      ...props,
      capacity: Number(props.capacity)
    });
  }

  canAccommodate(guestCount) {
    return Number(guestCount) <= this._capacity;
  }
}
