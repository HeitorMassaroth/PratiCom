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
  Building2
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'deliveries', label: 'Encomendas', icon: Package },
    { id: 'access', label: 'Portaria & Acessos', icon: ShieldCheck },
    { id: 'residents', label: 'Moradores & Veículos', icon: Users },
    { id: 'reservations', label: 'Áreas & Reservas', icon: CalendarDays },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'market', label: 'Mercadinho (PDV)', icon: ShoppingBag },
    { id: 'announcements', label: 'Mural de Avisos', icon: Megaphone }
  ];

  return (
    <aside className="sidebar">
      <div className="brand-section">
        <div className="brand-logo-icon">
          <Building2 size={24} />
        </div>
        <div className="brand-text">
          <h2>PratiCom</h2>
          <span>ERP Condominial v2</span>
        </div>
      </div>

      <nav className="nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
