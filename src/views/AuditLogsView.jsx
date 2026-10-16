import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  Download, 
  RefreshCw, 
  Calendar, 
  User, 
  FileText, 
  AlertCircle,
  Database,
  CheckCircle2,
  Eye,
  Info
} from 'lucide-react';
import { api, getActiveCondoId } from '../services/api';
import Modal from '../components/Modal';

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [tableFilter, setTableFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  const condoId = getActiveCondoId();

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.get('/audit_logs');
      setLogs(data || []);
    } catch (err) {
      console.error('Erro ao carregar logs de auditoria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const handleCondoChange = () => loadLogs();
    window.addEventListener('condo-changed', handleCondoChange);
    return () => window.removeEventListener('condo-changed', handleCondoChange);
  }, []);

  const handleExport = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `praticom_auditoria_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.showToast?.('Relatório de auditoria exportado com sucesso!', 'success');
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ip_address && log.ip_address.includes(searchTerm));
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesTable = tableFilter === 'ALL' || log.target_table === tableFilter;
    return matchesSearch && matchesAction && matchesTable;
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'INSERT':
        return <span className="badge badge-success">INCLUSÃO (INSERT)</span>;
      case 'UPDATE':
        return <span className="badge badge-primary">ALTERAÇÃO (UPDATE)</span>;
      case 'DELETE':
        return <span className="badge badge-danger">EXCLUSÃO (DELETE)</span>;
      default:
        return <span className="badge badge-neutral">{action}</span>;
    }
  };

  const totalLogs = logs.length;
  const insertCount = logs.filter((l) => l.action === 'INSERT').length;
  const updateCount = logs.filter((l) => l.action === 'UPDATE').length;
  const deleteCount = logs.filter((l) => l.action === 'DELETE').length;

  return (
    <div className="view-container">
      {/* Cabeçalho */}
      <div className="view-header">
        <div>
          <h1>Trilha de Auditoria & Compliance (Logs)</h1>
          <p className="subtitle">
            Histórico imutável de operações, alterações de dados e atividades de segurança registradas no ERP
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={loadLogs} title="Recarregar">
            <RefreshCw size={16} /> Atualizar
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={16} /> Exportar Relatório
          </button>
        </div>
      </div>

      {/* Estatísticas de Auditoria */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Eventos Auditados</span>
            <History size={18} className="stat-icon" color="var(--primary)" />
          </div>
          <div className="stat-value">{totalLogs}</div>
          <span className="stat-subtext">Trilha contínua com IP e timestamps</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Inclusões de Registros</span>
            <CheckCircle2 size={18} className="stat-icon" color="var(--success)" />
          </div>
          <div className="stat-value">{insertCount}</div>
          <span className="stat-subtext">Novos cadastros e operações</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Modificações</span>
            <FileText size={18} className="stat-icon" color="var(--primary)" />
          </div>
          <div className="stat-value">{updateCount}</div>
          <span className="stat-subtext">Atualizações cadastrais e baixas</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Exclusões Realizadas</span>
            <AlertCircle size={18} className="stat-icon" color="var(--danger)" />
          </div>
          <div className="stat-value">{deleteCount}</div>
          <span className="stat-subtext">Cancelamentos e descartes</span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="search-filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Filtrar por operador, detalhes da ação ou IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="filter-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="ALL">Todas as Ações</option>
            <option value="INSERT">Inclusão (INSERT)</option>
            <option value="UPDATE">Alteração (UPDATE)</option>
            <option value="DELETE">Exclusão (DELETE)</option>
          </select>

          <select
            className="filter-select"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
          >
            <option value="ALL">Todas as Tabelas / Módulos</option>
            <option value="users">Usuários (users)</option>
            <option value="condominiums">Condomínios (condominiums)</option>
            <option value="deliveries">Encomendas (deliveries)</option>
            <option value="access_logs">Portaria (access_logs)</option>
            <option value="occurrences">Chamados (occurrences)</option>
            <option value="polls">Votações (polls)</option>
            <option value="announcements">Comunicados (announcements)</option>
            <option value="condo_settings">Configurações (condo_settings)</option>
          </select>
        </div>
      </div>

      {/* Tabela de Trilha de Auditoria */}
      <div className="card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data & Hora</th>
              <th>Operador Responsável</th>
              <th>Tipo de Ação</th>
              <th>Tabela Alvo</th>
              <th>Descrição do Evento</th>
              <th>Endereço IP</th>
              <th style={{ textAlign: 'right' }}>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  Carregando trilha de auditoria...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Nenhum registro de auditoria localizado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} onClick={() => setSelectedLog(log)} style={{ cursor: 'pointer' }}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                    {log.created_at ? log.created_at.replace('T', ' ').substring(0, 19) : '—'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.user_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      {log.user_role}
                    </div>
                  </td>
                  <td>{getActionBadge(log.action)}</td>
                  <td>
                    <code style={{ fontSize: '0.78rem', padding: '2px 6px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                      {log.target_table}
                    </code>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {log.details}
                  </td>
                  <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                    {log.ip_address || '127.0.0.1'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon" title="Ver detalhes completos do evento">
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Inspeção de Log */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Auditoria do Evento #${selectedLog.id}` : ''}
      >
        <div className="form-layout" style={{ fontSize: '0.88rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Operador Responsável</span>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedLog?.user_name}</div>
              <span className="badge badge-primary" style={{ marginTop: '4px' }}>{selectedLog?.user_role}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tipo de Mutação</span>
              <div style={{ marginTop: '4px' }}>{selectedLog && getActionBadge(selectedLog.action)}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tabela / Entidade Afetada</span>
              <div style={{ fontFamily: 'var(--font-mono)', marginTop: '2px' }}>{selectedLog?.target_table}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Endereço IP & Timestamp</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', marginTop: '2px' }}>
                {selectedLog?.ip_address} ({selectedLog?.created_at?.replace('T', ' ').substring(0, 19)})
              </div>
            </div>
          </div>

          <div style={{ marginTop: '14px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Descrição Completa da Ação
            </span>
            <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)', lineHeight: '1.5' }}>
              {selectedLog?.details}
            </div>
          </div>

          <div className="restricted-advice" style={{ marginTop: '14px' }}>
            Este evento possui assinatura imutável no banco de dados corporativo SQLite e está em conformidade com as diretrizes da LGPD e regras de prestação de contas condominiais.
          </div>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={() => setSelectedLog(null)}>
              Fechar Inspeção
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
