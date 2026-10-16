// ============================================================================
// PratiCom ERP - Value Object: PostalCode (CEP - Código de Endereçamento Postal)
// Validação e formatação de CEP brasileiro de 8 dígitos
// ============================================================================

import { ValueObject } from '../common/ValueObject.js';

export class PostalCode extends ValueObject {
  constructor(rawCep) {
    const cleaned = PostalCode.sanitize(rawCep);
    if (!PostalCode.isValid(cleaned)) {
      throw new Error(`CEP inválido: '${rawCep}'. Deve conter exatamente 8 dígitos numéricos.`);
    }
    super({
      value: cleaned,
      formatted: `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`
    });
  }

  get value() { return this.props.value; }
  get formatted() { return this.props.formatted; }

  static sanitize(cep) {
    if (typeof cep !== 'string' && typeof cep !== 'number') return '';
    return String(cep).replace(/\D/g, '');
  }

  static isValid(cep) {
    const clean = PostalCode.sanitize(cep);
    return clean.length === 8;
  }

  toString() {
    return this.formatted;
  }
}
