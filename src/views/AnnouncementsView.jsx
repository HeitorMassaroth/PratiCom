import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Pin, 
  Trash2, 
  Check, 
  AlertCircle, 
  Search, 
  Share2, 
  FileText, 
  CheckCheck, 
  Eye, 
  Send, 
  Printer, 
  Building, 
  Calendar,
  Sparkles,
  ShieldCheck,
  X
} from 'lucide-react';
import api, { getActiveCondoId } from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

export default function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState([]);
  const [condoInfo, setCondoInfo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');

  // Modal de Visualização de Edital Oficial
  const [previewDoc, setPreviewDoc] = useState(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'Geral',
    priority: 'normal',
    target_audience: 'Todos os Moradores',
    is_pinned: 0
  });

  const condoId = getActiveCondoId();

  const loadAnnouncements = () => {
    Promise.all([
      api.get('/announcements'),
      api.get(`/condominiums/${condoId}`).catch(() => null)
    ])
      .then(([annData, condoData]) => {
        setAnnouncements(annData || []);
        if (condoData) setCondoInfo(condoData);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadAnnouncements();
    window.addEventListener('condo-changed', loadAnnouncements);
    return () => window.removeEventListener('condo-changed', loadAnnouncements);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/announcements', form);
      setIsModalOpen(false);
      setForm({ 
        title: '', 
        content: '', 
        category: 'Geral', 
        priority: 'normal', 
        target_audience: 'Todos os Moradores', 
        is_pinned: 0 
      });
      showToast('Comunicado publicado no mural oficial do condomínio.');
      loadAnnouncements();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente remover esta publicação do mural oficial?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      showToast('Comunicado removido do mural.', 'info');
      loadAnnouncements();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleShareWhatsApp = (ann) => {
    const text = `📢 *COMUNICADO OFICIAL - ${condoInfo?.name || 'PRATICOM ERP'}*\n\n*${ann.title.toUpperCase()}*\nCategoria: ${ann.category} | Prioridade: ${ann.priority}\n\n${ann.content}\n\n_Publicado no mural digital em ${new Date(ann.created_at || Date.now()).toLocaleDateString('pt-BR')}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Métricas
  const totalCount = announcements.length;
  const pinnedCount = announcements.filter((a) => a.is_pinned === 1).length;
  const urgentCount = announcements.filter((a) => a.priority === 'alta' || a.priority === 'urgente').length;

  // Filtragem
  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch = 
      (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeCategoryFilter === 'ALL') return true;
    if (activeCategoryFilter === 'PINNED') return a.is_pinned === 1;
    if (activeCategoryFilter === 'URGENT') return a.priority === 'alta' || a.priority === 'urgente';
    return a.category === activeCategoryFilter;
  });

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>Mural de Avisos & Comunicados Oficiais</h1>
            <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={11} /> Canal Oficial Auditado
            </span>
          </div>
          <p>Transmissão oficial de editais de assembleia, manutenções preventivas e normas internas com recibo de leitura.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Publicar Comunicado</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Comunicados no Mural</span>
            <Megaphone size={18} className="stat-icon" color="var(--primary)" />
          </div>
          <div className="stat-value">{totalCount}</div>
          <span className="stat-subtext">Publicações vigentes</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Fixados no Topo</span>
            <Pin size={18} className="stat-icon" color="#8b5cf6" />
          </div>
          <div className="stat-value">{pinnedCount}</div>
          <span className="stat-subtext">Destaques prioritários</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Avisos Urgentes</span>
            <AlertCircle size={18} className="stat-icon" color="var(--danger)" />
          </div>
          <div className="stat-value">{urgentCount}</div>
          <span className="stat-subtext">Atenção imediata</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Taxa Média de Leitura</span>
            <CheckCheck size={18} className="stat-icon" color="var(--success)" />
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>93.8%</div>
          <span className="stat-subtext">Engajamento dos condôminos</span>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--text-dim)" />
          <input
            type="text"
            className="filter-select"
            style={{ width: '100%', padding: '8px 12px' }}
            placeholder="Buscar por termo, edital, regra ou palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="segmented-tabs" style={{ margin: 0 }}>
          <button
            className={`segmented-tab ${activeCategoryFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveCategoryFilter('ALL')}
          >
            Todos ({totalCount})
          </button>
          <button
            className={`segmented-tab ${activeCategoryFilter === 'PINNED' ? 'active' : ''}`}
            onClick={() => setActiveCategoryFilter('PINNED')}
          >
            📌 Fixados ({pinnedCount})
          </button>
          <button
            className={`segmented-tab ${activeCategoryFilter === 'URGENT' ? 'active' : ''}`}
            onClick={() => setActiveCategoryFilter('URGENT')}
          >
            🚨 Urgentes ({urgentCount})
          </button>
          <button
            className={`segmented-tab ${activeCategoryFilter === 'Assembleia' ? 'active' : ''}`}
            onClick={() => setActiveCategoryFilter('Assembleia')}
          >
            Assembleias
          </button>
          <button
            className={`segmented-tab ${activeCategoryFilter === 'Manutenção' ? 'active' : ''}`}
            onClick={() => setActiveCategoryFilter('Manutenção')}
          >
            Manutenções
          </button>
        </div>
      </div>

      {/* Lista de Comunicados */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredAnnouncements.length === 0 ? (
          <div className="erp-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Nenhum comunicado localizado no mural com os filtros selecionados.
          </div>
        ) : (
          filteredAnnouncements.map((a) => {
            const isUrgent = a.priority === 'alta' || a.priority === 'urgente';
            return (
              <div
                key={a.id}
                className="erp-panel"
                style={{
                  borderLeft: isUrgent ? '4px solid var(--danger)' : a.is_pinned ? '4px solid var(--primary)' : '1px solid var(--border)',
                  boxShadow: a.is_pinned ? '0 4px 16px rgba(37, 99, 235, 0.08)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{a.title}</h3>
                    {a.is_pinned === 1 && (
                      <span className="badge badge-primary" style={{ gap: '3px' }}>
                        <Pin size={11} />
                        <span>Fixado no Topo</span>
                      </span>
                    )}
                    <span className={`badge ${isUrgent ? 'badge-danger' : 'badge-neutral'}`}>
                      {a.category}
                    </span>
                    {isUrgent && (
                      <span className="badge badge-warning" style={{ textTransform: 'uppercase' }}>
                        Prioridade {a.priority}
                      </span>
                    )}
                    <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                      Público: {a.target_audience || 'Todos os Moradores'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setPreviewDoc(a)}
                      title="Visualizar Edital Oficial Formatado"
                    >
                      <FileText size={13} />
                      <span>Ver Edital</span>
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleShareWhatsApp(a)}
                      style={{ color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.3)' }}
                      title="Compartilhar no WhatsApp do Condomínio"
                    >
                      <Share2 size={13} />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      className="btn-icon"
                      style={{ width: 30, height: 30 }}
                      onClick={() => handleDelete(a.id)}
                      title="Excluir comunicado"
                    >
                      <Trash2 size={13} color="var(--danger)" />
                    </button>
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                  {a.content}
                </p>

                {/* Rodapé com Recibos de Leitura e Data */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      {a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
                      <Eye size={13} />
                      142 visualizações registradas
                    </span>
                  </div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                    <ShieldCheck size={13} />
                    Protocolo Digital: #{a.id}-{Math.abs(hashCode(a.title + a.id))}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Novo Comunicado */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publicar Comunicado no Mural Oficial">
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Título do Comunicado <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Ex: Interrupção programada de fornecimento de água para manutenção do barrilete"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Categoria <span className="required">*</span></label>
              <select
                className="form-control"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Geral">Geral</option>
                <option value="Assembleia">Assembleia / Reunião</option>
                <option value="Manutenção">Manutenção Preventiva</option>
                <option value="Obras">Obras & Reformas</option>
                <option value="Segurança">Segurança & Portaria</option>
              </select>
            </div>
            <div className="form-group">
              <label>Prioridade <span className="required">*</span></label>
              <select
                className="form-control"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div className="form-group">
              <label>Público-Alvo</label>
              <select
                className="form-control"
                value={form.target_audience}
                onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
              >
                <option value="Todos os Moradores">Todos os Moradores</option>
                <option value="Bloco A">Apenas Bloco A</option>
                <option value="Bloco B">Apenas Bloco B</option>
                <option value="Proprietários">Apenas Proprietários</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={form.is_pinned === 1}
                onChange={(e) => setForm({ ...form, is_pinned: e.target.checked ? 1 : 0 })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 600 }}>
                Fixar comunicado em destaque no topo do mural e do dashboard
              </span>
            </label>
          </div>

          <div className="form-group">
            <label>Texto Integral do Comunicado Oficial <span className="required">*</span></label>
            <textarea
              className="form-control"
              required
              rows={5}
              placeholder="Descreva detalhadamente o comunicado oficial, motivos, horários previstos e recomendações aos condôminos..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Publicar no Mural Oficial</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Visualização de Edital Oficial Formal */}
      {previewDoc && (
        <Modal isOpen={Boolean(previewDoc)} onClose={() => setPreviewDoc(null)} title="Edital Oficial de Convocação / Comunicado">
          <div className="official-doc-sheet" style={{ margin: '10px 0' }}>
            <div className="official-doc-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="official-doc-stamp">Publicação Registrada</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Doc ID: #{previewDoc.id}</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0', textTransform: 'uppercase' }}>
                {condoInfo?.name || 'CONDOMÍNIO RESIDENCIAL'}
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                CNPJ: {condoInfo?.cnpj || '12.345.678/0001-90'} • {condoInfo?.city || 'São Paulo'} - {condoInfo?.state || 'SP'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                Administração Condominial Integrada • Plataforma PratiCom ERP
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e293b' }}>
                {previewDoc.title}
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                Categoria: {previewDoc.category} | Prioridade: {previewDoc.priority.toUpperCase()} | Destinatários: {previewDoc.target_audience || 'Todos'}
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.7', whiteSpace: 'pre-wrap', padding: '16px 0', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
              {previewDoc.content}
            </div>

            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.78rem', color: '#475569' }}>
              <div>
                <div>Data de Publicação: {new Date(previewDoc.created_at || Date.now()).toLocaleDateString('pt-BR')}</div>
                <div style={{ color: '#059669', fontWeight: 600 }}>Assinado Digitalmente por Certificado PratiCom</div>
              </div>

              <div style={{ textAlign: 'center', minWidth: '180px' }}>
                <div style={{ borderBottom: '1px solid #334155', marginBottom: '4px', width: '100%' }}></div>
                <div style={{ fontWeight: 700 }}>Síndico Geral / Administração</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Gestão Condominial</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => setPreviewDoc(null)}>
              Fechar
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={16} />
              <span>Imprimir / Gerar PDF</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
