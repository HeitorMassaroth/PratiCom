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
  CheckCircle2,
  Users,
  HardHat,
  Vote,
  Wrench,
  Key,
  Home,
  Clock,
  Car
} from 'lucide-react';
import api, { getActiveProfile } from '../services/api';

export default function DashboardView({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(getActiveProfile());

  const loadDashboard = () => {
    setLoading(true);
    api.get('/dashboard')
      .then((res) => setData(res))
      .catch((err) => console.error('Erro ao carregar dashboard:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
    const handleCondoChange = () => loadDashboard();
    const handleProfileChange = () => setProfile(getActiveProfile());

    window.addEventListener('condo-changed', loadDashboard);
    window.addEventListener('profile-changed', handleProfileChange);

    return () => {
      window.removeEventListener('condo-changed', loadDashboard);
      window.removeEventListener('profile-changed', handleProfileChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={32} color="var(--primary)" style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: '14px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carregando dados operacionais...</p>
        </div>
      </div>
    );
  }

  const m = data?.metrics || {};
  const announcements = data?.urgentAnnouncements || [];

  // ==========================================================================
  // 1. DASHBOARD ADAPTADO: MORADOR
  // ==========================================================================
  if (profile === 'morador') {
    return (
      <div className="view-container">
        <div className="view-header">
          <div>
            <h1>Meu Painel Residencial (Apto 101 - Torre A)</h1>
            <p className="subtitle">
              Acompanhe suas encomendas com PIN de retirada, reservas de lazer, chamados e comunicados do condomínio
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => onNavigate('reservations')}>
              <Calendar size={16} /> Reservar Área
            </button>
            <button className="btn btn-primary" onClick={() => onNavigate('occurrences')}>
              <Wrench size={16} /> Abrir Chamado
            </button>
          </div>
        </div>

        {/* KPIs Pessoais do Morador */}
        <div className="stats-grid">
          <div className="stat-card" onClick={() => onNavigate('deliveries')} style={{ cursor: 'pointer' }}>
            <div className="stat-header">
              <span className="stat-label">Minhas Encomendas</span>
              <Package size={18} className="stat-icon" color="var(--warning)" />
            </div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>1 Pacote</div>
            <span className="stat-subtext">Aguardando retirada na portaria com PIN <strong>4821</strong></span>
          </div>

          <div className="stat-card" onClick={() => onNavigate('reservations')} style={{ cursor: 'pointer' }}>
            <div className="stat-header">
              <span className="stat-label">Minha Próxima Reserva</span>
              <Calendar size={18} className="stat-icon" color="var(--primary)" />
            </div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>Salão Nobre</div>
            <span className="stat-subtext">Hoje às 18:00 (Confirmada)</span>
          </div>

          <div className="stat-card" onClick={() => onNavigate('residents')} style={{ cursor: 'pointer' }}>
            <div className="stat-header">
              <span className="stat-label">Veículos Cadastrados</span>
              <Car size={18} className="stat-icon" color="var(--success)" />
            </div>
            <div className="stat-value">1 Veículo</div>
            <span className="stat-subtext">Jeep Compass (Placa ABC-1D23) - Vaga G1-01</span>
          </div>

          <div className="stat-card" onClick={() => onNavigate('polls')} style={{ cursor: 'pointer' }}>
            <div className="stat-header">
              <span className="stat-label">Votações em Aberto</span>
              <Vote size={18} className="stat-icon" color="#8b5cf6" />
            </div>
            <div className="stat-value">2 Pautas</div>
            <span className="stat-subtext">Reconhecimento Facial e Regimento</span>
          </div>
        </div>

        {/* Seção Central do Morador */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          {/* Mural de Comunicados da Comunidade */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={18} color="var(--primary)" />
                <span>Mural de Avisos da Administração</span>
              </h3>
              <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('announcements')}>
                Ver Todos <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {announcements.map((a) => (
                <div key={a.id} style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  borderLeft: a.priority === 'urgente' ? '3px solid var(--danger)' : '3px solid var(--primary)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{a.title}</strong>
                    <span className="badge badge-primary">{a.category}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{a.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Atalhos do Morador */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--primary)" />
              <span>Ações Rápidas do Condômino</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '12px 16px' }} onClick={() => onNavigate('deliveries')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Package size={18} color="var(--warning)" />
                  <span>Ver Código PIN das minhas Encomendas</span>
                </div>
                <ArrowRight size={16} />
              </button>

              <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '12px 16px' }} onClick={() => onNavigate('polls')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Vote size={18} color="#8b5cf6" />
                  <span>Registrar Voto na Assembleia Virtual</span>
                </div>
                <ArrowRight size={16} />
              </button>

              <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '12px 16px' }} onClick={() => onNavigate('occurrences')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Wrench size={18} color="var(--primary)" />
                  <span>Solicitar Reparo / Ocorrência de Manutenção</span>
                </div>
                <ArrowRight size={16} />
              </button>

              <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '12px 16px' }} onClick={() => onNavigate('residents')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={18} color="var(--success)" />
                  <span>Atualizar Cadastro de Moradores e Veículo</span>
                </div>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 2. DASHBOARD ADAPTADO: TRABALHADOR (PORTARIA & OPERAÇÃO)
  // ==========================================================================
  if (profile === 'trabalhador') {
    return (
      <div className="view-container">
        <div className="view-header">
          <div>
            <h1>Painel Operacional da Portaria & Manutenção 24h</h1>
            <p className="subtitle">
              Controle imediato de fluxo de encomendas, portaria, liberação de visitantes e ocorrências técnicas
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => onNavigate('access')}>
              <ShieldCheck size={16} /> Nova Entrada
            </button>
            <button className="btn btn-primary" onClick={() => onNavigate('deliveries')}>
              <Package size={16} /> Receber Pacote
            </button>
          </div>
        </div>

        {/* KPIs Operacionais */}
        <div className="stats-grid">
          <div className="stat-card" onClick={() => onNavigate('deliveries')} style={{ cursor: 'pointer' }}>
            <div className="stat-header">
              <span className="stat-label">Armário de Encomendas</span>
              <Package size={18} className="stat-icon" color="var(--warning)" />
            </div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>{m.pendingDeliveries || 2} Pacotes</div>
            <span className="stat-subtext">Aguardando conferência de PIN na entrega</span>
          </div>

          <div className="stat-card" onClick={() => onNavigate('access')} style={{ cursor: 'pointer' }}>
            <div className="stat-header">
              <span className="stat-label">Visitantes no Perímetro</span>
              <ShieldCheck size={18} className="stat-icon" color="var(--success)" />
            </div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{m.activeVisitors || 2} Ativos</div>
            <span className="stat-subtext">Dentro do condomínio neste momento</span>
          </div>

          <div className="stat-card" onClick={() => onNavigate('occurrences')} style={{ cursor: 'pointer' }}>
            <div className="stat-header">
              <span className="stat-label">Chamados da Portaria</span>
              <Wrench size={18} className="stat-icon" color="var(--primary)" />
            </div>
            <div className="stat-value">1 Urgência</div>
            <span className="stat-subtext">Portão eletrônico G1 em atendimento</span>
          </div>

          <div className="stat-card" onClick={() => onNavigate('announcements')} style={{ cursor: 'pointer' }}>
            <div className="stat-header">
              <span className="stat-label">Avisos de Plantão</span>
              <Megaphone size={18} className="stat-icon" color="#8b5cf6" />
            </div>
            <div className="stat-value">{announcements.length} Alertas</div>
            <span className="stat-subtext">Manutenções programadas no turno</span>
          </div>
        </div>

        {/* Atalhos de Operação do Trabalhador */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="var(--primary)" />
              <span>Controle Rápido de Portaria</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '12px 16px' }} onClick={() => onNavigate('deliveries')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Package size={18} color="var(--warning)" />
                  <span style={{ fontWeight: 600 }}>Dar Baixa em Encomenda via Teclado PIN</span>
                </div>
                <ArrowRight size={16} />
              </button>

              <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '12px 16px' }} onClick={() => onNavigate('access')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={18} color="var(--success)" />
                  <span style={{ fontWeight: 600 }}>Cadastrar Visitante ou Prestador de Serviço</span>
                </div>
                <ArrowRight size={16} />
              </button>

              <button className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '12px 16px' }} onClick={() => onNavigate('occurrences')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <HardHat size={18} color="var(--primary)" />
                  <span style={{ fontWeight: 600 }}>Registrar Ocorrência Técnica / Manutenção</span>
                </div>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={18} color="var(--primary)" />
              <span>Informativos da Administração para a Equipe</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {announcements.map((a) => (
                <div key={a.id} style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', borderLeft: '3px solid var(--warning)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '3px' }}>{a.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 3. DASHBOARD ADAPTADO: SÍNDICO & ADMINISTRADOR
  // ==========================================================================
  return (
    <div className="view-container">
      {/* Header Executivo */}
      <div className="view-header">
        <div>
          <h1>{profile === 'sindico' ? 'Gestão Executiva do Condomínio' : 'Centro de Comando do ERP (Admin)'}</h1>
          <p className="subtitle">
            Visão consolidada de portaria, fluxo de caixa, quórum de assembleias, estoque e governança
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('settings')}>
            <span>Regras do Condomínio</span>
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('market')}>
            <ShoppingBag size={16} />
            <span>Terminal PDV</span>
          </button>
        </div>
      </div>

      {/* Alerta de Estoque Crítico */}
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
            <span>Alerta de Reposição: {m.lowStockItems} itens no Honest Market estão abaixo do estoque mínimo.</span>
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

      {/* Grid de KPIs Executivos */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => onNavigate('deliveries')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span className="stat-label">Encomendas Pendentes</span>
            <Package size={18} className="stat-icon" color="var(--warning)" />
          </div>
          <div className="stat-value">{m.pendingDeliveries || 0}</div>
          <span className="stat-subtext">No armário digital da portaria</span>
        </div>

        <div className="stat-card" onClick={() => onNavigate('access')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span className="stat-label">Visitantes no Perímetro</span>
            <ShieldCheck size={18} className="stat-icon" color="var(--success)" />
          </div>
          <div className="stat-value">{m.activeVisitors || 0}</div>
          <span className="stat-subtext">Com crachá ou autorização ativa</span>
        </div>

        <div className="stat-card" onClick={() => onNavigate('financial')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span className="stat-label">Saldo em Caixa Real</span>
            <DollarSign size={18} className="stat-icon" color="var(--primary)" />
          </div>
          <div className="stat-value" style={{ color: (m.balance || 0) >= 0 ? 'var(--text-main)' : 'var(--danger)' }}>
            R$ {Number(m.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="stat-subtext">Receitas liquidadas vs despesas</span>
        </div>

        <div className="stat-card" onClick={() => onNavigate('occurrences')} style={{ cursor: 'pointer' }}>
          <div className="stat-header">
            <span className="stat-label">Chamados de Reparo</span>
            <Wrench size={18} className="stat-icon" color="#8b5cf6" />
          </div>
          <div className="stat-value">3 Abertos</div>
          <span className="stat-subtext">Manutenção e ocorrências prediais</span>
        </div>
      </div>

      {/* Painel de Indicadores Visuais & Saúde Operacional */}
      <div className="card" style={{ padding: '22px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Monitor Executivo de Saúde Operacional & Predial</h3>
          </div>
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={13} /> Sistema Conforme
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Medidor 1: Saúde Financeira & Arrecadação */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem' }}>
              <span style={{ fontWeight: 600 }}>Adimplência de Taxas Condominiais</span>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>94.8%</span>
            </div>
            {/* Barra de Progresso */}
            <div style={{ height: '8px', background: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex', marginBottom: '10px' }}>
              <div style={{ width: '94.8%', background: 'var(--success)' }} />
              <div style={{ width: '5.2%', background: 'var(--danger)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <span>Recebidas: R$ 87.420,00</span>
              <span>Atrasadas: R$ 4.800,00 (5 un.)</span>
            </div>
          </div>

          {/* Medidor 2: Ocupação Predial & Vagas de Garagem */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem' }}>
              <span style={{ fontWeight: 600 }}>Ocupação das Unidades Habitacionais</span>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>88.5% (85 / 96)</span>
            </div>
            {/* Barra de Progresso */}
            <div style={{ height: '8px', background: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex', marginBottom: '10px' }}>
              <div style={{ width: '88.5%', background: 'var(--primary)' }} />
              <div style={{ width: '11.5%', background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <span>85 unidades habitadas</span>
              <span>11 unidades vagas / reforma</span>
            </div>
          </div>

          {/* Medidor 3: Índice de Resolução de Ocorrências */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.84rem' }}>
              <span style={{ fontWeight: 600 }}>Eficiência Técnica de Chamados</span>
              <span style={{ color: '#8b5cf6', fontWeight: 700 }}>82.3% SLA</span>
            </div>
            {/* Barra de Progresso */}
            <div style={{ height: '8px', background: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex', marginBottom: '10px' }}>
              <div style={{ width: '82.3%', background: '#8b5cf6' }} />
              <div style={{ width: '17.7%', background: 'var(--warning)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <span>14 chamados atendidos no mês</span>
              <span>3 chamados pendentes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Executiva Bipartida */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Painel de Comunicados */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={18} color="var(--primary)" />
              <span>Comunicados & Avisos Ativos</span>
            </h3>
            <button className="btn btn-sm btn-outline" onClick={() => onNavigate('announcements')}>
              Mural <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {announcements.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  borderLeft: a.priority === 'urgente' ? '3px solid var(--danger)' : '3px solid var(--primary)',
                  borderTop: '1px solid var(--border)',
                  borderRight: '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600 }}>{a.title}</h4>
                  <span className={`badge ${a.priority === 'urgente' ? 'badge-danger' : 'badge-primary'}`}>
                    {a.category}
                  </span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{a.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Atalhos Rápidos da Gestão */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--primary)" />
            <span>Atalhos de Gestão e Governança</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              onClick={() => onNavigate('occurrences')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Wrench size={18} color="var(--primary)" />
                <span style={{ fontWeight: 600 }}>Gerenciar Chamados de Manutenção</span>
              </div>
              <ArrowRight size={16} />
            </button>

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              onClick={() => onNavigate('polls')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Vote size={18} color="#8b5cf6" />
                <span style={{ fontWeight: 600 }}>Assembleias Virtuais & Votações em Aberto</span>
              </div>
              <ArrowRight size={16} />
            </button>

            {profile === 'admin' && (
              <button
                className="btn btn-secondary"
                style={{ justifyContent: 'space-between', padding: '12px 16px' }}
                onClick={() => onNavigate('users')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Users size={18} color="var(--warning)" />
                  <span style={{ fontWeight: 600 }}>Gestão de Usuários & Acessos (RBAC)</span>
                </div>
                <ArrowRight size={16} />
              </button>
            )}

            <button
              className="btn btn-secondary"
              style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              onClick={() => onNavigate('financial')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <DollarSign size={18} color="var(--success)" />
                <span style={{ fontWeight: 600 }}>Balancete Mensal & Taxa de Inadimplência</span>
              </div>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
