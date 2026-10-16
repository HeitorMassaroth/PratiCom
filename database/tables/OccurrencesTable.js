import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class OccurrencesTable extends BaseTable {
  static tableName = 'occurrences';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    condominium_id: { type: 'INTEGER', notNull: true, foreignKey: { table: 'condominiums', column: 'id', onDelete: 'CASCADE' } },
    unit_id: { type: 'INTEGER', foreignKey: { table: 'units', column: 'id', onDelete: 'SET NULL' } },
    title: { type: 'TEXT', notNull: true },
    category: { 
      type: 'TEXT', 
      notNull: true, 
      defaultValue: 'Hidráulica',
      check: "category IN ('Hidráulica', 'Elétrica', 'Segurança', 'Convivência/Barulho', 'Limpeza', 'Estrutural')" 
    },
    priority: { 
      type: 'TEXT', 
      notNull: true, 
      defaultValue: 'media',
      check: "priority IN ('baixa', 'media', 'alta', 'urgente')" 
    },
    status: { 
      type: 'TEXT', 
      notNull: true, 
      defaultValue: 'OPEN',
      check: "status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')" 
    },
    description: { type: 'TEXT', notNull: true },
    resolution_notes: { type: 'TEXT' },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    resolved_at: { type: 'DATETIME' }
  };

  static indexes = [
    { name: 'idx_occ_condo_status', columns: ['condominium_id', 'status'] },
    { name: 'idx_occ_priority', columns: ['priority'] },
    { name: 'idx_occ_unit', columns: ['unit_id'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim().length < 5) {
        throw new DomainValidationError('title', 'Título da ocorrência deve conter no mínimo 5 caracteres', this.tableName);
      }
    }

    if (data.description !== undefined) {
      if (typeof data.description !== 'string' || data.description.trim().length < 10) {
        throw new DomainValidationError('description', 'Descrição da ocorrência deve conter no mínimo 10 caracteres', this.tableName);
      }
    }

    if (data.status !== undefined && !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].includes(data.status)) {
      throw new DomainValidationError('status', "Status deve ser 'OPEN', 'IN_PROGRESS', 'RESOLVED' ou 'REJECTED'", this.tableName);
    }

    if (data.priority !== undefined && !['baixa', 'media', 'alta', 'urgente'].includes(data.priority)) {
      throw new DomainValidationError('priority', "Prioridade deve ser 'baixa', 'media', 'alta' ou 'urgente'", this.tableName);
    }

    return true;
  }

  static beforeInsert(data) {
    const clean = super.beforeInsert(data);
    if (clean.title) clean.title = clean.title.trim();
    if (clean.description) clean.description = clean.description.trim();
    return clean;
  }
}
