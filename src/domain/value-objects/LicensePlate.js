// ============================================================================
// PratiCom ERP - Value Object: LicensePlate (Placa Veicular)
// Suporte ao padrão Mercosul (BRA2E19) e tradicional brasileiro (ABC-1234)
// ============================================================================

import { ValueObject } from '../common/ValueObject.js';

export class LicensePlate extends ValueObject {
  constructor(rawPlate) {
    const cleaned = LicensePlate.sanitize(rawPlate);
    if (!LicensePlate.isValid(cleaned)) {
      throw new Error(`Placa veicular inválida: '${rawPlate}'. Deve seguir o padrão Mercosul (ex: BRA2E19) ou cinza (ex: ABC1234).`);
    }

    const isMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(cleaned);

    super({
      value: cleaned,
      isMercosul,
      formatted: isMercosul ? cleaned : `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    });
  }

  get value() {
    return this.props.value;
  }

  get formatted() {
    return this.props.formatted;
  }

  get isMercosul() {
    return this.props.isMercosul;
  }

  static sanitize(plate) {
    if (typeof plate !== 'string') return '';
    return plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  static isValid(plate) {
    const clean = LicensePlate.sanitize(plate);
    if (clean.length !== 7) return false;
    // Padrão tradicional: 3 letras seguidas de 4 números (ABC1234)
    const isTraditional = /^[A-Z]{3}[0-9]{4}$/.test(clean);
    // Padrão Mercosul: 3 letras, 1 número, 1 letra, 2 números (BRA2E19)
    const isMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(clean);

    return isTraditional || isMercosul;
  }

  toString() {
    return this.formatted;
  }
}
