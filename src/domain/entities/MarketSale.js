// ============================================================================
// PratiCom ERP - DDD Aggregate Root: MarketSale (Venda no Mercadinho Autônomo)
// Agrega itens, valida totais em centavos exatos e registra método de pagamento
// ============================================================================

import { Entity } from '../common/Entity.js';
import { Money } from '../value-objects/Money.js';
import { MarketSaleItem } from './MarketSaleItem.js';

export class MarketSale extends Entity {
  constructor(id, props) {
    super(id, props);

    this._condominiumId = props.condominiumId || props.condominium_id;
    this._unitId = props.unitId || props.unit_id || null;
    this._residentId = props.residentId || props.resident_id || null;
    this._paymentMethod = props.paymentMethod || props.payment_method || 'PIX';
    this._items = Array.isArray(props.items) ? [...props.items] : [];
    this._totalAmount = this._calculateTotal(props.totalAmount || props.total_amount);
  }

  get condominiumId() { return this._condominiumId; }
  get unitId() { return this._unitId; }
  get residentId() { return this._residentId; }
  get paymentMethod() { return this._paymentMethod; }
  get items() { return [...this._items]; }
  get totalAmount() { return this._totalAmount; }
  get totalValue() { return this._totalAmount.value; }
  get totalFormatted() { return this._totalAmount.formatBRL(); }

  _calculateTotal(fallbackTotal) {
    if (this._items.length > 0) {
      let sumCents = 0;
      for (const item of this._items) {
        sumCents += item.subtotal.cents;
      }
      return new Money(sumCents);
    }
    return fallbackTotal instanceof Money 
      ? fallbackTotal 
      : Money.fromReais(Number(fallbackTotal || 0));
  }

  static create(props) {
    if (!props.condominiumId && !props.condominium_id) {
      throw new Error('A venda deve pertencer a um condomínio.');
    }

    return new MarketSale(props.id || null, {
      ...props
    });
  }

  addItem(product, quantity = 1) {
    const item = MarketSaleItem.create({
      productId: product.id,
      quantity,
      unitPrice: product.price
    });
    this._items.push(item);
    this._totalAmount = this._calculateTotal();
    this.markModified();
    return this;
  }
}
