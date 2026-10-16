import { BaseController } from './BaseController.js';

export class CondominiumController extends BaseController {
  constructor(service) {
    super(service);
  }

  getBlocks = async (req, res, next) => {
    try {
      const blocks = this.service.getBlocks(req.params.id);
      res.json(blocks);
    } catch (err) {
      next(err);
    }
  };

  createBlock = async (req, res, next) => {
    try {
      const created = this.service.createBlock(req.params.id, req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };
}
