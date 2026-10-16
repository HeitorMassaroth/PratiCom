import { BaseController } from './BaseController.js';

export class VehicleController extends BaseController {
  constructor(service) {
    super(service);
  }

  getAll = async (req, res, next) => {
    try {
      const vehicles = this.service.getAllForCondo(req.condominiumId);
      res.json(vehicles);
    } catch (err) {
      next(err);
    }
  };
}
