/**
 * Padrão de Projeto: TEMPLATE METHOD (2/3)
 * AbstractPaymentProcessor define a estrutura algorítmica para processamento de pagamentos.
 */
export class AbstractPaymentProcessor {
  processPayment({ amount, unitId, residentId, items }) {
    this.validateAmount(amount);
    const auth = this.authorizePayment(amount, unitId);
    if (!auth.success) {
      throw new Error(`Falha na autorização de pagamento: ${auth.reason}`);
    }
    const record = this.recordTransaction({ amount, unitId, residentId, items, auth });
    const receipt = this.generateReceipt(record);
    return receipt;
  }

  validateAmount(amount) {
    if (!amount || amount <= 0) {
      throw new Error('Valor inválido para pagamento.');
    }
  }

  authorizePayment(amount, unitId) {
    throw new Error('O método authorizePayment() deve ser implementado pela subclasse.');
  }

  recordTransaction(data) {
    return { id: Date.now(), ...data, timestamp: new Date().toISOString() };
  }

  generateReceipt(record) {
    return {
      success: true,
      transactionId: record.id,
      amount: record.amount,
      message: 'Pagamento processado com sucesso.',
      timestamp: record.timestamp
    };
  }
}

export class PixPaymentProcessor extends AbstractPaymentProcessor {
  authorizePayment(amount, unitId) {
    // Simula autorização instantânea PIX
    return { success: true, authCode: `PIX-${Math.floor(100000 + Math.random() * 900000)}` };
  }
}

export class CondoFeePaymentProcessor extends AbstractPaymentProcessor {
  authorizePayment(amount, unitId) {
    // Lança o valor do débito diretamente na cota condominial da unidade
    return { success: true, authCode: `CONDO-FEE-UNIT-${unitId}` };
  }
}

export class CardPaymentProcessor extends AbstractPaymentProcessor {
  authorizePayment(amount, unitId) {
    // Simula autorização na maquininha de cartão (débito/crédito)
    return { success: true, authCode: `CARD-${Math.floor(100000 + Math.random() * 900000)}` };
  }
}
