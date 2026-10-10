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
    return this.db.prepare(sql).all(params);
  }

  createProduct(data) {
    const stmt = this.db.prepare(`
      INSERT INTO market_products (name, category, price, stock_quantity, barcode)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      data.name,
      data.category || 'Alimentos',
      parseFloat(data.price),
      parseInt(data.stock_quantity || 0, 10),
      data.barcode || String(Math.floor(7890000000000 + Math.random() * 9999999999))
    );

    return this.db.prepare('SELECT * FROM market_products WHERE id = ?').get(info.lastInsertRowid);
  }

  updateStock(id, { quantity, action }) {
    const product = this.db.prepare('SELECT * FROM market_products WHERE id = ?').get(parseInt(id, 10));
    if (!product) {
      throw new Error('Produto não encontrado.');
    }

    let newStock = product.stock_quantity;
    const qty = parseInt(quantity, 10);

    if (action === 'add') {
      newStock += qty;
    } else if (action === 'set') {
      newStock = qty;
    } else if (action === 'subtract') {
      newStock = Math.max(0, newStock - qty);
    }

    this.db.prepare('UPDATE market_products SET stock_quantity = ? WHERE id = ?').run(newStock, parseInt(id, 10));
    return this.db.prepare('SELECT * FROM market_products WHERE id = ?').get(parseInt(id, 10));
  }

  checkout({ unit_id, resident_id, total_amount, payment_method, items }) {
    const unitId = parseInt(unit_id, 10);
    const residentId = parseInt(resident_id, 10);
    const amount = parseFloat(total_amount);

    // Processamento do pagamento via Template Method
    if (payment_method === 'CONDO_FEE') {
      this.condoFeeProcessor.processPayment({ amount, unitId, residentId, items });
    } else {
      this.pixProcessor.processPayment({ amount, unitId, residentId, items });
    }

    // Executa em transação ACID do SQLite
    const transaction = this.db.transaction(() => {
      // 1. Deduz estoque de cada item
      if (Array.isArray(items)) {
        for (const item of items) {
          const prod = this.db.prepare('SELECT stock_quantity FROM market_products WHERE id = ?').get(parseInt(item.id, 10));
          if (prod) {
            const updatedStock = Math.max(0, prod.stock_quantity - parseInt(item.quantity, 10));
            this.db.prepare('UPDATE market_products SET stock_quantity = ? WHERE id = ?').run(updatedStock, parseInt(item.id, 10));
          }
        }
      }

      // 2. Insere registro de venda
      const stmt = this.db.prepare(`
        INSERT INTO market_sales (unit_id, resident_id, total_amount, payment_method, items_json)
        VALUES (?, ?, ?, ?, ?)
      `);

      const info = stmt.run(unitId, residentId, amount, payment_method, JSON.stringify(items || []));

      // 3. Se o pagamento for débito em cota condominial, gera transação financeira em débito
      if (payment_method === 'CONDO_FEE') {
        this.db.prepare(`
          INSERT INTO financial_transactions (unit_id, description, amount, type, category, status, due_date)
          VALUES (?, 'Mercadinho Autônomo - Compra PDV', ?, 'INCOME', 'Mercadinho', 'PENDING', DATE('now', '+30 days'))
        `).run(unitId, amount);
      }

      return this.db.prepare('SELECT * FROM market_sales WHERE id = ?').get(info.lastInsertRowid);
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
    return sales.map(s => ({
      ...s,
      items: JSON.parse(s.items_json || '[]')
    }));
  }
}
