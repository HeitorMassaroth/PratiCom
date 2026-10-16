import { BaseController } from './BaseController.js';

export class ResidentController extends BaseController {
  constructor(service) {
    super(service);
  }

  getAll = async (req, res, next) => {
    try {
      const residents = this.service.search(req.condominiumId, {
        unit_id: req.query.unit_id,
        search: req.query.search
      });
      res.json(residents);
    } catch (err) {
      next(err);
    }
  };
}
