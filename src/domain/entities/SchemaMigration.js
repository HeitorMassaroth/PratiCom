// ============================================================================
// PratiCom ERP - DDD Entity: SchemaMigration (Versão de Migração do Esquema)
// Rastreamento histórico de atualizações estruturais do banco de dados SQLite
// ============================================================================

import { Entity } from '../common/Entity.js';

export class SchemaMigration extends Entity {
  constructor(id, props) {
    super(id, props);

    this._version = props.version;
    this._name = props.name;
    this._appliedAt = props.appliedAt || props.applied_at || new Date().toISOString();
    this._executionTimeMs = Number(props.executionTimeMs ?? props.execution_time_ms ?? 0);
  }

  get version() { return this._version; }
  get name() { return this._name; }
  get appliedAt() { return this._appliedAt; }
  get executionTimeMs() { return this._executionTimeMs; }

  static record({ version, name, executionTimeMs }) {
    if (!version) throw new Error('Versão da migração é obrigatória.');
    if (!name) throw new Error('Nome da migração é obrigatório.');

    return new SchemaMigration(null, {
      version,
      name,
      executionTimeMs,
      appliedAt: new Date().toISOString()
    });
  }
}
