// ============================================================================
// PratiCom ERP - Infrastructure Adapter: SqliteResidentRepository
// Persistência da entidade Resident com conversão para CPF Value Object
// ============================================================================

import { Resident } from '../../domain/entities/Resident.js';

export class SqliteResidentRepository {
  constructor(databaseEngine) {
    this.table = databaseEngine.getTable('residents');
  }

  _toDomain(row) {
    if (!row) return null;
    return new Resident(row.id, {
      unitId: row.unit_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      cpf: row.cpf,
      role: row.role,
      emergencyContact: row.emergency_contact,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  findById(id) {
    const row = this.table.findById(id);
    return this._toDomain(row);
  }

  findAllByUnit(unitId) {
    const rows = this.table.findAll({ unit_id: unitId }, { orderBy: 'name ASC' });
    return rows.map(r => this._toDomain(r));
  }

  save(resident) {
    const data = {
      unit_id: resident.unitId,
      name: resident.name,
      email: resident.email,
      phone: resident.phone,
      cpf: resident.cpf ? resident.cpf.value : null,
      role: resident.role,
      emergency_contact: resident.emergencyContact
    };

    let savedRow;
    if (resident.id) {
      savedRow = this.table.update(resident.id, data);
    } else {
      savedRow = this.table.insert(data);
    }

    return this._toDomain(savedRow);
  }
}
