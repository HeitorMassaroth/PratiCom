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
      SELECT d.*, u.block, u.number as unit_number, r.name as resident_name
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

  createDelivery(data) {
    const pickupCode = String(Math.floor(1000 + Math.random() * 9000));
    const stmt = this.db.prepare(`
      INSERT INTO deliveries (unit_id, resident_id, courier, tracking_code, description, status, pickup_code, notes, received_at)
      VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, CURRENT_TIMESTAMP)
    `);

    const info = stmt.run(
      parseInt(data.unit_id, 10),
      data.resident_id ? parseInt(data.resident_id, 10) : null,
      data.courier,
      data.tracking_code || null,
      data.description || '',
      pickupCode,
      data.notes || ''
    );

    const delivery = this.db.prepare('SELECT * FROM deliveries WHERE id = ?').get(info.lastInsertRowid);
    const unit = this.db.prepare('SELECT block, number FROM units WHERE id = ?').get(delivery.unit_id) || {};
    const resident = delivery.resident_id ? this.db.prepare('SELECT name, phone, email FROM residents WHERE id = ?').get(delivery.resident_id) : null;

    // Dispara notificação via Template Method
    if (resident) {
      this.notifier.sendNotification(resident, delivery);
    }

    return {
      ...delivery,
      block: unit.block || '',
      unit_number: unit.number || '',
      resident_name: resident ? resident.name : 'Morador'
    };
  }

  pickupDelivery(id, { pickup_code, picked_up_by }) {
    const delivery = this.db.prepare('SELECT * FROM deliveries WHERE id = ?').get(parseInt(id, 10));
    if (!delivery) {
      throw new Error('Encomenda não encontrada.');
    }

    if (delivery.status === 'PICKED_UP') {
      throw new Error('Esta encomenda já foi retirada.');
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
    return this.db.prepare('SELECT * FROM deliveries WHERE id = ?').get(parseInt(id, 10));
  }
}
