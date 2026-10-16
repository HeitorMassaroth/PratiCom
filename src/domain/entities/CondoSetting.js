// ============================================================================
// PratiCom ERP - DDD Entity: CondoSetting (Parâmetro Operacional de Governança)
// Regras customizadas por condomínio (tolerâncias, horário de silêncio, etc.)
// ============================================================================

import { Entity } from '../common/Entity.js';

export class CondoSetting extends Entity {
  constructor(id, props) {
    super(id, props);

    this._condominiumId = props.condominiumId || props.condominium_id;
    this._settingKey = props.settingKey || props.setting_key;
    this._settingValue = String(props.settingValue ?? props.setting_value ?? '');
    this._settingType = props.settingType || props.setting_type || 'string';
    this._description = props.description || null;
  }

  get condominiumId() { return this._condominiumId; }
  get settingKey() { return this._settingKey; }
  get settingValue() { return this._settingValue; }
  get settingType() { return this._settingType; }
  get description() { return this._description; }

  static create(props) {
    if (!props.condominiumId && !props.condominium_id) {
      throw new Error('Configuração deve pertencer a um condomínio.');
    }
    if (!props.settingKey && !props.setting_key) {
      throw new Error('Chave da configuração é obrigatória.');
    }

    return new CondoSetting(props.id || null, {
      ...props
    });
  }

  getTypedValue() {
    switch (this._settingType) {
      case 'boolean':
        return this._settingValue === 'true' || this._settingValue === '1';
      case 'number':
        return Number(this._settingValue);
      case 'json':
        try {
          return JSON.parse(this._settingValue);
        } catch {
          return null;
        }
      default:
        return this._settingValue;
    }
  }

  updateValue(newValue) {
    if (this._settingType === 'json' && typeof newValue === 'object') {
      this._settingValue = JSON.stringify(newValue);
    } else {
      this._settingValue = String(newValue);
    }
    this.markModified();
    return this;
  }
}
