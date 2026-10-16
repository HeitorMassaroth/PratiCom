import React, { useState, useEffect } from 'react';
import {
  Package,
  ShieldCheck,
  DollarSign,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Megaphone,
  ShoppingBag,
  Activity,
  Layers,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';

export default function DashboardView({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = () => {
    setLoading(true);
    api.get('/dashboard')
      .then((res) => setData(res))
      .catch((err) => console.error('Erro ao carregar dashboard:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
    window.addEventListener('condo-changed', loadDashboard);
    return () => window.removeEventListener('condo-changed', loadDashboard);
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={32} color="var(--primary)" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: '14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carregando dados operacionais...</p>
        </div>
      </div>
    );
  }

  const m = data?.metrics || {};
  const announcements = data?.urgentAnnouncements || [];

  return (
    <div className="page-container">
      {/* Header Operacional */}
      <div className="page-header">
        <div>
          <h1>Painel Executivo & Operacional</h1>
          <p>Visão consolidada de portaria, encomendas, fluxo de caixa e áreas comuns do condomínio.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('deliveries')}>
            <Package size={16} />
            <span>Portaria</span>
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('market')}>
            <ShoppingBag size={16} />
            <span>Terminal PDV</span>
          </button>
        </div>
      </div>

      {/* Alerta de Estoque Crítico (se houver) */}
      {m.lowStockItems > 0 && (
        <div style={{
          background: 'var(--warning-bg)',
          border: '1px solid var(--warning-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          color: 'var(--warning)',
          fontSize: '0.86rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
            <AlertTriangle size={18} />
            <span>Atenção: {m.lowStockItems} {m.lowStockItems === 1 ? 'produto está' : 'produtos estão'} com estoque igual ou abaixo do nível mínimo no Mercadinho Autônomo.</span>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => onNavigate('market')}
            style={{ borderColor: 'var(--warning-border)', color: 'var(--warning)' }}
          >
            Gerenciar Estoque
          </button>
        </div>
      )}

      {/* Grid de KPIs Operacionais */}
      <div className="metrics-grid">
        <div className="stat-card" onClick={() => onNavigate('deliveries')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Package size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Encomendas Aguardando</span>
            <span className="stat-value">{m.pendingDeliveries || 0}</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('access')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <ShieldCheck size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Visitantes no Perímetro</span>
            <span className="stat-value">{m.activeVisitors || 0}</span>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('financial')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Saldo em Caixa Real</span>
            <span className="stat-value" style={{ color: (m.balance || 0) >= 0 ? 'var(--text-main)' : 'var(--danger)' }}>
              R$ {Number(m.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate('reservations')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <Calendar size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Reservas para Hoje</span>
            <span className="stat-value">{m.todayReservations || 0}</span>
          </div>
        </div>
      </div>

      {/* Seção Bipartida: Alertas & Ações Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Painel de Comunicados */}
        <div className="erp-panel">
          <div className="panel-header">
            <h3>
              <Megaphone size={18} color="var(--primary)" />
              <span>Comunicados & Avisos Importantes</span>
            </h3>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => onNavigate('announcements')}
            >
              <span>Ver Mural</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              <CheckCircle2 size={24} style={{ margin: '0 auto 8px', color: 'var(--success)' }} />
              <p>Nenhum comunicado urgente ou fixado pendente.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {announcements.map((a) => {
                const isUrgent = a.priority === 'urgente' || a.priority === 'alta';
                return (
                  <div
                    key={a.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      borderLeft: isUrgent ? '3px solid var(--danger)' : '3px solid var(--primary)',
                      borderTop: '1px solid var(--border)',
                      borderRight: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 600 }}>{a.title}</h4>
                      <span className={`badge ${isUrgent ? 'badge-danger' : 'badge-primary'}`}>
                        {a.category}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>{a.content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Painel de Ações Rápidas */}
        <div className="erp-panel">
          <div className="panel-header">
            <h3>
              <Layers size={18} color="var(--primary)" />
              <span>Atalhos Rápidos de Operação</span>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              onClick={() => onNavigate('deliveries')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Package size={18} color="var(--warning)" />
                <span style={{ fontWeight: 600 }}>Entregar Encomenda com PIN Seguro</span>
              </div>
              <ArrowRight size={16} color="var(--text-dim)" />
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              onClick={() => onNavigate('access')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck size={18} color="var(--success)" />
                <span style={{ fontWeight: 600 }}>Registrar Entrada / Saída de Visitante</span>
              </div>
              <ArrowRight size={16} color="var(--text-dim)" />
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              onClick={() => onNavigate('financial')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <DollarSign size={18} color="var(--primary)" />
                <span style={{ fontWeight: 600 }}>Visualizar Balancete & Baixa de Taxas</span>
              </div>
              <ArrowRight size={16} color="var(--text-dim)" />
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              onClick={() => onNavigate('reservations')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={18} color="var(--info)" />
                <span style={{ fontWeight: 600 }}>Consultar Agenda de Áreas Comuns</span>
              </div>
              <ArrowRight size={16} color="var(--text-dim)" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
