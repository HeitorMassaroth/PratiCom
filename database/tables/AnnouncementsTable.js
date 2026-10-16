import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class AnnouncementsTable extends BaseTable {
  static tableName = 'announcements';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    condominium_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'condominiums', column: 'id', onDelete: 'CASCADE' } 
    },
    title: { type: 'TEXT', notNull: true },
    content: { type: 'TEXT', notNull: true },
    category: { type: 'TEXT', defaultValue: 'Geral' },
    priority: { 
      type: 'TEXT', 
      defaultValue: 'normal', 
      check: "priority IN ('normal', 'urgente', 'alta')" 
    },
    is_pinned: { type: 'INTEGER', defaultValue: 0 },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' }
  };

  static indexes = [
    { name: 'idx_announcements_condo', columns: ['condominium_id'] },
    { name: 'idx_announcements_priority', columns: ['priority', 'is_pinned'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim().length < 3) {
        throw new DomainValidationError('title', 'Título do comunicado deve conter no mínimo 3 caracteres', this.tableName);
      }
    }

    if (data.priority !== undefined && !['normal', 'urgente', 'alta'].includes(data.priority)) {
      throw new DomainValidationError('priority', "Prioridade deve ser 'normal', 'urgente' ou 'alta'", this.tableName);
    }

    return true;
  }
}
