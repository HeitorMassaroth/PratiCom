import DatabaseSingleton from '../config/DatabaseSingleton.js';
import { DeliveryNotificationDispatcher } from '../services/templates/NotificationTemplate.js';

/**
 * Padrão de Projeto: DAO (Data Access Object - 2/3)
 * Abstração e persistência relacional de encomendas recebidas na portaria.
 */
export class DeliveryDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
    this.notifier = new DeliveryNotificationDispatcher();
  }

  getDeliveries({ condominiumId, status, unit_id } = {}) {
    let sql = `
      SELECT d.*, u.block, u.number as unit_number, r.name as resident_name, b.condominium_id
      FROM deliveries d
      LEFT JOIN units u ON d.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents r ON d.resident_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      if (cId === 1) {
        sql += ' AND (b.condominium_id = 1 OR u.block_id IS NULL)';
      } else {
        sql += ' AND b.condominium_id = ?';
        params.push(cId);
      }
    }

    if (status) {
      const s = String(status).toUpperCase();
      if (s === 'PENDING' || s === 'RECEBIDA') {
        sql += " AND UPPER(d.status) IN ('PENDING', 'RECEBIDA')";
      } else if (s === 'DELIVERED' || s === 'PICKED_UP' || s === 'ENTREGUE') {
        sql += " AND UPPER(d.status) IN ('DELIVERED', 'PICKED_UP', 'ENTREGUE')";
      } else if (s === 'CANCELLED' || s === 'CANCELADA') {
        sql += " AND UPPER(d.status) IN ('CANCELLED', 'CANCELADA')";
      } else {
        sql += " AND UPPER(d.status) = ?";
        params.push(s);
      }
    }

    if (unit_id) {
      sql += ' AND d.unit_id = ?';
      params.push(parseInt(unit_id, 10));
    }

    sql += ' ORDER BY d.received_at DESC, d.id DESC';
    return this.db.prepare(sql).all(params);
  }

  getDeliveryById(id, { condominiumId } = {}) {
    const sql = `
      SELECT d.*, u.block, u.number as unit_number, r.name as resident_name, b.condominium_id
      FROM deliveries d
      LEFT JOIN units u ON d.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents r ON d.resident_id = r.id
      WHERE d.id = ?
    `;
    const delivery = this.db.prepare(sql).get(parseInt(id, 10));
    if (!delivery) return null;

    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      const deliveryCondoId = delivery.condominium_id ?? 1;
      if (cId === 1) {
        if (delivery.condominium_id && delivery.condominium_id !== 1) {
          return null;
        }
      } else {
        if (deliveryCondoId !== cId) {
          return null;
        }
      }
    }

    return delivery;
  }

  createDelivery(data, { condominiumId } = {}) {
    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      const unit = this.db.prepare(`
        SELECT u.id, b.condominium_id 
        FROM units u 
        LEFT JOIN blocks b ON u.block_id = b.id 
        WHERE u.id = ?
      `).get(parseInt(data.unit_id, 10));

      if (!unit) {
        throw new Error('Unidade de destino não encontrada.');
      }
      const unitCondoId = unit.condominium_id ?? 1;
      if (cId === 1) {
        if (unit.condominium_id && unit.condominium_id !== 1) {
          throw new Error('A unidade selecionada não pertence ao condomínio atual.');
        }
      } else if (unitCondoId !== cId) {
        throw new Error('A unidade selecionada não pertence ao condomínio atual.');
      }
    }

    const pickupCode = String(Math.floor(1000 + Math.random() * 9000));
    const stmt = this.db.prepare(`
      INSERT INTO deliveries (
        unit_id, resident_id, courier, tracking_code, description, 
        status, pickup_code, notes, received_at, registered_at, received_by, registered_by
      )
      VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?)
    `);

    const info = stmt.run(
      parseInt(data.unit_id, 10),
      data.resident_id ? parseInt(data.resident_id, 10) : null,
      data.courier,
      data.tracking_code || null,
      data.description || '',
      pickupCode,
      data.notes || '',
      data.received_by || 'Portaria',
      data.registered_by || 'Portaria'
    );

    const delivery = this.getDeliveryById(info.lastInsertRowid);
    const resident = delivery.resident_id 
      ? this.db.prepare('SELECT name, phone, email FROM residents WHERE id = ?').get(delivery.resident_id) 
      : null;

    // Dispara notificação via Template Method
    if (resident) {
      this.notifier.sendNotification(resident, delivery);
    }

    return delivery;
  }

  updateDelivery(id, data, { condominiumId } = {}) {
    const delivery = this.getDeliveryById(id, { condominiumId });
    if (!delivery) {
      throw new Error('Encomenda não encontrada ou não pertence a este condomínio.');
    }

    const upperStatus = String(delivery.status).toUpperCase();
    if (upperStatus === 'CANCELLED' || upperStatus === 'CANCELADA') {
      throw new Error('Encomendas canceladas não podem ser editadas.');
    }

    const isDelivered = ['PICKED_UP', 'DELIVERED', 'ENTREGUE'].includes(upperStatus);

    if (isDelivered) {
      const stmt = this.db.prepare(`
        UPDATE deliveries
        SET notes = ?, picked_up_by = ?
        WHERE id = ?
      `);
      stmt.run(
        data.notes !== undefined ? data.notes : delivery.notes,
        data.picked_up_by !== undefined ? data.picked_up_by : delivery.picked_up_by,
        parseInt(id, 10)
      );
    } else {
      let unitId = delivery.unit_id;
      if (data.unit_id) {
        const newUnitId = parseInt(data.unit_id, 10);
        if (condominiumId) {
          const cId = parseInt(condominiumId, 10);
          const u = this.db.prepare(`
            SELECT u.id, b.condominium_id 
            FROM units u 
            LEFT JOIN blocks b ON u.block_id = b.id 
            WHERE u.id = ?
          `).get(newUnitId);
          if (!u) throw new Error('Unidade não encontrada.');
          const uCondo = u.condominium_id ?? 1;
          if (cId === 1 ? (u.condominium_id && u.condominium_id !== 1) : uCondo !== cId) {
            throw new Error('A unidade informada não pertence ao condomínio atual.');
          }
        }
        unitId = newUnitId;
      }

      const stmt = this.db.prepare(`
        UPDATE deliveries
        SET unit_id = ?,
            resident_id = ?,
            courier = ?,
            tracking_code = ?,
            description = ?,
            notes = ?
        WHERE id = ?
      `);

      stmt.run(
        unitId,
        data.resident_id !== undefined ? (data.resident_id ? parseInt(data.resident_id, 10) : null) : delivery.resident_id,
        data.courier || delivery.courier,
        data.tracking_code !== undefined ? (data.tracking_code || null) : delivery.tracking_code,
        data.description !== undefined ? data.description : delivery.description,
        data.notes !== undefined ? data.notes : delivery.notes,
        parseInt(id, 10)
      );
    }

    return this.getDeliveryById(id, { condominiumId });
  }

  pickupDelivery(id, { pickup_code, picked_up_by, condominiumId } = {}) {
    const delivery = this.getDeliveryById(id, { condominiumId });
    if (!delivery) {
      throw new Error('Encomenda não encontrada ou não pertence a este condomínio.');
    }

    const upperStatus = String(delivery.status).toUpperCase();
    if (upperStatus === 'PICKED_UP' || upperStatus === 'DELIVERED' || upperStatus === 'ENTREGUE') {
      throw new Error('Esta encomenda já foi retirada.');
    }

    if (upperStatus === 'CANCELLED' || upperStatus === 'CANCELADA') {
      throw new Error('Não é possível dar baixa em uma encomenda cancelada.');
    }

    if (pickup_code && delivery.pickup_code !== String(pickup_code).trim()) {
      throw new Error('Código de retirada (PIN) incorreto.');
    }

    const stmt = this.db.prepare(`
      UPDATE deliveries 
      SET status = 'PICKED_UP', picked_up_at = CURRENT_TIMESTAMP, picked_up_by = ?
      WHERE id = ?
    `);

    stmt.run(picked_up_by || 'Morador', parseInt(id, 10));
    return this.getDeliveryById(id, { condominiumId });
  }

  cancelDelivery(id, { reason, cancelledBy, condominiumId } = {}) {
    const delivery = this.getDeliveryById(id, { condominiumId });
    if (!delivery) {
      throw new Error('Encomenda não encontrada ou não pertence a este condomínio.');
    }

    const upperStatus = String(delivery.status).toUpperCase();
    if (['PICKED_UP', 'DELIVERED', 'ENTREGUE'].includes(upperStatus)) {
      throw new Error('Encomendas já retiradas pelo morador não podem ser canceladas.');
    }

    if (['CANCELLED', 'CANCELADA'].includes(upperStatus)) {
      throw new Error('Esta encomenda já foi cancelada.');
    }

    const stmt = this.db.prepare(`
      UPDATE deliveries
      SET status = 'CANCELLED',
          cancelled_at = CURRENT_TIMESTAMP,
          cancelled_by = ?,
          cancellation_reason = ?
      WHERE id = ?
    `);

    stmt.run(cancelledBy || 'Portaria', reason || 'Cancelado pelo operador', parseInt(id, 10));
    return this.getDeliveryById(id, { condominiumId });
  }

  deleteDelivery(id, { condominiumId } = {}) {
    const delivery = this.getDeliveryById(id, { condominiumId });
    if (!delivery) {
      throw new Error('Encomenda não encontrada ou não pertence a este condomínio.');
    }

    const upperStatus = String(delivery.status).toUpperCase();
    if (['PICKED_UP', 'DELIVERED', 'ENTREGUE'].includes(upperStatus)) {
      throw new Error('Encomendas já entregues não podem ser excluídas.');
    }

    this.db.prepare('DELETE FROM deliveries WHERE id = ?').run(parseInt(id, 10));
    return { success: true, message: 'Encomenda removida com sucesso.' };
  }
}

