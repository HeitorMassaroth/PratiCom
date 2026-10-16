// ============================================================================
// PratiCom ERP - DDD Entity: MarketSaleItem (Item da Venda no PDV)
// Representa um produto e sua quantidade na cesta de compras
// ============================================================================

import { Entity } from '../common/Entity.js';
import { Money } from '../value-objects/Money.js';

export class MarketSaleItem extends Entity {
  constructor(id, props) {
    super(id, props);

    this._saleId = props.saleId || props.sale_id || null;
    this._productId = props.productId || props.product_id;
    this._quantity = Number(props.quantity || 1);
    this._unitPrice = props.unitPrice instanceof Money 
      ? props.unitPrice 
      : Money.fromReais(Number(props.unitPrice || props.unit_price || 0));
    this._subtotal = this._unitPrice.multiply(this._quantity);
  }

  get saleId() { return this._saleId; }
  get productId() { return this._productId; }
  get quantity() { return this._quantity; }
  get unitPrice() { return this._unitPrice; }
  get subtotal() { return this._subtotal; }
  get subtotalValue() { return this._subtotal.value; }
  get subtotalFormatted() { return this._subtotal.formatBRL(); }

  static create({ productId, quantity, unitPrice }) {
    if (!productId) throw new Error('ID do produto obrigatório no item de venda.');
    const qty = Number(quantity);
    if (qty <= 0) throw new Error('Quantidade do item deve ser maior que zero.');

    return new MarketSaleItem(null, {
      productId,
      quantity: qty,
      unitPrice
    });
  }
}
