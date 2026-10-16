import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class ResidentsTable extends BaseTable {
  static tableName = 'residents';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    unit_id: { 
      type: 'INTEGER', 
      notNull: true, 
      foreignKey: { table: 'units', column: 'id', onDelete: 'CASCADE' } 
    },
    name: { type: 'TEXT', notNull: true },
    email: { type: 'TEXT' },
    phone: { type: 'TEXT' },
    cpf: { type: 'TEXT' },
    role: { 
      type: 'TEXT', 
      defaultValue: 'Proprietário', 
      check: "role IN ('Proprietário', 'Inquilino', 'Dependente')" 
    },
    emergency_contact: { type: 'TEXT' },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'DATETIME' }
  };

  static indexes = [
    { name: 'idx_residents_unit_id', columns: ['unit_id'] },
    { name: 'idx_residents_cpf', columns: ['cpf'], where: 'cpf IS NOT NULL' }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length < 3) {
        throw new DomainValidationError('name', 'Nome do morador deve ter pelo menos 3 caracteres', this.tableName);
      }
    }

    if (data.role !== undefined && !['Proprietário', 'Inquilino', 'Dependente'].includes(data.role)) {
      throw new DomainValidationError('role', "Papel deve ser 'Proprietário', 'Inquilino' ou 'Dependente'", this.tableName);
    }

    if (data.cpf !== undefined && data.cpf !== null && data.cpf !== '') {
      const sanitized = String(data.cpf).replace(/\D/g, '');
      if (sanitized.length !== 11 && sanitized.length !== 0) {
        throw new DomainValidationError('cpf', 'CPF deve conter exatamente 11 dígitos numéricos', this.tableName);
      }
    }

    return true;
  }

  static beforeInsert(data) {
    const clean = super.beforeInsert(data);
    if (clean.cpf) clean.cpf = String(clean.cpf).replace(/\D/g, '');
    if (clean.name) clean.name = clean.name.trim();
    return clean;
  }
}
