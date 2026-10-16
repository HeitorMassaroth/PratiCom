import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Award, 
  UserCheck, 
  Home, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Mail, 
  Phone, 
  Building, 
  UserX, 
  Key,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Share2,
  Sliders,
  Check
} from 'lucide-react';
import { api, getActiveCondoId } from '../services/api';
import Modal from '../components/Modal';

export default function UsersManagementView() {
  const [users, setUsers] = useState([]);
  const [condos, setCondos] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sub-abas: 'users' ou 'rbac'
  const [activeTab, setActiveTab] = useState('users');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'MORADOR',
    status: 'ACTIVE',
    condominium_id: getActiveCondoId(),
    unit_id: '',
    unit_number: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, condosData, unitsData] = await Promise.all([
        api.get('/users'),
        api.get('/condominiums'),
        api.get('/units')
      ]);
      setUsers(usersData || []);
      setCondos(condosData || []);
      setUnits(unitsData || []);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
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
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'MORADOR',
      status: 'ACTIVE',
      condominium_id: getActiveCondoId(),
      unit_id: '',
      unit_number: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      condominium_id: user.condominium_id || getActiveCondoId(),
      unit_id: user.unit_id || '',
      unit_number: user.unit_number || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, formData);
        window.showToast?.('Usuário atualizado com sucesso!', 'success');
      } else {
        await api.post('/users', formData);
        window.showToast?.('Novo usuário cadastrado com sucesso!', 'success');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      window.showToast?.(err.message || 'Erro ao salvar usuário', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/users/${user.id}`, { status: newStatus });
      window.showToast?.(`Status do usuário alterado para ${newStatus === 'ACTIVE' ? 'Ativo' : 'Suspenso'}`, 'info');
      loadData();
    } catch (err) {
      window.showToast?.(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      await api.delete(`/users/${deleteConfirmUser.id}`);
      window.showToast?.('Usuário excluído com sucesso!', 'success');
      setDeleteConfirmUser(null);
      loadData();
    } catch (err) {
      window.showToast?.(err.message, 'error');
    }
  };

  const handleSendWhatsAppInvite = (user) => {
    const text = `👋 Olá *${user.name}*!\n\nSeu acesso ao *PratiCom ERP Condominial* está ativo com o perfil *${user.role}*.\nE-mail de login: ${user.email}\n\nAcesse o sistema diretamente pela intranet do condomínio.`;
    window.open(`https://wa.me/55${(user.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Filtragem
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(searchTerm));
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Métricas
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const sindicoCount = users.filter((u) => u.role === 'SINDICO').length;
  const workerCount = users.filter((u) => u.role === 'TRABALHADOR').length;
  const residentCount = users.filter((u) => u.role === 'MORADOR').length;
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge badge-primary"><Shield size={11} /> Administrador</span>;
      case 'SINDICO':
        return <span className="badge badge-warning"><Award size={11} /> Síndico Geral</span>;
      case 'TRABALHADOR':
        return <span className="badge badge-info"><UserCheck size={11} /> Portaria / Operação</span>;
      case 'MORADOR':
        return <span className="badge badge-neutral"><Home size={11} /> Morador</span>;
      default:
        return <span className="badge badge-neutral">{role}</span>;
    }
  };

  // Matriz de Permissões RBAC Oficial
  const rbacMatrixData = [
    {
      module: '🏢 Estrutura Predial, Torres & Unidades',
      admin: 'TOTAL',
      sindico: 'TOTAL',
      subsindico: 'OPERAÇÃO',
      conselho: 'LEITURA',
      portaria: 'LEITURA',
      morador: 'LEITURA'
    },
    {
      module: '👥 Moradores, Frotas & Pets',
      admin: 'TOTAL',
      sindico: 'TOTAL',
      subsindico: 'OPERAÇÃO',
      conselho: 'LEITURA',
      portaria: 'LEITURA',
      morador: 'PRÓPRIO'
    },
    {
      module: '🛡️ Portaria & Controle de Visitantes',
      admin: 'TOTAL',
      sindico: 'TOTAL',
      subsindico: 'TOTAL',
      conselho: 'LEITURA',
      portaria: 'TOTAL',
      morador: 'CONVITES'
    },
    {
      module: '📦 Encomendas & Armário Digital',
      admin: 'TOTAL',
      sindico: 'TOTAL',
      subsindico: 'TOTAL',
      conselho: 'LEITURA',
      portaria: 'TOTAL',
      morador: 'RETIRADA'
    },
    {
      module: '💰 Financeiro, Boletos & Balancetes',
      admin: 'TOTAL',
      sindico: 'TOTAL',
      subsindico: 'LEITURA',
      conselho: 'AUDITORIA',
      portaria: 'SEM ACESSO',
      morador: '2ª VIA'
    },
    {
      module: '📅 Reservas de Áreas Comuns',
      admin: 'TOTAL',
      sindico: 'TOTAL',
      subsindico: 'TOTAL',
      conselho: 'LEITURA',
      portaria: 'CONSULTA',
      morador: 'AGENDAR'
    },
    {
      module: '🛠️ Chamados & Manutenção Predial',
      admin: 'TOTAL',
      sindico: 'TOTAL',
      subsindico: 'TOTAL',
      conselho: 'LEITURA',
      portaria: 'ABERTURA',
      morador: 'ABERTURA'
    },
    {
      module: '🗳️ Assembleias Virtuais & Atas',
      admin: 'TOTAL',
      sindico: 'PRESIDÊNCIA',
      subsindico: 'LEITURA',
      conselho: 'PARECER',
      portaria: 'SEM ACESSO',
      morador: 'VOTAÇÃO'
    },
    {
      module: '📜 Trilha de Auditoria & Compliance',
      admin: 'TOTAL',
      sindico: 'LEITURA',
      subsindico: 'LEITURA',
      conselho: 'AUDITORIA',
      portaria: 'SEM ACESSO',
      morador: 'SEM ACESSO'
    }
  ];

  const renderRbacPill = (perm) => {
    switch (perm) {
      case 'TOTAL':
      case 'PRESIDÊNCIA':
        return <span className="rbac-perm-pill rbac-perm-full">Total</span>;
      case 'OPERAÇÃO':
      case 'CONVITES':
      case 'RETIRADA':
      case 'AGENDAR':
      case 'VOTAÇÃO':
      case 'ABERTURA':
      case 'PRÓPRIO':
      case '2ª VIA':
        return <span className="rbac-perm-pill rbac-perm-ops">{perm}</span>;
      case 'LEITURA':
      case 'AUDITORIA':
      case 'PARECER':
      case 'CONSULTA':
        return <span className="rbac-perm-pill rbac-perm-read">{perm}</span>;
      default:
        return <span className="rbac-perm-pill rbac-perm-none">Sem Acesso</span>;
    }
  };

  return (
    <div className="view-container">
      {/* Cabeçalho */}
      <div className="view-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>Gestão de Usuários & Controle de Acesso (RBAC)</h1>
            <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={11} /> Níveis Granulares
            </span>
          </div>
          <p className="subtitle">
            Administre contas, credenciais de operadores, moradores e matriz corporativa de permissões
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={loadData} title="Recarregar">
            <RefreshCw size={16} /> Atualizar
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <UserPlus size={16} /> Novo Usuário
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total de Usuários</span>
            <Users size={18} className="stat-icon" color="var(--primary)" />
          </div>
          <div className="stat-value">{totalUsers}</div>
          <span className="stat-subtext">{activeCount} ativos com login autorizado</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Administradores</span>
            <Shield size={18} className="stat-icon" color="var(--primary)" />
          </div>
          <div className="stat-value">{adminCount}</div>
          <span className="stat-subtext">Acesso irrestrito a configurações</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Síndicos & Portaria</span>
            <UserCheck size={18} className="stat-icon" color="var(--warning)" />
          </div>
          <div className="stat-value">{sindicoCount + workerCount}</div>
          <span className="stat-subtext">{sindicoCount} Síndicos / {workerCount} Porteiros</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Moradores Habilitados</span>
            <Home size={18} className="stat-icon" color="#8b5cf6" />
          </div>
          <div className="stat-value">{residentCount}</div>
          <span className="stat-subtext">Acesso a votações e reservas</span>
        </div>
      </div>

      {/* Sub-Abas Segmentadas */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div className="segmented-tabs" style={{ margin: 0 }}>
          <button
            className={`segmented-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={15} /> Contas de Usuários ({users.length})
          </button>
          <button
            className={`segmented-tab ${activeTab === 'rbac' ? 'active' : ''}`}
            onClick={() => setActiveTab('rbac')}
          >
            <ShieldCheck size={15} /> Matriz de Permissões RBAC
          </button>
        </div>

        {activeTab === 'users' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-dim)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '32px' }}
                placeholder="Buscar por nome, e-mail ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              className="filter-select" 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">Todos os Perfis</option>
              <option value="ADMIN">Administrador</option>
              <option value="SINDICO">Síndico</option>
              <option value="TRABALHADOR">Portaria/Operação</option>
              <option value="MORADOR">Morador</option>
            </select>

            <select 
              className="filter-select" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="SUSPENDED">Suspensos</option>
            </select>
          </div>
        )}
      </div>

      {/* Sub-Aba 1: Lista de Contas de Usuários */}
      {activeTab === 'users' && (
        <div className="card table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Perfil de Acesso</th>
                <th>Condomínio / Unidade</th>
                <th>Contato</th>
                <th>Último Acesso</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                    Carregando usuários...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Nenhum usuário localizado com os critérios selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const condo = condos.find((c) => c.id === u.condominium_id);
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="user-avatar-circle" style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: u.role === 'ADMIN' ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.08)',
                            color: u.role === 'ADMIN' ? 'var(--primary)' : 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}>
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {condo ? condo.name : 'Acesso Global'}
                        </div>
                        {u.unit_number && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            Apto {u.unit_number}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem' }}>{u.phone || '—'}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                          {u.last_login_at ? u.last_login_at.substring(0, 16) : 'Nunca acessou'}
                        </span>
                      </td>
                      <td>
                        {u.status === 'ACTIVE' ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={11} /> Ativo
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <XCircle size={11} /> Suspenso
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {u.phone && (
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => handleSendWhatsAppInvite(u)}
                              style={{ color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.3)', gap: '4px' }}
                              title="Enviar convite e credenciais via WhatsApp"
                            >
                              <MessageSquare size={12} /> WhatsApp
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'ACTIVE' ? 'Suspender Acesso' : 'Ativar Acesso'}
                          >
                            {u.status === 'ACTIVE' ? <UserX size={15} color="var(--warning)" /> : <CheckCircle2 size={15} color="var(--success)" />}
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEdit(u)}
                            title="Editar Dados e Perfil"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => setDeleteConfirmUser(u)}
                            title="Excluir Usuário"
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={15} />
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

      {/* Sub-Aba 2: Matriz de Permissões RBAC */}
      {activeTab === 'rbac' && (
        <div className="rbac-matrix-container">
          <div style={{ padding: '16px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                Matriz de Controle de Acesso Baseado em Papéis (RBAC)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Políticas corporativas de segurança e níveis de privilégio atribuídos por cargo no PratiCom ERP
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="badge badge-success">Total</span>
              <span className="badge badge-primary">Operação</span>
              <span className="badge badge-warning">Leitura/Consulta</span>
              <span className="badge badge-neutral">Sem Acesso</span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '320px' }}>Módulo Operacional</th>
                  <th style={{ textAlign: 'center' }}>Administrador</th>
                  <th style={{ textAlign: 'center' }}>Síndico Geral</th>
                  <th style={{ textAlign: 'center' }}>Subsíndico</th>
                  <th style={{ textAlign: 'center' }}>Conselho Fiscal</th>
                  <th style={{ textAlign: 'center' }}>Portaria / Recepção</th>
                  <th style={{ textAlign: 'center' }}>Morador / Condômino</th>
                </tr>
              </thead>
              <tbody>
                {rbacMatrixData.map((row, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                      {row.module}
                    </td>
                    <td style={{ textAlign: 'center' }}>{renderRbacPill(row.admin)}</td>
                    <td style={{ textAlign: 'center' }}>{renderRbacPill(row.sindico)}</td>
                    <td style={{ textAlign: 'center' }}>{renderRbacPill(row.subsindico)}</td>
                    <td style={{ textAlign: 'center' }}>{renderRbacPill(row.conselho)}</td>
                    <td style={{ textAlign: 'center' }}>{renderRbacPill(row.portaria)}</td>
                    <td style={{ textAlign: 'center' }}>{renderRbacPill(row.morador)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Criar/Editar Usuário */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? `Editar Usuário: ${editingUser.name}` : 'Cadastrar Novo Usuário'}
      >
        <form onSubmit={handleSave} className="form-layout">
          <div className="form-group">
            <label>Nome Completo *</label>
            <input
              type="text"
              required
              placeholder="Ex: Roberto Carlos Pereira"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>E-mail (Login de Acesso) *</label>
              <input
                type="email"
                required
                placeholder="roberto@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Telefone / WhatsApp</label>
              <input
                type="text"
                placeholder="(41) 98888-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Perfil de Acesso (RBAC) *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="ADMIN">Administrador (Acesso Irrestrito)</option>
                <option value="SINDICO">Síndico (Gestão Completa)</option>
                <option value="TRABALHADOR">Portaria / Operador de Recepção</option>
                <option value="MORADOR">Morador (Painel Residencial)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status da Conta</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Ativo (Acesso Liberado)</option>
                <option value="SUSPENDED">Suspenso (Bloqueado)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Condomínio Vinculado</label>
              <select
                value={formData.condominium_id}
                onChange={(e) => setFormData({ ...formData, condominium_id: Number(e.target.value) })}
              >
                {condos.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {formData.role === 'MORADOR' && (
              <div className="form-group">
                <label>Unidade Habitacional</label>
                <select
                  value={formData.unit_id}
                  onChange={(e) => {
                    const u = units.find(unit => unit.id === Number(e.target.value));
                    setFormData({
                      ...formData,
                      unit_id: e.target.value,
                      unit_number: u ? u.number : ''
                    });
                  }}
                >
                  <option value="">Selecione o apartamento...</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.block_name} - Apto {u.number}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Excluir Usuário */}
      <Modal
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        title="Confirmar Exclusão de Conta"
      >
        <div style={{ padding: '10px 0' }}>
          <p>
            Deseja realmente revogar e excluir a conta de <strong>{deleteConfirmUser?.name}</strong> ({deleteConfirmUser?.email})?
          </p>
          <div style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Essa ação removerá todas as permissões de acesso deste usuário à plataforma.
          </div>
          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirmUser(null)}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <Trash2 size={16} /> Excluir Conta
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
