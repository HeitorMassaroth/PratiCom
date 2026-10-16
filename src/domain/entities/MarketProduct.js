// ============================================================================
// PratiCom ERP - DDD Entity: MarketProduct (Produto do Mercadinho Autônomo)
// Controle de estoque, preços com Money VO e leitor de código de barras Barcode VO
// ============================================================================

import { Entity } from '../common/Entity.js';
import { Money } from '../value-objects/Money.js';
import { Barcode } from '../value-objects/Barcode.js';

export class MarketProduct extends Entity {
  constructor(id, props) {
    super(id, props);

    this._condominiumId = props.condominiumId || props.condominium_id;
    this._name = props.name;
    this._category = props.category || 'Geral';
    this._price = props.price instanceof Money ? props.price : Money.fromReais(Number(props.price || 0));
    this._stockQuantity = Number(props.stockQuantity ?? props.stock_quantity ?? 0);
    this._minStock = Number(props.minStock ?? props.min_stock ?? 5);
    this._barcode = props.barcode ? (props.barcode instanceof Barcode ? props.barcode : new Barcode(props.barcode)) : null;
  }

  get condominiumId() { return this._condominiumId; }
  get name() { return this._name; }
  get category() { return this._category; }
  get price() { return this._price; }
  get priceValue() { return this._price.value; }
  get priceFormatted() { return this._price.formatBRL(); }
  get stockQuantity() { return this._stockQuantity; }
  get minStock() { return this._minStock; }
  get barcode() { return this._barcode; }
  get barcodeValue() { return this._barcode ? this._barcode.value : null; }

  static create(props) {
    if (!props.condominiumId && !props.condominium_id) {
      throw new Error('Produto deve estar vinculado a um condomínio.');
    }
    if (!props.name || props.name.trim().length < 2) {
      throw new Error('Nome do produto deve ter no mínimo 2 caracteres.');
    }

    const price = props.price instanceof Money ? props.price : Money.fromReais(Number(props.price || 0));
    if (!price.isPositive()) {
      throw new Error('Preço do produto deve ser maior que zero.');
    }

    const barcode = props.barcode ? (props.barcode instanceof Barcode ? props.barcode : new Barcode(props.barcode)) : null;

    return new MarketProduct(props.id || null, {
      ...props,
      price,
      barcode,
      stockQuantity: Number(props.stockQuantity ?? props.stock_quantity ?? 0),
      minStock: Number(props.minStock ?? props.min_stock ?? 5)
    });
  }

  deductStock(quantity) {
    const qty = Number(quantity);
    if (qty <= 0) throw new Error('Quantidade a abater deve ser positiva.');
    if (this._stockQuantity < qty) {
      throw new Error(`Estoque insuficiente para o produto '${this._name}'. Disponível: ${this._stockQuantity}, Requisitado: ${qty}`);
    }

    this._stockQuantity -= qty;
    this.markModified();
    return this;
  }

  restock(quantity) {
    const qty = Number(quantity);
    if (qty <= 0) throw new Error('Quantidade de reposição deve ser positiva.');
    this._stockQuantity += qty;
    this.markModified();
    return this;
  }

  isLowStock() {
    return this._stockQuantity <= this._minStock;
  }
}
