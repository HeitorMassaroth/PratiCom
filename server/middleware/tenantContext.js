import DatabaseSingleton from '../config/DatabaseSingleton.js';

/**
 * Middleware para Identificação e Isolamento de Contexto Multi-Tenant (Alternativa C).
 * Intercepta requisições HTTP e garante o isolamento lógico via `condominium_id`.
 */
export function tenantContextMiddleware(req, res, next) {
  const db = DatabaseSingleton.getDb();
  
  // 1. Extrai o ID do Condomínio do Header 'x-condominium-id' ou do parâmetro da query
  let condoIdHeader = req.headers?.['x-condominium-id'] || req.query?.condominium_id;

  let condominiumId = parseInt(condoIdHeader, 10);

  // 2. Se não foi fornecido, assume o condomínio padrão (1) para compatibilidade retroativa
  if (isNaN(condominiumId) || condominiumId <= 0) {
    const defaultCondo = db.prepare("SELECT id FROM condominiums WHERE status = 'ACTIVE' ORDER BY id ASC LIMIT 1").get();
    condominiumId = defaultCondo ? defaultCondo.id : 1;
  }

  // 3. Valida a existência do condomínio no banco compartilhado
  const condo = db.prepare('SELECT id, name, status FROM condominiums WHERE id = ?').get(condominiumId);

  if (!condo) {
    return res.status(404).json({
      error: `Condomínio com ID ${condominiumId} não foi encontrado.`
    });
  }

  if (condo.status !== 'ACTIVE') {
    return res.status(403).json({
      error: `O condomínio '${condo.name}' está inativo.`
    });
  }

  // 4. Injeta o ID e nome do condomínio validado no objeto da requisição
  req.condominiumId = condo.id;
  req.condominiumName = condo.name;

  next();
}
