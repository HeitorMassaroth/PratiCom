import React from 'react';
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
  Database
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab }) {
  const navGroups = [
    {
      title: 'Visão Geral',
      items: [
        { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Operação & Portaria',
      items: [
        { id: 'deliveries', label: 'Encomendas & PIN', icon: Package },
        { id: 'access', label: 'Portaria & Acessos', icon: ShieldCheck }
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
          <Database size={13} />
          <span>SQLite 3 (WAL)</span>
        </div>
        <span>v2.0.0</span>
      </div>
    </aside>
  );
}
