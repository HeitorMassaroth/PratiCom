// ============================================================================
// PratiCom ERP - Value Object: CPF (Cadastro de Pessoas Físicas)
// Validação matemática estrita de dígitos verificadores (Regra Receita Federal)
// ============================================================================

import { ValueObject } from '../common/ValueObject.js';

export class CPF extends ValueObject {
  constructor(rawCpf) {
    const cleaned = CPF.sanitize(rawCpf);
    if (!CPF.isValid(cleaned)) {
      throw new Error(`CPF inválido: '${rawCpf}'. Dígitos verificadores matematicamente incorretos.`);
    }
    super({ value: cleaned });
  }

  get value() {
    return this.props.value;
  }

  get formatted() {
    return this.props.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  static sanitize(cpf) {
    if (typeof cpf !== 'string' && typeof cpf !== 'number') return '';
    return String(cpf).replace(/\D/g, '');
  }

  static isValid(cpf) {
    const clean = CPF.sanitize(cpf);
    if (clean.length !== 11) return false;
    // Rejeita sequências de dígitos idênticos (11111111111, etc.)
    if (/^(\d)\1{10}$/.test(clean)) return false;

    // Cálculo do 1º Dígito Verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    let rest = 11 - (sum % 11);
    let digit1 = (rest === 10 || rest === 11) ? 0 : rest;
    if (digit1 !== parseInt(clean.charAt(9), 10)) return false;

    // Cálculo do 2º Dígito Verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(clean.charAt(i), 10) * (11 - i);
    }
    rest = 11 - (sum % 11);
    let digit2 = (rest === 10 || rest === 11) ? 0 : rest;
    return digit2 === parseInt(clean.charAt(10), 10);
  }

  toString() {
    return this.formatted;
  }
}
