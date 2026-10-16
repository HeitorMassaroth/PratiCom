// ============================================================================
// PratiCom ERP - DDD Aggregate Root: Poll (Assembleia / Votação Virtual)
// Gerencia quórum condominial, votos de unidades e apuração auditável
// ============================================================================

import { Entity } from '../common/Entity.js';
import { PollVoteCastEvent } from '../events/AppEvents.js';

export class Poll extends Entity {
  constructor(id, props) {
    super(id, props);

    this._condominiumId = props.condominiumId;
    this._title = props.title;
    this._description = props.description;
    this._category = props.category || 'Ordinária';
    this._quorumType = props.quorumType || 'SIMPLE_MAJORITY';
    this._status = props.status || 'OPEN';
    this._options = Array.isArray(props.options) 
      ? props.options 
      : (typeof props.options === 'string' ? JSON.parse(props.options) : ['Aprovar', 'Rejeitar', 'Abstenção']);
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._votes = Array.isArray(props.votes) ? [...props.votes] : [];
  }

  get condominiumId() { return this._condominiumId; }
  get title() { return this._title; }
  get description() { return this._description; }
  get category() { return this._category; }
  get quorumType() { return this._quorumType; }
  get status() { return this._status; }
  get options() { return [...this._options]; }
  get startDate() { return this._startDate; }
  get endDate() { return this._endDate; }
  get votes() { return [...this._votes]; }
  get totalVotes() { return this._votes.length; }

  static create(props) {
    if (!props.condominiumId) throw new Error('Votação deve pertencer a um condomínio.');
    if (!props.title || props.title.trim().length < 5) throw new Error('Título da votação deve ter no mínimo 5 caracteres.');
    if (!props.startDate || !props.endDate) throw new Error('Datas de início e término são obrigatórias.');

    return new Poll(props.id || null, {
      ...props,
      status: 'OPEN',
      votes: []
    });
  }

  hasUnitVoted(unitId) {
    return this._votes.some(v => Number(v.unitId) === Number(unitId));
  }

  castVote({ unitId, residentId, selectedOption, ipAddress = null, signatureHash = null }) {
    if (this._status !== 'OPEN') {
      throw new Error(`Esta votação está '${this._status}' e não aceita novos votos.`);
    }

    const now = new Date().toISOString().split('T')[0];
    if (this._endDate && now > this._endDate) {
      throw new Error(`O prazo para votação encerrou em ${this._endDate}.`);
    }

    if (this.hasUnitVoted(unitId)) {
      throw new Error(`A unidade #${unitId} já registrou seu voto nesta deliberação.`);
    }

    if (!this._options.includes(selectedOption)) {
      throw new Error(`Opção '${selectedOption}' inválida. Opções válidas: ${this._options.join(', ')}`);
    }

    const vote = {
      pollId: this.id,
      unitId,
      residentId,
      selectedOption,
      votedAt: new Date().toISOString(),
      ipAddress,
      signatureHash: signatureHash || `hash_${Date.now()}_u${unitId}`
    };

    this._votes.push(vote);
    this.markModified();

    this.addDomainEvent(new PollVoteCastEvent(
      this.id,
      unitId,
      selectedOption
    ));

    return vote;
  }

  closeVoting() {
    this._status = 'CLOSED';
    this.markModified();
    return this;
  }

  /**
   * Apura os resultados dos votos e verifica se o quórum foi atingido
   */
  tallyResults(totalCondominiumUnits = 0) {
    const tally = {};
    for (const opt of this._options) {
      tally[opt] = 0;
    }

    for (const vote of this._votes) {
      if (tally[vote.selectedOption] !== undefined) {
        tally[vote.selectedOption]++;
      }
    }

    const totalVoted = this._votes.length;
    const turnoutPct = totalCondominiumUnits > 0 ? (totalVoted / totalCondominiumUnits) * 100 : 0;

    let quorumReached = false;
    if (this._quorumType === 'SIMPLE_MAJORITY') {
      quorumReached = totalVoted > 0;
    } else if (this._quorumType === 'TWO_THIRDS') {
      quorumReached = totalCondominiumUnits > 0 && totalVoted >= Math.ceil((totalCondominiumUnits * 2) / 3);
    } else if (this._quorumType === 'UNANIMITY') {
      quorumReached = totalCondominiumUnits > 0 && totalVoted === totalCondominiumUnits;
    }

    return {
      pollId: this.id,
      title: this.title,
      quorumType: this._quorumType,
      status: this._status,
      totalVotes: totalVoted,
      totalUnits: totalCondominiumUnits,
      turnoutPercentage: Number(turnoutPct.toFixed(1)),
      quorumReached,
      breakdown: Object.entries(tally).map(([option, count]) => ({
        option,
        votes: count,
        percentage: totalVoted > 0 ? Number(((count / totalVoted) * 100).toFixed(1)) : 0
      }))
    };
  }
}
