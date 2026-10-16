// ============================================================================
// PratiCom ERP - Value Object: PickupPIN (Código de Retirada de Encomenda)
// PIN numérico de 4 dígitos para liberação segura na portaria
// ============================================================================

import { ValueObject } from '../common/ValueObject.js';

export class PickupPIN extends ValueObject {
  constructor(rawPin) {
    const pinStr = String(rawPin || '').trim();
    if (!PickupPIN.isValid(pinStr)) {
      throw new Error(`Código PIN de retirada inválido: '${rawPin}'. Deve ser composto por 4 dígitos numéricos.`);
    }
    super({ pin: pinStr });
  }

  get value() {
    return this.props.pin;
  }

  static isValid(pin) {
    return /^\d{4}$/.test(String(pin || '').trim());
  }

  static generate() {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return new PickupPIN(randomNum.toString());
  }

  matches(candidate) {
    if (!candidate) return false;
    return this.props.pin === String(candidate).trim();
  }

  toString() {
    return this.value;
  }
}
