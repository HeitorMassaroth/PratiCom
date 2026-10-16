// ============================================================================
// PratiCom ERP - DDD Aggregate Root: Condominium (Condomínio Edilício)
// Entidade raiz multi-inquilino com CNPJ e governança integrada
// ============================================================================

import { Entity } from '../common/Entity.js';
import { CNPJ } from '../value-objects/CNPJ.js';

export class Condominium extends Entity {
  constructor(id, props) {
    super(id, props);

    this._name = props.name;
    this._cnpj = props.cnpj ? (props.cnpj instanceof CNPJ ? props.cnpj : new CNPJ(props.cnpj)) : null;
    this._address = props.address || null;
    this._city = props.city || null;
    this._state = props.state || null;
    this._postalCode = props.postalCode || null;
    this._phone = props.phone || null;
    this._status = props.status || 'ACTIVE';
  }

  get name() { return this._name; }
  get cnpj() { return this._cnpj; }
  get address() { return this._address; }
  get city() { return this._city; }
  get state() { return this._state; }
  get postalCode() { return this._postalCode; }
  get phone() { return this._phone; }
  get status() { return this._status; }
  get isActive() { return this._status === 'ACTIVE'; }

  static create(props) {
    if (!props.name || props.name.trim().length < 3) {
      throw new Error('Nome do condomínio deve conter no mínimo 3 caracteres.');
    }
    const cnpj = props.cnpj ? new CNPJ(props.cnpj) : null;

    return new Condominium(props.id || null, {
      ...props,
      cnpj,
      status: props.status || 'ACTIVE'
    });
  }

  activate() {
    this._status = 'ACTIVE';
    this.markModified();
    return this;
  }

  suspend() {
    this._status = 'SUSPENDED';
    this.markModified();
    return this;
  }
}
