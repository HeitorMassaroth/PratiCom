import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class AuditLogsTable extends BaseTable {
  static tableName = 'audit_logs';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    condominium_id: { type: 'INTEGER' },
    user_id: { type: 'INTEGER' },
    user_role: { type: 'TEXT' },
    action: { type: 'TEXT', notNull: true }, // 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', etc.
    target_table: { type: 'TEXT', notNull: true },
    target_id: { type: 'INTEGER' },
    old_values: { type: 'TEXT' }, // JSON string snapshot
    new_values: { type: 'TEXT' }, // JSON string snapshot
    ip_address: { type: 'TEXT' },
    user_agent: { type: 'TEXT' },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' }
  };

  static indexes = [
    { name: 'idx_audit_condo_date', columns: ['condominium_id', 'created_at'] },
    { name: 'idx_audit_target', columns: ['target_table', 'target_id'] },
    { name: 'idx_audit_user', columns: ['user_id'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.action !== undefined && (!data.action || data.action.trim().length === 0)) {
      throw new DomainValidationError('action', 'Ação de auditoria é obrigatória', this.tableName);
    }

    if (data.target_table !== undefined && (!data.target_table || data.target_table.trim().length === 0)) {
      throw new DomainValidationError('target_table', 'Tabela alvo é obrigatória', this.tableName);
    }

    return true;
  }
}
