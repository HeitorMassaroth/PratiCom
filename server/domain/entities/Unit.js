import { BaseDomainEntity } from '../BaseDomainEntity.js';

/**
 * Entidade de Domínio: Unit (Unidade / Apartamento)
 * Representa uma unidade habitacional ou comercial vinculada a um bloco.
 */
export class Unit extends BaseDomainEntity {
  constructor(data = {}) {
    super(data);
    this._blockId = data.block_id !== undefined ? (data.block_id !== null ? Number(data.block_id) : null) : (data.blockId !== undefined ? Number(data.blockId) : null);
    this._block = data.block ? String(data.block).trim() : '';
    this._number = data.number ? String(data.number).trim() : '';
    this._floor = data.floor !== undefined && data.floor !== null ? Number(data.floor) : null;
    this._type = data.type ? String(data.type).trim() : 'APARTMENT';
  }

  get blockId() { return this._blockId; }
  get block() { return this._block; }
  get number() { return this._number; }
  get floor() { return this._floor; }
  get type() { return this._type; }

  getFullIdentifier() {
    return this._block ? `${this._block} - ${this._number}` : `Apto ${this._number}`;
  }

  isPenthouse() {
    return this._type.toUpperCase() === 'PENTHOUSE' || this._type.toUpperCase() === 'COBERTURA';
  }

  validate() {
    if (!this._number) {
      throw new Error('Número da unidade é obrigatório.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      block_id: this._blockId,
      block: this._block,
      number: this._number,
      floor: this._floor,
      type: this._type
    };
  }

  static fromDatabase(row) {
    if (!row) return null;
    return new Unit(row);
  }
}
