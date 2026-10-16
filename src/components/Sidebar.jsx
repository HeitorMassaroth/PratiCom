import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShieldCheck,
  Users,
  CalendarDays,
  DollarSign,
  Megaphone,
  ShoppingBag,
  Building2,
  Cpu,
  Layers,
  Shield,
  Award,
  UserCheck,
  Home,
  UserCog,
  History,
  Sliders,
  Wrench,
  Vote,
  AlertTriangle
} from 'lucide-react';
import { getActiveProfile } from '../services/api';

export default function Sidebar({ activeTab, onSelectTab }) {
  const [profile, setProfile] = useState(getActiveProfile());

  useEffect(() => {
    const handleProfileChange = () => {
      setProfile(getActiveProfile());
    };
    window.addEventListener('profile-changed', handleProfileChange);
    return () => window.removeEventListener('profile-changed', handleProfileChange);
  }, []);

  // Definição da Navegação Estruturada por Papel (RBAC)
  const getNavGroups = () => {
    switch (profile) {
      case 'morador':
        return [
          {
            title: 'Meu Espaço',
            items: [
              { id: 'dashboard', label: 'Meu Painel', icon: LayoutDashboard }
            ]
          },
          {
            title: 'Minha Unidade',
            items: [
              { id: 'deliveries', label: 'Minhas Encomendas', icon: Package },
              { id: 'reservations', label: 'Minhas Reservas', icon: CalendarDays },
              { id: 'occurrences', label: 'Meus Chamados', icon: Wrench },
              { id: 'residents', label: 'Meus Dados & Veículo', icon: Users }
            ]
          },
          {
            title: 'Comunidade & Decisões',
            items: [
              { id: 'polls', label: 'Assembleias & Votações', icon: Vote },
              { id: 'announcements', label: 'Mural de Avisos', icon: Megaphone }
            ]
          }
        ];

      case 'trabalhador':
        return [
          {
            title: 'Operação Central',
            items: [
              { id: 'dashboard', label: 'Painel da Portaria', icon: LayoutDashboard }
            ]
          },
          {
            title: 'Fluxo Operacional',
            items: [
              { id: 'deliveries', label: 'Encomendas & PIN', icon: Package },
              { id: 'access', label: 'Portaria & Acessos', icon: ShieldCheck },
              { id: 'occurrences', label: 'Chamados & Manutenção', icon: Wrench }
            ]
          },
          {
            title: 'Informativos',
            items: [
              { id: 'announcements', label: 'Quadro de Avisos', icon: Megaphone }
            ]
          }
        ];

      case 'sindico':
        return [
          {
            title: 'Visão Geral',
            items: [
              { id: 'dashboard', label: 'Gestão Executiva', icon: LayoutDashboard }
            ]
          },
          {
            title: 'Diretrizes & Governança',
            items: [
              { id: 'settings', label: 'Regras do Condomínio', icon: Sliders },
              { id: 'audit', label: 'Trilha de Auditoria', icon: History },
              { id: 'polls', label: 'Assembleias & Votações', icon: Vote },
              { id: 'errors', label: 'Diagnóstico & Erros', icon: AlertTriangle }
            ]
          },
          {
            title: 'Comunidade & Reparos',
            items: [
              { id: 'occurrences', label: 'Chamados de Manutenção', icon: Wrench },
              { id: 'residents', label: 'Moradores & Veículos', icon: Users },
              { id: 'reservations', label: 'Áreas & Reservas', icon: CalendarDays },
              { id: 'announcements', label: 'Mural de Avisos', icon: Megaphone }
            ]
          },
          {
            title: 'Operação & Segurança',
            items: [
              { id: 'deliveries', label: 'Encomendas & PIN', icon: Package },
              { id: 'access', label: 'Portaria & Acessos', icon: ShieldCheck }
            ]
          },
          {
            title: 'Controladoria & PDV',
            items: [
              { id: 'financial', label: 'Financeiro & Taxas', icon: DollarSign },
              { id: 'market', label: 'Mercadinho Autônomo', icon: ShoppingBag }
            ]
          }
        ];

      case 'admin':
      default:
        return [
          {
            title: 'Visão Geral',
            items: [
              { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard }
            ]
          },
          {
            title: 'Estrutura & Configuração',
            items: [
              { id: 'condominiums', label: 'Estrutura Predial', icon: Layers },
              { id: 'settings', label: 'Parâmetros do Condomínio', icon: Sliders }
            ]
          },
          {
            title: 'Acessos & Governança',
            items: [
              { id: 'users', label: 'Gestão de Usuários', icon: UserCog },
              { id: 'audit', label: 'Trilha de Auditoria', icon: History },
              { id: 'polls', label: 'Assembleias & Votações', icon: Vote },
              { id: 'errors', label: 'Diagnóstico & Erros', icon: AlertTriangle }
            ]
          },
          {
            title: 'Operação & Portaria',
            items: [
              { id: 'deliveries', label: 'Encomendas & PIN', icon: Package },
              { id: 'access', label: 'Portaria & Acessos', icon: ShieldCheck },
              { id: 'occurrences', label: 'Chamados & Manutenção', icon: Wrench }
            ]
          },
          {
            title: 'Gestão Predial',
            items: [
              { id: 'residents', label: 'Moradores & Veículos', icon: Users },
              { id: 'reservations', label: 'Áreas & Reservas', icon: CalendarDays },
              { id: 'announcements', label: 'Mural de Avisos', icon: Megaphone }
            ]
          },
          {
            title: 'Controladoria & PDV',
            items: [
              { id: 'financial', label: 'Financeiro & Taxas', icon: DollarSign },
              { id: 'market', label: 'Mercadinho Autônomo', icon: ShoppingBag }
            ]
          }
        ];
    }
  };

  const navGroups = getNavGroups();

  const getProfileBadge = () => {
    switch (profile) {
      case 'admin':
        return { label: 'Administrador ERP', icon: Shield, color: 'var(--primary)' };
      case 'sindico':
        return { label: 'Síndico Condomínio', icon: Award, color: 'var(--success)' };
      case 'trabalhador':
        return { label: 'Portaria / Operação', icon: UserCheck, color: 'var(--warning)' };
      case 'morador':
        return { label: 'Morador Residente', icon: Home, color: '#8b5cf6' };
      default:
        return { label: 'Usuário Ativo', icon: Shield, color: 'var(--primary)' };
    }
  };

  const badgeInfo = getProfileBadge();
  const BadgeIcon = badgeInfo.icon;

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="brand-section">
        <div className="brand-logo-icon">
          <Building2 size={22} />
        </div>
        <div className="brand-text">
          <h2>PratiCom</h2>
          <span>ERP Condominial</span>
        </div>
      </div>

      {/* Role Indicator Banner */}
      <div className="sidebar-role-indicator">
        <div className="role-icon-wrap" style={{ color: badgeInfo.color }}>
          <BadgeIcon size={15} />
        </div>
        <div className="role-info-text">
          <span className="role-prefix">Perfil em Uso</span>
          <span className="role-title" style={{ color: badgeInfo.color }}>{badgeInfo.label}</span>
        </div>
      </div>

      {/* Nav Sections */}
      <div className="nav-container">
        {navGroups.map((group) => (
          <div key={group.title} className="nav-section">
            <div className="nav-section-title">{group.title}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectTab(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={13} />
          <span>Standalone Data Engine</span>
        </div>
        <span>v2.0</span>
      </div>
    </aside>
  );
}
