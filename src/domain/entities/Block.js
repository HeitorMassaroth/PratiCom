// ============================================================================
// PratiCom ERP - DDD Entity: Block (Bloco / Torre Residencial)
// Estrutura física de agrupamento de unidades dentro de um condomínio
// ============================================================================

import { Entity } from '../common/Entity.js';

export class Block extends Entity {
  constructor(id, props) {
    super(id, props);

    this._condominiumId = props.condominiumId || props.condominium_id;
    this._name = props.name;
    this._description = props.description || null;
    this._status = props.status || 'ACTIVE';
  }

  get condominiumId() { return this._condominiumId; }
  get name() { return this._name; }
  get description() { return this._description; }
  get status() { return this._status; }
  get isActive() { return this._status === 'ACTIVE'; }

  static create(props) {
    if (!props.condominiumId && !props.condominium_id) {
      throw new Error('O bloco deve estar associado a um condomínio.');
    }
    if (!props.name || props.name.trim().length < 2) {
      throw new Error('Nome do bloco deve ter pelo menos 2 caracteres.');
    }

    return new Block(props.id || null, {
      ...props,
      status: props.status || 'ACTIVE'
    });
  }

  activate() {
    this._status = 'ACTIVE';
    this.markModified();
    return this;
  }

  suspend() {
    this._status = 'MAINTENANCE';
    this.markModified();
    return this;
  }
}
