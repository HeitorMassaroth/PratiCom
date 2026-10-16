// ============================================================================
// PratiCom ERP - DDD Entity & Aggregate Root Base Class
// Possui identidade única, controla invariantes e enfileira eventos de domínio
// ============================================================================

export class Entity {
  constructor(id, props = {}) {
    this._id = id !== undefined && id !== null ? id : null;
    this._props = { ...props };
    this._domainEvents = [];
    this._createdAt = props.createdAt || new Date().toISOString();
    this._updatedAt = props.updatedAt || new Date().toISOString();
  }

  get id() {
    return this._id;
  }

  get createdAt() {
    return this._createdAt;
  }

  get updatedAt() {
    return this._updatedAt;
  }

  get domainEvents() {
    return [...this._domainEvents];
  }

  addDomainEvent(event) {
    this._domainEvents.push(event);
  }

  clearDomainEvents() {
    this._domainEvents = [];
  }

  markModified() {
    this._updatedAt = new Date().toISOString();
  }

  equals(entity) {
    if (entity === null || entity === undefined) return false;
    if (entity.constructor !== this.constructor) return false;
    if (this._id === null || entity.id === null) return false;
    return this._id === entity.id;
  }
}
