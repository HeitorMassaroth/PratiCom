import DatabaseSingleton from '../config/DatabaseSingleton.js';
import { AnnouncementNotificationDispatcher } from '../services/templates/NotificationTemplate.js';

/**
 * Módulo DAO Consolidado de Operações (Portaria & Mural de Comunicados)
 * Consolida as responsabilidades de acesso a dados de Acesso de Portaria e Comunicados em um único módulo coeso.
 */

export class AccessDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
  }

  getAccessLogs({ condominiumId, status, type, search } = {}) {
    let sql = `
      SELECT a.*, a.entry_time AS entered_at, a.exit_time AS exited_at, COALESCE(b.name, u.block) as block, u.number as unit_number
      FROM access_logs a
      LEFT JOIN units u ON a.destination_unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
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
      sql += ' AND a.status = ?';
      params.push(status);
    }

    if (type) {
      sql += ' AND a.type = ?';
      params.push(type);
    }

    if (search) {
      sql += ` AND (
        LOWER(a.visitor_name) LIKE ?
        OR a.document LIKE ?
        OR LOWER(COALESCE(a.company, '')) LIKE ?
        OR UPPER(COALESCE(a.vehicle_plate, '')) LIKE ?
      )`;
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term, term, `%${search.toUpperCase()}%`);
    }

    sql += ' ORDER BY a.entry_time DESC';
    return this.db.prepare(sql).all(params);
  }

  registerEntry(data) {
    const stmt = this.db.prepare(`
      INSERT INTO access_logs (
        visitor_name, document, type, destination_unit_id, status,
        company, vehicle_plate, authorized_by, notes, entry_time
      )
      VALUES (?, ?, ?, ?, 'IN_PROPERTY', ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const info = stmt.run(
      data.visitor_name,
      data.document,
      data.type || 'Visitante',
      parseInt(data.destination_unit_id || data.unit_id, 10),
      data.company || null,
      data.vehicle_plate || null,
      data.authorized_by || null,
      data.notes || ''
    );

    return this.db.prepare(`
      SELECT a.*, a.entry_time AS entered_at, a.exit_time AS exited_at,
        u.block, u.number AS unit_number
      FROM access_logs a
      LEFT JOIN units u ON a.destination_unit_id = u.id
      WHERE a.id = ?
    `).get(info.lastInsertRowid);
  }

  registerExit(id) {
    const stmt = this.db.prepare(`
      UPDATE access_logs
      SET status = 'EXITED', exit_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(parseInt(id, 10));
    return this.db.prepare(`
      SELECT a.*, a.entry_time AS entered_at, a.exit_time AS exited_at,
        u.block, u.number AS unit_number
      FROM access_logs a
      LEFT JOIN units u ON a.destination_unit_id = u.id
      WHERE a.id = ?
    `).get(parseInt(id, 10));
  }

  deleteAccess(id, condominiumId) {
    let sql = `
      DELETE FROM access_logs
      WHERE id = ?
        AND destination_unit_id IN (
          SELECT u.id
          FROM units u
          LEFT JOIN blocks b ON u.block_id = b.id
          WHERE 1=1
    `;
    const params = [parseInt(id, 10)];
    const cId = parseInt(condominiumId, 10);

    if (cId === 1) {
      sql += ' AND (b.condominium_id = 1 OR u.block_id IS NULL)';
    } else {
      sql += ' AND b.condominium_id = ?';
      params.push(cId);
    }

    sql += ')';
    return this.db.prepare(sql).run(...params).changes > 0;
  }
}

export class AnnouncementDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
    this.notifier = new AnnouncementNotificationDispatcher();
  }

  getAnnouncements({ condominiumId, category, search } = {}) {
    let sql = 'SELECT * FROM announcements WHERE 1=1';
    const params = [];

    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      if (cId === 1) {
        sql += ' AND (condominium_id = 1 OR condominium_id IS NULL)';
      } else {
        sql += ' AND condominium_id = ?';
        params.push(cId);
      }
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ?)';
      const term = `%${search.toLowerCase()}%`;
      params.push(term, term);
    }

    sql += ' ORDER BY created_at DESC';
    return this.db.prepare(sql).all(params);
  }

  createAnnouncement(data, condominiumId) {
    const stmt = this.db.prepare(`
      INSERT INTO announcements (condominium_id, title, content, category, priority, author, target_block, is_pinned, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const condoId = data?.condominium_id || condominiumId || null;
    const info = stmt.run(
      condoId ? parseInt(condoId, 10) : null,
      data.title,
      data.content,
      data.category || 'Geral',
      data.priority || 'normal',
      data.author || data.created_by || 'Síndico Geral',
      data.target_block || 'Todos',
      data.is_pinned ? 1 : 0,
      data.expires_at || null
    );

    const announcement = this.db.prepare('SELECT * FROM announcements WHERE id = ?').get(info.lastInsertRowid);
    if (announcement.priority === 'URGENTE' || announcement.priority === 'high' || announcement.priority === 'urgent') {
      this.notifier.sendNotification({ name: 'Todos os Moradores', contact: 'Mural Geral' }, announcement);
    }
    return announcement;
  }

  deleteAnnouncement(id) {
    const stmt = this.db.prepare('DELETE FROM announcements WHERE id = ?');
    const info = stmt.run(parseInt(id, 10));
    return info.changes > 0;
  }
}
