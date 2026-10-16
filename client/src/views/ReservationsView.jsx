import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Clock, Users, XCircle } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function ReservationsView() {
  const [spaces, setSpaces] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [residents, setResidents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    space_id: '',
    resident_id: '',
    unit_id: '',
    reservation_date: today,
    start_time: '18:00',
    end_time: '23:00',
    notes: ''
  });

  const loadData = () => {
    Promise.all([api.get('/spaces'), api.get('/reservations'), api.get('/residents')])
      .then(([spacesData, resData, residentsData]) => {
        setSpaces(spacesData || []);
        setReservations(resData || []);
        setResidents(residentsData || []);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('condo-changed', loadData);
    return () => window.removeEventListener('condo-changed', loadData);
  }, []);

  const handleResidentSelect = (residentId) => {
    const selected = residents.find((r) => r.id === Number(residentId));
    setForm({
      ...form,
      resident_id: residentId,
      unit_id: selected ? selected.unit_id : ''
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/reservations', form);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Deseja cancelar esta reserva?')) return;
    try {
      await api.patch(`/reservations/${id}/cancel`, {});
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Áreas Comuns & Reservas</h1>
          <p>Agendamento de espaços com validação inteligente contra sobreposição de horários.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Nova Reserva</span>
        </button>
      </div>

      {/* Espaços Cadastrados */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {spaces.map((s) => (
          <div key={s.id} className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{s.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>{s.description || 'Área de convivência social.'}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
              <Users size={16} />
              <span>Capacidade: {s.capacity} pessoas</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de Reservas */}
      <div className="glass-card table-responsive">
        <h3 style={{ marginBottom: '16px' }}>Histórico de Reservas</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Espaço</th>
              <th>Data</th>
              <th>Horário</th>
              <th>Morador / Unidade</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Nenhuma reserva registrada.
                </td>
              </tr>
            ) : (
              reservations.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.space_name}</strong></td>
                  <td>{r.reservation_date}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} color="var(--primary)" />
                      {r.start_time} às {r.end_time}
                    </span>
                  </td>
                  <td>{r.resident_name} (Apto {r.unit_number})</td>
                  <td>
                    {r.status === 'CONFIRMED' ? (
                      <span className="badge badge-success">Confirmada</span>
                    ) : (
                      <span className="badge badge-danger">Cancelada</span>
                    )}
                  </td>
                  <td>
                    {r.status === 'CONFIRMED' && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => handleCancel(r.id)}
                        title="Cancelar Reserva"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Reserva */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agendar Espaço Comum">
        <form onSubmit={handleCreate}>
          {errorMsg && <div className="badge badge-danger" style={{ marginBottom: 16, width: '100%' }}>{errorMsg}</div>}
          <div className="form-group">
            <label>Espaço Comum *</label>
            <select
              className="form-control"
              value={form.space_id}
              onChange={(e) => setForm({ ...form, space_id: e.target.value })}
              required
            >
              <option value="">Selecione o espaço...</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>{s.name} (Capacidade: {s.capacity})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Morador Responsável *</label>
            <select
              className="form-control"
              value={form.resident_id}
              onChange={(e) => handleResidentSelect(e.target.value)}
              required
            >
              <option value="">Selecione o morador...</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>{r.name} - Apto {r.unit_number}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Data da Reserva *</label>
            <input
              type="date"
              className="form-control"
              value={form.reservation_date}
              onChange={(e) => setForm({ ...form, reservation_date: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Horário Inicial *</label>
              <input
                type="time"
                className="form-control"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Horário Final *</label>
              <input
                type="time"
                className="form-control"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                required
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Confirmar Agendamento</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
