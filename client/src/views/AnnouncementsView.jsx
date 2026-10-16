import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Pin, Trash2 } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

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
      loadAnnouncements();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deseja excluir este comunicado?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      loadAnnouncements();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Mural de Avisos & Comunicados</h1>
          <p>Transmissão oficial de comunicados, assembleias e avisos urgentes aos moradores.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Publicar Aviso</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {announcements.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Nenhum comunicado publicado no mural.
          </div>
        ) : (
          announcements.map((a) => {
            const isUrgent = a.priority === 'alta' || a.priority === 'urgente';
            return (
              <div
                key={a.id}
                className="glass-card"
                style={{
                  borderLeft: isUrgent ? '5px solid var(--danger)' : a.is_pinned ? '5px solid var(--primary)' : '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>{a.title}</h3>
                    {a.is_pinned === 1 && (
                      <span className="badge badge-info" style={{ gap: '4px' }}>
                        <Pin size={12} />
                        Fixado
                      </span>
                    )}
                    <span className={`badge ${isUrgent ? 'badge-danger' : 'badge-warning'}`}>
                      {a.category}
                    </span>
                  </div>
                  <button className="btn-icon" style={{ width: 30, height: 30 }} onClick={() => handleDelete(a.id)}>
                    <Trash2 size={15} color="var(--danger)" />
                  </button>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '12px' }}>
                  {a.content}
                </p>
                <small style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  Publicado em: {new Date(a.created_at).toLocaleDateString('pt-BR')} às {new Date(a.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Novo Comunicado */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publicar Novo Comunicado">
        <form onSubmit={handleCreate}>
          {errorMsg && <div className="badge badge-danger" style={{ marginBottom: 16, width: '100%' }}>{errorMsg}</div>}
          <div className="form-group">
            <label>Título do Comunicado *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Convocação de Assembleia Extraordinária"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Categoria</label>
              <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="Geral">Aviso Geral</option>
                <option value="Assembleia">Assembleia</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Segurança">Segurança</option>
                <option value="Obras">Obras</option>
              </select>
            </div>
            <div className="form-group">
              <label>Prioridade</label>
              <select className="form-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Conteúdo da Mensagem *</label>
            <textarea
              rows={4}
              className="form-control"
              placeholder="Descreva as informações do comunicado..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="pinCheck"
              checked={form.is_pinned === 1}
              onChange={(e) => setForm({ ...form, is_pinned: e.target.checked ? 1 : 0 })}
            />
            <label htmlFor="pinCheck" style={{ margin: 0, cursor: 'pointer' }}>Fixar este aviso no topo do mural e no Dashboard</label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Publicar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
