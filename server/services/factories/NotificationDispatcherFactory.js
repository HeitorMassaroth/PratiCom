import {
  DeliveryNotificationDispatcher,
  AnnouncementNotificationDispatcher
} from '../templates/NotificationTemplate.js';

/**
 * Padrão de Projeto: FACTORY METHOD (Despachantes de Notificação)
 * NotificationDispatcherFactory encapsula a instanciação do despachante adequado
 * para mensageria e alertas internos do condomínio.
 */
export class NotificationDispatcherFactory {
  static createDispatcher(eventType) {
    const normalized = String(eventType || '').toLowerCase();
    switch (normalized) {
      case 'delivery':
      case 'encomenda':
        return new DeliveryNotificationDispatcher();
      case 'announcement':
      case 'comunicado':
      case 'aviso':
        return new AnnouncementNotificationDispatcher();
      default:
        throw new Error(`Tipo de notificador não suportado: ${eventType}`);
    }
  }
}
