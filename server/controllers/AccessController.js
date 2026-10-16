import { BaseController } from './BaseController.js';

export class AccessController extends BaseController {
  constructor(service) {
    super(service);
  }

  getAll = async (req, res, next) => {
    try {
      const logs = this.service.getAllWithUnits(req.condominiumId, req.query.status, req.query.search);
      res.json(logs);
    } catch (err) {
      next(err);
    }
  };

  registerEntry = async (req, res, next) => {
    try {
      const created = this.service.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  registerExit = async (req, res, next) => {
    try {
      const updated = this.service.registerExit(req.params.id);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };
}
