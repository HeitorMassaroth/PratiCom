// ============================================================================
// PratiCom ERP - DDD Entity: Announcement (Comunicado / Mural de Avisos)
// Avisos internos do condomínio, manutenções, convocações e alertas
// ============================================================================

import { Entity } from '../common/Entity.js';

export class Announcement extends Entity {
  constructor(id, props) {
    super(id, props);

    this._condominiumId = props.condominiumId || props.condominium_id;
    this._title = props.title;
    this._content = props.content;
    this._category = props.category || 'Geral';
    this._priority = props.priority || 'normal';
    this._isPinned = Boolean(props.isPinned ?? props.is_pinned ?? false);
  }

  get condominiumId() { return this._condominiumId; }
  get title() { return this._title; }
  get content() { return this._content; }
  get category() { return this._category; }
  get priority() { return this._priority; }
  get isPinned() { return this._isPinned; }
  get isUrgent() { return this._priority === 'urgente' || this._priority === 'alta'; }

  static create(props) {
    if (!props.condominiumId && !props.condominium_id) {
      throw new Error('O aviso deve pertencer a um condomínio.');
    }
    if (!props.title || props.title.trim().length < 4) {
      throw new Error('Título do comunicado deve ter pelo menos 4 caracteres.');
    }
    if (!props.content || props.content.trim().length < 8) {
      throw new Error('Conteúdo do comunicado deve ter pelo menos 8 caracteres.');
    }

    return new Announcement(props.id || null, {
      ...props,
      isPinned: Boolean(props.isPinned ?? props.is_pinned ?? false)
    });
  }

  pin() {
    this._isPinned = true;
    this.markModified();
    return this;
  }

  unpin() {
    this._isPinned = false;
    this.markModified();
    return this;
  }
}
