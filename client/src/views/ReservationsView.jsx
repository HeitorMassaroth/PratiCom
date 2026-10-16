import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Clock, Users, XCircle, Check } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

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
      showToast('Reserva confirmada sem conflito de horários.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Deseja realmente cancelar esta reserva de espaço?')) return;
    try {
      await api.patch(`/reservations/${id}/cancel`, {});
      showToast('Reserva cancelada com sucesso.', 'info');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Áreas Comuns & Agenda de Reservas</h1>
          <p>Disponibilidade de espaços coletivos com verificação algorítmica de conflitos de horário.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          <span>Nova Reserva</span>
        </button>
      </div>

      {/* Catálogo de Espaços Cadastrados */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {spaces.map((s) => (
          <div key={s.id} className="erp-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{s.name}</h3>
                <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} />
                  <span>{s.capacity} pessoas</span>
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: '1.4' }}>
                {s.description || 'Área de convivência coletiva para eventos de condôminos.'}
              </p>
            </div>
            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Uso exclusivo mediante reserva antecipada
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de Histórico de Reservas */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Ref</th>
              <th>Espaço Comum</th>
              <th>Morador Responsável</th>
              <th>Unidade</th>
              <th>Data do Evento</th>
              <th>Horário</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Nenhuma reserva registrada.
                </td>
              </tr>
            ) : (
              reservations.map((r) => (
                <tr key={r.id}>
                  <td className="num-cell">#{r.id}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{r.space_name}</span>
                    {r.notes && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Obs: {r.notes}</div>
                    )}
                  </td>
                  <td>{r.resident_name}</td>
                  <td>Unidade {r.unit_number}</td>
                  <td style={{ fontSize: '0.84rem' }}>
                    {r.reservation_date ? new Date(r.reservation_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="num-cell">
                    {r.start_time} às {r.end_time}
                  </td>
                  <td>
                    {r.status === 'CONFIRMED' ? (
                      <span className="badge badge-success">Confirmada</span>
                    ) : (
                      <span className="badge badge-neutral">Cancelada</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {r.status === 'CONFIRMED' && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleCancel(r.id)}
                        title="Cancelar reserva de espaço"
                      >
                        <XCircle size={13} color="var(--danger)" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Nova Reserva */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agendar Área Comum">
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Espaço a Reservar <span className="required">*</span></label>
            <select
              className="form-control"
              required
              value={form.space_id}
              onChange={(e) => setForm({ ...form, space_id: e.target.value })}
            >
              <option value="">Selecione o espaço comum...</option>
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Capacidade: {s.capacity} pessoas)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Morador Responsável <span className="required">*</span></label>
            <select
              className="form-control"
              required
              value={form.resident_id}
              onChange={(e) => handleResidentSelect(e.target.value)}
            >
              <option value="">Selecione o morador...</option>
              {residents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} • Unidade {r.unit_number} ({r.role})
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Data do Evento <span className="required">*</span></label>
              <input
                type="date"
                className="form-control"
                required
                value={form.reservation_date}
                onChange={(e) => setForm({ ...form, reservation_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Horário Início <span className="required">*</span></label>
              <input
                type="time"
                className="form-control"
                required
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Horário Término <span className="required">*</span></label>
              <input
                type="time"
                className="form-control"
                required
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Finalidade / Observações</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Aniversário familiar, confraternização"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Validar e Confirmar</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
