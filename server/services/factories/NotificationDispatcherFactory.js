import {
  DeliveryNotificationDispatcher,
  AnnouncementNotificationDispatcher
} from '../templates/NotificationTemplate.js';

/**
 * Padrão de Projeto: FACTORY METHOD (GoF Canônico)
 * 1. Creator Abstrato: Declara o Factory Method 'createDispatcher()'
 */
export class NotificationDispatcherCreator {
  /**
   * Factory Method abstrato que as subclasses devem implementar.
   */
  createDispatcher() {
    throw new Error('O Factory Method createDispatcher() deve ser implementado pela subclasse.');
  }

  notify(recipientData, messageContent) {
    const dispatcher = this.createDispatcher();
    return dispatcher.sendNotification(recipientData, messageContent);
  }
}

/**
 * 2. Criadores Concretos (Concrete Creators):
 * Subclasses que sobrescrevem o Factory Method para instanciar despachantes específicos.
 */
export class DeliveryNotificationCreator extends NotificationDispatcherCreator {
  createDispatcher() {
    return new DeliveryNotificationDispatcher();
  }
}

export class AnnouncementNotificationCreator extends NotificationDispatcherCreator {
  createDispatcher() {
    return new AnnouncementNotificationDispatcher();
  }
}

/**
 * 3. Ponto Central de Seleção de Criadores
 */
export class NotificationDispatcherFactory {
  static getCreator(eventType) {
    const normalized = String(eventType || '').toLowerCase();
    switch (normalized) {
      case 'delivery':
      case 'encomenda':
        return new DeliveryNotificationCreator();
      case 'announcement':
      case 'comunicado':
      case 'aviso':
        return new AnnouncementNotificationCreator();
      default:
        throw new Error(`Tipo de notificador não suportado: ${eventType}`);
    }
  }

  static createDispatcher(eventType) {
    return NotificationDispatcherFactory.getCreator(eventType).createDispatcher();
  }
}
