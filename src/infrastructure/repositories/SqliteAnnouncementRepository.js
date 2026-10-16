// ============================================================================
// PratiCom ERP - Infrastructure Adapter: SqliteAnnouncementRepository
// Persistência de avisos e comunicados no mural
// ============================================================================

import { Announcement } from '../../domain/entities/Announcement.js';

export class SqliteAnnouncementRepository {
  constructor(databaseEngine) {
    this.table = databaseEngine.getTable('announcements');
  }

  _toDomain(row) {
    if (!row) return null;
    return new Announcement(row.id, {
      condominiumId: row.condominium_id,
      title: row.title,
      content: row.content,
      category: row.category,
      priority: row.priority,
      isPinned: Boolean(row.is_pinned),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  findById(id) {
    const row = this.table.findById(id);
    return this._toDomain(row);
  }

  findAllByCondominium(condominiumId) {
    const rows = this.table.findAll({ condominium_id: condominiumId }, { orderBy: 'is_pinned DESC, created_at DESC' });
    return rows.map(r => this._toDomain(r));
  }

  save(announcement) {
    const data = {
      condominium_id: announcement.condominiumId,
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      priority: announcement.priority,
      is_pinned: announcement.isPinned ? 1 : 0
    };

    let savedRow;
    if (announcement.id) {
      savedRow = this.table.update(announcement.id, data);
    } else {
      savedRow = this.table.insert(data);
    }

    return this._toDomain(savedRow);
  }
}
