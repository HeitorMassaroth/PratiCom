import { DAOFactory } from '../dao/DAOFactory.js';

/**
 * Middleware para Validação de Disponibilidade de Módulos por Condomínio.
 * Bloqueia requisições a rotas de módulos não contratados/ativados para o condomínio atual.
 */
export const checkModuleAvailability = (moduleKey) => (req, res, next) => {
  const condominiumId = req.condominiumId;
  const condoDAO = DAOFactory.getDAO('condominium');

  if (!condoDAO.isModuleEnabled(condominiumId, moduleKey)) {
    return res.status(403).json({
      error: `Acesso negado: o módulo '${moduleKey}' está desativado para este condomínio.`,
      module: moduleKey,
      disabled: true
    });
  }

  next();
};
