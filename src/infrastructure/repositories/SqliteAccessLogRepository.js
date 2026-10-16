// ============================================================================
// PratiCom ERP - Infrastructure Adapter: SqliteAccessLogRepository
// Persistência de registros de acesso na portaria
// ============================================================================

import { AccessLog } from '../../domain/entities/AccessLog.js';

export class SqliteAccessLogRepository {
  constructor(databaseEngine) {
    this.table = databaseEngine.getTable('access_logs');
  }

  _toDomain(row) {
    if (!row) return null;
    return new AccessLog(row.id, {
      destinationUnitId: row.destination_unit_id,
      visitorName: row.visitor_name,
      document: row.document,
      type: row.type,
      company: row.company,
      status: row.status,
      enteredAt: row.entered_at,
      exitedAt: row.exited_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  findById(id) {
    const row = this.table.findById(id);
    return this._toDomain(row);
  }

  findAllInProperty() {
    const rows = this.table.findAll({ status: 'IN_PROPERTY' }, { orderBy: 'entered_at DESC' });
    return rows.map(r => this._toDomain(r));
  }

  save(log) {
    const data = {
      destination_unit_id: log.destinationUnitId,
      visitor_name: log.visitorName,
      document: log.document,
      type: log.type,
      company: log.company,
      status: log.status,
      entered_at: log.enteredAt,
      exited_at: log.exitedAt
    };

    let savedRow;
    if (log.id) {
      savedRow = this.table.update(log.id, data);
    } else {
      savedRow = this.table.insert(data);
    }

    return this._toDomain(savedRow);
  }
}
