import { BaseController } from './BaseController.js';

export class ReservationController extends BaseController {
  constructor(service) {
    super(service);
  }

  getAll = async (req, res, next) => {
    try {
      const list = this.service.getAllWithDetails(req.condominiumId, req.query.date, req.query.space_id);
      res.json(list);
    } catch (err) {
      next(err);
    }
  };

  createWithConflictCheck = async (req, res, next) => {
    try {
      const created = this.service.createWithConflictCheck(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  cancel = async (req, res, next) => {
    try {
      const updated = this.service.update(req.params.id, { status: 'CANCELLED' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };
}
