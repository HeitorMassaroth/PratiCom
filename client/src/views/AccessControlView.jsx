import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, LogOut, Search } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function AccessControlView() {
  const [logs, setLogs] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    destination_unit_id: '',
    visitor_name: '',
    document: '',
    type: 'Visitante',
    company: '',
    vehicle_plate: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = () => {
    Promise.all([api.get(`/access?search=${search}`), api.get('/units')])
      .then(([accessData, unitsData]) => {
        setLogs(accessData || []);
        setUnits(unitsData || []);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('condo-changed', loadData);
    return () => window.removeEventListener('condo-changed', loadData);
  }, [search]);

  const handleEntry = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/access/entry', form);
      setIsModalOpen(false);
      setForm({ destination_unit_id: '', visitor_name: '', document: '', type: 'Visitante', company: '', vehicle_plate: '' });
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleExit = async (id) => {
    try {
      await api.patch(`/access/${id}/exit`, {});
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Portaria & Controle de Acesso</h1>
          <p>Monitoramento em tempo real de visitantes, prestadores e veículos na portaria.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Registrar Entrada</span>
        </button>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '14px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nome, documento ou placa..."
            style={{ paddingLeft: '42px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Visitante / Prestador</th>
              <th>Documento</th>
              <th>Tipo / Empresa</th>
              <th>Destino</th>
              <th>Placa Veículo</th>
              <th>Entrada</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Nenhum registro de acesso encontrado.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td><strong>{log.visitor_name}</strong></td>
                  <td>{log.document}</td>
                  <td>
                    <span>{log.type}</span>
                    {log.company && <small style={{ display: 'block', color: 'var(--text-muted)' }}>{log.company}</small>}
                  </td>
                  <td>Apto {log.destination_unit}</td>
                  <td>{log.vehicle_plate || '-'}</td>
                  <td>{new Date(log.entered_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    {log.status === 'IN_PROPERTY' ? (
                      <span className="badge badge-success">No Condomínio</span>
                    ) : (
                      <span className="badge badge-info">Liberado (Saída)</span>
                    )}
                  </td>
                  <td>
                    {log.status === 'IN_PROPERTY' && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => handleExit(log.id)}
                      >
                        <LogOut size={14} />
                        <span>Dar Saída</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Entrada */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Entrada na Portaria">
        <form onSubmit={handleEntry}>
          {errorMsg && <div className="badge badge-danger" style={{ marginBottom: 16, width: '100%' }}>{errorMsg}</div>}
          <div className="form-group">
            <label>Unidade de Destino *</label>
            <select
              className="form-control"
              value={form.destination_unit_id}
              onChange={(e) => setForm({ ...form, destination_unit_id: e.target.value })}
              required
            >
              <option value="">Selecione a Unidade...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>Apto {u.number} ({u.block_name || 'Bloco'})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Nome Completo do Visitante *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: João da Silva"
              value={form.visitor_name}
              onChange={(e) => setForm({ ...form, visitor_name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Documento de Identificação (RG / CPF) *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: 12.345.678-9"
              value={form.document}
              onChange={(e) => setForm({ ...form, document: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Tipo</label>
              <select className="form-control" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="Visitante">Visitante</option>
                <option value="Prestador de Serviço">Prestador de Serviço</option>
                <option value="Delivery / Entregador">Delivery / Entregador</option>
              </select>
            </div>
            <div className="form-group">
              <label>Placa do Veículo (Opcional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: BRA2E19"
                value={form.vehicle_plate}
                onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Empresa (Se aplicável)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Copel, Sanepar, Claro..."
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Registrar Entrada</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
