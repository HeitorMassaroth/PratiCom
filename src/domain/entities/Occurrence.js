// ============================================================================
// PratiCom ERP - DDD Aggregate Root: Occurrence (Ocorrência / Chamado de Manutenção)
// Gerencia transições de estado, SLA por prioridade e anotações técnicas
// ============================================================================

import { Entity } from '../common/Entity.js';
import { OccurrenceReportedEvent } from '../events/AppEvents.js';

export class Occurrence extends Entity {
  constructor(id, props) {
    super(id, props);

    this._condominiumId = props.condominiumId;
    this._unitId = props.unitId || null;
    this._title = props.title;
    this._category = props.category || 'Geral';
    this._priority = props.priority || 'media';
    this._status = props.status || 'OPEN';
    this._description = props.description;
    this._resolutionNotes = props.resolutionNotes || null;
    this._resolvedAt = props.resolvedAt || null;
  }

  get condominiumId() { return this._condominiumId; }
  get unitId() { return this._unitId; }
  get title() { return this._title; }
  get category() { return this._category; }
  get priority() { return this._priority; }
  get status() { return this._status; }
  get description() { return this._description; }
  get resolutionNotes() { return this._resolutionNotes; }
  get resolvedAt() { return this._resolvedAt; }

  static report(props) {
    if (!props.condominiumId) throw new Error('Ocorrência deve pertencer a um condomínio.');
    if (!props.title || props.title.trim().length < 5) {
      throw new Error('Título da ocorrência deve ter no mínimo 5 caracteres.');
    }
    if (!props.description || props.description.trim().length < 10) {
      throw new Error('Descrição da ocorrência deve ter no mínimo 10 caracteres.');
    }

    const occurrence = new Occurrence(props.id || null, {
      ...props,
      status: 'OPEN'
    });

    occurrence.addDomainEvent(new OccurrenceReportedEvent(
      occurrence.id,
      occurrence.condominiumId,
      occurrence.unitId,
      occurrence.priority,
      occurrence.category
    ));

    return occurrence;
  }

  startProgress(assignedWorker = null) {
    if (this._status !== 'OPEN') {
      throw new Error(`Não é possível iniciar atendimento para ocorrência no status '${this._status}'.`);
    }

    this._status = 'IN_PROGRESS';
    if (assignedWorker) {
      this._resolutionNotes = `Atendimento iniciado por: ${assignedWorker}`;
    }
    this.markModified();
    return this;
  }

  resolve(resolutionNotes) {
    if (this._status === 'RESOLVED') {
      throw new Error('Esta ocorrência já se encontra resolvida.');
    }
    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      throw new Error('Notas de resolução são obrigatórias com no mínimo 5 caracteres.');
    }

    this._status = 'RESOLVED';
    this._resolutionNotes = resolutionNotes.trim();
    this._resolvedAt = new Date().toISOString();
    this.markModified();
    return this;
  }

  reject(reason) {
    if (this._status === 'RESOLVED') {
      throw new Error('Não é possível rejeitar uma ocorrência já concluída com sucesso.');
    }

    this._status = 'REJECTED';
    this._resolutionNotes = `Rejeitado/Indeferido: ${reason}`;
    this.markModified();
    return this;
  }
}
