import { BaseRepository } from './BaseRepository.js';

/**
 * Repositório especializado para a entidade Resident e Vehicle.
 * Reutiliza os métodos CRUD unificados de BaseRepository.
 */
export class ResidentRepository extends BaseRepository {
  constructor() {
    super('residents', { primaryKey: 'id', tenantColumn: 'condominium_id', isTenantDirect: false });
  }

  /**
   * Busca residentes com filtros multi-tenant resolvidos via unidade/bloco.
   */
  findWithUnitDetails({ condominiumId, unit_id, search } = {}) {
    let sql = `
      SELECT r.*, u.block, u.number as unit_number 
      FROM residents r
      LEFT JOIN units u ON r.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (condominiumId) {
      const scope = this.unitTenantScope(condominiumId, { blockAlias: 'b', unitAlias: 'u' });
      sql += scope.sql;
      params.push(...scope.params);
    }

    if (unit_id) {
      sql += ' AND r.unit_id = ?';
      params.push(parseInt(unit_id, 10));
    }

    if (search) {
      sql += ' AND (LOWER(r.name) LIKE ? OR LOWER(r.email) LIKE ? OR r.phone LIKE ? OR r.cpf LIKE ?)';
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY r.name ASC';
    return this.db.prepare(sql).all(...params);
  }
}
