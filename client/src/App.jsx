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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('praticom_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('praticom_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveTab} />;
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
      default:
        return <DashboardView onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      <div className="main-content">
        <Header theme={theme} onToggleTheme={toggleTheme} />
        <main>{renderActiveView()}</main>
      </div>
    </div>
  );
}
