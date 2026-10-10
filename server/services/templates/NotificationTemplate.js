/**
 * Padrão de Projeto: TEMPLATE METHOD (3/3)
 * AbstractNotificationDispatcher define o fluxo de envio de notificações e alertas.
 */
export class AbstractNotificationDispatcher {
  sendNotification(recipientData, messageContent) {
    const recipient = this.buildRecipient(recipientData);
    const formatted = this.formatMessage(messageContent);
    const result = this.deliver(recipient, formatted);
    this.logNotification(recipient, result);
    return result;
  }

  buildRecipient(recipientData) {
    return {
      name: recipientData.name || 'Morador',
      contact: recipientData.phone || recipientData.email || 'Unidade'
    };
  }

  formatMessage(content) {
    throw new Error('O método formatMessage() deve ser implementado pela subclasse.');
  }

  deliver(recipient, message) {
    console.log(`📡 Disparando notificação para [${recipient.name} - ${recipient.contact}]: ${message}`);
    return { success: true, deliveredAt: new Date().toISOString() };
  }

  logNotification(recipient, result) {
    // Registra log do despacho
  }
}

export class DeliveryNotificationDispatcher extends AbstractNotificationDispatcher {
  formatMessage(content) {
    return `📦 [PRATICOM] Olá, você possui uma nova encomenda (${content.courier}) aguardando retirada na portaria. Código: ${content.pickup_code}`;
  }
}

export class AnnouncementNotificationDispatcher extends AbstractNotificationDispatcher {
  formatMessage(content) {
    return `📢 [AVISO CONDOMINIAL] ${content.title}: ${content.content}`;
  }
}
