import { BaseController } from './BaseController.js';
import db from '../config/database.js';

export class MarketController extends BaseController {
  constructor(service) {
    super(service);
  }

  getProducts = async (req, res, next) => {
    try {
      const products = this.service.getAll({ condominium_id: req.condominiumId });
      res.json(products);
    } catch (err) {
      next(err);
    }
  };

  createProduct = async (req, res, next) => {
    try {
      const created = this.service.create(req.body, { condominiumId: req.condominiumId });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  updateStock = async (req, res, next) => {
    try {
      const { delta, quantity } = req.body;
      const prod = this.service.getById(req.params.id);
      if (!prod) return res.status(404).json({ error: 'Produto não encontrado.' });

      let newStock = prod.stock_quantity;
      if (quantity !== undefined) newStock = Number(quantity);
      else if (delta !== undefined) newStock += Number(delta);

      const updated = this.service.update(req.params.id, { stock_quantity: Math.max(0, newStock) });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  checkout = async (req, res, next) => {
    try {
      const result = this.service.checkout(req.condominiumId, req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  getSales = async (req, res, next) => {
    try {
      const sales = db.prepare(`
        SELECT s.*, u.number as unit_number, r.name as resident_name
        FROM market_sales s
        LEFT JOIN units u ON s.unit_id = u.id
        LEFT JOIN residents r ON s.resident_id = r.id
        WHERE s.condominium_id = ?
        ORDER BY s.id DESC
      `).all(req.condominiumId);
      res.json(sales);
    } catch (err) {
      next(err);
    }
  };
}
