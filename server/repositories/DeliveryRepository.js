import { BaseRepository } from './BaseRepository.js';
import { Delivery } from '../domain/index.js';

/**
 * Repositório especializado para a entidade Delivery.
 * Reutiliza os métodos CRUD unificados de BaseRepository.
 */
export class DeliveryRepository extends BaseRepository {
  constructor() {
    super('deliveries', { primaryKey: 'id', tenantColumn: 'condominium_id', isTenantDirect: false });
  }

  /**
   * Converte registro de banco para a entidade de domínio Delivery.
   */
  toDomain(row) {
    return Delivery.fromDatabase(row);
  }

  /**
   * Busca entregas com JOIN detalhado de unidade e morador.
   */
  findWithDetails({ condominiumId, status } = {}) {
    let sql = `
      SELECT d.*, u.block, u.number as unit_number, r.name as resident_name, r.phone as resident_phone
      FROM deliveries d
      LEFT JOIN units u ON d.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents r ON d.resident_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (condominiumId) {
      const scope = this.unitTenantScope(condominiumId, { blockAlias: 'b', unitAlias: 'u' });
      sql += scope.sql;
      params.push(...scope.params);
    }

    if (status) {
      sql += ' AND d.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY d.received_at DESC';
    return this.db.prepare(sql).all(...params);
  }
}
