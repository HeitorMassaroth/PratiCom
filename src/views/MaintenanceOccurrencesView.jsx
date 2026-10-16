import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  MessageSquare, 
  User, 
  Building, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  ChevronRight,
  ShieldAlert,
  Zap,
  Droplet,
  Volume2,
  Brush,
  HardHat,
  Columns,
  List as ListIcon,
  Share2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api, getActiveCondoId, getActiveProfile } from '../services/api';
import Modal from '../components/Modal';

export default function MaintenanceOccurrencesView() {
  const [occurrences, setOccurrences] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modo de visualização: 'kanban' ou 'list'
  const [viewMode, setViewMode] = useState('kanban');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [attendingOcc, setAttendingOcc] = useState(null);
  const [deleteConfirmOcc, setDeleteConfirmOcc] = useState(null);

  // Form State Novo Chamado
  const [formData, setFormData] = useState({
    title: '',
    category: 'Hidráulica',
    priority: 'media',
    unit_id: '',
    description: ''
  });

  // Form State Atendimento
  const [attendForm, setAttendForm] = useState({
    status: 'IN_PROGRESS',
    resolution_notes: ''
  });

  const condoId = getActiveCondoId();
  const profile = getActiveProfile();

  const loadData = async () => {
    try {
      setLoading(true);
      const [occsData, unitsData] = await Promise.all([
        api.get('/occurrences'),
        api.get('/units')
      ]);
      setOccurrences(occsData || []);
      setUnits(unitsData || []);
      if (unitsData && unitsData.length > 0 && !formData.unit_id) {
        setFormData((prev) => ({ ...prev, unit_id: unitsData[0].id }));
      }
    } catch (err) {
      console.error('Erro ao carregar chamados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleCondoChange = () => loadData();
    window.addEventListener('condo-changed', handleCondoChange);
    return () => window.removeEventListener('condo-changed', handleCondoChange);
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      category: 'Hidráulica',
      priority: 'media',
      unit_id: units[0]?.id || '',
      description: ''
    });
    setShowCreateModal(true);
  };

  const handleSaveCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/occurrences', formData);
      window.showToast?.('Chamado de manutenção aberto com sucesso!', 'success');
      setShowCreateModal(false);
      loadData();
    } catch (err) {
      window.showToast?.(err.message || 'Erro ao registrar chamado', 'error');
    }
  };

  const handleOpenAttend = (occ) => {
    setAttendingOcc(occ);
    setAttendForm({
      status: occ.status === 'OPEN' ? 'IN_PROGRESS' : occ.status,
      resolution_notes: occ.resolution_notes || ''
    });
  };

  const handleQuickAdvanceStatus = async (occ, nextStatus) => {
    try {
      await api.patch(`/occurrences/${occ.id}`, { status: nextStatus });
      window.showToast?.(`Chamado #${occ.id} movido para ${nextStatus}!`, 'success');
      loadData();
    } catch (err) {
      window.showToast?.(err.message || 'Erro ao atualizar status', 'error');
    }
  };

  const handleSaveAttend = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/occurrences/${attendingOcc.id}`, attendForm);
      window.showToast?.(`Chamado #${attendingOcc.id} atualizado com sucesso!`, 'success');
      setAttendingOcc(null);
      loadData();
    } catch (err) {
      window.showToast?.(err.message || 'Erro ao atualizar chamado', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmOcc) return;
    try {
      await api.delete(`/occurrences/${deleteConfirmOcc.id}`);
      window.showToast?.('Chamado excluído com sucesso!', 'success');
      setDeleteConfirmOcc(null);
      loadData();
    } catch (err) {
      window.showToast?.(err.message, 'error');
    }
  };

  const handleWhatsAppDispatch = (occ) => {
    const text = `🛠️ *ORDEM DE SERVIÇO TÉCNICA #${occ.id}*\n\n*${occ.title}*\nCategoria: ${occ.category} | Prioridade: ${occ.priority.toUpperCase()}\nLocal: Apto ${occ.unit_number} (${occ.resident_name})\n\nDescrição: ${occ.description}\n\nFavor registrar atendimento no PratiCom ERP.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filtragem
  const filteredOccurrences = occurrences.filter((occ) => {
    const matchesSearch = 
      (occ.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (occ.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (occ.resident_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(occ.unit_number || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || occ.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || occ.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'ALL' || occ.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Métricas
  const totalCount = occurrences.length;
  const openCount = occurrences.filter((o) => o.status === 'OPEN').length;
  const inProgressCount = occurrences.filter((o) => o.status === 'IN_PROGRESS').length;
  const resolvedCount = occurrences.filter((o) => o.status === 'RESOLVED').length;

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'urgente':
        return <span className="badge badge-danger">URGENTE</span>;
      case 'alta':
        return <span className="badge badge-warning">ALTA</span>;
      case 'media':
        return <span className="badge badge-primary">MÉDIA</span>;
      default:
        return <span className="badge badge-neutral">BAIXA</span>;
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'OPEN':
        return <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Aberto</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Wrench size={12} /> Em Atendimento</span>;
      case 'RESOLVED':
        return <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={12} /> Concluído</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">Recusado</span>;
      default:
        return <span className="badge badge-neutral">{s}</span>;
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Hidráulica':
        return <Droplet size={14} color="#0284c7" />;
      case 'Elétrica':
        return <Zap size={14} color="#f59e0b" />;
      case 'Segurança':
        return <ShieldAlert size={14} color="#ef4444" />;
      case 'Convivência/Barulho':
        return <Volume2 size={14} color="#8b5cf6" />;
      case 'Limpeza':
        return <Brush size={14} color="#10b981" />;
      default:
        return <HardHat size={14} color="var(--primary)" />;
    }
  };

  // Separação para o Quadro Kanban
  const openCards = filteredOccurrences.filter((o) => o.status === 'OPEN');
  const inProgressCards = filteredOccurrences.filter((o) => o.status === 'IN_PROGRESS');
  const resolvedCards = filteredOccurrences.filter((o) => o.status === 'RESOLVED' || o.status === 'REJECTED');

  return (
    <div className="view-container">
      {/* Cabeçalho */}
      <div className="view-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>Chamados, Ocorrências & Manutenção Predial</h1>
            <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={11} /> SLA Control Ativo
            </span>
          </div>
          <p className="subtitle">
            Central de atendimento técnico, reparos em áreas comuns e gestão com quadro Kanban operacional
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Switcher Tabela / Kanban */}
          <div className="segmented-tabs" style={{ margin: 0 }}>
            <button
              className={`segmented-tab ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Quadro Kanban Operacional"
            >
              <Columns size={14} /> Kanban
            </button>
            <button
              className={`segmented-tab ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Lista Detalhada"
            >
              <ListIcon size={14} /> Lista
            </button>
          </div>
          <button className="btn btn-secondary" onClick={loadData} title="Recarregar">
            <RefreshCw size={16} /> Atualizar
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={16} /> Registrar Ocorrência
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total de Chamados</span>
            <HardHat size={18} className="stat-icon" color="var(--primary)" />
          </div>
          <div className="stat-value">{totalCount}</div>
          <span className="stat-subtext">Histórico completo de ocorrências</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Aguardando Triagem</span>
            <AlertCircle size={18} className="stat-icon" color="var(--warning)" />
          </div>
          <div className="stat-value" style={{ color: openCount > 0 ? 'var(--warning)' : 'var(--text-main)' }}>
            {openCount}
          </div>
          <span className="stat-subtext">Requerem providências imediatas</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Em Execução / Manutenção</span>
            <Wrench size={18} className="stat-icon" color="var(--primary)" />
          </div>
          <div className="stat-value">{inProgressCount}</div>
          <span className="stat-subtext">Equipes técnicas acionadas</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Reparos Concluídos</span>
            <CheckCircle2 size={18} className="stat-icon" color="var(--success)" />
          </div>
          <div className="stat-value">{resolvedCount}</div>
          <span className="stat-subtext">Problemas sanados com laudo</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por título, descrição, morador ou apartamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Todos os Status</option>
            <option value="OPEN">Abertos</option>
            <option value="IN_PROGRESS">Em Atendimento</option>
            <option value="RESOLVED">Concluídos</option>
            <option value="REJECTED">Recusados</option>
          </select>

          <select className="filter-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="ALL">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>

          <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="ALL">Todas as Categorias</option>
            <option value="Hidráulica">Hidráulica</option>
            <option value="Elétrica">Elétrica</option>
            <option value="Segurança">Segurança</option>
            <option value="Convivência/Barulho">Convivência/Barulho</option>
            <option value="Limpeza">Limpeza</option>
            <option value="Estrutural">Estrutural</option>
          </select>
        </div>
      </div>

      {/* Visualização 1: Quadro Kanban Operacional */}
      {viewMode === 'kanban' && (
        <div className="kanban-board-grid">
          {/* Coluna 1: Aguardando Triagem */}
          <div className="kanban-lane">
            <div className="kanban-lane-header">
              <div className="kanban-lane-title">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)' }}></span>
                <span>Aguardando Triagem</span>
              </div>
              <span className="badge badge-warning">{openCards.length}</span>
            </div>

            <div className="kanban-cards-stack">
              {openCards.length === 0 ? (
                <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                  Nenhum chamado pendente de triagem.
                </div>
              ) : (
                openCards.map((occ) => (
                  <div key={occ.id} className="kanban-task-card">
                    <div className="kanban-card-badges">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {getCategoryIcon(occ.category)} {occ.category}
                      </span>
                      {getPriorityBadge(occ.priority)}
                    </div>

                    <div className="kanban-card-title">
                      #{occ.id} - {occ.title}
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                      {occ.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <span>Apto {occ.unit_number} ({occ.resident_name})</span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>SLA: 24h</span>
                    </div>

                    <div className="kanban-card-footer">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleWhatsAppDispatch(occ)}
                        style={{ color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.3)', gap: '4px' }}
                        title="Acionar técnico via WhatsApp"
                      >
                        <Share2 size={12} /> WhatsApp
                      </button>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleQuickAdvanceStatus(occ, 'IN_PROGRESS')}
                          title="Iniciar atendimento técnico"
                          style={{ gap: '4px' }}
                        >
                          <span>Iniciar</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Coluna 2: Em Atendimento Técnico */}
          <div className="kanban-lane">
            <div className="kanban-lane-header">
              <div className="kanban-lane-title">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></span>
                <span>Em Execução / Reparo</span>
              </div>
              <span className="badge badge-primary">{inProgressCards.length}</span>
            </div>

            <div className="kanban-cards-stack">
              {inProgressCards.length === 0 ? (
                <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                  Nenhum chamado em execução no momento.
                </div>
              ) : (
                inProgressCards.map((occ) => (
                  <div key={occ.id} className="kanban-task-card" style={{ borderLeft: '3px solid var(--primary)' }}>
                    <div className="kanban-card-badges">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {getCategoryIcon(occ.category)} {occ.category}
                      </span>
                      {getPriorityBadge(occ.priority)}
                    </div>

                    <div className="kanban-card-title">
                      #{occ.id} - {occ.title}
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                      {occ.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <span>Apto {occ.unit_number} ({occ.resident_name})</span>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Em Reparo</span>
                    </div>

                    <div className="kanban-card-footer">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleWhatsAppDispatch(occ)}
                        style={{ color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.3)', gap: '4px' }}
                      >
                        <Share2 size={12} /> WhatsApp
                      </button>

                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleOpenAttend(occ)}
                        title="Concluir chamado com laudo técnico"
                        style={{ gap: '4px' }}
                      >
                        <CheckCircle2 size={12} />
                        <span>Concluir</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Coluna 3: Concluídos & Finalizados */}
          <div className="kanban-lane">
            <div className="kanban-lane-header">
              <div className="kanban-lane-title">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}></span>
                <span>Concluídos / Homologados</span>
              </div>
              <span className="badge badge-success">{resolvedCards.length}</span>
            </div>

            <div className="kanban-cards-stack">
              {resolvedCards.length === 0 ? (
                <div style={{ padding: '24px 10px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                  Nenhum chamado concluído recente.
                </div>
              ) : (
                resolvedCards.map((occ) => (
                  <div key={occ.id} className="kanban-task-card" style={{ borderLeft: '3px solid var(--success)', opacity: 0.9 }}>
                    <div className="kanban-card-badges">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {getCategoryIcon(occ.category)} {occ.category}
                      </span>
                      {getStatusBadge(occ.status)}
                    </div>

                    <div className="kanban-card-title">
                      #{occ.id} - {occ.title}
                    </div>

                    {occ.resolution_notes && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--success)', background: 'var(--success-bg)', padding: '6px 8px', borderRadius: 'var(--radius-xs)' }}>
                        <strong>Laudo:</strong> {occ.resolution_notes}
                      </div>
                    )}

                    <div className="kanban-card-footer">
                      <span>Apto {occ.unit_number} ({occ.resident_name})</span>
                      <button
                        className="btn-icon"
                        onClick={() => handleOpenAttend(occ)}
                        title="Ver laudo ou editar"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visualização 2: Lista Detalhada */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {loading ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Carregando chamados e ocorrências...
            </div>
          ) : filteredOccurrences.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Nenhum chamado de manutenção localizado com os filtros selecionados.
            </div>
          ) : (
            filteredOccurrences.map((occ) => (
              <div key={occ.id} className="card" style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getCategoryIcon(occ.category)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>#{occ.id} - {occ.title}</span>
                        {getPriorityBadge(occ.priority)}
                      </h3>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <span><strong>Categoria:</strong> {occ.category}</span>
                        <span><strong>Solicitante:</strong> {occ.resident_name} (Apto {occ.unit_number})</span>
                        <span><strong>Data:</strong> {occ.created_at ? occ.created_at.substring(0, 16) : '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getStatusBadge(occ.status)}
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleWhatsAppDispatch(occ)}
                      style={{ color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.3)', gap: '4px' }}
                      title="Acionar técnico no WhatsApp"
                    >
                      <Share2 size={13} />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleOpenAttend(occ)}
                      title="Atender chamado ou atualizar parecer"
                    >
                      <Edit3 size={14} /> Atender
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => setDeleteConfirmOcc(occ)}
                      title="Excluir chamado"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Descrição */}
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: '1.5', margin: '8px 0 12px 0', background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-xs)' }}>
                  {occ.description}
                </p>

                {/* Parecer Técnico (se houver) */}
                {occ.resolution_notes && (
                  <div style={{
                    borderLeft: '3px solid var(--success)',
                    background: 'var(--success-bg)',
                    padding: '8px 12px',
                    borderRadius: '0 var(--radius-xs) var(--radius-xs) 0',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--text-main)'
                  }}>
                    <CheckCircle2 size={15} color="var(--success)" style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Parecer Técnico:</strong> {occ.resolution_notes}
                      {occ.resolved_at && <span style={{ marginLeft: '10px', color: 'var(--text-dim)', fontSize: '0.75rem' }}>(Concluído em: {occ.resolved_at.substring(0, 16)})</span>}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Criar Chamado */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Registrar Novo Chamado / Ocorrência"
      >
        <form onSubmit={handleSaveCreate} className="form-layout">
          <div className="form-group">
            <label>Título do Chamado *</label>
            <input
              type="text"
              required
              placeholder="Ex: Vazamento no registro da área comum"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Categoria *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Hidráulica">Hidráulica</option>
                <option value="Elétrica">Elétrica</option>
                <option value="Segurança">Segurança</option>
                <option value="Convivência/Barulho">Convivência / Barulho</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Estrutural">Estrutural</option>
              </select>
            </div>

            <div className="form-group">
              <label>Nível de Gravidade / Prioridade *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="baixa">Baixa (Pode aguardar cronograma)</option>
                <option value="media">Média (Atenção necessária)</option>
                <option value="alta">Alta (Impacta moradores)</option>
                <option value="urgente">Urgente (Risco imediato à segurança)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Unidade Solicitante / Local do Ocorrido *</label>
            <select
              value={formData.unit_id}
              onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.block_name} - Apartamento {u.number}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Descrição Detalhada do Problema *</label>
            <textarea
              required
              rows="4"
              placeholder="Descreva detalhadamente o ocorrido, localização exata e qualquer detalhe relevante para a equipe técnica..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Registrar Chamado
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Atender Chamado */}
      <Modal
        isOpen={!!attendingOcc}
        onClose={() => setAttendingOcc(null)}
        title={attendingOcc ? `Atendimento do Chamado #${attendingOcc.id}` : ''}
      >
        <form onSubmit={handleSaveAttend} className="form-layout">
          <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', marginBottom: '14px' }}>
            <div style={{ fontWeight: 600 }}>{attendingOcc?.title}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Apto {attendingOcc?.unit_number} - {attendingOcc?.resident_name}
            </div>
          </div>

          <div className="form-group">
            <label>Status do Chamado *</label>
            <select
              value={attendForm.status}
              onChange={(e) => setAttendForm({ ...attendForm, status: e.target.value })}
            >
              <option value="OPEN">Aberto (Em fila)</option>
              <option value="IN_PROGRESS">Em Atendimento (Técnico em deslocamento / em análise)</option>
              <option value="RESOLVED">Concluído (Problema sanado)</option>
              <option value="REJECTED">Recusado (Fora de escopo / Improcedente)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Parecer Técnico / Solução Adotada</label>
            <textarea
              rows="4"
              placeholder="Descreva as providências tomadas, peças substituídas ou laudo técnico..."
              value={attendForm.resolution_notes}
              onChange={(e) => setAttendForm({ ...attendForm, resolution_notes: e.target.value })}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setAttendingOcc(null)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar Parecer
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Exclusão */}
      <Modal
        isOpen={!!deleteConfirmOcc}
        onClose={() => setDeleteConfirmOcc(null)}
        title="Confirmar Exclusão de Chamado"
      >
        <div style={{ padding: '10px 0' }}>
          <p>Deseja realmente remover o chamado <strong>#{deleteConfirmOcc?.id} - {deleteConfirmOcc?.title}</strong>?</p>
          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirmOcc(null)}>Cancelar</button>
            <button className="btn btn-danger" onClick={handleDelete}><Trash2 size={16} /> Excluir</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
