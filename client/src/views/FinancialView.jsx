import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, CheckCircle, TrendingUp, TrendingDown, AlertCircle, PieChart } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

export default function FinancialView() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
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
      showToast('Lançamento financeiro registrado com sucesso!');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handlePay = async (id) => {
    try {
      await api.patch(`/financial/transactions/${id}/pay`, {});
      showToast('🎉 Pagamento / Baixa confirmada com sucesso!');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredTxs = transactions.filter((t) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'INCOME') return t.type === 'income';
    if (filterType === 'EXPENSE') return t.type === 'expense';
    if (filterType === 'PENDING') return t.status === 'PENDING';
    if (filterType === 'PAID') return t.status === 'PAID';
    return true;
  });

  const incomePaid = summary?.incomePaid || 0;
  const incomePending = summary?.incomePending || 0;
  const totalInc = incomePaid + incomePending;
  const paidPct = totalInc > 0 ? Math.round((incomePaid / totalInc) * 100) : 100;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Gestão Financeira & Balancetes</h1>
          <p>Fluxo de caixa consolidado, controle orçamentário e liquidação de taxas condominiais.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="metrics-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.16)', color: 'var(--primary)' }}>
            <DollarSign size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: (summary?.currentBalance || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              R$ {Number(summary?.currentBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="stat-label">Saldo em Caixa Real</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <TrendingUp size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-value">R$ {Number(summary?.incomePaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="stat-label">Receitas Liquidadas</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <TrendingDown size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-value">R$ {Number(summary?.expensePaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="stat-label">Despesas Pagas</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <AlertCircle size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{summary?.defaultRate || 0}%</div>
            <div className="stat-label">Taxa de Inadimplência</div>
          </div>
        </div>
      </div>

      {/* Barra de Progresso de Arrecadação */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '20px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>Índice de Arrecadação do Mês</span>
          <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.95rem' }}>{paidPct}% arrecadado</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${paidPct}%`, background: 'linear-gradient(90deg, #10b981, #6366f1)' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Pago: R$ {Number(incomePaid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          <span>Pendente: R$ {Number(incomePending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Filtros de Tabela */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
        {[
          { id: 'ALL', label: 'Todos os Lançamentos' },
          { id: 'INCOME', label: 'Apenas Receitas' },
          { id: 'EXPENSE', label: 'Apenas Despesas' },
          { id: 'PENDING', label: 'Pendentes' },
          { id: 'PAID', label: 'Pagos / Baixados' }
        ].map((f) => (
          <button
            key={f.id}
            className={`btn ${filterType === f.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            onClick={() => setFilterType(f.id)}
          >
            {f.label}
          </button>
        ))}
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
            {filteredTxs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Nenhum lançamento financeiro corresponde aos filtros.
                </td>
              </tr>
            ) : (
              filteredTxs.map((tx) => (
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
                  <td style={{ fontWeight: 800, fontSize: '0.98rem' }}>
                    R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    {tx.status === 'PAID' ? (
                      <span className="badge badge-success">Liquidado</span>
                    ) : (
                      <span className="badge badge-warning">Pendente</span>
                    )}
                  </td>
                  <td>
                    {tx.status === 'PENDING' && (
                      <button
                        className="btn btn-success"
                        style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                        onClick={() => handlePay(tx.id)}
                      >
                        <CheckCircle size={15} />
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
                placeholder="Ex: Taxa Condominial, Manutenção, Luz..."
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
              placeholder="Ex: Manutenção preventiva dos portões de entrada"
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
