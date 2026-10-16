import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  Building, 
  Shield, 
  Award, 
  UserCheck, 
  Home, 
  ChevronDown,
  Search,
  Sparkles
} from 'lucide-react';
import { 
  getActiveCondoId, 
  setActiveCondoId, 
  getActiveProfile, 
  setActiveProfile, 
  api 
} from '../services/api';
import NotificationsPopover from './NotificationsPopover';

const PROFILES = [
  { id: 'admin', label: 'Administrador Geral', role: 'Administrador', icon: Shield, badgeClass: 'badge-admin' },
  { id: 'sindico', label: 'Síndico Responsável', role: 'Síndico', icon: Award, badgeClass: 'badge-sindico' },
  { id: 'trabalhador', label: 'Portaria & Operação', role: 'Trabalhador', icon: UserCheck, badgeClass: 'badge-worker' },
  { id: 'morador', label: 'Morador (Unid. 101-A)', role: 'Morador', icon: Home, badgeClass: 'badge-resident' }
];

export default function Header({ theme, onToggleTheme, onOpenSpotlight, onNavigate }) {
  const [condos, setCondos] = useState([]);
  const [selectedCondo, setSelectedCondo] = useState(getActiveCondoId());
  const [currentProfile, setCurrentProfile] = useState(getActiveProfile());

  useEffect(() => {
    api.get('/condominiums')
      .then((data) => setCondos(data || []))
      .catch((err) => console.error('Erro ao listar condomínios:', err));

    const handleProfileChange = () => {
      setCurrentProfile(getActiveProfile());
    };

    window.addEventListener('profile-changed', handleProfileChange);
    return () => window.removeEventListener('profile-changed', handleProfileChange);
  }, []);

  const handleCondoChange = (e) => {
    const val = e.target.value;
    setSelectedCondo(val);
    setActiveCondoId(val);
  };

  const handleProfileChange = (e) => {
    const val = e.target.value;
    setCurrentProfile(val);
    setActiveProfile(val);
  };

  const activeProfileData = PROFILES.find(p => p.id === currentProfile) || PROFILES[0];
  const ProfileIcon = activeProfileData.icon;

  return (
    <header className="top-header">
      <div className="header-left">
        {/* Seletor de Condomínio Ativo */}
        <div className="condo-picker" title="Condomínio selecionado para o contexto de dados">
          <Building size={16} color="var(--primary)" />
          <label htmlFor="condo-select">Condomínio:</label>
          <select id="condo-select" value={selectedCondo} onChange={handleCondoChange}>
            {condos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Botão de Busca Rápida (Spotlight / Command Palette) */}
        <button 
          className="quick-search-trigger"
          onClick={onOpenSpotlight}
          title="Buscar qualquer tela, ação ou perfil (Ctrl+K)"
        >
          <Search size={14} className="quick-search-icon" />
          <span className="quick-search-text">Buscar telas, ações ou dados...</span>
          <kbd className="quick-search-kbd">Ctrl K</kbd>
        </button>
      </div>

      <div className="header-actions">
        {/* Status do Sistema com Pulso Radar */}
        <div className="system-status-indicator" title="Interface corporativa integrada ao motor em memória">
          <span className="status-radar-dot"></span>
          <span>PratiCom v2.0</span>
        </div>

        {/* Central de Notificações em Tempo Real */}
        <NotificationsPopover onNavigate={onNavigate} />

        {/* Seletor de Perfil de Acesso (RBAC) */}
        <div className="profile-selector-box" title="Alternar papel de acesso para testar permissões e layouts">
          <div className={`profile-badge-pill ${activeProfileData.badgeClass}`}>
            <ProfileIcon size={14} />
            <span>{activeProfileData.role}</span>
          </div>
          <select 
            id="profile-select"
            aria-label="Perfil de Usuário Ativo"
            value={currentProfile} 
            onChange={handleProfileChange}
            className="profile-native-select"
          >
            {PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="profile-chevron" />
        </div>

        {/* Botão de Alternância de Tema */}
        <button
          className="btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          aria-label="Alternar tema de cores"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
