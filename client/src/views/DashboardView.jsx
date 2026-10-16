import React, { useState, useEffect } from 'react';
import {
  Package,
  ShieldCheck,
  DollarSign,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Megaphone,
  TrendingUp,
  Activity,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={36} className="pulse-dot" style={{ width: 36, height: 36, background: 'var(--primary)' }} />
          <p style={{ marginTop: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>Sincronizando dados em tempo real...</p>
        </div>
      </div>
    );
  }

  const m = data?.metrics || {};
  const announcements = data?.urgentAnnouncements || [];

  return (
    <div className="page-container">
      {/* Hero Header */}
      <div className="page-header" style={{ marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="pulse-dot"></span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--success)', letterSpacing: '0.06em' }}>
              Painel Operacional Ativo
            </span>
          </div>
          <h1>{getGreeting()}, Síndico(a)! 👋</h1>
          <p>Visão executiva em tempo real com governança, segurança e saúde financeira do condomínio.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => onNavigate('market')}>
            <ShoppingBag size={18} />
            <span>Abrir PDV Express</span>
          </button>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="metrics-grid">
        <div className="glass-card stat-card" onClick={() => onNavigate('deliveries')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Package size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{m.pendingDeliveries || 0}</div>
            <div className="stat-label">Encomendas Aguardando</div>
          </div>
        </div>

        <div className="glass-card stat-card" onClick={() => onNavigate('access')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <ShieldCheck size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{m.activeVisitors || 0}</div>
            <div className="stat-label">Visitantes na Propriedade</div>
          </div>
        </div>

        <div className="glass-card stat-card" onClick={() => onNavigate('financial')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.16)', color: 'var(--primary)' }}>
            <DollarSign size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-value">R$ {Number(m.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <div className="stat-label">Saldo em Caixa Atual</div>
          </div>
        </div>

        <div className="glass-card stat-card" onClick={() => onNavigate('reservations')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
            <Calendar size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{m.todayReservations || 0}</div>
            <div className="stat-label">Eventos / Reservas Hoje</div>
          </div>
        </div>
      </div>

      {/* Seção Central: Alertas Críticos + Resumo Operacional */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Mural de Avisos com Destaque Visual */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
              <Megaphone size={22} color="var(--primary)" />
              <span>Comunicados Fixados & Urgentes</span>
            </h3>
            <button
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              onClick={() => onNavigate('announcements')}
            >
              Ver Mural Completo →
            </button>
          </div>

          {announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <Sparkles size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>Nenhum comunicado crítico ou urgente no momento.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.map((a) => (
                <div
                  key={a.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    borderLeft: a.priority === 'urgente' || a.priority === 'alta' ? '4px solid var(--danger)' : '4px solid var(--primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{a.title}</h4>
                    <span className={`badge ${a.priority === 'urgente' || a.priority === 'alta' ? 'badge-danger' : 'badge-primary'}`}>
                      {a.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Atalhos Rápidos e Módulos */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '18px', fontSize: '1.2rem' }}>Ações Rápidas da Portaria e Gestão</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '14px 18px' }} onClick={() => onNavigate('deliveries')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Package size={20} color="var(--warning)" />
                <span style={{ fontWeight: 600 }}>Entregar Encomenda com PIN Seguro</span>
              </div>
              <ArrowUpRight size={18} color="var(--text-muted)" />
            </button>

            <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '14px 18px' }} onClick={() => onNavigate('access')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldCheck size={20} color="var(--success)" />
                <span style={{ fontWeight: 600 }}>Registrar Entrada / Saída de Visitante</span>
              </div>
              <ArrowUpRight size={18} color="var(--text-muted)" />
            </button>

            <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '14px 18px' }} onClick={() => onNavigate('reservations')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={20} color="var(--info)" />
                <span style={{ fontWeight: 600 }}>Verificar Disponibilidade de Áreas Comuns</span>
              </div>
              <ArrowUpRight size={18} color="var(--text-muted)" />
            </button>

            <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '14px 18px' }} onClick={() => onNavigate('financial')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <DollarSign size={20} color="var(--primary)" />
                <span style={{ fontWeight: 600 }}>Visualizar Balancete e Quitação de Taxas</span>
              </div>
              <ArrowUpRight size={18} color="var(--text-muted)" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
