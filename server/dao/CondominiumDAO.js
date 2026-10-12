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
    return { 
      ...condominium, 
      blocks: this.getBlocks(condominiumId),
      modules: this.getModules(condominiumId)
    };
  }

  createCondominium(data) {
    if (!data.name?.trim()) throw new Error('Nome do condomínio é obrigatório.');
    const info = this.db.prepare(`INSERT INTO condominiums (name, cnpj, address, city, state, postal_code, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(data.name.trim(), data.cnpj || null, data.address || null, data.city || null, data.state || null, data.postal_code || null, data.phone || null);
    
    const newId = info.lastInsertRowid;
    // Novos condomínios recebem os módulos opcionais explicitamente configurados (desabilitados por padrão ou conforme data.modules)
    const validModules = ['dashboard', 'access', 'deliveries', 'reservations', 'financial', 'market'];
    const insertStmt = this.db.prepare(`
      INSERT INTO condominium_modules (condominium_id, module_key, enabled)
      VALUES (?, ?, ?)
    `);
    for (const m of validModules) {
      const isEnabled = data.modules && typeof data.modules[m] !== 'undefined' ? (data.modules[m] ? 1 : 0) : 0;
      insertStmt.run(newId, m, isEnabled);
    }

    return this.getCondominium(newId);
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

  getModules(condominiumId) {
    const cId = id(condominiumId);
    const validModules = ['dashboard', 'access', 'deliveries', 'reservations', 'financial', 'market'];
    const rows = this.db.prepare('SELECT module_key, enabled FROM condominium_modules WHERE condominium_id = ?').all(cId);

    if (rows.length === 0) {
      // Se não houver registros, condomínio ID 1 é ativado por compatibilidade; outros desativados por padrão
      const defaultVal = cId === 1 ? 1 : 0;
      const insertStmt = this.db.prepare('INSERT OR IGNORE INTO condominium_modules (condominium_id, module_key, enabled) VALUES (?, ?, ?)');
      for (const m of validModules) {
        insertStmt.run(cId, m, defaultVal);
      }
      return validModules.map(m => ({ module_key: m, enabled: Boolean(defaultVal) }));
    }

    const map = Object.fromEntries(rows.map(r => [r.module_key, Boolean(r.enabled)]));
    return validModules.map(m => ({
      module_key: m,
      enabled: typeof map[m] !== 'undefined' ? map[m] : false
    }));
  }

  setModules(condominiumId, modulesInput) {
    const cId = id(condominiumId);
    const condo = this.db.prepare('SELECT id FROM condominiums WHERE id = ?').get(cId);
    if (!condo) throw new Error('Condomínio não encontrado.');

    const validModules = ['dashboard', 'access', 'deliveries', 'reservations', 'financial', 'market'];
    const upsertStmt = this.db.prepare(`
      INSERT INTO condominium_modules (condominium_id, module_key, enabled, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(condominium_id, module_key) DO UPDATE SET
        enabled = excluded.enabled,
        updated_at = CURRENT_TIMESTAMP
    `);

    let moduleEntries = [];
    if (Array.isArray(modulesInput)) {
      moduleEntries = modulesInput.map(item => [item.module_key, Boolean(item.enabled)]);
    } else if (typeof modulesInput === 'object' && modulesInput !== null) {
      moduleEntries = Object.entries(modulesInput);
    }

    const tx = this.db.transaction(() => {
      for (const [key, val] of moduleEntries) {
        if (validModules.includes(key)) {
          upsertStmt.run(cId, key, val ? 1 : 0);
        }
      }
    });
    tx();

    return this.getModules(cId);
  }

  isModuleEnabled(condominiumId, moduleKey) {
    const cId = id(condominiumId);
    // As 3 áreas estruturais obrigatórias são SEMPRE habilitadas
    if (['residents', 'territory', 'announcements'].includes(moduleKey)) {
      return true;
    }
    const row = this.db.prepare(`
      SELECT enabled FROM condominium_modules 
      WHERE condominium_id = ? AND module_key = ?
    `).get(cId, moduleKey);

    if (!row) {
      return cId === 1;
    }
    return Boolean(row.enabled);
  }
}
