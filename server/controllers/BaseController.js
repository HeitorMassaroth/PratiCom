export class BaseController {
  constructor(service) {
    this.service = service;
  }

  getAll = async (req, res, next) => {
    try {
      const filters = { ...req.query };
      if (req.condominiumId && this.service.repo?.hasDirectTenant && !filters.condominium_id) {
        filters.condominium_id = req.condominiumId;
      }
      const data = this.service.getAll(filters);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req, res, next) => {
    try {
      const item = this.service.getById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Registro não encontrado.' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const created = this.service.create(req.body, { condominiumId: req.condominiumId });
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const updated = this.service.update(req.params.id, req.body, { condominiumId: req.condominiumId });
      if (!updated) return res.status(404).json({ error: 'Registro não encontrado.' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const deleted = this.service.delete(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Registro não encontrado.' });
      res.json({ message: 'Registro removido com sucesso.' });
    } catch (err) {
      next(err);
    }
  };
}
