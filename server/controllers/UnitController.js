import { BaseController } from './BaseController.js';

export class UnitController extends BaseController {
  constructor(service) {
    super(service);
  }

  getAll = async (req, res, next) => {
    try {
      const units = this.service.getAllForCondo(req.condominiumId);
      res.json(units);
    } catch (err) {
      next(err);
    }
  };
}
