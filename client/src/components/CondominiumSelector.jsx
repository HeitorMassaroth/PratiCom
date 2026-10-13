import React, { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Check, Plus, Search, ShieldCheck, MapPin, Layers } from 'lucide-react';
import { api } from '../services/api';

export default function CondominiumSelector({ onCondoChange, showToast, setCurrentView }) {
  const [isOpen, setIsOpen] = useState(false);
  const [condominiums, setCondominiums] = useState([]);
  const [activeCondoId, setActiveCondoId] = useState(api.getActiveCondominiumId() || '1');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchCondominiums = async () => {
    setLoading(true);
    try {
      const data = await api.getCondominiums();
      setCondominiums(data || []);
    } catch (err) {
      console.warn('Não foi possível carregar lista de condomínios:', err);
      setCondominiums([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCondominiums();
  }, [isOpen]);

  // Escutar eventos globais de alteração da lista de condomínios
  useEffect(() => {
    const handleCondoListUpdate = () => {
      fetchCondominiums();
      setActiveCondoId(api.getActiveCondominiumId() || '1');
    };
    window.addEventListener('condo-list-changed', handleCondoListUpdate);
    return () => window.removeEventListener('condo-list-changed', handleCondoListUpdate);
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Condomínio selecionado atual ou fallback
  const activeCondo = condominiums.find(c => String(c.id) === String(activeCondoId)) || {
    id: activeCondoId,
    name: condominiums.length > 0 ? condominiums[0].name : 'Condomínio Alpha Praticom',
    status: 'ACTIVE',
    city: 'São Paulo',
    state: 'SP',
    blocks_count: 2,
    units_count: 8
  };

  const handleSelectCondo = (condo) => {
    const idStr = String(condo.id);
    setActiveCondoId(idStr);
    api.setActiveCondominiumId(idStr);
    setIsOpen(false);

    if (showToast) {
      showToast(`Condomínio ativo alterado para "${condo.name}" (ID: ${condo.id})`, 'success');
    }

    if (onCondoChange) {
      onCondoChange(condo);
    }
  };

  const filteredCondos = condominiums.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="condo-selector-container" ref={dropdownRef}>
      {/* Botão Pill Seletor na Topbar */}
      <button 
        className={`condo-selector-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Clique para alternar o condomínio ativo"
      >
        <div className="condo-icon-box">
          <Building2 size={18} />
        </div>
        
        <div className="condo-info-pill">
          <span className="condo-label">Condomínio Ativo</span>
          <span className="condo-name">{activeCondo.name}</span>
        </div>

        <span className="condo-status-dot" title="Condomínio Ativo no Sistema"></span>
        <ChevronDown size={16} className={`condo-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {/* Menu Popover / Dropdown Modal Visual */}
      {isOpen && (
        <div className="condo-dropdown-menu">
          <div className="condo-dropdown-header">
            <div className="condo-header-title">
              <Building2 size={18} color="var(--brand-forest)" />
              <div>
                <h4>Alternar Condomínio</h4>
                <p>Selecione a instância condominial para operar</p>
              </div>
            </div>
            <span className="condo-badge-count">{condominiums.length} cadastrado(s)</span>
          </div>

          {/* Campo de Busca Rápida */}
          <div className="condo-search-box">
            <Search size={14} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou endereço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {/* Lista de Condomínios */}
          <div className="condo-list">
            {loading ? (
              <div className="condo-loading">Carregando condomínios...</div>
            ) : filteredCondos.length > 0 ? (
              filteredCondos.map((condo) => {
                const isCurrent = String(condo.id) === String(activeCondoId);
                return (
                  <div
                    key={condo.id}
                    className={`condo-item-card ${isCurrent ? 'selected' : ''}`}
                    onClick={() => handleSelectCondo(condo)}
                  >
                    <div className="condo-item-main">
                      <div className="condo-item-avatar">
                        <Building2 size={18} />
                      </div>
                      <div className="condo-item-details">
                        <div className="condo-item-name">{condo.name}</div>
                        <div className="condo-item-meta">
                          {condo.address ? (
                            <span><MapPin size={12} /> {condo.address}</span>
                          ) : (
                            <span>ID: #{condo.id}</span>
                          )}
                          <span className="condo-meta-divider">•</span>
                          <span><Layers size={12} /> {condo.blocks_count || 0} blocos ({condo.units_count || 0} aptos)</span>
                        </div>
                      </div>
                    </div>

                    {isCurrent ? (
                      <div className="condo-active-badge">
                        <Check size={14} /> Ativo
                      </div>
                    ) : (
                      <span className="condo-select-hint">Selecionar</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="condo-empty-state">
                <p>Nenhum condomínio encontrado.</p>
              </div>
            )}
          </div>

          {/* Rodapé com Atalho para Gestão Territorial */}
          <div className="condo-dropdown-footer">
            <button 
              className="condo-add-btn"
              onClick={() => {
                setIsOpen(false);
                if (setCurrentView) setCurrentView('territory');
              }}
            >
              <Plus size={15} /> Cadastrar ou Gerenciar Condomínios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
