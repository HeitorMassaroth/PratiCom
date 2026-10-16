import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, CheckCircle, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function FinancialView() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    type: 'income',
    category: 'Taxa Condominial',
    description: '',
    amount: '',
    due_date: today
  });

  const loadData = () => {
    Promise.all([api.get('/financial/summary'), api.get('/financial/transactions')])
      .then(([sumData, txData]) => {
        setSummary(sumData);
        setTransactions(txData || []);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('condo-changed', loadData);
    return () => window.removeEventListener('condo-changed', loadData);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/financial/transactions', form);
      setIsModalOpen(false);
      setForm({ type: 'income', category: 'Taxa Condominial', description: '', amount: '', due_date: today });
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handlePay = async (id) => {
    try {
      await api.patch(`/financial/transactions/${id}/pay`, {});
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Gestão Financeira & Balancetes</h1>
          <p>Controle de fluxo de caixa, quitação de despesas e cálculo de inadimplência.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="metrics-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <DollarSign size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">R$ {Number(summary?.currentBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="stat-label">Saldo em Caixa Real</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <TrendingUp size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">R$ {Number(summary?.incomePaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="stat-label">Receitas Liquidadas</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <TrendingDown size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">R$ {Number(summary?.expensePaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="stat-label">Despesas Pagas</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <AlertCircle size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{summary?.defaultRate || 0}%</div>
            <div className="stat-label">Taxa de Inadimplência</div>
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="glass-card table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Categoria</th>
              <th>Descrição</th>
              <th>Vencimento</th>
              <th>Valor (R$)</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Nenhum lançamento financeiro registrado.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    {tx.type === 'income' ? (
                      <span className="badge badge-success">Receita</span>
                    ) : (
                      <span className="badge badge-danger">Despesa</span>
                    )}
                  </td>
                  <td><strong>{tx.category}</strong></td>
                  <td>{tx.description}</td>
                  <td>{tx.due_date}</td>
                  <td style={{ fontWeight: 700 }}>
                    R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    {tx.status === 'PAID' ? (
                      <span className="badge badge-success">Pago</span>
                    ) : (
                      <span className="badge badge-warning">Pendente</span>
                    )}
                  </td>
                  <td>
                    {tx.status === 'PENDING' && (
                      <button
                        className="btn btn-success"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handlePay(tx.id)}
                      >
                        <CheckCircle size={14} />
                        <span>Dar Baixa</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Lançamento */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Lançar Transação Financeira">
        <form onSubmit={handleCreate}>
          {errorMsg && <div className="badge badge-danger" style={{ marginBottom: 16, width: '100%' }}>{errorMsg}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Tipo de Lançamento *</label>
              <select className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="income">Receita (Entrada)</option>
                <option value="expense">Despesa (Saída)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Categoria *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Manutenção, Limpeza, Taxa..."
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Descrição Detalhada *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Manutenção preventiva dos portões"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Data de Vencimento *</label>
              <input
                type="date"
                className="form-control"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Registrar Lançamento</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
