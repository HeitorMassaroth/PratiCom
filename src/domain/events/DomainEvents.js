// ============================================================================
// PratiCom ERP - DomainEvents Dispatcher (Bus de Eventos de Domínio)
// Permite comunicação assíncrona desacoplada entre agregados e serviços
// ============================================================================

export class DomainEvents {
  static handlersMap = new Map();

  static subscribe(eventClassName, handler) {
    if (!this.handlersMap.has(eventClassName)) {
      this.handlersMap.set(eventClassName, []);
    }
    this.handlersMap.get(eventClassName).push(handler);
  }

  static publish(event) {
    const eventName = event.constructor.name;
    const handlers = this.handlersMap.get(eventName) || [];
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (err) {
        console.error(`[DomainEvents] Erro ao executar handler para ${eventName}:`, err);
      }
    }
  }

  static dispatchEventsForAggregate(aggregate) {
    if (!aggregate || typeof aggregate.domainEvents === 'undefined') return;
    const events = aggregate.domainEvents;
    for (const event of events) {
      this.publish(event);
    }
    aggregate.clearDomainEvents();
  }

  static clearHandlers() {
    this.handlersMap.clear();
  }
}
