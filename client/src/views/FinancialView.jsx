import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, CheckCircle, TrendingUp, TrendingDown, AlertCircle, PieChart, Check } from 'lucide-react';
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
      showToast('Lançamento contábil registrado com sucesso.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handlePay = async (id) => {
    try {
      await api.patch(`/financial/transactions/${id}/pay`, {});
      showToast('Baixa de quitação confirmada com sucesso.');
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
          <Plus size={16} />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Cards de Indicadores Contábeis */}
      <div className="metrics-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Saldo Real em Caixa</span>
            <span className="stat-value" style={{ color: (summary?.currentBalance || 0) >= 0 ? 'var(--text-main)' : 'var(--danger)' }}>
              R$ {Number(summary?.currentBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Receitas Arrecadadas</span>
            <span className="stat-value" style={{ color: 'var(--success)' }}>
              R$ {Number(summary?.incomePaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <TrendingDown size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Despesas Operacionais</span>
            <span className="stat-value">
              R$ {Number(summary?.expensePaid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <AlertCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Inadimplência / Pendente</span>
            <span className="stat-value" style={{ color: 'var(--warning)' }}>
              R$ {Number(summary?.incomePending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Indicador de Arrecadação Mensal */}
      <div className="erp-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <span style={{ fontSize: '0.86rem', fontWeight: 700 }}>Taxa de Arrecadação de Cotas Condominiais</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
              (Total Previsto: R$ {Number(totalInc).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
            </span>
          </div>
          <span className="badge badge-primary">{paidPct}% Liquidado</span>
        </div>

        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{
              width: `${paidPct}%`,
              backgroundColor: paidPct >= 70 ? 'var(--success)' : paidPct >= 40 ? 'var(--warning)' : 'var(--danger)'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span>R$ {Number(incomePaid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pagos</span>
          <span>R$ {Number(incomePending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto</span>
        </div>
      </div>

      {/* Filtros de Tipo */}
      <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div className="segmented-tabs">
          <button
            className={`segmented-tab ${filterType === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterType('ALL')}
          >
            Todos os Lançamentos ({transactions.length})
          </button>
          <button
            className={`segmented-tab ${filterType === 'INCOME' ? 'active' : ''}`}
            onClick={() => setFilterType('INCOME')}
          >
            Receitas
          </button>
          <button
            className={`segmented-tab ${filterType === 'EXPENSE' ? 'active' : ''}`}
            onClick={() => setFilterType('EXPENSE')}
          >
            Despesas
          </button>
          <button
            className={`segmented-tab ${filterType === 'PENDING' ? 'active' : ''}`}
            onClick={() => setFilterType('PENDING')}
          >
            Em Aberto
          </button>
          <button
            className={`segmented-tab ${filterType === 'PAID' ? 'active' : ''}`}
            onClick={() => setFilterType('PAID')}
          >
            Quitados
          </button>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Ref</th>
              <th>Categoria Contábil</th>
              <th>Histórico / Descrição</th>
              <th>Vencimento</th>
              <th>Tipo</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th>Situação</th>
              <th style={{ textAlign: 'right' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredTxs.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Nenhum lançamento contábil encontrado.
                </td>
              </tr>
            ) : (
              filteredTxs.map((t) => (
                <tr key={t.id}>
                  <td className="num-cell">#{t.id}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{t.category}</span>
                  </td>
                  <td>{t.description}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {t.due_date ? new Date(t.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td>
                    {t.type === 'income' ? (
                      <span className="badge badge-success">Receita</span>
                    ) : (
                      <span className="badge badge-danger">Despesa</span>
                    )}
                  </td>
                  <td className="num-cell" style={{ textAlign: 'right', fontWeight: 600 }}>
                    {t.type === 'expense' ? '-' : '+'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    {t.status === 'PAID' ? (
                      <span className="badge badge-success">Quitado</span>
                    ) : (
                      <span className="badge badge-warning">Em Aberto</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {t.status === 'PENDING' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handlePay(t.id)}
                        title="Confirmar liquidação do lançamento"
                      >
                        <CheckCircle size={13} />
                        <span>Baixar Pagamento</span>
                      </button>
                    )}
                    {t.status === 'PAID' && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        Pago {t.payment_date ? `(${t.payment_date})` : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Novo Lançamento Financeiro */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Lançamento Contábil">
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreate}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Tipo de Operação <span className="required">*</span></label>
              <select
                className="form-control"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="income">Receita (Entrada)</option>
                <option value="expense">Despesa (Saída)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Categoria <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="Ex: Taxa Condominial, Manutenção, Copel"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Histórico / Descrição <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Ex: Manutenção preventiva dos portões de entrada"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Valor Monetário (R$) <span className="required">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                required
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Data de Vencimento <span className="required">*</span></label>
              <input
                type="date"
                className="form-control"
                required
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Registrar Lançamento</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
