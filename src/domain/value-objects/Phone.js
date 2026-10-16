// ============================================================================
// PratiCom ERP - Value Object: Phone (Telefone Brasileiro Fixo / Celular)
// Validação de DDD e dígitos de 10 ou 11 números com formatação
// ============================================================================

import { ValueObject } from '../common/ValueObject.js';

export class Phone extends ValueObject {
  constructor(rawPhone) {
    const cleaned = Phone.sanitize(rawPhone);
    if (!Phone.isValid(cleaned)) {
      throw new Error(`Telefone inválido: '${rawPhone}'. Deve conter DDD válido e 10 ou 11 dígitos.`);
    }
    super({
      value: cleaned,
      formatted: Phone.format(cleaned),
      isMobile: cleaned.length === 11
    });
  }

  get value() { return this.props.value; }
  get formatted() { return this.props.formatted; }
  get isMobile() { return this.props.isMobile; }

  static sanitize(phone) {
    if (typeof phone !== 'string' && typeof phone !== 'number') return '';
    return String(phone).replace(/\D/g, '');
  }

  static isValid(phone) {
    const clean = Phone.sanitize(phone);
    if (clean.length !== 10 && clean.length !== 11) return false;
    // Validação básica de DDD (11 a 99)
    const ddd = parseInt(clean.substring(0, 2), 10);
    if (ddd < 11 || ddd > 99) return false;

    // Se tiver 11 dígitos, o primeiro dígito após DDD deve ser 9 (celular)
    if (clean.length === 11 && clean.charAt(2) !== '9') return false;

    return true;
  }

  static format(cleaned) {
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  toString() {
    return this.formatted;
  }
}
