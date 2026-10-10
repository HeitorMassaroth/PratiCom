import DatabaseSingleton from '../config/DatabaseSingleton.js';

/**
 * Padrão de Projeto: DAO (Data Access Object - 1/3)
 * Isolamento e abstração do acesso aos dados de Unidades, Moradores, Veículos e Pets no SQLite.
 */
export class ResidentDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
  }

  getUnits() {
    const units = this.db.prepare('SELECT * FROM units ORDER BY block, number').all();
    return units.map(u => {
      const resCount = this.db.prepare('SELECT COUNT(*) as count FROM residents WHERE unit_id = ?').get(u.id).count;
      const vehCount = this.db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE unit_id = ?').get(u.id).count;
      const petCount = this.db.prepare('SELECT COUNT(*) as count FROM pets WHERE unit_id = ?').get(u.id).count;
      return {
        ...u,
        residents_count: resCount,
        vehicles_count: vehCount,
        pets_count: petCount
      };
    });
  }

  getResidents({ unit_id, search } = {}) {
    let sql = `
      SELECT r.*, u.block, u.number as unit_number 
      FROM residents r
      LEFT JOIN units u ON r.unit_id = u.id
      WHERE 1=1
    `;
    const params = [];

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
    return this.db.prepare(sql).all(params);
  }

  createResident(data) {
    const stmt = this.db.prepare(`
      INSERT INTO residents (unit_id, name, email, phone, cpf, role, emergency_contact)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      parseInt(data.unit_id, 10),
      data.name,
      data.email || null,
      data.phone || null,
      data.cpf || null,
      data.role || 'Proprietário',
      data.emergency_contact || null
    );

    const resident = this.db.prepare('SELECT * FROM residents WHERE id = ?').get(info.lastInsertRowid);
    const unit = this.db.prepare('SELECT block, number FROM units WHERE id = ?').get(resident.unit_id) || {};
    return { ...resident, block: unit.block || '', unit_number: unit.number || '' };
  }

  deleteResident(id) {
    const stmt = this.db.prepare('DELETE FROM residents WHERE id = ?');
    const info = stmt.run(parseInt(id, 10));
    return info.changes > 0;
  }

  getVehicles() {
    const sql = `
      SELECT v.*, u.block, u.number as unit_number, r.name as resident_name
      FROM vehicles v
      LEFT JOIN units u ON v.unit_id = u.id
      LEFT JOIN residents r ON v.resident_id = r.id
      ORDER BY v.id DESC
    `;
    return this.db.prepare(sql).all();
  }

  createVehicle(data) {
    const stmt = this.db.prepare(`
      INSERT INTO vehicles (unit_id, resident_id, plate, model, color, type, parking_spot)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      parseInt(data.unit_id, 10),
      data.resident_id ? parseInt(data.resident_id, 10) : null,
      data.plate.toUpperCase(),
      data.model,
      data.color || '',
      data.type || 'Carro',
      data.parking_spot || ''
    );
    return this.db.prepare('SELECT * FROM vehicles WHERE id = ?').get(info.lastInsertRowid);
  }

  getPets() {
    const sql = `
      SELECT p.*, u.block, u.number as unit_number, r.name as resident_name
      FROM pets p
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN residents r ON p.resident_id = r.id
      ORDER BY p.id DESC
    `;
    return this.db.prepare(sql).all();
  }
}
