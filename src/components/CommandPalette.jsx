import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Package,
  ShieldCheck,
  Users,
  CalendarDays,
  DollarSign,
  Megaphone,
  ShoppingBag,
  Building2,
  Sliders,
  History,
  Wrench,
  Vote,
  Sun,
  Moon,
  Shield,
  Award,
  UserCheck,
  Home,
  ArrowRight,
  Sparkles,
  Command
} from 'lucide-react';
import { setActiveProfile, getActiveProfile } from '../services/api';

export default function CommandPalette({ isOpen, onClose, onNavigate, onToggleTheme, theme }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const ACTIONS = [
    // Módulos
    { id: 'dashboard', title: 'Dashboard Executivo', category: 'Navegação', icon: LayoutDashboard, action: () => onNavigate('dashboard') },
    { id: 'deliveries', title: 'Armário Digital & Encomendas', category: 'Navegação', icon: Package, action: () => onNavigate('deliveries') },
    { id: 'access', title: 'Portaria & Controle de Acesso', category: 'Navegação', icon: ShieldCheck, action: () => onNavigate('access') },
    { id: 'occurrences', title: 'Chamados & Manutenção Predial', category: 'Navegação', icon: Wrench, action: () => onNavigate('occurrences') },
    { id: 'polls', title: 'Assembleias Virtuais & Votações', category: 'Navegação', icon: Vote, action: () => onNavigate('polls') },
    { id: 'residents', title: 'Moradores, Unidades & Veículos', category: 'Navegação', icon: Users, action: () => onNavigate('residents') },
    { id: 'reservations', title: 'Espaços Comuns & Reservas', category: 'Navegação', icon: CalendarDays, action: () => onNavigate('reservations') },
    { id: 'financial', title: 'Financeiro, Balancete & Cotas', category: 'Navegação', icon: DollarSign, action: () => onNavigate('financial') },
    { id: 'market', title: 'Honest Market Autônomo', category: 'Navegação', icon: ShoppingBag, action: () => onNavigate('market') },
    { id: 'announcements', title: 'Mural de Avisos & Comunicados', category: 'Navegação', icon: Megaphone, action: () => onNavigate('announcements') },
    { id: 'condominiums', title: 'Estrutura Predial & Blocos', category: 'Navegação', icon: Building2, action: () => onNavigate('condominiums') },
    { id: 'settings', title: 'Parâmetros & Regras do Condomínio', category: 'Navegação', icon: Sliders, action: () => onNavigate('settings') },
    { id: 'users', title: 'Gestão de Usuários & RBAC', category: 'Navegação', icon: Users, action: () => onNavigate('users') },
    { id: 'audit', title: 'Trilha de Auditoria & Conformidade', category: 'Navegação', icon: History, action: () => onNavigate('audit') },

    // Alternar Perfis (RBAC)
    { 
      id: 'profile-admin', 
      title: 'Mudar Perfil para Administrador Geral', 
      category: 'Papel de Acesso (RBAC)', 
      icon: Shield, 
      action: () => { setActiveProfile('admin'); onClose(); } 
    },
    { 
      id: 'profile-sindico', 
      title: 'Mudar Perfil para Síndico Responsável', 
      category: 'Papel de Acesso (RBAC)', 
      icon: Award, 
      action: () => { setActiveProfile('sindico'); onClose(); } 
    },
    { 
      id: 'profile-worker', 
      title: 'Mudar Perfil para Portaria / Operação', 
      category: 'Papel de Acesso (RBAC)', 
      icon: UserCheck, 
      action: () => { setActiveProfile('trabalhador'); onClose(); } 
    },
    { 
      id: 'profile-morador', 
      title: 'Mudar Perfil para Morador (Apto 101-A)', 
      category: 'Papel de Acesso (RBAC)', 
      icon: Home, 
      action: () => { setActiveProfile('morador'); onClose(); } 
    },

    // Ações Rápidas
    { 
      id: 'toggle-theme', 
      title: theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro', 
      category: 'Preferências', 
      icon: theme === 'dark' ? Sun : Moon, 
      action: () => { onToggleTheme(); onClose(); } 
    }
  ];

  const filteredActions = ACTIONS.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(false); // will trigger toggle in parent
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredActions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredActions.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredActions, onClose]);

  if (!isOpen) return null;

  return (
    <div className="spotlight-overlay" onClick={onClose}>
      <div className="spotlight-modal" onClick={e => e.stopPropagation()}>
        {/* Input de Busca */}
        <div className="spotlight-header">
          <Search size={18} className="spotlight-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="spotlight-input"
            placeholder="Digite para buscar telas, ações rápidas ou perfis..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="spotlight-esc-badge" onClick={onClose}>ESC</div>
        </div>

        {/* Lista de Resultados */}
        <div className="spotlight-results">
          {filteredActions.length === 0 ? (
            <div className="spotlight-empty">
              <span>Nenhum comando encontrado para "{query}"</span>
            </div>
          ) : (
            filteredActions.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`spotlight-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="spotlight-item-left">
                    <div className="spotlight-icon-wrap">
                      <Icon size={16} />
                    </div>
                    <div className="spotlight-item-text">
                      <span className="spotlight-item-title">{item.title}</span>
                      <span className="spotlight-item-category">{item.category}</span>
                    </div>
                  </div>
                  <div className="spotlight-item-right">
                    {isSelected && <ArrowRight size={14} className="spotlight-arrow" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé Informativo */}
        <div className="spotlight-footer">
          <div className="spotlight-footer-keys">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navegar</span>
            <span><kbd>↵</kbd> Executar</span>
            <span><kbd>ESC</kbd> Fechar</span>
          </div>
          <div className="spotlight-footer-brand">
            <Sparkles size={12} color="var(--primary)" />
            <span>PratiCom Spotlight</span>
          </div>
        </div>
      </div>
    </div>
  );
}
