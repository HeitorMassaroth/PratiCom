import { BaseController } from './BaseController.js';

export class FinancialController extends BaseController {
  constructor(service) {
    super(service);
  }

  getSummary = async (req, res, next) => {
    try {
      const summary = this.service.getSummary(req.condominiumId);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  };

  getAllTransactions = async (req, res, next) => {
    try {
      const filters = { condominium_id: req.condominiumId };
      if (req.query.status) filters.status = req.query.status;
      if (req.query.type) filters.type = req.query.type;
      const txs = this.service.getAll(filters);
      res.json(txs);
    } catch (err) {
      next(err);
    }
  };

  pay = async (req, res, next) => {
    try {
      const paid = this.service.pay(req.params.id);
      res.json(paid);
    } catch (err) {
      next(err);
    }
  };
}
