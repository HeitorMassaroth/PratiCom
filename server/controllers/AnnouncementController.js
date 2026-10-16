import { BaseController } from './BaseController.js';

export class AnnouncementController extends BaseController {
  constructor(service) {
    super(service);
  }

  getAll = async (req, res, next) => {
    try {
      const list = this.service.getRecentAndPinned(req.condominiumId);
      res.json(list);
    } catch (err) {
      next(err);
    }
  };
}
