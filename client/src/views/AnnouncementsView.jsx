import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Pin, Trash2, Check, AlertCircle } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

export default function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'Geral',
    priority: 'normal',
    is_pinned: 0
  });

  const loadAnnouncements = () => {
    api.get('/announcements')
      .then((data) => setAnnouncements(data || []))
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
      setForm({ title: '', content: '', category: 'Geral', priority: 'normal', is_pinned: 0 });
      showToast('Comunicado publicado no mural oficial.');
      loadAnnouncements();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja realmente remover esta publicação do mural?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      showToast('Comunicado removido do mural.', 'info');
      loadAnnouncements();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Mural de Avisos & Comunicados Oficiais</h1>
          <p>Canal oficial de transmissão de editais de assembleia, avisos de manutenção e normas internas.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Publicar Comunicado</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {announcements.length === 0 ? (
          <div className="erp-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Nenhum comunicado publicado no mural do condomínio.
          </div>
        ) : (
          announcements.map((a) => {
            const isUrgent = a.priority === 'alta' || a.priority === 'urgente';
            return (
              <div
                key={a.id}
                className="erp-panel"
                style={{
                  borderLeft: isUrgent ? '4px solid var(--danger)' : a.is_pinned ? '4px solid var(--primary)' : '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{a.title}</h3>
                    {a.is_pinned === 1 && (
                      <span className="badge badge-primary" style={{ gap: '3px' }}>
                        <Pin size={11} />
                        <span>Fixado</span>
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
                  </div>
                  <button
                    className="btn-icon"
                    style={{ width: 28, height: 28 }}
                    onClick={() => handleDelete(a.id)}
                    title="Excluir comunicado"
                  >
                    <Trash2 size={13} color="var(--danger)" />
                  </button>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.55', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>
                  {a.content}
                </p>

                <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  Publicado em: {a.created_at ? new Date(a.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Novo Comunicado */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publicar Comunicado no Mural">
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
              placeholder="Ex: Interrupção temporária de água para manutenção"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-grid-2">
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
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={form.is_pinned === 1}
                onChange={(e) => setForm({ ...form, is_pinned: e.target.checked ? 1 : 0 })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>Fixar comunicado em destaque no topo do mural e do dashboard</span>
            </label>
          </div>

          <div className="form-group">
            <label>Texto Integral do Comunicado <span className="required">*</span></label>
            <textarea
              className="form-control"
              required
              rows={4}
              placeholder="Descreva detalhadamente o comunicado oficial..."
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
              <span>Publicar no Mural</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
