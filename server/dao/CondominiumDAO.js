import DatabaseSingleton from '../config/DatabaseSingleton.js';

const id = (value) => Number.parseInt(value, 10);

export class CondominiumDAO {
  constructor() { this.db = DatabaseSingleton.getDb(); }

  getCondominiums({ status } = {}) {
    let sql = `SELECT c.*, COUNT(DISTINCT b.id) AS blocks_count, COUNT(DISTINCT u.id) AS units_count
      FROM condominiums c LEFT JOIN blocks b ON b.condominium_id = c.id
      LEFT JOIN units u ON u.block_id = b.id WHERE 1=1`;
    const params = [];
    if (status) { sql += ' AND c.status = ?'; params.push(status); }
    sql += ' GROUP BY c.id ORDER BY c.name';
    return this.db.prepare(sql).all(params);
  }

  getCondominium(condominiumId) {
    const condominium = this.db.prepare('SELECT * FROM condominiums WHERE id = ?').get(id(condominiumId));
    if (!condominium) return null;
    return { ...condominium, blocks: this.getBlocks(condominiumId) };
  }

  createCondominium(data) {
    if (!data.name?.trim()) throw new Error('Nome do condomínio é obrigatório.');
    const info = this.db.prepare(`INSERT INTO condominiums (name, cnpj, address, city, state, postal_code, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(data.name.trim(), data.cnpj || null, data.address || null, data.city || null, data.state || null, data.postal_code || null, data.phone || null);
    return this.getCondominium(info.lastInsertRowid);
  }

  updateCondominium(condominiumId, data) {
    if (!this.getCondominium(condominiumId)) throw new Error('Condomínio não encontrado.');
    if (!data.name?.trim()) throw new Error('Nome do condomínio é obrigatório.');
    this.db.prepare(`UPDATE condominiums SET name=?, cnpj=?, address=?, city=?, state=?, postal_code=?, phone=? WHERE id=?`).run(data.name.trim(), data.cnpj || null, data.address || null, data.city || null, data.state || null, data.postal_code || null, data.phone || null, id(condominiumId));
    return this.getCondominium(condominiumId);
  }

  setCondominiumStatus(condominiumId, status) {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) throw new Error('Status inválido.');
    const result = this.db.prepare('UPDATE condominiums SET status = ? WHERE id = ?').run(status, id(condominiumId));
    if (!result.changes) throw new Error('Condomínio não encontrado.');
    return this.getCondominium(condominiumId);
  }

  deleteCondominium(condominiumId) {
    const dependencies = this.db.prepare('SELECT COUNT(*) AS count FROM blocks WHERE condominium_id = ?').get(id(condominiumId)).count;
    if (dependencies) throw new Error('Não é possível excluir condomínio com blocos vinculados.');
    const result = this.db.prepare('DELETE FROM condominiums WHERE id = ?').run(id(condominiumId));
    if (!result.changes) throw new Error('Condomínio não encontrado.');
  }

  getBlocks(condominiumId) {
    return this.db.prepare(`SELECT b.*, COUNT(u.id) AS units_count FROM blocks b LEFT JOIN units u ON u.block_id=b.id
      WHERE b.condominium_id=? GROUP BY b.id ORDER BY b.name`).all(id(condominiumId));
  }

  getBlock(blockId) {
    return this.db.prepare(`SELECT b.*, c.name AS condominium_name FROM blocks b JOIN condominiums c ON c.id=b.condominium_id WHERE b.id=?`).get(id(blockId));
  }

  createBlock(condominiumId, data) {
    const condominium = this.getCondominium(condominiumId);
    if (!condominium) throw new Error('Condomínio não encontrado.');
    if (condominium.status !== 'ACTIVE') throw new Error('Condomínio inativo não aceita novos blocos.');
    if (!data.name?.trim()) throw new Error('Nome do bloco é obrigatório.');
    const info = this.db.prepare('INSERT INTO blocks (condominium_id, name, description) VALUES (?, ?, ?)').run(id(condominiumId), data.name.trim(), data.description || null);
    return this.getBlock(info.lastInsertRowid);
  }

  updateBlock(blockId, data) {
    if (!data.name?.trim()) throw new Error('Nome do bloco é obrigatório.');
    const result = this.db.prepare('UPDATE blocks SET name=?, description=? WHERE id=?').run(data.name.trim(), data.description || null, id(blockId));
    if (!result.changes) throw new Error('Bloco não encontrado.');
    return this.getBlock(blockId);
  }

  setBlockStatus(blockId, status) {
    if (!['ACTIVE', 'INACTIVE'].includes(status)) throw new Error('Status inválido.');
    const result = this.db.prepare('UPDATE blocks SET status=? WHERE id=?').run(status, id(blockId));
    if (!result.changes) throw new Error('Bloco não encontrado.');
    return this.getBlock(blockId);
  }

  deleteBlock(blockId) {
    const dependencies = this.db.prepare('SELECT COUNT(*) AS count FROM units WHERE block_id = ?').get(id(blockId)).count;
    if (dependencies) throw new Error('Não é possível excluir bloco com unidades vinculadas.');
    const result = this.db.prepare('DELETE FROM blocks WHERE id=?').run(id(blockId));
    if (!result.changes) throw new Error('Bloco não encontrado.');
  }

  getPendingUnits() {
    return this.db.prepare('SELECT id, block AS legacy_block, number, floor, type FROM units WHERE block_id IS NULL ORDER BY block, number').all();
  }

  mapPendingUnits(blockId, legacyBlock) {
    const block = this.getBlock(blockId);
    if (!block) throw new Error('Bloco não encontrado.');
    if (!legacyBlock?.trim()) throw new Error('Identificação legada do bloco é obrigatória.');
    const result = this.db.prepare('UPDATE units SET block_id=? WHERE block_id IS NULL AND block=?').run(id(blockId), legacyBlock.trim());
    return { mapped: result.changes };
  }
}
