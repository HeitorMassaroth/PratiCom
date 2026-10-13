import React from 'react';
import { Sun, Moon, Search, Bell, Shield, User, Building } from 'lucide-react';
import CondominiumSelector from './CondominiumSelector';

export default function Header({ currentView, setCurrentView, theme, toggleTheme, userRole, setUserRole, searchTerm, setSearchTerm, showToast, onCondoChange }) {
  const titles = {
    dashboard: { title: 'Visão Geral & Dashboard', subtitle: 'Painel executivo com métricas consolidadas em tempo real' },
    deliveries: { title: 'Controle de Encomendas', subtitle: 'Recebimento de pacotes, notificação e confirmação por PIN' },
    financial: { title: 'Gestão Financeira & Boletos', subtitle: 'Controle de fluxo de caixa, despesas e inadimplência por unidade' },
    access: { title: 'Portaria & Controle de Acessos', subtitle: 'Registro de entrada e saída de visitantes, prestadores e veículos' },
    residents: { title: 'Cadastro de Pessoas & Unidades', subtitle: 'Diretório de moradores, apartamentos e veículos' },
    territory: { title: 'Condomínios & Blocos', subtitle: 'Estrutura territorial, blocos e associação segura de unidades' },
    reservations: { title: 'Reservas de Áreas Comuns', subtitle: 'Agendamento de churrasqueira, salão e quadra (Limite: 1 hora por pessoa/dia)' },
    announcements: { title: 'Mural de Comunicados', subtitle: 'Informativos, convocações de assembleia e avisos urgentes aos moradores' },
    market: { title: 'Mercadinho Autônomo & Estoque', subtitle: 'Controle de estoque, alerta de reposição e terminal PDV de autoatendimento' },
  };

  const currentInfo = titles[currentView] || { title: 'Praticom', subtitle: 'Sistema de Gestão Condominial' };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title">
          <h1>{currentInfo.title}</h1>
          <p>{currentInfo.subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        {/* Seletor Visual de Condomínio Ativo */}
        <CondominiumSelector 
          onCondoChange={onCondoChange}
          showToast={showToast}
          setCurrentView={setCurrentView}
        />

        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Pesquisar morador, apto, placa..."
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
          />
        </div>

        <div className="role-switcher" title="Alternar visão de perfil">
          <button
            className={`role-btn ${userRole === 'admin' ? 'active' : ''}`}
            onClick={() => setUserRole('admin')}
          >
            Síndico
          </button>
          <button
            className={`role-btn ${userRole === 'portaria' ? 'active' : ''}`}
            onClick={() => setUserRole('portaria')}
          >
            Portaria
          </button>
          <button
            className={`role-btn ${userRole === 'morador' ? 'active' : ''}`}
            onClick={() => setUserRole('morador')}
          >
            Morador
          </button>
        </div>

        <button className="theme-toggle-btn" onClick={toggleTheme} title="Alternar Tema Claro/Escuro">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
