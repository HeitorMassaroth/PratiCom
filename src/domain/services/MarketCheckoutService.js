// ============================================================================
// PratiCom ERP - Domain Service: MarketCheckoutService
// Processa compras no PDV autônomo, valida estoque e emite a venda
// ============================================================================

import { MarketSale } from '../entities/MarketSale.js';
import { MarketSaleItem } from '../entities/MarketSaleItem.js';
import { Money } from '../value-objects/Money.js';

export class MarketCheckoutService {
  /**
   * Processa o checkout de uma cesta de compras no Honest Market
   * @param {Object} params - { condominiumId, unitId, residentId, paymentMethod, cartItems: [{ product, quantity }] }
   */
  static processCheckout({ condominiumId, unitId, residentId, paymentMethod = 'PIX', cartItems = [] }) {
    if (!cartItems || cartItems.length === 0) {
      throw new Error('A cesta de compras está vazia.');
    }

    // 1. Valida estoque e disponibilidade de cada produto
    for (const item of cartItems) {
      const product = item.product;
      const quantity = item.quantity || 1;
      if (product.stockQuantity < quantity) {
        throw new Error(`Estoque insuficiente para '${product.name}'. Disponível: ${product.stockQuantity}, Requisitado: ${quantity}`);
      }
    }

    // 2. Abate estoque de cada produto
    const saleItems = [];
    let totalCents = 0;

    for (const item of cartItems) {
      const product = item.product;
      const quantity = item.quantity || 1;

      product.deductStock(quantity);

      const saleItem = MarketSaleItem.create({
        productId: product.id,
        quantity,
        unitPrice: product.price
      });

      saleItems.push(saleItem);
      totalCents += saleItem.subtotal.cents;
    }

    // 3. Monta o Agregado de Venda
    const sale = MarketSale.create({
      condominiumId,
      unitId,
      residentId,
      paymentMethod,
      items: saleItems,
      totalAmount: new Money(totalCents)
    });

    return {
      sale,
      totalAmount: sale.totalAmount.formatBRL(),
      totalCents,
      itemsCount: saleItems.length
    };
  }
}
