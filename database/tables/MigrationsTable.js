import { BaseTable } from '../core/BaseTable.js';

export class MigrationsTable extends BaseTable {
  static tableName = 'schema_migrations';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    version: { type: 'TEXT', notNull: true, unique: true },
    name: { type: 'TEXT', notNull: true },
    applied_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    execution_time_ms: { type: 'INTEGER', defaultValue: 0 }
  };

  static indexes = [
    { name: 'idx_migrations_version', columns: ['version'], unique: true }
  ];
}
