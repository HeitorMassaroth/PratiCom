// ============================================================================
// PratiCom ERP - Infrastructure Adapter: SqliteMarketRepository
// Persistência de produtos, controle de estoque e vendas no PDV autônomo
// ============================================================================

import { MarketProduct } from '../../domain/entities/MarketProduct.js';
import { MarketSale } from '../../domain/entities/MarketSale.js';
import { MarketSaleItem } from '../../domain/entities/MarketSaleItem.js';
import { Money } from '../../domain/value-objects/Money.js';

export class SqliteMarketRepository {
  constructor(databaseEngine) {
    this.engine = databaseEngine;
    this.productsTable = databaseEngine.getTable('market_products');
    this.salesTable = databaseEngine.getTable('market_sales');
    this.itemsTable = databaseEngine.getTable('market_sale_items');
  }

  _toProductDomain(row) {
    if (!row) return null;
    return new MarketProduct(row.id, {
      condominiumId: row.condominium_id,
      name: row.name,
      category: row.category,
      price: Money.fromReais(Number(row.price || 0)),
      stockQuantity: row.stock_quantity,
      minStock: row.min_stock,
      barcode: row.barcode,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  findProductById(id) {
    return this._toProductDomain(this.productsTable.findById(id));
  }

  findProductByBarcode(barcode) {
    const row = this.productsTable.findOne({ barcode: String(barcode).trim() });
    return this._toProductDomain(row);
  }

  findAllProducts(condominiumId) {
    const rows = this.productsTable.findAll({ condominium_id: condominiumId }, { orderBy: 'name ASC' });
    return rows.map(r => this._toProductDomain(r));
  }

  saveProduct(product) {
    const data = {
      condominium_id: product.condominiumId,
      name: product.name,
      category: product.category,
      price: product.priceValue,
      stock_quantity: product.stockQuantity,
      min_stock: product.minStock,
      barcode: product.barcodeValue
    };

    let savedRow;
    if (product.id) {
      savedRow = this.productsTable.update(product.id, data);
    } else {
      savedRow = this.productsTable.insert(data);
    }

    return this._toProductDomain(savedRow);
  }

  recordSale(sale) {
    return this.engine.transaction(() => {
      const saleRow = this.salesTable.insert({
        condominium_id: sale.condominiumId,
        unit_id: sale.unitId,
        resident_id: sale.residentId,
        total_amount: sale.totalValue,
        payment_method: sale.paymentMethod
      });

      for (const item of sale.items) {
        this.itemsTable.insert({
          sale_id: saleRow.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice.value,
          subtotal: item.subtotalValue
        });

        // Abate estoque na tabela física de produtos
        const pRow = this.productsTable.findById(item.productId);
        if (pRow) {
          this.productsTable.update(item.productId, {
            stock_quantity: Math.max(0, pRow.stock_quantity - item.quantity)
          });
        }
      }

      return saleRow;
    });
  }
}
