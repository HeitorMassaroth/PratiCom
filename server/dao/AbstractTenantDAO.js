import DatabaseSingleton from '../config/DatabaseSingleton.js';

/**
 * Padrão de Projeto: TEMPLATE METHOD (Persistência Base Multi-Tenant)
 * AbstractTenantDAO encapsula o acesso ao banco SQLite e define o esqueleto
 * invariante para consultas e operações protegidas por isolamento de condomínio.
 */
export class AbstractTenantDAO {
  constructor() {
    this.db = DatabaseSingleton.getDb();
  }

  /**
   * Hook para obter a conexão SQLite gerenciada pelo Singleton.
   */
  getDb() {
    return this.db;
  }

  /**
   * Normaliza o identificador do condomínio recebido via objeto de opções ou primitivo.
   */
  resolveCondominiumId(options) {
    if (options === undefined || options === null) return null;
    const raw = typeof options === 'object' ? options.condominiumId : options;
    const parsed = parseInt(raw, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  /**
   * Template Method para geração de escopo SQL de unidades/blocos vinculados ao tenant.
   * Suporta retrocompatibilidade do condomínio padrão (ID 1).
   */
  unitTenantScope(options, { blockAlias = 'b', unitAlias = 'u' } = {}) {
    const condoId = this.resolveCondominiumId(options);
    if (!condoId) return { sql: '', params: [] };

    if (condoId === 1) {
      return {
        sql: ` AND (${blockAlias}.condominium_id = 1 OR ${unitAlias}.block_id IS NULL)`,
        params: []
      };
    }

    return {
      sql: ` AND ${blockAlias}.condominium_id = ?`,
      params: [condoId]
    };
  }

  /**
   * Template Method para geração de escopo direto em tabelas que possuem a coluna condominium_id.
   */
  directTenantScope(options, { tableAlias = '', columnName = 'condominium_id' } = {}) {
    const condoId = this.resolveCondominiumId(options);
    if (!condoId) return { sql: '1=1', params: [] };

    const prefix = tableAlias ? `${tableAlias}.` : '';
    if (condoId === 1) {
      return {
        sql: `(${prefix}${columnName} = 1 OR ${prefix}${columnName} IS NULL)`,
        params: []
      };
    }

    return {
      sql: `${prefix}${columnName} = ?`,
      params: [condoId]
    };
  }
}
