// ============================================================================
// PratiCom ERP - DDD Entity: Resident (Morador do Condomínio)
// Encapsula validação de CPF, papéis residenciais e contatos de emergência
// ============================================================================

import { Entity } from '../common/Entity.js';
import { CPF } from '../value-objects/CPF.js';

export class Resident extends Entity {
  constructor(id, props) {
    super(id, props);

    this._unitId = props.unitId;
    this._name = props.name;
    this._email = props.email || null;
    this._phone = props.phone || null;
    this._cpf = props.cpf ? (props.cpf instanceof CPF ? props.cpf : new CPF(props.cpf)) : null;
    this._role = props.role || 'Morador';
    this._emergencyContact = props.emergencyContact || null;
  }

  get unitId() { return this._unitId; }
  get name() { return this._name; }
  get email() { return this._email; }
  get phone() { return this._phone; }
  get cpf() { return this._cpf; }
  get role() { return this._role; }
  get emergencyContact() { return this._emergencyContact; }

  static create(props) {
    if (!props.unitId) throw new Error('O morador deve pertencer a uma unidade.');
    if (!props.name || props.name.trim().length < 3) throw new Error('Nome do morador deve ter pelo menos 3 caracteres.');

    const cpf = props.cpf ? new CPF(props.cpf) : null;

    return new Resident(props.id || null, {
      ...props,
      cpf
    });
  }

  updateContact(email, phone, emergencyContact) {
    if (email) this._email = email.trim();
    if (phone) this._phone = phone.trim();
    if (emergencyContact) this._emergencyContact = emergencyContact.trim();
    this.markModified();
    return this;
  }
}
