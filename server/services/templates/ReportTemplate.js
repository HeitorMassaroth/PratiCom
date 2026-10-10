/**
 * Padrão de Projeto: TEMPLATE METHOD (1/3)
 * AbstractReportGenerator define a estrutura do algoritmo de geração de relatórios.
 */
export class AbstractReportGenerator {
  generateReport(params) {
    const data = this.fetchData(params);
    const header = this.formatHeader();
    const content = this.formatContent(data);
    const summary = this.formatSummary(data);
    return {
      header,
      content,
      summary,
      generatedAt: new Date().toISOString()
    };
  }

  fetchData(params) {
    throw new Error('O método fetchData() deve ser implementado pelas subclasses.');
  }

  formatHeader() {
    return '--- RELATÓRIO ERP PRATICOM ---';
  }

  formatContent(data) {
    throw new Error('O método formatContent() deve ser implementado pelas subclasses.');
  }

  formatSummary(data) {
    return `Total de registros processados: ${Array.isArray(data) ? data.length : 0}`;
  }
}

export class FinancialReportGenerator extends AbstractReportGenerator {
  constructor(db) {
    super();
    this.db = db;
  }

  fetchData(params) {
    return this.db.prepare('SELECT * FROM financial_transactions ORDER BY due_date DESC').all();
  }

  formatHeader() {
    return '--- RELATÓRIO CONSOLIDADO FINANCEIRO CONDOMINIAL ---';
  }

  formatContent(data) {
    return data.map(t => `${t.due_date} | ${t.description} | R$ ${t.amount} | Status: ${t.status}`);
  }

  formatSummary(data) {
    const totalIncome = data.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = data.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    return `Receitas: R$ ${totalIncome.toFixed(2)} | Despesas: R$ ${totalExpense.toFixed(2)} | Saldo: R$ ${(totalIncome - totalExpense).toFixed(2)}`;
  }
}
