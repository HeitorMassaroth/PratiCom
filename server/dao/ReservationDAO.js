import DatabaseSingleton from '../config/DatabaseSingleton.js';

export class ReservationDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
  }

  getSpaces() {
    return this.db.prepare('SELECT * FROM spaces ORDER BY name ASC').all();
  }

  getReservations({ space_id, date } = {}) {
    let sql = `
      SELECT r.*, s.name as space_name, u.block, u.number as unit_number, res.name as resident_name
      FROM reservations r
      LEFT JOIN spaces s ON r.space_id = s.id
      LEFT JOIN units u ON r.unit_id = u.id
      LEFT JOIN residents res ON r.resident_id = res.id
      WHERE 1=1
    `;
    const params = [];

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
    const space = this.db.prepare('SELECT * FROM spaces WHERE id = ?').get(parseInt(data.space_id, 10));
    if (!space) {
      throw new Error('Espaço não encontrado.');
    }

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
      INSERT INTO reservations (space_id, unit_id, resident_id, reservation_date, start_time, end_time, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')
    `);

    const info = stmt.run(
      parseInt(data.space_id, 10),
      parseInt(data.unit_id, 10),
      parseInt(data.resident_id, 10),
      data.reservation_date,
      data.start_time,
      data.end_time,
      totalPrice
    );

    return this.db.prepare(`
      SELECT r.*, s.name as space_name 
      FROM reservations r 
      JOIN spaces s ON r.space_id = s.id 
      WHERE r.id = ?
    `).get(info.lastInsertRowid);
  }

  cancelReservation(id) {
    const stmt = this.db.prepare(`
      UPDATE reservations SET status = 'CANCELLED' WHERE id = ?
    `);
    stmt.run(parseInt(id, 10));
    return this.db.prepare('SELECT * FROM reservations WHERE id = ?').get(parseInt(id, 10));
  }
}
