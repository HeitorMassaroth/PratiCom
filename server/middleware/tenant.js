import db from '../config/database.js';

export function tenantMiddleware(req, res, next) {
  const header = req.headers['x-condominium-id'];
  const condoId = header ? parseInt(header, 10) : 1;

  if (isNaN(condoId)) {
    return res.status(400).json({ error: 'Header X-Condominium-Id inválido.' });
  }

  req.condominiumId = condoId;
  next();
}
