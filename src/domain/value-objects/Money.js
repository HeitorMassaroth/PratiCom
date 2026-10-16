// ============================================================================
// PratiCom ERP - Value Object: Money (Moeda / Valor Monetário)
// Precisão absoluta em centavos inteiros (Zero problemas com arredondamento IEEE-754)
// ============================================================================

import { ValueObject } from '../common/ValueObject.js';

export class Money extends ValueObject {
  constructor(amountInCents) {
    if (!Number.isInteger(amountInCents)) {
      throw new Error(`Money deve ser inicializado com centavos inteiros. Recebido: ${amountInCents}`);
    }
    super({ cents: amountInCents });
  }

  get cents() {
    return this.props.cents;
  }

  get value() {
    return this.props.cents / 100;
  }

  static fromReais(reais) {
    if (typeof reais !== 'number' || isNaN(reais)) {
      throw new Error(`Valor em Reais inválido: ${reais}`);
    }
    return new Money(Math.round(reais * 100));
  }

  static zero() {
    return new Money(0);
  }

  add(otherMoney) {
    return new Money(this.cents + otherMoney.cents);
  }

  subtract(otherMoney) {
    return new Money(this.cents - otherMoney.cents);
  }

  multiply(multiplier) {
    return new Money(Math.round(this.cents * multiplier));
  }

  percentage(pct) {
    return new Money(Math.round(this.cents * (pct / 100)));
  }

  isGreaterThan(other) {
    return this.cents > other.cents;
  }

  isLessThan(other) {
    return this.cents < other.cents;
  }

  isZero() {
    return this.cents === 0;
  }

  isPositive() {
    return this.cents > 0;
  }

  formatBRL() {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.value);
  }

  toString() {
    return this.formatBRL();
  }
}
