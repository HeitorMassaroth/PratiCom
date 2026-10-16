import { BaseController } from './BaseController.js';

export class DeliveryController extends BaseController {
  constructor(service) {
    super(service);
  }

  getAll = async (req, res, next) => {
    try {
      const deliveries = this.service.getAllWithUnits(req.condominiumId, req.query.status);
      res.json(deliveries);
    } catch (err) {
      next(err);
    }
  };

  pickup = async (req, res, next) => {
    try {
      const { pickup_code, picked_up_by } = req.body;
      const updated = this.service.pickup(req.params.id, pickup_code, picked_up_by);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  cancel = async (req, res, next) => {
    try {
      const { reason } = req.body;
      const updated = this.service.cancel(req.params.id, reason);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };
}
