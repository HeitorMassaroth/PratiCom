// ============================================================================
// PratiCom ERP - Value Object: Email
// Validação RFC 5322, sanitização e normalização em minúsculas
// ============================================================================

import { ValueObject } from '../common/ValueObject.js';

export class Email extends ValueObject {
  constructor(rawEmail) {
    const cleaned = Email.sanitize(rawEmail);
    if (!Email.isValid(cleaned)) {
      throw new Error(`E-mail inválido: '${rawEmail}'. Formato deve seguir usuario@dominio.ext.`);
    }
    super({ value: cleaned });
  }

  get value() {
    return this.props.value;
  }

  static sanitize(email) {
    if (typeof email !== 'string') return '';
    return email.trim().toLowerCase();
  }

  static isValid(email) {
    const clean = Email.sanitize(email);
    if (!clean || clean.length > 254) return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return emailRegex.test(clean);
  }

  toString() {
    return this.value;
  }
}
