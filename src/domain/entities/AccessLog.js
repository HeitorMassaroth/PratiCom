// ============================================================================
// PratiCom ERP - DDD Entity: AccessLog (Registro de Entrada e Saída na Portaria)
// Rastreamento de fluxo de pedestres, visitantes, prestadores e entregadores
// ============================================================================

import { Entity } from '../common/Entity.js';

export class AccessLog extends Entity {
  constructor(id, props) {
    super(id, props);

    this._destinationUnitId = props.destinationUnitId || props.destination_unit_id;
    this._visitorName = props.visitorName || props.visitor_name;
    this._document = props.document || null;
    this._type = props.type || 'Visitante';
    this._company = props.company || null;
    this._status = props.status || 'IN_PROPERTY';
    this._enteredAt = props.enteredAt || props.entered_at || new Date().toISOString();
    this._exitedAt = props.exitedAt || props.exited_at || null;
  }

  get destinationUnitId() { return this._destinationUnitId; }
  get visitorName() { return this._visitorName; }
  get document() { return this._document; }
  get type() { return this._type; }
  get company() { return this._company; }
  get status() { return this._status; }
  get enteredAt() { return this._enteredAt; }
  get exitedAt() { return this._exitedAt; }
  get isInProperty() { return this._status === 'IN_PROPERTY'; }

  static recordEntry(props) {
    if (!props.destinationUnitId && !props.destination_unit_id) {
      throw new Error('A unidade de destino é obrigatória para autorização de entrada.');
    }
    if (!props.visitorName && !props.visitor_name) {
      throw new Error('Nome do visitante/prestador é obrigatório.');
    }

    return new AccessLog(props.id || null, {
      ...props,
      status: 'IN_PROPERTY',
      enteredAt: props.enteredAt || props.entered_at || new Date().toISOString(),
      exitedAt: null
    });
  }

  recordExit() {
    if (this._status === 'EXITED') {
      throw new Error('A saída deste visitante já foi registrada previamente.');
    }

    this._status = 'EXITED';
    this._exitedAt = new Date().toISOString();
    this.markModified();
    return this;
  }

  getStayDurationMinutes() {
    const end = this._exitedAt ? new Date(this._exitedAt) : new Date();
    const start = new Date(this._enteredAt);
    return Math.max(0, Math.round((end - start) / 60000));
  }
}
