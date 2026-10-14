import {
  PixPaymentProcessor,
  CondoFeePaymentProcessor,
  CardPaymentProcessor
} from '../templates/PaymentTemplate.js';

/**
 * Padrão de Projeto: FACTORY METHOD (Processadores de Pagamento)
 * PaymentProcessorFactory encapsula a criação da estratégia concreta de liquidação financeira.
 */
export class PaymentProcessorFactory {
  static createProcessor(paymentMethod) {
    const normalized = String(paymentMethod || '').toLowerCase();
    switch (normalized) {
      case 'pix':
        return {
          code: 'PIX',
          processor: new PixPaymentProcessor()
        };
      case 'credit_card':
      case 'card':
        return {
          code: 'CARD',
          processor: new CardPaymentProcessor()
        };
      case 'condo_bill':
      case 'condo_fee':
        return {
          code: 'CONDO_FEE',
          processor: new CondoFeePaymentProcessor()
        };
      default:
        throw new Error(`Forma de pagamento não suportada: ${paymentMethod}`);
    }
  }

  static getSupportedMethods() {
    return ['pix', 'credit_card', 'condo_bill'];
  }
}
