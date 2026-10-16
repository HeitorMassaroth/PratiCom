// ============================================================================
// PratiCom ERP - DDD Entity: CondominiumModule (Módulo Funcional Contratado)
// Feature flags modulares por condomínio (Deliveries, Market, Financial, etc.)
// ============================================================================

import { Entity } from '../common/Entity.js';

export class CondominiumModule extends Entity {
  constructor(id, props) {
    super(id, props);

    this._condominiumId = props.condominiumId || props.condominium_id;
    this._moduleKey = props.moduleKey || props.module_key;
    this._isEnabled = Boolean(props.isEnabled ?? props.is_enabled ?? true);
  }

  get condominiumId() { return this._condominiumId; }
  get moduleKey() { return this._moduleKey; }
  get isEnabled() { return this._isEnabled; }

  static create(props) {
    if (!props.condominiumId && !props.condominium_id) {
      throw new Error('Módulo deve estar associado a um condomínio.');
    }
    if (!props.moduleKey && !props.module_key) {
      throw new Error('Chave do módulo é obrigatória.');
    }

    return new CondominiumModule(props.id || null, {
      ...props
    });
  }

  enable() {
    this._isEnabled = true;
    this.markModified();
    return this;
  }

  disable() {
    this._isEnabled = false;
    this.markModified();
    return this;
  }

  toggle() {
    this._isEnabled = !this._isEnabled;
    this.markModified();
    return this;
  }
}
