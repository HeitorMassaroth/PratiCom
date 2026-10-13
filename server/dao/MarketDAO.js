import DatabaseSingleton from '../config/DatabaseSingleton.js';
import { PixPaymentProcessor, CondoFeePaymentProcessor, CardPaymentProcessor } from '../services/templates/PaymentTemplate.js';

// Ícone exibido quando o produto não tem um próprio cadastrado.
const CATEGORY_ICONS = {
  'Bebidas': '🥤',
  'Snacks & Salgados': '🍿',
  'Doces': '🍫',
  'Congelados': '🧊',
  'Higiene & Limpeza': '🧼',
  'Mercearia': '🛒'
};

export class MarketDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
    // Forma de pagamento recebida da tela → código gravado na venda e processador (Template Method)
    this.paymentMethods = {
      pix: { code: 'PIX', processor: new PixPaymentProcessor() },
      credit_card: { code: 'CARD', processor: new CardPaymentProcessor() },
      condo_bill: { code: 'CONDO_FEE', processor: new CondoFeePaymentProcessor() }
    };
  }

  // Restringe unidades ao condomínio ativo (aliases u = units, b = blocks).
  unitScope(condominiumId) {
    if (!condominiumId) return { sql: '', params: [] };
    const cId = parseInt(condominiumId, 10);
    if (cId === 1) {
      return { sql: ' AND (b.condominium_id = 1 OR u.block_id IS NULL)', params: [] };
    }
    return { sql: ' AND b.condominium_id = ?', params: [cId] };
  }

  // Restringe produtos ao condomínio ativo; o condomínio 1 herda o catálogo legado sem vínculo.
  tenantScope(condominiumId) {
    if (!condominiumId) return { sql: '', params: [] };
    const cId = parseInt(condominiumId, 10);
    if (cId === 1) {
      return { sql: ' AND (condominium_id = 1 OR condominium_id IS NULL)', params: [] };
    }
    return { sql: ' AND condominium_id = ?', params: [cId] };
  }

  // Campos esperados pela tela; produtos antigos sem custo/mínimo/ícone recebem valores padrão.
  toProductView(p) {
    return {
      ...p,
      sale_price: p.price,
      cost_price: p.cost_price ?? parseFloat((p.price * 0.65).toFixed(2)),
      min_stock: p.min_stock ?? 5,
      image_url: p.image_url || CATEGORY_ICONS[p.category] || '📦'
    };
  }

  getProduct(id, condominiumId) {
    const scope = this.tenantScope(condominiumId);
    const prod = this.db.prepare(`SELECT * FROM market_products WHERE id = ?${scope.sql}`)
      .get(parseInt(id, 10), ...scope.params);
    return prod ? this.toProductView(prod) : null;
  }

  getProducts({ condominiumId, category, search } = {}) {
    const scope = this.tenantScope(condominiumId);
    let sql = `SELECT * FROM market_products WHERE 1=1${scope.sql}`;
    const params = [...scope.params];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (LOWER(name) LIKE ? OR barcode LIKE ?)';
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY name ASC';
    const products = this.db.prepare(sql).all(params);
    return products.map(p => this.toProductView(p));
  }

  createProduct(data) {
    const priceVal = parseFloat(data.price ?? data.sale_price);
    if (isNaN(priceVal) || priceVal < 0) {
      throw new Error('Preço de venda inválido.');
    }
    const costVal = parseFloat(data.cost_price);
    const minStockVal = parseInt(data.min_stock, 10);
    const stmt = this.db.prepare(`
      INSERT INTO market_products (condominium_id, name, category, price, cost_price, stock_quantity, min_stock, image_url, barcode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      data.condominium_id ? parseInt(data.condominium_id, 10) : null,
      data.name,
      data.category || 'Alimentos',
      priceVal,
      isNaN(costVal) ? null : costVal,
      parseInt(data.stock_quantity || 0, 10),
      isNaN(minStockVal) ? 5 : minStockVal,
      data.image_url || null,
      data.barcode || String(Math.floor(7890000000000 + Math.random() * 9999999999))
    );

    return this.getProduct(info.lastInsertRowid);
  }

  updateProduct(id, data, condominiumId) {
    const product = this.getProduct(id, condominiumId);
    if (!product) {
      throw new Error('Produto não encontrado.');
    }

    const name = data.name !== undefined ? String(data.name).trim() : product.name;
    if (!name) {
      throw new Error('Nome do produto é obrigatório.');
    }

    const priceInput = data.price ?? data.sale_price;
    const priceVal = priceInput !== undefined && priceInput !== '' ? parseFloat(priceInput) : product.price;
    if (isNaN(priceVal) || priceVal < 0) {
      throw new Error('Preço de venda inválido.');
    }

    const costVal = data.cost_price !== undefined && data.cost_price !== '' ? parseFloat(data.cost_price) : product.cost_price;
    const stockVal = data.stock_quantity !== undefined && data.stock_quantity !== '' ? parseInt(data.stock_quantity, 10) : product.stock_quantity;
    const minStockVal = data.min_stock !== undefined && data.min_stock !== '' ? parseInt(data.min_stock, 10) : product.min_stock;
    if (isNaN(stockVal) || stockVal < 0) {
      throw new Error('Quantidade em estoque inválida.');
    }

    this.db.prepare(`
      UPDATE market_products
      SET name = ?, category = ?, price = ?, cost_price = ?, stock_quantity = ?, min_stock = ?, image_url = ?, barcode = ?
      WHERE id = ?
    `).run(
      name,
      data.category || product.category,
      priceVal,
      isNaN(costVal) ? null : costVal,
      stockVal,
      isNaN(minStockVal) ? 5 : minStockVal,
      data.image_url !== undefined ? data.image_url || null : product.image_url,
      data.barcode !== undefined ? data.barcode || null : product.barcode,
      product.id
    );

    return this.getProduct(product.id);
  }

  // Itens de vendas antigas mantêm nome e preço próprios (FK ON DELETE SET NULL), preservando o histórico.
  deleteProduct(id, condominiumId) {
    const product = this.getProduct(id, condominiumId);
    if (!product) return false;
    const result = this.db.prepare('DELETE FROM market_products WHERE id = ?').run(product.id);
    return result.changes > 0;
  }

  updateStock(id, { delta, quantity, action }, condominiumId) {
    const product = this.getProduct(id, condominiumId);
    if (!product) {
      throw new Error('Produto não encontrado.');
    }

    let newStock = product.stock_quantity;
    if (delta !== undefined && delta !== null) {
      newStock = Math.max(0, newStock + parseInt(delta, 10));
    } else {
      const qty = parseInt(quantity || 0, 10);
      if (action === 'add') {
        newStock += qty;
      } else if (action === 'set') {
        newStock = qty;
      } else if (action === 'subtract') {
        newStock = Math.max(0, newStock - qty);
      }
    }

    this.db.prepare('UPDATE market_products SET stock_quantity = ? WHERE id = ?').run(newStock, product.id);
    return this.getProduct(product.id);
  }

  // O carrinho da tela informa só QUAIS produtos e QUANTOS; preço e total vêm sempre do banco.
  checkout({ unit_id, resident_id, payment_method, items }, condominiumId) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Carrinho de compras vazio.');
    }

    const method = this.paymentMethods[payment_method];
    if (!method) {
      throw new Error('Forma de pagamento inválida.');
    }

    const unitId = parseInt(unit_id, 10);
    const residentId = parseInt(resident_id, 10);
    if (!unitId) {
      throw new Error('Selecione a unidade do comprador.');
    }
    if (!residentId) {
      throw new Error('Selecione o morador comprador.');
    }

    const unitScope = this.unitScope(condominiumId);
    const unit = this.db.prepare(`
      SELECT u.id FROM units u
      LEFT JOIN blocks b ON u.block_id = b.id
      WHERE u.id = ?${unitScope.sql}
    `).get(unitId, ...unitScope.params);
    if (!unit) {
      throw new Error('Unidade não encontrada neste condomínio.');
    }

    const resident = this.db.prepare('SELECT id FROM residents WHERE id = ? AND unit_id = ?').get(residentId, unitId);
    if (!resident) {
      throw new Error('O morador informado não pertence à unidade selecionada.');
    }

    const productScope = this.tenantScope(condominiumId);

    // Transação ACID do SQLite: estoque, venda, itens e lançamento financeiro são gravados juntos ou nada é gravado.
    const transaction = this.db.transaction(() => {
      // 1. Valida cada item contra o banco e baixa o estoque
      const lines = [];
      for (const item of items) {
        const productId = parseInt(item.product_id || item.id, 10);
        const qty = Number(item.quantity);
        if (!productId) {
          throw new Error('Item do carrinho sem produto.');
        }
        if (!Number.isInteger(qty) || qty <= 0) {
          throw new Error('Quantidade inválida no carrinho.');
        }

        const prod = this.db.prepare(`SELECT id, name, price, stock_quantity FROM market_products WHERE id = ?${productScope.sql}`)
          .get(productId, ...productScope.params);
        if (!prod) {
          throw new Error(`Produto ID ${productId} não foi encontrado.`);
        }
        if (prod.stock_quantity < qty) {
          throw new Error(`Estoque insuficiente para o produto '${prod.name}'. Disponível: ${prod.stock_quantity}, solicitado: ${qty}.`);
        }

        this.db.prepare('UPDATE market_products SET stock_quantity = stock_quantity - ? WHERE id = ?').run(qty, prod.id);
        lines.push({ productId: prod.id, name: prod.name, unitPrice: prod.price, quantity: qty });
      }

      const amount = Math.round(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0) * 100) / 100;

      // 2. Processa o pagamento (Template Method) com o total calculado pelo banco; se falhar, a transação é desfeita
      method.processor.processPayment({ amount, unitId, residentId, items: lines });

      // 3. Registra a venda e os itens com o preço do momento da venda
      const saleId = this.db.prepare(`
        INSERT INTO market_sales (unit_id, resident_id, total_amount, payment_method)
        VALUES (?, ?, ?, ?)
      `).run(unitId, residentId, amount, method.code).lastInsertRowid;

      const insertItem = this.db.prepare(`
        INSERT INTO market_sale_items (sale_id, product_id, product_name, unit_price, quantity, line_total)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const l of lines) {
        insertItem.run(saleId, l.productId, l.name, l.unitPrice, l.quantity, Math.round(l.unitPrice * l.quantity * 100) / 100);
      }

      // 4. Débito na cota condominial gera lançamento a receber no financeiro do condomínio
      if (method.code === 'CONDO_FEE') {
        this.db.prepare(`
          INSERT INTO financial_transactions (condominium_id, unit_id, description, amount, type, category, status, due_date)
          VALUES (?, ?, 'Mercadinho Autônomo - Compra PDV', ?, 'INCOME', 'Mercadinho', 'PENDING', DATE('now', '+30 days'))
        `).run(condominiumId ? parseInt(condominiumId, 10) : null, unitId, amount);
      }

      return this.db.prepare('SELECT * FROM market_sales WHERE id = ?').get(saleId);
    });

    return transaction();
  }

  getSales({ condominiumId } = {}) {
    let sql = `
      SELECT s.*, u.block, u.number as unit_number, r.name as resident_name
      FROM market_sales s
      LEFT JOIN units u ON s.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents r ON s.resident_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      if (cId === 1) {
        sql += ' AND (b.condominium_id = 1 OR u.block_id IS NULL)';
      } else {
        sql += ' AND b.condominium_id = ?';
        params.push(cId);
      }
    }

    sql += ' ORDER BY s.created_at DESC';
    const sales = this.db.prepare(sql).all(params);
    const getItems = this.db.prepare(`
      SELECT product_id, product_name AS name, unit_price AS price, quantity, line_total
      FROM market_sale_items
      WHERE sale_id = ?
      ORDER BY id ASC
    `);
    return sales.map(s => ({ ...s, items: getItems.all(s.id) }));
  }
}
