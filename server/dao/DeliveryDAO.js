import { AbstractTenantDAO } from './AbstractTenantDAO.js';
import { CreateDeliveryOperation } from '../services/templates/EntityOperationTemplate.js';
import { NotificationDispatcherFactory } from '../services/factories/NotificationDispatcherFactory.js';

/**
 * Padrão de Projeto: DAO (Data Access Object) com herança de AbstractTenantDAO
 * Abstração e persistência relacional de encomendas recebidas na portaria.
 */
export class DeliveryDAO extends AbstractTenantDAO {
  constructor() {
    super();
    this.notifier = NotificationDispatcherFactory.createDispatcher('delivery');
  }

  // Utiliza o Template Method unitTenantScope da classe base
  tenantScope(options) {
    return this.unitTenantScope(options, { blockAlias: 'b', unitAlias: 'u' });
  }

  getDeliveries({ condominiumId, status, unit_id } = {}) {
    const scope = this.tenantScope(condominiumId);
    let sql = `
      SELECT d.*, u.block, u.number as unit_number, r.name as resident_name
      FROM deliveries d
      LEFT JOIN units u ON d.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents r ON d.resident_id = r.id
      WHERE 1=1${scope.sql}
    `;
    const params = [...scope.params];

    if (status) {
      sql += ' AND d.status = ?';
      params.push(status);
    }

    if (unit_id) {
      sql += ' AND d.unit_id = ?';
      params.push(parseInt(unit_id, 10));
    }

    sql += ' ORDER BY d.received_at DESC';
    return this.db.prepare(sql).all(params);
  }

  getDelivery(id, condominiumId) {
    const scope = this.tenantScope(condominiumId);
    return this.db.prepare(`
      SELECT d.*, u.block, u.number as unit_number, r.name as resident_name
      FROM deliveries d
      LEFT JOIN units u ON d.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents r ON d.resident_id = r.id
      WHERE d.id = ?${scope.sql}
    `).get(parseInt(id, 10), ...scope.params) || null;
  }

  // Garante que unidade (e morador, se informado) pertencem ao condomínio ativo.
  validateRecipient(unitId, residentId, condominiumId) {
    const scope = this.tenantScope(condominiumId);
    const unit = this.db.prepare(`
      SELECT u.id FROM units u
      LEFT JOIN blocks b ON u.block_id = b.id
      WHERE u.id = ?${scope.sql}
    `).get(unitId, ...scope.params);
    if (!unit) {
      throw new Error('Unidade não encontrada neste condomínio.');
    }

    if (residentId) {
      const resident = this.db.prepare('SELECT id FROM residents WHERE id = ? AND unit_id = ?').get(residentId, unitId);
      if (!resident) {
        throw new Error('O morador informado não pertence à unidade selecionada.');
      }
    }
  }

  createDelivery(data, condominiumId) {
    return new CreateDeliveryOperation().execute(data, { condominiumId });
  }

  updateDelivery(id, data, condominiumId) {
    const delivery = this.getDelivery(id, condominiumId);
    if (!delivery) {
      throw new Error('Encomenda não encontrada.');
    }

    if (delivery.status === 'delivered') {
      throw new Error('Encomenda já retirada não pode ser alterada.');
    }

    const unitId = data.unit_id ? parseInt(data.unit_id, 10) : delivery.unit_id;
    let residentId = delivery.resident_id;
    if (data.resident_id !== undefined) {
      residentId = data.resident_id ? parseInt(data.resident_id, 10) : null;
    }
    this.validateRecipient(unitId, residentId, condominiumId);

    this.db.prepare(`
      UPDATE deliveries
      SET unit_id = ?, resident_id = ?, courier = ?, tracking_code = ?, description = ?, notes = ?
      WHERE id = ?
    `).run(
      unitId,
      residentId,
      data.courier || delivery.courier,
      data.tracking_code !== undefined ? data.tracking_code || null : delivery.tracking_code,
      data.description !== undefined ? data.description || '' : delivery.description,
      data.notes !== undefined ? data.notes || '' : delivery.notes,
      delivery.id
    );

    return this.getDelivery(delivery.id);
  }

  deleteDelivery(id, condominiumId) {
    const delivery = this.getDelivery(id, condominiumId);
    if (!delivery) return false;
    const result = this.db.prepare('DELETE FROM deliveries WHERE id = ?').run(delivery.id);
    return result.changes > 0;
  }

  pickupDelivery(id, { pickup_code, picked_up_by }, condominiumId) {
    const delivery = this.getDelivery(id, condominiumId);
    if (!delivery) {
      throw new Error('Encomenda não encontrada.');
    }

    if (delivery.status === 'delivered') {
      throw new Error('Esta encomenda já foi retirada.');
    }

    if (pickup_code && delivery.pickup_code !== String(pickup_code).trim()) {
      throw new Error('Código de retirada (PIN) incorreto.');
    }

    const stmt = this.db.prepare(`
      UPDATE deliveries
      SET status = 'delivered', picked_up_at = CURRENT_TIMESTAMP, picked_up_by = ?
      WHERE id = ?
    `);

    stmt.run(picked_up_by || 'Morador', delivery.id);
    return this.getDelivery(delivery.id);
  }

  cancelDelivery(id, options = {}, condominiumId) {
    const cId = condominiumId || options?.condominiumId;
    const delivery = this.getDelivery(id, cId);
    if (!delivery) {
      throw new Error('Encomenda não encontrada.');
    }
    if (delivery.status === 'delivered') {
      throw new Error('Não é possível cancelar uma encomenda que já foi retirada.');
    }
    const stmt = this.db.prepare(`
      UPDATE deliveries
      SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP, cancelled_by = ?, cancellation_reason = ?
      WHERE id = ?
    `);
    stmt.run(options?.cancelledBy || options?.cancelled_by || 'Portaria', options?.reason || 'Cancelada pela portaria', delivery.id);
    return this.getDelivery(delivery.id);
  }
}