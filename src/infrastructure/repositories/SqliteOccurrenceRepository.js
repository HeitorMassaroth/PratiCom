// ============================================================================
// PratiCom ERP - Infrastructure Adapter: SqliteOccurrenceRepository
// Persistência de ocorrências e chamados de manutenção com estados do domínio
// ============================================================================

import { Occurrence } from '../../domain/entities/Occurrence.js';
import { DomainEvents } from '../../domain/events/DomainEvents.js';

export class SqliteOccurrenceRepository {
  constructor(databaseEngine) {
    this.table = databaseEngine.getTable('occurrences');
  }

  _toDomain(row) {
    if (!row) return null;
    return new Occurrence(row.id, {
      condominiumId: row.condominium_id,
      unitId: row.unit_id,
      title: row.title,
      category: row.category,
      priority: row.priority,
      status: row.status,
      description: row.description,
      resolutionNotes: row.resolution_notes,
      resolvedAt: row.resolved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  findById(id) {
    const row = this.table.findById(id);
    return this._toDomain(row);
  }

  findAllByCondominium(condominiumId) {
    const rows = this.table.findAll({ condominium_id: condominiumId }, { orderBy: 'created_at DESC' });
    return rows.map(r => this._toDomain(r));
  }

  save(occ) {
    const data = {
      condominium_id: occ.condominiumId,
      unit_id: occ.unitId,
      title: occ.title,
      category: occ.category,
      priority: occ.priority,
      status: occ.status,
      description: occ.description,
      resolution_notes: occ.resolutionNotes,
      resolved_at: occ.resolvedAt
    };

    let savedRow;
    if (occ.id) {
      savedRow = this.table.update(occ.id, data);
    } else {
      savedRow = this.table.insert(data);
    }

    const savedEntity = this._toDomain(savedRow);
    DomainEvents.dispatchEventsForAggregate(occ);

    return savedEntity;
  }
}
