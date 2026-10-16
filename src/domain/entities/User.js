// ============================================================================
// PratiCom ERP - DDD Aggregate Root: User (Usuário do Sistema / RBAC)
// Controle de perfis, acesso a módulos e credenciais com Value Object Email
// ============================================================================

import { Entity } from '../common/Entity.js';
import { Email } from '../value-objects/Email.js';

export const VALID_ROLES = ['ADMIN', 'SINDICO', 'CONSELHEIRO', 'MORADOR', 'TRABALHADOR', 'PORTARIA'];

export class User extends Entity {
  constructor(id, props) {
    super(id, props);

    this._condominiumId = props.condominiumId || props.condominium_id || null;
    this._residentId = props.residentId || props.resident_id || null;
    this._name = props.name;
    this._email = props.email instanceof Email ? props.email : new Email(props.email);
    this._passwordHash = props.passwordHash || props.password_hash;
    this._role = props.role || 'MORADOR';
    this._status = props.status || 'ACTIVE';
  }

  get condominiumId() { return this._condominiumId; }
  get residentId() { return this._residentId; }
  get name() { return this._name; }
  get email() { return this._email; }
  get emailAddress() { return this._email.value; }
  get role() { return this._role; }
  get status() { return this._status; }
  get isActive() { return this._status === 'ACTIVE'; }

  static create(props) {
    if (!props.name || props.name.trim().length < 3) {
      throw new Error('Nome de usuário deve conter no mínimo 3 caracteres.');
    }
    if (!props.email) {
      throw new Error('E-mail é obrigatório para criação de usuário.');
    }
    const role = (props.role || 'MORADOR').toUpperCase();
    if (!VALID_ROLES.includes(role)) {
      throw new Error(`Papel inválido: '${role}'. Papéis válidos: ${VALID_ROLES.join(', ')}`);
    }

    const email = props.email instanceof Email ? props.email : new Email(props.email);

    return new User(props.id || null, {
      ...props,
      email,
      role,
      status: props.status || 'ACTIVE'
    });
  }

  hasRole(expectedRole) {
    return this._role.toUpperCase() === expectedRole.toUpperCase();
  }

  canManageFinances() {
    return ['ADMIN', 'SINDICO'].includes(this._role.toUpperCase());
  }

  canAccessPortaria() {
    return ['ADMIN', 'SINDICO', 'PORTARIA', 'TRABALHADOR'].includes(this._role.toUpperCase());
  }

  changeRole(newRole) {
    const roleUpper = newRole.toUpperCase();
    if (!VALID_ROLES.includes(roleUpper)) {
      throw new Error(`Papel inválido: '${newRole}'.`);
    }
    this._role = roleUpper;
    this.markModified();
    return this;
  }

  deactivate() {
    this._status = 'INACTIVE';
    this.markModified();
    return this;
  }

  activate() {
    this._status = 'ACTIVE';
    this.markModified();
    return this;
  }
}
