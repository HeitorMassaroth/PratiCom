// ============================================================================
// PratiCom ERP - DDD Entity: PollVote (Voto Registrado em Assembleia)
// Voto auditável vinculado a uma unidade residencial e morador
// ============================================================================

import { Entity } from '../common/Entity.js';

export class PollVote extends Entity {
  constructor(id, props) {
    super(id, props);

    this._pollId = props.pollId || props.poll_id;
    this._unitId = props.unitId || props.unit_id;
    this._residentId = props.residentId || props.resident_id;
    this._selectedOption = props.selectedOption || props.selected_option;
    this._votedAt = props.votedAt || props.voted_at || new Date().toISOString();
    this._ipAddress = props.ipAddress || props.ip_address || null;
    this._signatureHash = props.signatureHash || props.signature_hash || null;
  }

  get pollId() { return this._pollId; }
  get unitId() { return this._unitId; }
  get residentId() { return this._residentId; }
  get selectedOption() { return this._selectedOption; }
  get votedAt() { return this._votedAt; }
  get ipAddress() { return this._ipAddress; }
  get signatureHash() { return this._signatureHash; }

  static cast(props) {
    if (!props.pollId && !props.poll_id) throw new Error('Voto deve pertencer a uma votação/assembleia.');
    if (!props.unitId && !props.unit_id) throw new Error('Voto deve pertencer a uma unidade.');
    if (!props.selectedOption && !props.selected_option) throw new Error('Opção escolhida é obrigatória.');

    return new PollVote(props.id || null, {
      ...props,
      votedAt: props.votedAt || props.voted_at || new Date().toISOString()
    });
  }
}
