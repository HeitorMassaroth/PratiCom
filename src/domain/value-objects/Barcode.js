// ============================================================================
// PratiCom ERP - Value Object: Barcode (Código de Barras EAN-13 / UPC)
// Validação do dígito verificador para produtos do Mercadinho Autônomo
// ============================================================================

import { ValueObject } from '../common/ValueObject.js';

export class Barcode extends ValueObject {
  constructor(rawCode) {
    const cleaned = Barcode.sanitize(rawCode);
    if (!Barcode.isValid(cleaned)) {
      throw new Error(`Código de barras inválido: '${rawCode}'. Deve ser numérico entre 8 e 14 dígitos.`);
    }
    super({ value: cleaned });
  }

  get value() { return this.props.value; }

  static sanitize(code) {
    if (typeof code !== 'string' && typeof code !== 'number') return '';
    return String(code).trim().replace(/\s+/g, '');
  }

  static isValid(code) {
    const clean = Barcode.sanitize(code);
    if (!/^\d{8,14}$/.test(clean)) return false;

    // Se for EAN-13, valida o dígito verificador
    if (clean.length === 13) {
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        const factor = (i % 2 === 0) ? 1 : 3;
        sum += parseInt(clean.charAt(i), 10) * factor;
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      return checkDigit === parseInt(clean.charAt(12), 10);
    }

    return true;
  }

  toString() {
    return this.value;
  }
}
