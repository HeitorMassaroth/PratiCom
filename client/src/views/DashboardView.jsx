import React, { useState, useEffect } from 'react';
import { Package, ShieldCheck, DollarSign, Calendar, AlertTriangle, ArrowUpRight, Megaphone } from 'lucide-react';
import api from '../services/api';

export default function DashboardView({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = () => {
    setLoading(true);
    api.get('/dashboard')
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
    window.addEventListener('condo-changed', loadDashboard);
    return () => window.removeEventListener('condo-changed', loadDashboard);
  }, []);

  if (loading) {
    return <div className="page-container"><p>Carregando métricas consolidadas...</p></div>;
  }

  const m = data?.metrics || {};
  const announcements = data?.urgentAnnouncements || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Painel de Controle e Métricas</h1>
          <p>Visão executiva em tempo real das operações do condomínio.</p>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="metrics-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Package size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{m.pendingDeliveries || 0}</div>
            <div className="stat-label">Encomendas Pendentes</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <ShieldCheck size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{m.activeVisitors || 0}</div>
            <div className="stat-label">Visitantes no Condomínio</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
            <DollarSign size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">R$ {Number(m.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="stat-label">Balanço Financeiro</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <Calendar size={26} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{m.todayReservations || 0}</div>
            <div className="stat-label">Reservas Confirmadas Hoje</div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '12px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone size={20} color="var(--primary)" />
            Avisos Críticos e Fixados
          </h3>
          {announcements.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum comunicado urgente no momento.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.map((a) => (
                <div key={a.id} style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', borderLeft: '4px solid var(--warning)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.95rem' }}>{a.title}</h4>
                    <span className="badge badge-warning">{a.priority?.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '16px' }}>Atalhos de Gestão Operacional</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'space-between' }} onClick={() => onNavigate('deliveries')}>
              <span>📦 Registrar Encomenda na Portaria</span>
              <ArrowUpRight size={16} />
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'space-between' }} onClick={() => onNavigate('access')}>
              <span>🛡️ Registrar Entrada de Visitante</span>
              <ArrowUpRight size={16} />
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'space-between' }} onClick={() => onNavigate('market')}>
              <span>🛒 Abrir PDV do Mercadinho</span>
              <ArrowUpRight size={16} />
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'space-between' }} onClick={() => onNavigate('reservations')}>
              <span>📅 Agendar Espaço Comum</span>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
