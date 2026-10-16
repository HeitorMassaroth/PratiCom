// ============================================================================
// PratiCom ERP - DDD Entity: AuditLog (Trilha de Auditoria LGPD e Segurança)
// Registro imutável de eventos e mutações realizadas por usuários do sistema
// ============================================================================

import { Entity } from '../common/Entity.js';

export class AuditLog extends Entity {
  constructor(id, props) {
    super(id, props);

    this._condominiumId = props.condominiumId || props.condominium_id;
    this._userId = props.userId || props.user_id;
    this._userRole = props.userRole || props.user_role;
    this._action = props.action;
    this._targetTable = props.targetTable || props.target_table;
    this._targetId = props.targetId || props.target_id;
    this._oldValues = props.oldValues || props.old_values || null;
    this._newValues = props.newValues || props.new_values || null;
    this._ipAddress = props.ipAddress || props.ip_address || null;
  }

  get condominiumId() { return this._condominiumId; }
  get userId() { return this._userId; }
  get userRole() { return this._userRole; }
  get action() { return this._action; }
  get targetTable() { return this._targetTable; }
  get targetId() { return this._targetId; }
  get oldValues() { return this._oldValues; }
  get newValues() { return this._newValues; }
  get ipAddress() { return this._ipAddress; }

  static record(props) {
    if (!props.action) throw new Error('Ação de auditoria é obrigatória.');
    if (!props.targetTable && !props.target_table) throw new Error('Tabela alvo é obrigatória.');

    return new AuditLog(props.id || null, {
      ...props
    });
  }

  isSecurityCritical() {
    const criticalActions = ['DELETE', 'ROLE_CHANGE', 'PASSWORD_RESET', 'SYSTEM_CONFIG', 'PERMISSION_UPDATE'];
    return criticalActions.some(ca => this._action.toUpperCase().includes(ca));
  }
}
