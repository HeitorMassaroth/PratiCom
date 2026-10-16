import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class PollsTable extends BaseTable {
  static tableName = 'polls';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    condominium_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'condominiums', column: 'id', onDelete: 'CASCADE' } 
    },
    title: { type: 'TEXT', notNull: true },
    description: { type: 'TEXT', notNull: true },
    category: { 
      type: 'TEXT', 
      notNull: true, 
      defaultValue: 'Ordinária',
      check: "category IN ('Ordinária', 'Extraordinária', 'Enquete', 'Obras')"
    },
    quorum_type: { 
      type: 'TEXT', 
      notNull: true, 
      defaultValue: 'SIMPLE_MAJORITY',
      check: "quorum_type IN ('SIMPLE_MAJORITY', 'TWO_THIRDS', 'UNANIMITY')"
    },
    status: { 
      type: 'TEXT', 
      notNull: true, 
      defaultValue: 'OPEN',
      check: "status IN ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED')"
    },
    options: { 
      type: 'TEXT', 
      notNull: true,
      defaultValue: '["Aprovar", "Rejeitar", "Abstenção"]'
    },
    start_date: { type: 'TEXT', notNull: true },
    end_date: { type: 'TEXT', notNull: true },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'DATETIME' }
  };

  static indexes = [
    { name: 'idx_polls_condo_status', columns: ['condominium_id', 'status'] },
    { name: 'idx_polls_end_date', columns: ['end_date'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim().length < 5) {
        throw new DomainValidationError('title', 'Título da votação deve conter no mínimo 5 caracteres', this.tableName);
      }
    }

    if (data.status !== undefined && !['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED'].includes(data.status)) {
      throw new DomainValidationError('status', "Status deve ser 'DRAFT', 'OPEN', 'CLOSED' ou 'CANCELLED'", this.tableName);
    }

    if (data.quorum_type !== undefined && !['SIMPLE_MAJORITY', 'TWO_THIRDS', 'UNANIMITY'].includes(data.quorum_type)) {
      throw new DomainValidationError('quorum_type', "Tipo de quórum deve ser 'SIMPLE_MAJORITY', 'TWO_THIRDS' ou 'UNANIMITY'", this.tableName);
    }

    if (data.start_date && data.end_date) {
      if (new Date(data.end_date) < new Date(data.start_date)) {
        throw new DomainValidationError('end_date', 'Data de término deve ser posterior à data de início', this.tableName);
      }
    }

    return true;
  }
}
