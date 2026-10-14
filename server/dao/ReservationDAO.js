import DatabaseSingleton from '../config/DatabaseSingleton.js';

export class ReservationDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
  }

  assertReservationDateIsValid(reservationDate) {
    if (!reservationDate) {
      throw new Error('A data da reserva é obrigatória.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(`${reservationDate}T00:00:00`);
    if (Number.isNaN(targetDate.getTime())) {
      throw new Error('Data da reserva inválida.');
    }

    if (targetDate < today) {
      throw new Error('Não é permitido criar ou editar reservas em datas passadas.');
    }
  }

  assertReservationDurationIsOneHour(startTime, endTime) {
    const startHour = parseInt(String(startTime).split(':')[0], 10);
    const endHour = parseInt(String(endTime).split(':')[0], 10);

    if (!Number.isInteger(startHour) || !Number.isInteger(endHour)) {
      throw new Error('Horário da reserva inválido.');
    }

    if (endHour - startHour !== 1) {
      throw new Error('Cada reserva deve ter exatamente 1 hora de duração.');
    }
  }

  getSpaceById(id) {
    return this.db.prepare('SELECT * FROM spaces WHERE id = ?').get(parseInt(id, 10));
  }

  getReservationById(id) {
    return this.db.prepare(`
      SELECT r.*, s.name as space_name, u.block, u.number as unit_number, res.name as resident_name
      FROM reservations r
      LEFT JOIN spaces s ON r.space_id = s.id
      LEFT JOIN units u ON r.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents res ON r.resident_id = res.id
      WHERE r.id = ?
    `).get(parseInt(id, 10));
  }

  getSpaces({ condominiumId } = {}) {
    let sql = 'SELECT * FROM spaces WHERE 1=1';
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

    sql += ' ORDER BY name ASC';
    return this.db.prepare(sql).all(params);
  }

  createSpace(data) {
    const condominiumId = parseInt(data.condominium_id ?? data.condominiumId, 10);
    const name = String(data.name || '').trim();
    const capacity = parseInt(data.capacity, 10);

    if (!condominiumId) throw new Error('Condomínio inválido para o espaço.');
    if (!name) throw new Error('O nome da área é obrigatório.');
    if (!Number.isInteger(capacity) || capacity <= 0) throw new Error('A capacidade da área deve ser maior que zero.');

    const stmt = this.db.prepare(`
      INSERT INTO spaces (condominium_id, name, description, capacity, price_per_hour, rules)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      condominiumId,
      name,
      data.description?.trim() || null,
      capacity,
      Number(data.price_per_hour ?? 0) || 0,
      data.rules?.trim() || null
    );

    return this.db.prepare('SELECT * FROM spaces WHERE id = ?').get(info.lastInsertRowid);
  }

  updateSpace(id, data) {
    const current = this.getSpaceById(id);
    if (!current) throw new Error('Área não encontrada.');

    const name = data.name !== undefined ? String(data.name || '').trim() : current.name;
    const capacity = data.capacity !== undefined ? parseInt(data.capacity, 10) : current.capacity;

    if (!name) throw new Error('O nome da área é obrigatório.');
    if (!Number.isInteger(capacity) || capacity <= 0) throw new Error('A capacidade da área deve ser maior que zero.');

    this.db.prepare(`
      UPDATE spaces
      SET name = ?, description = ?, capacity = ?, price_per_hour = ?, rules = ?
      WHERE id = ?
    `).run(
      name,
      data.description !== undefined ? data.description?.trim() || null : current.description,
      capacity,
      data.price_per_hour !== undefined ? Number(data.price_per_hour) || 0 : current.price_per_hour,
      data.rules !== undefined ? data.rules?.trim() || null : current.rules,
      parseInt(id, 10)
    );

    return this.getSpaceById(id);
  }

  deleteSpace(id) {
    const spaceId = parseInt(id, 10);
    const reservationCount = this.db.prepare('SELECT COUNT(*) as count FROM reservations WHERE space_id = ?').get(spaceId).count;
    if (reservationCount > 0) {
      throw new Error('Não é possível excluir a área porque ela possui reservas registradas.');
    }

    const info = this.db.prepare('DELETE FROM spaces WHERE id = ?').run(spaceId);
    if (!info.changes) {
      throw new Error('Área não encontrada.');
    }

    return { id: spaceId };
  }

  getReservations({ condominiumId, space_id, date } = {}) {
    let sql = `
      SELECT r.*, s.name as space_name, u.block, u.number as unit_number, res.name as resident_name
      FROM reservations r
      LEFT JOIN spaces s ON r.space_id = s.id
      LEFT JOIN units u ON r.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents res ON r.resident_id = res.id
      WHERE 1=1
    `;
    const params = [];

    if (condominiumId) {
      const cId = parseInt(condominiumId, 10);
      if (cId === 1) {
        sql += ' AND (s.condominium_id = 1 OR s.condominium_id IS NULL OR b.condominium_id = 1 OR u.block_id IS NULL)';
      } else {
        sql += ' AND (s.condominium_id = ? OR b.condominium_id = ?)';
        params.push(cId, cId);
      }
    }

    if (space_id) {
      sql += ' AND r.space_id = ?';
      params.push(parseInt(space_id, 10));
    }

    if (date) {
      sql += ' AND r.reservation_date = ?';
      params.push(date);
    }

    sql += ' ORDER BY r.reservation_date DESC, r.start_time ASC';
    return this.db.prepare(sql).all(params);
  }

  createReservation(data) {
    const space = this.getSpaceById(data.space_id);
    if (!space) {
      throw new Error('Espaço não encontrado.');
    }

    this.assertReservationDateIsValid(data.reservation_date);
    this.assertReservationDurationIsOneHour(data.start_time, data.end_time);

    // Checar conflitos de data e hora
    const conflict = this.db.prepare(`
      SELECT COUNT(*) as count FROM reservations
      WHERE space_id = ? AND reservation_date = ? AND status = 'CONFIRMED'
      AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))
    `).get(
      parseInt(data.space_id, 10),
      data.reservation_date,
      data.end_time, data.start_time,
      data.end_time, data.start_time
    );

    if (conflict.count > 0) {
      throw new Error('Já existe uma reserva confirmada para este horário e espaço.');
    }

    const startHour = parseInt(data.start_time.split(':')[0], 10);
    const endHour = parseInt(data.end_time.split(':')[0], 10);
    const hours = Math.max(1, endHour - startHour);
    const totalPrice = (space.price_per_hour || 0) * hours;

    const stmt = this.db.prepare(`
      INSERT INTO reservations (space_id, unit_id, resident_id, reservation_date, start_time, end_time, guests_count, notes, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')
    `);

    const info = stmt.run(
      parseInt(data.space_id, 10),
      parseInt(data.unit_id, 10),
      parseInt(data.resident_id, 10),
      data.reservation_date,
      data.start_time,
      data.end_time,
      parseInt(data.guests_count, 10) || 0,
      data.notes?.trim() || null,
      totalPrice
    );

    return this.getReservationById(info.lastInsertRowid);
  }

  updateReservation(id, data) {
    const current = this.getReservationById(id);
    if (!current) {
      throw new Error('Reserva não encontrada.');
    }

    const spaceId = data.space_id !== undefined ? parseInt(data.space_id, 10) : current.space_id;
    const space = this.getSpaceById(spaceId);
    if (!space) {
      throw new Error('Espaço não encontrado.');
    }

    const unitId = data.unit_id !== undefined ? parseInt(data.unit_id, 10) : current.unit_id;
    const residentId = data.resident_id !== undefined ? parseInt(data.resident_id, 10) : current.resident_id;
    const reservationDate = data.reservation_date !== undefined ? data.reservation_date : current.reservation_date;
    const startTime = data.start_time !== undefined ? data.start_time : current.start_time;
    const endTime = data.end_time !== undefined ? data.end_time : current.end_time;
    const guestsCount = data.guests_count !== undefined ? parseInt(data.guests_count, 10) || 0 : current.guests_count || 0;
    const notes = data.notes !== undefined ? data.notes?.trim() || null : current.notes || null;

    this.assertReservationDateIsValid(reservationDate);
    this.assertReservationDurationIsOneHour(startTime, endTime);

    const conflict = this.db.prepare(`
      SELECT COUNT(*) as count FROM reservations
      WHERE space_id = ? AND reservation_date = ? AND status = 'CONFIRMED' AND id <> ?
      AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))
    `).get(
      spaceId,
      reservationDate,
      parseInt(id, 10),
      endTime, startTime,
      endTime, startTime
    );

    if (conflict.count > 0) {
      throw new Error('Já existe uma reserva confirmada para este horário e espaço.');
    }

    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    const hours = Math.max(1, endHour - startHour);
    const totalPrice = (space.price_per_hour || 0) * hours;

    this.db.prepare(`
      UPDATE reservations
      SET space_id = ?, unit_id = ?, resident_id = ?, reservation_date = ?, start_time = ?, end_time = ?, guests_count = ?, notes = ?, total_price = ?
      WHERE id = ?
    `).run(
      spaceId,
      unitId,
      residentId,
      reservationDate,
      startTime,
      endTime,
      guestsCount,
      notes,
      totalPrice,
      parseInt(id, 10)
    );

    return this.getReservationById(id);
  }

  cancelReservation(id) {
    const stmt = this.db.prepare(`
      UPDATE reservations SET status = 'CANCELLED' WHERE id = ?
    `);
    stmt.run(parseInt(id, 10));
    return this.getReservationById(id);
  }

  deleteReservation(id) {
    const info = this.db.prepare('DELETE FROM reservations WHERE id = ?').run(parseInt(id, 10));
    if (!info.changes) {
      throw new Error('Reserva não encontrada.');
    }
    return { id: parseInt(id, 10) };
  }
}
