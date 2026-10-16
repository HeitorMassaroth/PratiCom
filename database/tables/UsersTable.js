import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class UsersTable extends BaseTable {
  static tableName = 'users';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    condominium_id: { 
      type: 'INTEGER', 
      foreignKey: { table: 'condominiums', column: 'id', onDelete: 'CASCADE' } 
    },
    resident_id: { 
      type: 'INTEGER', 
      foreignKey: { table: 'residents', column: 'id', onDelete: 'SET NULL' } 
    },
    name: { type: 'TEXT', notNull: true },
    email: { type: 'TEXT', notNull: true, unique: true },
    password_hash: { type: 'TEXT', notNull: true },
    role: { 
      type: 'TEXT', 
      notNull: true, 
      defaultValue: 'MORADOR', 
      check: "role IN ('ADMIN', 'SINDICO', 'TRABALHADOR', 'MORADOR')" 
    },
    status: { 
      type: 'TEXT', 
      notNull: true, 
      defaultValue: 'ACTIVE', 
      check: "status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE')" 
    },
    last_login_at: { type: 'DATETIME' },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'DATETIME' }
  };

  static indexes = [
    { name: 'idx_users_email', columns: ['email'], unique: true },
    { name: 'idx_users_role_status', columns: ['role', 'status'] },
    { name: 'idx_users_condo', columns: ['condominium_id'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        throw new DomainValidationError('email', 'E-mail informado possui formato inválido', this.tableName);
      }
    }

    if (data.role !== undefined && !['ADMIN', 'SINDICO', 'TRABALHADOR', 'MORADOR'].includes(data.role)) {
      throw new DomainValidationError('role', "Perfil deve ser 'ADMIN', 'SINDICO', 'TRABALHADOR' ou 'MORADOR'", this.tableName);
    }

    return true;
  }
}
