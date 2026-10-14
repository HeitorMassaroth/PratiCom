import { BaseDomainEntity } from '../BaseDomainEntity.js';

/**
 * Entidade de Domínio: Resident (Morador / Ocupante)
 * Representa uma pessoa física vinculada a uma unidade residencial.
 */
export class Resident extends BaseDomainEntity {
  constructor(data = {}) {
    super(data);
    this._unitId = data.unit_id !== undefined ? Number(data.unit_id) : (data.unitId !== undefined ? Number(data.unitId) : null);
    this._name = data.name ? String(data.name).trim() : '';
    this._email = data.email ? String(data.email).trim() : null;
    this._phone = data.phone ? String(data.phone).trim() : null;
    this._cpf = data.cpf ? String(data.cpf).trim() : null;
    this._role = data.role ? String(data.role).trim() : 'RESIDENT';
    this._emergencyContact = data.emergency_contact || data.emergencyContact || null;
  }

  get unitId() { return this._unitId; }
  get name() { return this._name; }
  get email() { return this._email; }
  get phone() { return this._phone; }
  get cpf() { return this._cpf; }
  get role() { return this._role; }
  get emergencyContact() { return this._emergencyContact; }

  isOwner() {
    const roleUpper = (this._role || '').toUpperCase();
    return roleUpper === 'PROPRIETÁRIO' || roleUpper === 'OWNER';
  }

  isTenant() {
    const roleUpper = (this._role || '').toUpperCase();
    return roleUpper === 'INQUILINO' || roleUpper === 'TENANT';
  }

  hasEmergencyContact() {
    return Boolean(this._emergencyContact && String(this._emergencyContact).trim().length > 0);
  }

  validate() {
    if (!this._unitId) {
      throw new Error('Unidade é obrigatória.');
    }
    if (!this._name) {
      throw new Error('Nome é obrigatório.');
    }
    if (this._name.length < 2) {
      throw new Error('Nome deve conter ao menos 2 caracteres.');
    }
  }

  toJSON() {
    return {
      id: this.id,
      unit_id: this._unitId,
      name: this._name,
      email: this._email,
      phone: this._phone,
      cpf: this._cpf,
      role: this._role,
      emergency_contact: this._emergencyContact
    };
  }

  static fromDatabase(row) {
    if (!row) return null;
    return new Resident(row);
  }
}
