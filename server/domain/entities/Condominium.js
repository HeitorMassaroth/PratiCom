import { BaseDomainEntity } from '../BaseDomainEntity.js';

/**
 * Entidade de Domínio: Condominium (Condomínio / Tenant Raiz)
 * Representa a raiz de isolamento multi-tenant do ERP.
 */
export class Condominium extends BaseDomainEntity {
  constructor(data = {}) {
    super(data);
    this._name = data.name ? String(data.name).trim() : '';
    this._address = data.address ? String(data.address).trim() : '';
    this._cnpj = data.cnpj ? String(data.cnpj).trim() : null;
    this._contactPhone = data.contact_phone || data.contactPhone || null;
    this._status = data.status || 'ACTIVE';
  }

  get name() { return this._name; }
  get address() { return this._address; }
  get cnpj() { return this._cnpj; }
  get contactPhone() { return this._contactPhone; }
  get status() { return this._status; }

  isActive() {
    return this._status === 'ACTIVE';
  }

  activate() {
    this._status = 'ACTIVE';
  }

  deactivate() {
    this._status = 'INACTIVE';
  }

  validate() {
    if (!this._name) {
      throw new Error('Nome do condomínio é obrigatório.');
    }
    if (this._name.length < 3) {
      throw new Error('Nome do condomínio deve ter no mínimo 3 caracteres.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this._name,
      address: this._address,
      cnpj: this._cnpj,
      contact_phone: this._contactPhone,
      status: this._status,
      created_at: this.createdAt
    };
  }

  static fromDatabase(row) {
    if (!row) return null;
    return new Condominium(row);
  }
}
