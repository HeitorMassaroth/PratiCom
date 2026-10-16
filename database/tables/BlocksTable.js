import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class BlocksTable extends BaseTable {
  static tableName = 'blocks';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    condominium_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'condominiums', column: 'id', onDelete: 'CASCADE' } 
    },
    name: { type: 'TEXT', notNull: true },
    description: { type: 'TEXT' },
    status: { type: 'TEXT', notNull: true, defaultValue: 'ACTIVE', check: "status IN ('ACTIVE', 'INACTIVE')" },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'DATETIME' }
  };

  static compositeUnique = [
    ['condominium_id', 'name']
  ];

  static indexes = [
    { name: 'idx_blocks_condo_id', columns: ['condominium_id'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.condominium_id !== undefined) {
      if (!Number.isInteger(Number(data.condominium_id)) || Number(data.condominium_id) <= 0) {
        throw new DomainValidationError('condominium_id', 'ID do condomínio deve ser um número inteiro positivo', this.tableName);
      }
    }

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length === 0) {
        throw new DomainValidationError('name', 'Identificação do bloco não pode ser vazia', this.tableName);
      }
    }

    return true;
  }
}
