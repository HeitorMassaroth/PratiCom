import {
  PixPaymentProcessor,
  CondoFeePaymentProcessor,
  CardPaymentProcessor
} from '../templates/PaymentTemplate.js';

/**
 * Padrão de Projeto: FACTORY METHOD (GoF Canônico)
 * 1. Creator Abstrato: Declara o Factory Method abstrato 'createProcessor()'
 *    e opcionalmente operações de negócio que dependem do produto criado.
 */
export class PaymentProcessorCreator {
  /**
   * Factory Method abstrato que deve ser implementado pelas subclasses criadoras.
   */
  createProcessor() {
    throw new Error('O Factory Method createProcessor() deve ser implementado pela subclasse concreta.');
  }

  /**
   * Operação padrão de negócio que utiliza o produto retornado pelo Factory Method.
   */
  process(paymentData) {
    const processor = this.createProcessor();
    return processor.processPayment(paymentData);
  }
}

/**
 * 2. Criadores Concretos (Concrete Creators):
 * Cada subclasse sobrescreve o Factory Method para retornar uma instância
 * do seu produto de pagamento específico.
 */
export class PixPaymentCreator extends PaymentProcessorCreator {
  createProcessor() {
    return new PixPaymentProcessor();
  }
}

export class CardPaymentCreator extends PaymentProcessorCreator {
  createProcessor() {
    return new CardPaymentProcessor();
  }
}

export class CondoFeePaymentCreator extends PaymentProcessorCreator {
  createProcessor() {
    return new CondoFeePaymentProcessor();
  }
}

/**
 * 3. Mapeador e Ponto de Acesso Central de Criadores
 * Mantém compatibilidade com o checkout do PDV instanciando via Criadores Concretos GoF.
 */
export class PaymentProcessorFactory {
  static getCreator(paymentMethod) {
    const normalized = String(paymentMethod || '').toLowerCase();
    switch (normalized) {
      case 'pix':
        return new PixPaymentCreator();
      case 'credit_card':
      case 'card':
        return new CardPaymentCreator();
      case 'condo_bill':
      case 'condo_fee':
        return new CondoFeePaymentCreator();
      default:
        throw new Error(`Forma de pagamento não suportada: ${paymentMethod}`);
    }
  }

  static createProcessor(paymentMethod) {
    const creator = PaymentProcessorFactory.getCreator(paymentMethod);
    const normalized = String(paymentMethod || '').toLowerCase();
    const code = normalized === 'pix' ? 'PIX' : (normalized.includes('condo') ? 'CONDO_FEE' : 'CARD');
    return {
      code,
      processor: creator.createProcessor(),
      creator
    };
  }

  static getSupportedMethods() {
    return ['pix', 'credit_card', 'condo_bill'];
  }
}
