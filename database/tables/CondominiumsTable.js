import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class CondominiumsTable extends BaseTable {
  static tableName = 'condominiums';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    name: { type: 'TEXT', notNull: true },
    cnpj: { type: 'TEXT', unique: true },
    address: { type: 'TEXT' },
    city: { type: 'TEXT' },
    state: { type: 'TEXT' },
    postal_code: { type: 'TEXT' },
    phone: { type: 'TEXT' },
    status: { type: 'TEXT', notNull: true, defaultValue: 'ACTIVE', check: "status IN ('ACTIVE', 'INACTIVE')" },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'DATETIME' },
    deleted_at: { type: 'DATETIME' }
  };

  static indexes = [
    { name: 'idx_condo_cnpj', columns: ['cnpj'], unique: true, where: 'cnpj IS NOT NULL' },
    { name: 'idx_condo_status', columns: ['status'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length < 3) {
        throw new DomainValidationError('name', 'Nome do condomínio deve conter no mínimo 3 caracteres', this.tableName);
      }
    }

    if (data.status !== undefined && !['ACTIVE', 'INACTIVE'].includes(data.status)) {
      throw new DomainValidationError('status', "Status deve ser estritamente 'ACTIVE' ou 'INACTIVE'", this.tableName);
    }

    if (data.cnpj !== undefined && data.cnpj !== null && data.cnpj !== '') {
      const sanitized = String(data.cnpj).replace(/\D/g, '');
      if (sanitized.length !== 14 && sanitized.length !== 0) {
        throw new DomainValidationError('cnpj', 'CNPJ deve conter 14 dígitos numéricos', this.tableName);
      }
    }

    return true;
  }

  static beforeInsert(data) {
    const clean = super.beforeInsert(data);
    if (clean.name) clean.name = clean.name.trim();
    return clean;
  }
}
