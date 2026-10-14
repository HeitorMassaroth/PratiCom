import { BaseDomainEntity } from '../BaseDomainEntity.js';

/**
 * Entidade de Domínio: Block (Bloco / Torre)
 * Representa a divisão territorial de um condomínio.
 */
export class Block extends BaseDomainEntity {
  constructor(data = {}) {
    super(data);
    this._condominiumId = data.condominium_id !== undefined ? Number(data.condominium_id) : (data.condominiumId !== undefined ? Number(data.condominiumId) : null);
    this._name = data.name ? String(data.name).trim() : '';
    this._description = data.description ? String(data.description).trim() : '';
    this._status = data.status || 'ACTIVE';
  }

  get condominiumId() { return this._condominiumId; }
  get name() { return this._name; }
  get description() { return this._description; }
  get status() { return this._status; }

  isActive() {
    return this._status === 'ACTIVE';
  }

  normalizeName() {
    return this._name.trim().toUpperCase();
  }

  validate() {
    if (!this._condominiumId) {
      throw new Error('ID do condomínio é obrigatório para o bloco.');
    }
    if (!this._name) {
      throw new Error('Nome do bloco é obrigatório.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      condominium_id: this._condominiumId,
      name: this._name,
      description: this._description,
      status: this._status
    };
  }

  static fromDatabase(row) {
    if (!row) return null;
    return new Block(row);
  }
}
