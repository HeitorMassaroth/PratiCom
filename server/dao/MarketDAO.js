import DatabaseSingleton from '../config/DatabaseSingleton.js';
import { PixPaymentProcessor, CondoFeePaymentProcessor } from '../services/templates/PaymentTemplate.js';

export class MarketDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
    this.pixProcessor = new PixPaymentProcessor();
    this.condoFeeProcessor = new CondoFeePaymentProcessor();
  }

  getProducts({ category, search } = {}) {
    let sql = 'SELECT * FROM market_products WHERE 1=1';
    const params = [];

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

    return products.map(p => ({
      ...p,
      sale_price: p.price,
      cost_price: parseFloat((p.price * 0.65).toFixed(2)),
      min_stock: 5,
      image_url: '📦'
    }));
  }

  createProduct(data) {
    const priceVal = parseFloat(data.price || data.sale_price || 0);
    const stmt = this.db.prepare(`
      INSERT INTO market_products (name, category, price, stock_quantity, barcode)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      data.name,
      data.category || 'Alimentos',
      priceVal,
      parseInt(data.stock_quantity || 0, 10),
      data.barcode || String(Math.floor(7890000000000 + Math.random() * 9999999999))
    );

    const prod = this.db.prepare('SELECT * FROM market_products WHERE id = ?').get(info.lastInsertRowid);
    return {
      ...prod,
      sale_price: prod.price,
      cost_price: parseFloat((prod.price * 0.65).toFixed(2)),
      min_stock: 5,
      image_url: '📦'
    };
  }

  updateStock(id, { delta, quantity, action }) {
    const product = this.db.prepare('SELECT * FROM market_products WHERE id = ?').get(parseInt(id, 10));
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

    this.db.prepare('UPDATE market_products SET stock_quantity = ? WHERE id = ?').run(newStock, parseInt(id, 10));
    const prod = this.db.prepare('SELECT * FROM market_products WHERE id = ?').get(parseInt(id, 10));
    return {
      ...prod,
      sale_price: prod.price,
      cost_price: parseFloat((prod.price * 0.65).toFixed(2)),
      min_stock: 5,
      image_url: '📦'
    };
  }

  checkout({ unit_id, resident_id, total_amount, payment_method, items }) {
    const unitId = unit_id ? parseInt(unit_id, 10) : 1;
    const residentId = resident_id ? parseInt(resident_id, 10) : 1;
    const isCondoBill = payment_method === 'CONDO_FEE' || payment_method === 'condo_bill';
    const methodFormatted = isCondoBill ? 'CONDO_FEE' : 'PIX';

    // Calcula total se não enviado ou se inválido
    const calculatedTotal = Array.isArray(items) 
      ? items.reduce((sum, item) => sum + (parseFloat(item.price || item.sale_price || 0) * parseInt(item.quantity || 1, 10)), 0)
      : 0;
    const amount = (total_amount !== undefined && total_amount !== null && !isNaN(parseFloat(total_amount)))
      ? parseFloat(total_amount)
      : calculatedTotal;

    // Processamento do pagamento via Template Method
    if (isCondoBill) {
      this.condoFeeProcessor.processPayment({ amount, unitId, residentId, items });
    } else {
      this.pixProcessor.processPayment({ amount, unitId, residentId, items });
    }

    // Executa em transação ACID do SQLite
    const transaction = this.db.transaction(() => {
      // 1. Validar e deduzir estoque de cada item
      if (Array.isArray(items)) {
        for (const item of items) {
          const productId = parseInt(item.product_id || item.id, 10);
          const qty = parseInt(item.quantity, 10);
          if (!productId || isNaN(productId)) continue;

          const prod = this.db.prepare('SELECT id, name, stock_quantity FROM market_products WHERE id = ?').get(productId);
          if (!prod) {
            throw new Error(`Produto ID ${productId} não foi encontrado.`);
          }
          if (prod.stock_quantity < qty) {
            throw new Error(`Estoque insuficiente para o produto '${prod.name}'. Disponível: ${prod.stock_quantity}, solicitado: ${qty}.`);
          }

          const updatedStock = prod.stock_quantity - qty;
          this.db.prepare('UPDATE market_products SET stock_quantity = ? WHERE id = ?').run(updatedStock, productId);
        }
      }

      // 2. Insere registro de venda
      const stmt = this.db.prepare(`
        INSERT INTO market_sales (unit_id, resident_id, total_amount, payment_method)
        VALUES (?, ?, ?, ?)
      `);

      const info = stmt.run(unitId, residentId, amount, methodFormatted);
      const saleId = info.lastInsertRowid;
      const insertItem = this.db.prepare(`
        INSERT INTO market_sale_items (sale_id, product_id, product_name, unit_price, quantity, line_total)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of items || []) {
        const productId = parseInt(item.product_id || item.id, 10);
        const product = this.db.prepare('SELECT name FROM market_products WHERE id = ?').get(productId);
        const quantity = parseInt(item.quantity || 1, 10);
        const unitPrice = parseFloat(item.price || item.sale_price || 0);
        insertItem.run(
          saleId,
          productId || null,
          item.name || product?.name || 'Produto removido',
          unitPrice,
          quantity,
          unitPrice * quantity
        );
      }

      // 3. Se o pagamento for débito em cota condominial, gera transação financeira em débito
      if (isCondoBill) {
        this.db.prepare(`
          INSERT INTO financial_transactions (unit_id, description, amount, type, category, status, due_date)
          VALUES (?, 'Mercadinho Autônomo - Compra PDV', ?, 'INCOME', 'Mercadinho', 'PENDING', DATE('now', '+30 days'))
        `).run(unitId, amount);
      }

      return this.db.prepare('SELECT * FROM market_sales WHERE id = ?').get(saleId);
    });

    return transaction();
  }

  getSales() {
    const sql = `
      SELECT s.*, u.block, u.number as unit_number, r.name as resident_name
      FROM market_sales s
      LEFT JOIN units u ON s.unit_id = u.id
      LEFT JOIN residents r ON s.resident_id = r.id
      ORDER BY s.created_at DESC
    `;
    const sales = this.db.prepare(sql).all();
    const getItems = this.db.prepare(`
      SELECT product_id, product_name AS name, unit_price AS price, quantity, line_total
      FROM market_sale_items
      WHERE sale_id = ?
      ORDER BY id ASC
    `);
    return sales.map(s => ({ ...s, items: getItems.all(s.id) }));
  }
}
