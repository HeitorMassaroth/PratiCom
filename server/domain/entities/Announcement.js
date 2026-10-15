import { BaseDomainEntity } from '../BaseDomainEntity.js';

/**
 * Entidade de Domínio: Announcement (Comunicado / Mural de Avisos)
 * Representa os avisos e comunicados da administração para moradores.
 */
export class Announcement extends BaseDomainEntity {
  constructor(data = {}) {
    super(data);
    this._condominiumId = data.condominium_id !== undefined ? Number(data.condominium_id) : (data.condominiumId !== undefined ? Number(data.condominiumId) : null);
    this._blockId = data.block_id !== undefined && data.block_id !== null ? Number(data.block_id) : (data.blockId !== undefined && data.blockId !== null ? Number(data.blockId) : null);
    this._title = data.title ? String(data.title).trim() : '';
    this._message = data.content ? String(data.content).trim() : (data.message ? String(data.message).trim() : '');
    this._priority = data.priority ? String(data.priority).trim().toUpperCase() : 'NORMAL';
    this._pinned = Boolean(data.pinned === 1 || data.pinned === true);
    this._author = data.author ? String(data.author).trim() : 'Administração';
    this._expiresAt = data.expires_at || data.expiresAt || null;
  }

  get condominiumId() { return this._condominiumId; }
  get blockId() { return this._blockId; }
  get title() { return this._title; }
  get message() { return this._message; }
  get priority() { return this._priority; }
  get pinned() { return this._pinned; }
  get author() { return this._author; }
  get expiresAt() { return this._expiresAt; }

  isPinned() {
    return this._pinned;
  }

  isHighPriority() {
    return this._priority === 'HIGH' || this._priority === 'URGENT' || this._priority === 'ALTA';
  }

  isExpired() {
    if (!this._expiresAt) return false;
    const expDate = new Date(this._expiresAt).getTime();
    return !isNaN(expDate) && expDate < Date.now();
  }

  validate() {
    if (!this._condominiumId) {
      throw new Error('ID do condomínio é obrigatório para o comunicado.');
    }
    if (!this._title) {
      throw new Error('Título do comunicado é obrigatório.');
    }
    if (!this._message) {
      throw new Error('Mensagem do comunicado é obrigatória.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      condominium_id: this._condominiumId,
      block_id: this._blockId,
      title: this._title,
      message: this._message,
      priority: this._priority,
      pinned: this._pinned ? 1 : 0,
      author: this._author,
      expires_at: this._expiresAt
    };
  }

  static fromDatabase(row) {
    if (!row) return null;
    return new Announcement(row);
  }
}
