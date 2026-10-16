import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import DashboardView from './views/DashboardView';
import DeliveriesView from './views/DeliveriesView';
import AccessControlView from './views/AccessControlView';
import ResidentsView from './views/ResidentsView';
import ReservationsView from './views/ReservationsView';
import FinancialView from './views/FinancialView';
import MarketView from './views/MarketView';
import AnnouncementsView from './views/AnnouncementsView';
import CondominiumsBlocksView from './views/CondominiumsBlocksView';
import UsersManagementView from './views/UsersManagementView';
import CondoSettingsView from './views/CondoSettingsView';
import AuditLogsView from './views/AuditLogsView';
import MaintenanceOccurrencesView from './views/MaintenanceOccurrencesView';
import AssembliesPollsView from './views/AssembliesPollsView';
import SystemErrorsView from './views/SystemErrorsView';

import Toast from './components/Toast';
import CommandPalette from './components/CommandPalette';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getActiveProfile } from './services/api';
import { ShieldAlert, ArrowLeft, AlertOctagon } from 'lucide-react';

const ROLE_PERMISSIONS = {
  admin: [
    'dashboard', 
    'condominiums', 
    'settings', 
    'users', 
    'audit', 
    'polls',
    'occurrences',
    'deliveries', 
    'access', 
    'residents', 
    'reservations', 
    'financial', 
    'market', 
    'announcements',
    'errors'
  ],
  sindico: [
    'dashboard', 
    'settings', 
    'audit', 
    'polls',
    'occurrences',
    'deliveries', 
    'access', 
    'residents', 
    'reservations', 
    'financial', 
    'market', 
    'announcements',
    'errors'
  ],
  trabalhador: [
    'dashboard', 
    'deliveries', 
    'access', 
    'occurrences',
    'announcements'
  ],
  morador: [
    'dashboard', 
    'deliveries', 
    'reservations', 
    'occurrences',
    'polls',
    'residents', 
    'announcements'
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('praticom_theme') || 'dark');
  const [profile, setProfile] = useState(getActiveProfile());
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('praticom_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleProfileChange = () => {
      const newProfile = getActiveProfile();
      setProfile(newProfile);
      // Se a aba ativa não for permitida no novo perfil, redireciona suavemente para dashboard
      const allowed = ROLE_PERMISSIONS[newProfile] || ROLE_PERMISSIONS.admin;
      if (!allowed.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('profile-changed', handleProfileChange);
    return () => window.removeEventListener('profile-changed', handleProfileChange);
  }, [activeTab]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isTabAllowed = () => {
    const allowed = ROLE_PERMISSIONS[profile] || ROLE_PERMISSIONS.admin;
    return allowed.includes(activeTab);
  };

  const renderActiveView = () => {
    if (!isTabAllowed()) {
      return (
        <div className="restricted-access-view">
          <div className="restricted-card">
            <div className="restricted-icon-wrap">
              <ShieldAlert size={42} />
            </div>
            <h2>Acesso Restrito ao Módulo</h2>
            <p>
              O perfil <strong>{profile.toUpperCase()}</strong> não possui permissões administrativas para visualizar ou gerenciar esta seção.
            </p>
            <div className="restricted-advice">
              <span>Para testar esta funcionalidade no ERP, selecione o perfil <strong>Administrador</strong> ou <strong>Síndico</strong> no menu superior direito.</span>
            </div>
            <button className="btn btn-primary" onClick={() => setActiveTab('dashboard')}>
              <ArrowLeft size={16} /> Voltar ao Dashboard
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveTab} />;
      case 'condominiums':
        return <CondominiumsBlocksView />;
      case 'settings':
        return <CondoSettingsView />;
      case 'users':
        return <UsersManagementView />;
      case 'audit':
        return <AuditLogsView />;
      case 'occurrences':
        return <MaintenanceOccurrencesView />;
      case 'polls':
        return <AssembliesPollsView />;
      case 'deliveries':
        return <DeliveriesView />;
      case 'access':
        return <AccessControlView />;
      case 'residents':
        return <ResidentsView />;
      case 'reservations':
        return <ReservationsView />;
      case 'financial':
        return <FinancialView />;
      case 'market':
        return <MarketView />;
      case 'announcements':
        return <AnnouncementsView />;
      case 'errors':
        return <SystemErrorsView />;
      default:
        return (
          <div className="error-404-view animate-fade-in">
            <div className="error-404-card">
              <div className="error-404-code">404</div>
              <h2>Módulo Não Localizado</h2>
              <p>A seção ou rota <strong>"{activeTab}"</strong> não existe ou foi temporariamente movida.</p>
              <div className="error-404-actions">
                <button type="button" className="btn btn-primary" onClick={() => setActiveTab('dashboard')}>
                  <ArrowLeft size={16} /> Voltar ao Dashboard
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setActiveTab('errors')}>
                  <AlertOctagon size={16} /> Ver Central de Diagnóstico
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      <div className="main-content">
        <Header 
          theme={theme} 
          onToggleTheme={toggleTheme} 
          onOpenSpotlight={() => setIsSpotlightOpen(true)}
          onNavigate={setActiveTab}
        />
        <main>
          <ErrorBoundary onNavigate={setActiveTab} onReset={() => setActiveTab('dashboard')}>
            {renderActiveView()}
          </ErrorBoundary>
        </main>
      </div>
      <CommandPalette 
        isOpen={isSpotlightOpen} 
        onClose={() => setIsSpotlightOpen(false)} 
        onNavigate={setActiveTab}
        onToggleTheme={toggleTheme}
        theme={theme}
      />
      <Toast />
    </div>
  );
}
