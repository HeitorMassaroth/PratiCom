// ============================================================================
// PratiCom ERP - Base DomainEvent
// Registra fatos consumados de negócio disparados por Agregados
// ============================================================================

export class DomainEvent {
  constructor(aggregateId) {
    this.eventId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    this.occurredOn = new Date().toISOString();
    this.aggregateId = aggregateId;
  }

  get eventName() {
    return this.constructor.name;
  }
}
