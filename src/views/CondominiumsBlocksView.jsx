import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Layers,
  Home,
  Edit3,
  Trash2,
  Check,
  AlertTriangle,
  Phone,
  FileText,
  Search,
  Sliders,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Car,
  Heart,
  Package,
  MessageSquare,
  LayoutGrid,
  List as ListIcon,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import api, { getActiveCondoId, setActiveCondoId } from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

export default function CondominiumsBlocksView() {
  const [condominiums, setCondominiums] = useState([]);
  const [selectedCondoId, setSelectedCondoId] = useState(getActiveCondoId());
  const [blocks, setBlocks] = useState([]);
  const [units, setUnits] = useState([]);
  const [residents, setResidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [pets, setPets] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [modules, setModules] = useState({});

  // Modo de visualização de unidades: 'facade' (Mapa dos Andares) ou 'table' (Tabela)
  const [unitsViewMode, setUnitsViewMode] = useState('facade');
  const [selectedDossierUnit, setSelectedDossierUnit] = useState(null);

  // Filtros
  const [selectedBlockFilter, setSelectedBlockFilter] = useState('ALL');
  const [unitSearch, setUnitSearch] = useState('');

  // Modais de Condomínio
  const [isCondoModalOpen, setIsCondoModalOpen] = useState(false);
  const [condoForm, setCondoForm] = useState({ name: '', cnpj: '', address: '', city: 'Curitiba', state: 'PR', postal_code: '', phone: '', status: 'ACTIVE' });
  const [editingCondo, setEditingCondo] = useState(null);
  const [deletingCondo, setDeletingCondo] = useState(null);

  // Modais de Bloco
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({ name: '', description: '' });
  const [editingBlock, setEditingBlock] = useState(null);
  const [deletingBlock, setDeletingBlock] = useState(null);

  // Modais de Unidade
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitForm, setUnitForm] = useState({ block_id: '', number: '', floor: '1', type: 'Residencial' });
  const [editingUnit, setEditingUnit] = useState(null);
  const [deletingUnit, setDeletingUnit] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      const [cList, bList, uList, rList, vList, pList, dList] = await Promise.all([
        api.get('/condominiums'),
        api.get(`/blocks?condominium_id=${selectedCondoId}`),
        api.get('/units'),
        api.get('/residents'),
        api.get('/vehicles').catch(() => []),
        api.get('/pets').catch(() => []),
        api.get('/deliveries').catch(() => [])
      ]);
      setCondominiums(cList || []);
      setBlocks(bList || []);
      setUnits(uList || []);
      setResidents(rList || []);
      setVehicles(vList || []);
      setPets(pList || []);
      setDeliveries(dList || []);

      if (selectedCondoId) {
        const mod = await api.get(`/condominiums/${selectedCondoId}/modules`);
        setModules(mod || {});
      }
    } catch (err) {
      console.error('Erro ao carregar estrutura predial:', err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('condo-changed', () => {
      setSelectedCondoId(getActiveCondoId());
    });
  }, [selectedCondoId]);

  const activeCondo = condominiums.find((c) => String(c.id) === String(selectedCondoId)) || condominiums[0];

  // Alternar Condomínio em Foco
  const handleSelectCondo = (id) => {
    setSelectedCondoId(String(id));
    setActiveCondoId(String(id));
    setSelectedBlockFilter('ALL');
  };

  // --- CRUD CONDOMÍNIO ---
  const handleSaveCondo = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingCondo) {
        await api.patch(`/condominiums/${editingCondo.id}`, condoForm);
        showToast('Condomínio atualizado com sucesso.');
      } else {
        const created = await api.post('/condominiums', condoForm);
        setSelectedCondoId(String(created.id));
        setActiveCondoId(String(created.id));
        showToast('Novo condomínio cadastrado com sucesso.');
      }
      setIsCondoModalOpen(false);
      setEditingCondo(null);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteCondo = async () => {
    if (!deletingCondo) return;
    try {
      await api.delete(`/condominiums/${deletingCondo.id}`);
      showToast('Condomínio removido com sucesso.');
      setDeletingCondo(null);
      const remaining = condominiums.filter((c) => c.id !== deletingCondo.id);
      if (remaining.length > 0) {
        handleSelectCondo(remaining[0].id);
      }
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- CRUD BLOCO ---
  const handleSaveBlock = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingBlock) {
        await api.patch(`/blocks/${editingBlock.id}`, blockForm);
        showToast('Bloco atualizado com sucesso.');
      } else {
        await api.post('/blocks', { ...blockForm, condominium_id: selectedCondoId });
        showToast('Bloco cadastrado com sucesso.');
      }
      setIsBlockModalOpen(false);
      setEditingBlock(null);
      setBlockForm({ name: '', description: '' });
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteBlock = async () => {
    if (!deletingBlock) return;
    try {
      await api.delete(`/blocks/${deletingBlock.id}`);
      showToast('Bloco removido com sucesso.');
      setDeletingBlock(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- CRUD UNIDADE ---
  const handleSaveUnit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingUnit) {
        await api.patch(`/units/${editingUnit.id}`, unitForm);
        showToast('Unidade atualizada com sucesso.');
      } else {
        await api.post('/units', { ...unitForm, condominium_id: selectedCondoId });
        showToast('Unidade cadastrada com sucesso.');
      }
      setIsUnitModalOpen(false);
      setEditingUnit(null);
      setUnitForm({ block_id: blocks[0]?.id || '', number: '', floor: '1', type: 'Residencial' });
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;
    try {
      await api.delete(`/units/${deletingUnit.id}`);
      showToast('Unidade removida com sucesso.');
      setDeletingUnit(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- TOGGLE MÓDULOS ---
  const handleToggleModule = async (key) => {
    if (!activeCondo) return;
    const nextVal = !modules[key];
    const updated = { ...modules, [key]: nextVal };
    setModules(updated);
    try {
      await api.patch(`/condominiums/${activeCondo.id}/modules`, { [key]: nextVal });
      showToast(`Módulo "${key}" ${nextVal ? 'ativado' : 'desativado'}.`);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUnits = units.filter((u) => {
    if (selectedBlockFilter !== 'ALL' && u.block_id !== Number(selectedBlockFilter)) return false;
    const term = unitSearch.toLowerCase();
    return u.number.toLowerCase().includes(term) || u.type?.toLowerCase().includes(term);
  });

  return (
    <div className="page-container">
      {/* Header do Módulo */}
      <div className="page-header">
        <div>
          <h1>Estrutura Predial: Condomínios, Blocos & Unidades</h1>
          <p>Mapeamento territorial hierárquico com integridade relacional entre condomínios, torres e apartamentos.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingCondo(null);
            setCondoForm({ name: '', cnpj: '', address: '', city: 'Curitiba', state: 'PR', postal_code: '', phone: '', status: 'ACTIVE' });
            setIsCondoModalOpen(true);
            setErrorMsg('');
          }}
        >
          <Plus size={16} />
          <span>Novo Condomínio</span>
        </button>
      </div>

      {/* Visualizador Hierárquico Nível 1: Condomínio Selecionado */}
      {activeCondo && (
        <div className="erp-panel" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-primary">Condomínio Ativo #{activeCondo.id}</span>
                <span className={`badge ${activeCondo.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                  {activeCondo.status === 'ACTIVE' ? 'Operacional / Ativo' : 'Inativo'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{activeCondo.name}</h2>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>CNPJ: {activeCondo.cnpj || '—'}</span> • <span>Endereço: {activeCondo.address}, {activeCondo.city} - {activeCondo.state}</span> • <span>Tel: {activeCondo.phone || '—'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setEditingCondo(activeCondo);
                  setCondoForm({ ...activeCondo });
                  setIsCondoModalOpen(true);
                  setErrorMsg('');
                }}
              >
                <Edit3 size={13} />
                <span>Editar Condomínio</span>
              </button>
              <button
                className="btn btn-sm btn-outline"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                onClick={() => setDeletingCondo(activeCondo)}
                title="Excluir condomínio (valida dependências)"
              >
                <Trash2 size={13} />
                <span>Excluir</span>
              </button>
            </div>
          </div>

          {/* Seletor rápido de outros condomínios cadastrados */}
          {condominiums.length > 1 && (
            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Alternar Condomínio:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {condominiums.map((c) => (
                  <button
                    key={c.id}
                    className={`btn btn-sm ${String(c.id) === String(selectedCondoId) ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handleSelectCondo(c.id)}
                    style={{ fontSize: '0.78rem', padding: '3px 10px' }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid Principal: Nível 2 (Blocos/Torres) e Nível 3 (Unidades/Apartamentos) */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Nível 2: Gestão de Blocos / Torres */}
        <div className="erp-panel">
          <div className="panel-header">
            <h3>
              <Layers size={18} color="var(--primary)" />
              <span>Blocos & Torres ({blocks.length})</span>
            </h3>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setEditingBlock(null);
                setBlockForm({ name: '', description: '' });
                setIsBlockModalOpen(true);
                setErrorMsg('');
              }}
            >
              <Plus size={13} />
              <span>Bloco</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {blocks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nenhum bloco cadastrado neste condomínio.
              </div>
            ) : (
              blocks.map((b) => {
                const count = units.filter((u) => u.block_id === b.id).length;
                const isFiltered = String(selectedBlockFilter) === String(b.id);
                return (
                  <div
                    key={b.id}
                    style={{
                      padding: '12px 14px',
                      background: isFiltered ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                      border: `1px solid ${isFiltered ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onClick={() => setSelectedBlockFilter(isFiltered ? 'ALL' : String(b.id))}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: isFiltered ? 'var(--primary)' : 'var(--text-main)' }}>
                        {b.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {count} {count === 1 ? 'apartamento' : 'apartamentos'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon"
                        style={{ width: 26, height: 26 }}
                        onClick={() => {
                          setEditingBlock(b);
                          setBlockForm({ name: b.name, description: b.description || '' });
                          setIsBlockModalOpen(true);
                          setErrorMsg('');
                        }}
                        title="Editar bloco"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        className="btn-icon"
                        style={{ width: 26, height: 26, color: 'var(--danger)' }}
                        onClick={() => setDeletingBlock(b)}
                        title="Excluir bloco (bloqueia se tiver unidades)"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Nível 3: Gestão de Unidades / Apartamentos */}
        <div className="erp-panel">
          <div className="panel-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3>
                <Home size={18} color="var(--primary)" />
                <span>Unidades Habitacionais & Apartamentos</span>
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {selectedBlockFilter === 'ALL' ? 'Exibindo todas as torres' : `Filtrado por: ${blocks.find(b => String(b.id) === String(selectedBlockFilter))?.name}`}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Switcher Fachada vs Tabela */}
              <div className="segmented-tabs" style={{ margin: 0 }}>
                <button
                  className={`segmented-tab ${unitsViewMode === 'facade' ? 'active' : ''}`}
                  onClick={() => setUnitsViewMode('facade')}
                  title="Mapa Visual dos Andares / Fachada Predial"
                >
                  <LayoutGrid size={13} /> Andares
                </button>
                <button
                  className={`segmented-tab ${unitsViewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setUnitsViewMode('table')}
                  title="Tabela Detalhada de Unidades"
                >
                  <ListIcon size={13} /> Tabela
                </button>
              </div>

              <button
                className="btn btn-primary"
                disabled={blocks.length === 0}
                onClick={() => {
                  setEditingUnit(null);
                  setUnitForm({ block_id: blocks[0]?.id || '', number: '', floor: '1', type: 'Residencial' });
                  setIsUnitModalOpen(true);
                  setErrorMsg('');
                }}
              >
                <Plus size={15} />
                <span>Nova Unidade</span>
              </button>
            </div>
          </div>

          {/* Barra de Busca e Filtros de Unidades */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Filtrar por número da unidade..."
                style={{ paddingLeft: '32px' }}
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
              />
            </div>

            <div className="segmented-tabs">
              <button
                className={`segmented-tab ${selectedBlockFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedBlockFilter('ALL')}
              >
                Todas ({units.length})
              </button>
              {blocks.map((b) => (
                <button
                  key={b.id}
                  className={`segmented-tab ${String(selectedBlockFilter) === String(b.id) ? 'active' : ''}`}
                  onClick={() => setSelectedBlockFilter(String(b.id))}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          {/* Visualização 1: Mapa dos Andares / Fachada Predial */}
          {unitsViewMode === 'facade' && (
            <div>
              {filteredUnits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Nenhuma unidade habitacional encontrada neste bloco.
                </div>
              ) : (
                <div className="facade-floors-container">
                  {/* Agrupamento por andares decrescentes */}
                  {Array.from(new Set(filteredUnits.map((u) => Number(u.floor) || 1)))
                    .sort((a, b) => b - a)
                    .map((floorNum) => {
                      const floorUnits = filteredUnits.filter((u) => (Number(u.floor) || 1) === floorNum);
                      return (
                        <div key={floorNum} className="facade-floor-row">
                          <div className="facade-floor-label">
                            <span className="facade-floor-number">{floorNum}º</span>
                            <span className="facade-floor-name">Pavimento</span>
                          </div>

                          <div className="facade-units-grid">
                            {floorUnits.map((u) => {
                              const uResidents = residents.filter((r) => r.unit_id === u.id);
                              const uVehicles = vehicles.filter((v) => v.unit_id === u.id);
                              const isOccupied = uResidents.length > 0;

                              return (
                                <div
                                  key={u.id}
                                  className={`facade-unit-tile ${isOccupied ? 'is-occupied' : 'is-vacant'}`}
                                  onClick={() => setSelectedDossierUnit(u)}
                                  title="Clique para abrir o Dossiê 360º da Unidade"
                                >
                                  <div className="facade-unit-top">
                                    <span className="facade-unit-number">Apto {u.number}</span>
                                    <span className={`badge ${isOccupied ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                                      {isOccupied ? 'Ocupado' : 'Vago'}
                                    </span>
                                  </div>

                                  <div className="facade-unit-owner">
                                    {isOccupied ? uResidents[0].name : 'Sem morador'}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: '4px' }}>
                                    <span>{u.type || 'Residencial'}</span>
                                    {uVehicles.length > 0 && (
                                      <span title={`${uVehicles.length} veículo(s)`}>🚗 {uVehicles.length}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Visualização 2: Tabela de Unidades */}
          {unitsViewMode === 'table' && (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Unidade</th>
                    <th>Torre / Bloco</th>
                    <th>Andar</th>
                    <th>Tipo</th>
                    <th>Ocupantes / Moradores</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        Nenhuma unidade habitacional encontrada neste bloco.
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((u) => {
                      const condoResidents = residents.filter((r) => r.unit_id === u.id);
                      return (
                        <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedDossierUnit(u)}>
                          <td className="num-cell" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                            Apto {u.number}
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{u.block_name || 'Sem bloco'}</span>
                          </td>
                          <td className="num-cell">{u.floor}º Andar</td>
                          <td>
                            <span className="badge badge-neutral">{u.type}</span>
                          </td>
                          <td>
                            {condoResidents.length > 0 ? (
                              <div style={{ fontSize: '0.82rem' }}>
                                <span style={{ fontWeight: 600 }}>{condoResidents[0].name}</span>
                                {condoResidents.length > 1 && (
                                  <span style={{ color: 'var(--text-dim)', marginLeft: '4px' }}>
                                    (+{condoResidents.length - 1} dependentes)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Sem morador cadastrado</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                              <button
                                className="btn-icon"
                                style={{ width: 28, height: 28 }}
                                onClick={() => {
                                  setEditingUnit(u);
                                  setUnitForm({ block_id: u.block_id, number: u.number, floor: String(u.floor), type: u.type });
                                  setIsUnitModalOpen(true);
                                  setErrorMsg('');
                                }}
                                title="Editar unidade"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                className="btn-icon"
                                style={{ width: 28, height: 28, color: 'var(--danger)' }}
                                onClick={() => setDeletingUnit(u)}
                                title="Excluir unidade (bloqueia se tiver moradores)"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Painel Inferior: Auditoria e Ativação de Módulos do Condomínio */}
      <div className="erp-panel" style={{ marginTop: '24px' }}>
        <div className="panel-header">
          <h3>
            <Sliders size={18} color="var(--primary)" />
            <span>Módulos de Sistema Parametrizáveis por Condomínio</span>
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Parametrização seletiva para: {activeCondo?.name}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {[
            { key: 'deliveries', label: 'Portaria & Encomendas com PIN' },
            { key: 'access', label: 'Controle de Acessos & Visitantes' },
            { key: 'residents', label: 'Cadastro de Moradores & Frotas' },
            { key: 'reservations', label: 'Áreas de Convivência & Reservas' },
            { key: 'financial', label: 'Controladoria & Balancetes' },
            { key: 'market', label: 'Mercadinho Autônomo 24/7 (PDV)' }
          ].map((m) => {
            const isEnabled = modules[m.key] !== false;
            return (
              <div
                key={m.key}
                style={{
                  padding: '12px 16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{m.label}</span>
                <button
                  className={`btn btn-sm ${isEnabled ? 'btn-success' : 'btn-secondary'}`}
                  style={{ fontSize: '0.74rem', padding: '3px 10px' }}
                  onClick={() => handleToggleModule(m.key)}
                >
                  {isEnabled ? 'Ativado' : 'Desativado'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================
          MODAIS DE OPERAÇÃO
         ==================================================== */}

      {/* Modal: Cadastrar / Editar Condomínio */}
      <Modal
        isOpen={isCondoModalOpen}
        onClose={() => setIsCondoModalOpen(false)}
        title={editingCondo ? `Editar Condomínio #${editingCondo.id}` : 'Cadastrar Novo Condomínio'}
      >
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleSaveCondo}>
          <div className="form-group">
            <label>Razão Social / Nome do Condomínio <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Ex: Condomínio Residencial Ilhas Gregas"
              value={condoForm.name}
              onChange={(e) => setCondoForm({ ...condoForm, name: e.target.value })}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>CNPJ do Condomínio</label>
              <input
                type="text"
                className="form-control"
                placeholder="00.000.000/0001-00"
                value={condoForm.cnpj}
                onChange={(e) => setCondoForm({ ...condoForm, cnpj: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Telefone / Contato</label>
              <input
                type="text"
                className="form-control"
                placeholder="(41) 3333-0000"
                value={condoForm.phone}
                onChange={(e) => setCondoForm({ ...condoForm, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Logradouro / Endereço Completo</label>
            <input
              type="text"
              className="form-control"
              placeholder="Rua, Número, Bairro"
              value={condoForm.address}
              onChange={(e) => setCondoForm({ ...condoForm, address: e.target.value })}
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Cidade</label>
              <input
                type="text"
                className="form-control"
                value={condoForm.city}
                onChange={(e) => setCondoForm({ ...condoForm, city: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>UF</label>
              <input
                type="text"
                className="form-control"
                maxLength={2}
                value={condoForm.state}
                onChange={(e) => setCondoForm({ ...condoForm, state: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="form-group">
              <label>CEP</label>
              <input
                type="text"
                className="form-control"
                placeholder="80000-000"
                value={condoForm.postal_code}
                onChange={(e) => setCondoForm({ ...condoForm, postal_code: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCondoModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>{editingCondo ? 'Salvar Alterações' : 'Cadastrar Condomínio'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Cadastrar / Editar Bloco */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title={editingBlock ? `Editar Bloco: ${editingBlock.name}` : 'Cadastrar Bloco / Torre'}
      >
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleSaveBlock}>
          <div className="form-group">
            <label>Identificação / Nome do Bloco <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Ex: Torre A - Acácia, Bloco 01"
              value={blockForm.name}
              onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Descrição / Pavimentos</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: 8 pavimentos, 4 apartamentos por andar"
              value={blockForm.description}
              onChange={(e) => setBlockForm({ ...blockForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsBlockModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>{editingBlock ? 'Salvar Bloco' : 'Cadastrar Bloco'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Cadastrar / Editar Unidade */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title={editingUnit ? `Editar Unidade: Apto ${editingUnit.number}` : 'Cadastrar Unidade Habitacional'}
      >
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleSaveUnit}>
          <div className="form-group">
            <label>Bloco Pertencente <span className="required">*</span></label>
            <select
              className="form-control"
              required
              value={unitForm.block_id}
              onChange={(e) => setUnitForm({ ...unitForm, block_id: e.target.value })}
            >
              <option value="">Selecione o bloco da unidade...</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Número / Identificação <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="Ex: 101, 202-B, Cobertura 01"
                value={unitForm.number}
                onChange={(e) => setUnitForm({ ...unitForm, number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Andar / Pavimento</label>
              <input
                type="number"
                className="form-control"
                value={unitForm.floor}
                onChange={(e) => setUnitForm({ ...unitForm, floor: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tipo de Unidade</label>
            <select
              className="form-control"
              value={unitForm.type}
              onChange={(e) => setUnitForm({ ...unitForm, type: e.target.value })}
            >
              <option value="Residencial">Residencial</option>
              <option value="Cobertura">Cobertura</option>
              <option value="Comercial">Comercial</option>
              <option value="Kitnet">Kitnet</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsUnitModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>{editingUnit ? 'Salvar Unidade' : 'Cadastrar Unidade'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão de Condomínio */}
      {deletingCondo && (
        <Modal
          isOpen={Boolean(deletingCondo)}
          onClose={() => setDeletingCondo(null)}
          title="Confirmar Exclusão de Condomínio"
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', marginBottom: '14px' }}>
              <AlertTriangle size={24} />
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Excluir Condomínio: "{deletingCondo.name}"?</span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
              Esta ação verifica se existem blocos, unidades habitacionais ou moradores vinculados antes de autorizar a remoção.
            </p>

            <div style={{ marginTop: '14px', padding: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.82rem' }}>
              <strong>Regra de Integridade Relacional:</strong> Caso haja dependências cadastradas, a exclusão será imediatamente bloqueada para prevenir corrupção e orfandade de dados.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingCondo(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDeleteCondo}>
                <Trash2 size={16} />
                <span>Excluir Definitivamente</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Confirmação de Exclusão de Bloco */}
      {deletingBlock && (
        <Modal
          isOpen={Boolean(deletingBlock)}
          onClose={() => setDeletingBlock(null)}
          title="Confirmar Exclusão de Bloco"
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', marginBottom: '14px' }}>
              <AlertTriangle size={24} />
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Excluir Bloco: "{deletingBlock.name}"?</span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
              Deseja remover este bloco do condomínio?
            </p>

            <div style={{ marginTop: '14px', padding: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.82rem' }}>
              <strong>Atenção:</strong> Se este bloco possuir apartamentos cadastrados, a operação será bloqueada pela integridade relacional.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingBlock(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDeleteBlock}>
                <Trash2 size={16} />
                <span>Excluir Bloco</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Confirmação de Exclusão de Unidade */}
      {deletingUnit && (
        <Modal
          isOpen={Boolean(deletingUnit)}
          onClose={() => setDeletingUnit(null)}
          title="Confirmar Exclusão de Apartamento"
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', marginBottom: '14px' }}>
              <AlertTriangle size={24} />
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Excluir Unidade "Apto {deletingUnit.number}"?</span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
              Bloco: <strong>{deletingUnit.block_name}</strong>
            </p>

            <div style={{ marginTop: '14px', padding: '12px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.82rem' }}>
              <strong>Atenção:</strong> Se esta unidade possuir moradores cadastrados, vagas/veículos ou encomendas aguardando retirada, a exclusão será bloqueada para preservar o histórico.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingUnit(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDeleteUnit}>
                <Trash2 size={16} />
                <span>Excluir Unidade</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Dossiê 360º da Unidade Habitacional */}
      {selectedDossierUnit && (
        <Modal
          isOpen={Boolean(selectedDossierUnit)}
          onClose={() => setSelectedDossierUnit(null)}
          title={`Dossiê 360º • Unidade ${selectedDossierUnit.number}`}
        >
          {(() => {
            const uResidents = residents.filter((r) => r.unit_id === selectedDossierUnit.id);
            const uVehicles = vehicles.filter((v) => v.unit_id === selectedDossierUnit.id);
            const uPets = pets.filter((p) => p.unit_id === selectedDossierUnit.id);
            const uDeliveries = deliveries.filter((d) => d.unit_id === selectedDossierUnit.id);
            const isOccupied = uResidents.length > 0;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Header do Dossiê */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                      Apartamento {selectedDossierUnit.number}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {selectedDossierUnit.block_name} • {selectedDossierUnit.floor}º Pavimento • {selectedDossierUnit.type || 'Residencial'}
                    </div>
                  </div>
                  <span className={`badge ${isOccupied ? 'badge-success' : 'badge-neutral'}`} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    {isOccupied ? '🟢 Imóvel Ocupado' : '🔵 Imóvel Vago / Desocupado'}
                  </span>
                </div>

                {/* Seção 1: Moradores */}
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Users size={16} color="var(--primary)" />
                    <span>Moradores & Titulares ({uResidents.length})</span>
                  </h4>

                  {uResidents.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', padding: '10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                      Nenhum morador registrado para esta unidade.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {uResidents.map((r) => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)' }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.86rem' }}>{r.name}</span>
                            <span className="badge badge-primary" style={{ marginLeft: '8px', fontSize: '0.7rem' }}>{r.role}</span>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Tel: {r.phone || '—'} {r.email ? `• ${r.email}` : ''}
                            </div>
                          </div>
                          {r.phone && (
                            <a
                              href={`https://wa.me/55${r.phone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(r.name)},%20contato%20da%20administração%20do%20condomínio`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline"
                              style={{ color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.3)', gap: '4px' }}
                            >
                              <MessageSquare size={12} /> WhatsApp
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seção 2: Veículos */}
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Car size={16} color="var(--primary)" />
                    <span>Frotas Autorizadas & Vagas ({uVehicles.length})</span>
                  </h4>

                  {uVehicles.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', padding: '10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                      Nenhum veículo cadastrado para esta unidade.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                      {uVehicles.map((v) => (
                        <div key={v.id} style={{ padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{v.model}</span>
                            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{v.parking_spot || 'Vaga Padrão'}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Placa: <strong>{v.plate}</strong> • Cor: {v.color || '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seção 3: Pets */}
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Heart size={16} color="#ec4899" />
                    <span>Animais de Estimação Registrados ({uPets.length})</span>
                  </h4>

                  {uPets.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', padding: '10px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                      Nenhum animal doméstico registrado nesta unidade.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                      {uPets.map((p) => (
                        <div key={p.id} style={{ padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{p.name} ({p.species})</span>
                            <span className={`badge ${p.vaccine_status === 'VACCINATED' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                              {p.vaccine_status === 'VACCINATED' ? 'Vacina OK' : 'Vacina Pendente'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Raça: {p.breed || 'SRD'} • Porte {p.size}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seção 4: Encomendas Pendentes */}
                {uDeliveries.some((d) => d.status === 'PENDING') && (
                  <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', padding: '10px 14px', borderRadius: 'var(--radius-xs)', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Package size={14} />
                      <span>Há encomendas aguardando retirada na portaria para este apartamento!</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                  <button className="btn btn-secondary" onClick={() => setSelectedDossierUnit(null)}>
                    Fechar Dossiê
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingUnit(selectedDossierUnit);
                      setUnitForm({
                        block_id: selectedDossierUnit.block_id,
                        number: selectedDossierUnit.number,
                        floor: String(selectedDossierUnit.floor),
                        type: selectedDossierUnit.type
                      });
                      setSelectedDossierUnit(null);
                      setIsUnitModalOpen(true);
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Editar Dados da Unidade</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
