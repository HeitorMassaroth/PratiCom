import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class PollVotesTable extends BaseTable {
  static tableName = 'poll_votes';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    poll_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'polls', column: 'id', onDelete: 'CASCADE' } 
    },
    unit_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'units', column: 'id', onDelete: 'CASCADE' } 
    },
    resident_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'residents', column: 'id', onDelete: 'CASCADE' } 
    },
    selected_option: { type: 'TEXT', notNull: true },
    voted_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    ip_address: { type: 'TEXT' },
    signature_hash: { type: 'TEXT' }
  };

  // Garante que uma unidade/apartamento só vota uma única vez por enquete/assembleia
  static compositeUnique = [
    ['poll_id', 'unit_id']
  ];

  static indexes = [
    { name: 'idx_poll_votes_poll', columns: ['poll_id'] },
    { name: 'idx_poll_votes_unit', columns: ['unit_id'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.selected_option !== undefined) {
      if (typeof data.selected_option !== 'string' || data.selected_option.trim().length === 0) {
        throw new DomainValidationError('selected_option', 'Opção de voto é obrigatória', this.tableName);
      }
    }

    return true;
  }
}
