// ============================================================================
// PratiCom ERP - Value Object: CNPJ (Cadastro Nacional da Pessoa Jurídica)
// Validação matemática de condomínios edilícios e fornecedores
// ============================================================================

import { ValueObject } from '../common/ValueObject.js';

export class CNPJ extends ValueObject {
  constructor(rawCnpj) {
    const cleaned = CNPJ.sanitize(rawCnpj);
    if (!CNPJ.isValid(cleaned)) {
      throw new Error(`CNPJ inválido: '${rawCnpj}'. Falha nos dígitos verificadores.`);
    }
    super({ value: cleaned });
  }

  get value() {
    return this.props.value;
  }

  get formatted() {
    return this.props.value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  static sanitize(cnpj) {
    if (typeof cnpj !== 'string' && typeof cnpj !== 'number') return '';
    return String(cnpj).replace(/\D/g, '');
  }

  static isValid(cnpj) {
    const clean = CNPJ.sanitize(cnpj);
    if (clean.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(clean)) return false;

    // 1º Dígito
    let length = clean.length - 2;
    let numbers = clean.substring(0, length);
    const digits = clean.substring(length);
    let sum = 0;
    let pos = length - 7;
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0), 10)) return false;

    // 2º Dígito
    length = length + 1;
    numbers = clean.substring(0, length);
    sum = 0;
    pos = length - 7;
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i), 10) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1), 10);
  }

  toString() {
    return this.formatted;
  }
}
