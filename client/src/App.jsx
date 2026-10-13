import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './views/DashboardView';
import DeliveriesView from './views/DeliveriesView';
import FinancialView from './views/FinancialView';
import AccessControlView from './views/AccessControlView';
import ResidentsView from './views/ResidentsView';
import ReservationsView from './views/ReservationsView';
import AnnouncementsView from './views/AnnouncementsView';
import MarketInventoryView from './views/MarketInventoryView';
import CondominiumsBlocksView from './views/CondominiumsBlocksView';
import { api } from './services/api';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [userRole, setUserRole] = useState('admin'); // 'admin' | 'portaria' | 'morador'
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [availableModules, setAvailableModules] = useState(['dashboard', 'access', 'deliveries', 'reservations', 'financial', 'market']);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadDashboardMetrics = async () => {
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.warn('Dashboard não disponível ou com erro:', err.message);
    }
  };

  const loadCondoModules = async () => {
    try {
      const modulesList = await api.getActiveCondominiumModules();
      if (Array.isArray(modulesList)) {
        const enabledKeys = modulesList.filter(m => m.enabled).map(m => m.module_key);
        setAvailableModules(enabledKeys);

        // Fallback de navegação se a view atual estiver desativada no condomínio ativo
        const mandatoryViews = ['residents', 'territory', 'announcements'];
        setCurrentView(prevView => {
          if (mandatoryViews.includes(prevView)) return prevView;
          if (enabledKeys.includes(prevView)) return prevView;
          // Se o módulo da tela atual não estiver disponível, redireciona suavemente
          return enabledKeys.includes('dashboard') ? 'dashboard' : 'residents';
        });
      }
    } catch (err) {
      console.warn('Erro ao carregar módulos ativos:', err.message);
    }
  };

  const [activeCondo, setActiveCondo] = useState(null);
  const [condoRefreshKey, setCondoRefreshKey] = useState(Date.now());

  const handleCondoChange = (condo) => {
    if (condo) setActiveCondo(condo);
    loadCondoModules();
    loadDashboardMetrics();
    setCondoRefreshKey(Date.now());
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    loadCondoModules();
    loadDashboardMetrics();
    const interval = setInterval(loadDashboardMetrics, 15000);

    const onModulesChanged = () => {
      loadCondoModules();
      loadDashboardMetrics();
    };
    window.addEventListener('condo-modules-changed', onModulesChanged);
    window.addEventListener('dashboard-refresh', loadDashboardMetrics);

    return () => {
      clearInterval(interval);
      window.removeEventListener('condo-modules-changed', onModulesChanged);
      window.removeEventListener('dashboard-refresh', loadDashboardMetrics);
    };
  }, []);

  return (
    <div className="app-container">
      {/* Barra Lateral */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        stats={dashboardData?.metrics}
        availableModules={availableModules}
      />

      {/* Área Principal */}
      <div className="main-wrapper">
        <Header 
          currentView={currentView}
          setCurrentView={setCurrentView}
          theme={theme}
          toggleTheme={toggleTheme}
          userRole={userRole}
          setUserRole={setUserRole}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showToast={showToast}
          onCondoChange={handleCondoChange}
        />

        <main className="content-body" key={condoRefreshKey}>
          {currentView === 'dashboard' && (
            <DashboardView 
              data={dashboardData} 
              setCurrentView={setCurrentView}
              onRefresh={loadDashboardMetrics}
              activeCondo={activeCondo}
            />
          )}

          {currentView === 'deliveries' && (
            <DeliveriesView showToast={showToast} />
          )}

          {currentView === 'financial' && (
            <FinancialView showToast={showToast} />
          )}

          {currentView === 'access' && (
            <AccessControlView showToast={showToast} />
          )}

          {currentView === 'residents' && (
            <ResidentsView showToast={showToast} />
          )}

          {currentView === 'reservations' && (
            <ReservationsView showToast={showToast} />
          )}

          {currentView === 'announcements' && (
            <AnnouncementsView showToast={showToast} />
          )}

          {currentView === 'market' && (
            <MarketInventoryView showToast={showToast} />
          )}

          {currentView === 'territory' && <CondominiumsBlocksView showToast={showToast} />}
        </main>
      </div>

      {/* Sistema Global de Notificações Toast */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className="toast"
            style={{
              borderLeft: toast.type === 'success' ? '4px solid var(--accent-success)' :
                          toast.type === 'danger' ? '4px solid var(--accent-danger)' :
                          toast.type === 'warning' ? '4px solid var(--accent-warning)' : '4px solid var(--accent-primary)'
            }}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} color="var(--accent-success)" />}
            {toast.type === 'danger' && <AlertTriangle size={18} color="var(--accent-danger)" />}
            {toast.type === 'warning' && <AlertTriangle size={18} color="var(--accent-warning)" />}
            {toast.type === 'info' && <Info size={18} color="var(--accent-primary)" />}
            
            <div style={{ flex: 1 }}>{toast.message}</div>
            
            <button 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              onClick={() => removeToast(toast.id)}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
