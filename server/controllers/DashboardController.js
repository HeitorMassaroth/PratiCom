import { DashboardService } from '../services/index.js';

export class DashboardController {
  static getMetrics = async (req, res, next) => {
    try {
      const data = DashboardService.getMetrics(req.condominiumId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };
}
