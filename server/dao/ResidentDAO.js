import DatabaseSingleton from '../config/DatabaseSingleton.js';

/**
 * Padrão de Projeto: DAO (Data Access Object - 1/3)
 * Isolamento e abstração do acesso aos dados de Unidades, Moradores, Veículos e Pets no SQLite.
 */
export class ResidentDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
  }

  getUnits({ condominiumId } = {}) {
    let sql = `
      SELECT u.* 
      FROM units u
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

    sql += ' ORDER BY u.block, u.number';
    const units = this.db.prepare(sql).all(params);
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

  getUnit(id) {
    const unit = this.db.prepare('SELECT u.*, b.condominium_id FROM units u LEFT JOIN blocks b ON u.block_id = b.id WHERE u.id = ?').get(parseInt(id, 10));
    if (!unit) return null;
    const resCount = this.db.prepare('SELECT COUNT(*) as count FROM residents WHERE unit_id = ?').get(unit.id).count;
    const vehCount = this.db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE unit_id = ?').get(unit.id).count;
    const petCount = this.db.prepare('SELECT COUNT(*) as count FROM pets WHERE unit_id = ?').get(unit.id).count;
    return {
      ...unit,
      residents_count: resCount,
      vehicles_count: vehCount,
      pets_count: petCount
    };
  }

  createUnit(data) {
    if (!data.number || !String(data.number).trim()) {
      throw new Error('Número da unidade é obrigatório.');
    }
    const blockId = data.block_id ? parseInt(data.block_id, 10) : null;
    if (!blockId) {
      throw new Error('Bloco é obrigatório.');
    }

    const blockObj = this.db.prepare('SELECT * FROM blocks WHERE id = ?').get(blockId);
    if (!blockObj) {
      throw new Error('Bloco não encontrado.');
    }

    const numberStr = String(data.number).trim();

    // Validar duplicidade no mesmo bloco
    const existing = this.db.prepare('SELECT id FROM units WHERE block_id = ? AND number = ?').get(blockId, numberStr);
    if (existing) {
      throw new Error(`A unidade '${numberStr}' já está cadastrada no bloco '${blockObj.name}'.`);
    }

    const stmt = this.db.prepare(`
      INSERT INTO units (block, block_id, number, floor, type)
      VALUES (?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      blockObj.name,
      blockId,
      numberStr,
      data.floor ? parseInt(data.floor, 10) : 1,
      data.type || 'Residencial'
    );

    return this.getUnit(info.lastInsertRowid);
  }

  updateUnit(id, data) {
    const unit = this.getUnit(id);
    if (!unit) {
      throw new Error('Unidade não encontrada.');
    }

    if (!data.number || !String(data.number).trim()) {
      throw new Error('Número da unidade é obrigatório.');
    }

    const blockId = data.block_id ? parseInt(data.block_id, 10) : unit.block_id;
    const blockObj = this.db.prepare('SELECT * FROM blocks WHERE id = ?').get(blockId);
    if (!blockObj) {
      throw new Error('Bloco não encontrado.');
    }

    const numberStr = String(data.number).trim();

    // Validar duplicidade se alterou o número ou o bloco
    const existing = this.db.prepare('SELECT id FROM units WHERE block_id = ? AND number = ? AND id != ?').get(blockId, numberStr, parseInt(id, 10));
    if (existing) {
      throw new Error(`A unidade '${numberStr}' já existe no bloco '${blockObj.name}'.`);
    }

    this.db.prepare(`
      UPDATE units 
      SET block = ?, block_id = ?, number = ?, floor = ?, type = ?
      WHERE id = ?
    `).run(
      blockObj.name,
      blockId,
      numberStr,
      data.floor ? parseInt(data.floor, 10) : unit.floor,
      data.type || unit.type,
      parseInt(id, 10)
    );

    return this.getUnit(id);
  }

  deleteUnit(id) {
    const uId = parseInt(id, 10);
    const unit = this.getUnit(uId);
    if (!unit) {
      throw new Error('Unidade não encontrada.');
    }

    // Checagem de dependências relacionais
    const resCount = this.db.prepare('SELECT COUNT(*) as count FROM residents WHERE unit_id = ?').get(uId).count;
    if (resCount > 0) throw new Error(`Não é possível excluir a unidade '${unit.number}': possui ${resCount} morador(es) vinculado(s).`);

    const vehCount = this.db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE unit_id = ?').get(uId).count;
    if (vehCount > 0) throw new Error(`Não é possível excluir a unidade '${unit.number}': possui ${vehCount} veículo(s) vinculado(s).`);

    const delCount = this.db.prepare('SELECT COUNT(*) as count FROM deliveries WHERE unit_id = ?').get(uId).count;
    if (delCount > 0) throw new Error(`Não é possível excluir a unidade '${unit.number}': possui encomendas registradas.`);

    const accCount = this.db.prepare('SELECT COUNT(*) as count FROM access_logs WHERE destination_unit_id = ?').get(uId).count;
    if (accCount > 0) throw new Error(`Não é possível excluir a unidade '${unit.number}': possui registros de portaria/acesso.`);

    const finCount = this.db.prepare('SELECT COUNT(*) as count FROM financial_transactions WHERE unit_id = ?').get(uId).count;
    if (finCount > 0) throw new Error(`Não é possível excluir a unidade '${unit.number}': possui histórico financeiro/boletos.`);

    const resvCount = this.db.prepare('SELECT COUNT(*) as count FROM reservations WHERE unit_id = ?').get(uId).count;
    if (resvCount > 0) throw new Error(`Não é possível excluir a unidade '${unit.number}': possui reservas registradas.`);

    const result = this.db.prepare('DELETE FROM units WHERE id = ?').run(uId);
    return result.changes > 0;
  }

  getResidents({ condominiumId, unit_id, search } = {}) {
    let sql = `
      SELECT r.*, u.block, u.number as unit_number 
      FROM residents r
      LEFT JOIN units u ON r.unit_id = u.id
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

  getVehicles({ condominiumId } = {}) {
    let sql = `
      SELECT v.*, u.block, u.number as unit_number, r.name as resident_name
      FROM vehicles v
      LEFT JOIN units u ON v.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents r ON v.resident_id = r.id
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
    sql += ' ORDER BY v.id DESC';
    return this.db.prepare(sql).all(params);
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

  getPets({ condominiumId } = {}) {
    let sql = `
      SELECT p.*, u.block, u.number as unit_number, r.name as resident_name
      FROM pets p
      LEFT JOIN units u ON p.unit_id = u.id
      LEFT JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents r ON p.resident_id = r.id
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
    sql += ' ORDER BY p.id DESC';
    return this.db.prepare(sql).all(params);
  }
}
