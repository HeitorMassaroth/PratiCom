import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  Users, 
  XCircle, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Filter, 
  Search, 
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle2,
  Table as TableIcon
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

export default function ReservationsView() {
  const [spaces, setSpaces] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [residents, setResidents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modo de visualização: 'calendar' ou 'table'
  const [viewMode, setViewMode] = useState('calendar');

  // Filtros
  const [selectedSpaceFilter, setSelectedSpaceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Navegação do Calendário
  const todayObj = new Date();
  const [currentYear, setCurrentYear] = useState(todayObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(todayObj.getMonth()); // 0-indexed

  const todayStr = todayObj.toISOString().split('T')[0];

  const [form, setForm] = useState({
    space_id: '',
    resident_id: '',
    unit_id: '',
    reservation_date: todayStr,
    start_time: '18:00',
    end_time: '23:00',
    notes: '',
    accepted_rules: false
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

  const handleOpenCreateForSpace = (spaceId, dateStr = null) => {
    setForm((prev) => ({
      ...prev,
      space_id: spaceId || (spaces[0]?.id || ''),
      reservation_date: dateStr || prev.reservation_date || todayStr,
      accepted_rules: false
    }));
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.accepted_rules) {
      setErrorMsg('É necessário aceitar os termos de uso e regulamento interno para confirmar.');
      return;
    }

    try {
      await api.post('/reservations', form);
      setIsModalOpen(false);
      showToast('Reserva confirmada sem conflito de horários!');
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

  // Funções de navegação de mês
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
  };

  // Cores dinâmicas para cada espaço
  const spaceColors = [
    { bg: 'rgba(37, 99, 235, 0.15)', text: '#3b82f6', border: 'rgba(37, 99, 235, 0.3)' },
    { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
    { bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.3)' }
  ];

  const getSpaceColor = (spaceId) => {
    const idx = (Number(spaceId) || 0) % spaceColors.length;
    return spaceColors[idx];
  };

  // Gerador de células do calendário
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year, month) => new Date(year, month, 1).getDay(); // 0 = Domingo

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfWeek(currentYear, currentMonth);
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth === 0 ? 11 : currentMonth - 1);

  const calendarDays = [];

  // Dias do mês anterior para completar primeira semana
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarDays.push({ dayNumber: dayNum, dateStr, isCurrentMonth: false });
  }

  // Dias do mês atual
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ dayNumber: day, dateStr, isCurrentMonth: true });
  }

  // Dias do próximo mês para completar 35 ou 42 células
  const remainingSlots = (calendarDays.length % 7 === 0) ? 0 : (7 - (calendarDays.length % 7));
  for (let day = 1; day <= remainingSlots; day++) {
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ dayNumber: day, dateStr, isCurrentMonth: false });
  }

  // Filtros de Reservas
  const filteredReservations = reservations.filter((r) => {
    const matchesSpace = selectedSpaceFilter === 'ALL' || String(r.space_id) === String(selectedSpaceFilter);
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch = 
      (r.resident_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.space_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.unit_number || '').includes(searchTerm);
    return matchesSpace && matchesStatus && matchesSearch;
  });

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>Áreas Comuns & Agenda de Reservas</h1>
            <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={11} /> Anti-Conflito Ativo
            </span>
          </div>
          <p>Disponibilidade em tempo real com controle de horários, regras de convivência e validação cadastral.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Switcher Tabela / Calendário */}
          <div className="segmented-tabs" style={{ margin: 0 }}>
            <button
              className={`segmented-tab ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Visualização em Calendário Mensal"
            >
              <CalendarDays size={14} /> Calendário
            </button>
            <button
              className={`segmented-tab ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Visualização em Tabela Detalhada"
            >
              <TableIcon size={14} /> Tabela
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenCreateForSpace(null)}>
            <Plus size={16} />
            <span>Nova Reserva</span>
          </button>
        </div>
      </div>

      {/* Catálogo Visual de Espaços Cadastrados */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {spaces.map((s, index) => {
          const colorObj = spaceColors[index % spaceColors.length];
          return (
            <div 
              key={s.id} 
              className="erp-panel" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                borderTop: `3px solid ${colorObj.text}`,
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{s.name}</h3>
                  <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={12} />
                    <span>{s.capacity} pessoas</span>
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: '1.45', marginBottom: '14px' }}>
                  {s.description || 'Área nobre de convivência coletiva para eventos e confraternizações dos condôminos.'}
                </p>

                {/* Tags de Facilidades */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>Wi-Fi Livre</span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>Climatizado</span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>Som Integrado</span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>Até 23h</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Taxa Limpeza: <span style={{ color: 'var(--text-main)' }}>R$ 80,00</span>
                </span>
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => handleOpenCreateForSpace(s.id)}
                  style={{ gap: '4px' }}
                >
                  <Plus size={13} />
                  <span>Reservar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="var(--text-dim)" />
          <input
            type="text"
            className="filter-select"
            style={{ width: '100%', padding: '8px 12px' }}
            placeholder="Buscar por morador, apartamento ou espaço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-dim)" />
          <select
            className="filter-select"
            value={selectedSpaceFilter}
            onChange={(e) => setSelectedSpaceFilter(e.target.value)}
          >
            <option value="ALL">Todos os Espaços</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos os Status</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="CANCELLED">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Visualização 1: Calendário Interativo */}
      {viewMode === 'calendar' && (
        <div className="calendar-wrapper">
          {/* Barra Superior do Mês */}
          <div className="calendar-top-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CalendarIcon size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  {monthNames[currentMonth]} {currentYear}
                </h2>
              </div>
              <button className="btn btn-sm btn-outline" onClick={handleGoToday}>
                Hoje
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button className="btn-icon" onClick={handlePrevMonth} title="Mês anterior">
                <ChevronLeft size={16} />
              </button>
              <button className="btn-icon" onClick={handleNextMonth} title="Próximo mês">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Dias da Semana */}
          <div className="calendar-weekdays-grid">
            <div className="calendar-weekday-col">Domingo</div>
            <div className="calendar-weekday-col">Segunda</div>
            <div className="calendar-weekday-col">Terça</div>
            <div className="calendar-weekday-col">Quarta</div>
            <div className="calendar-weekday-col">Quinta</div>
            <div className="calendar-weekday-col">Sexta</div>
            <div className="calendar-weekday-col">Sábado</div>
          </div>

          {/* Matriz de Dias */}
          <div className="calendar-days-matrix">
            {calendarDays.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const cellEvents = filteredReservations.filter((r) => r.reservation_date === cell.dateStr && r.status === 'CONFIRMED');

              return (
                <div
                  key={idx}
                  className={`calendar-day-slot ${!cell.isCurrentMonth ? 'is-other-month' : ''} ${isToday ? 'is-today' : ''}`}
                  onClick={() => handleOpenCreateForSpace(null, cell.dateStr)}
                  title={`Clique para agendar em ${cell.dateStr}`}
                >
                  <div className="calendar-day-header">
                    <span className="calendar-day-number">{cell.dayNumber}</span>
                    {cellEvents.length > 0 && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                        {cellEvents.length} {cellEvents.length === 1 ? 'reserva' : 'reservas'}
                      </span>
                    )}
                  </div>

                  <div className="calendar-events-container">
                    {cellEvents.map((ev) => {
                      const color = getSpaceColor(ev.space_id);
                      return (
                        <div
                          key={ev.id}
                          className="calendar-event-tag"
                          style={{
                            background: color.bg,
                            color: color.text,
                            border: `1px solid ${color.border}`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Reserva #${ev.id}\nEspaço: ${ev.space_name}\nMorador: ${ev.resident_name} (Apto ${ev.unit_number})\nHorário: ${ev.start_time} às ${ev.end_time}`);
                          }}
                          title={`${ev.space_name} - ${ev.resident_name} (Apto ${ev.unit_number})`}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color.text, flexShrink: 0 }}></span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ev.space_name}: Apto {ev.unit_number} ({ev.start_time})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visualização 2: Tabela Detalhada */}
      {viewMode === 'table' && (
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
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Nenhuma reserva localizada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((r) => (
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
      )}

      {/* Modal: Nova Reserva */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agendar Área Comum do Condomínio">
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

          {/* Atalhos de Horário */}
          <div style={{ marginBottom: '14px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>Horários Sugeridos:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setForm((p) => ({ ...p, start_time: '11:00', end_time: '16:00' }))}
              >
                Almoço (11h-16h)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setForm((p) => ({ ...p, start_time: '18:00', end_time: '23:00' }))}
              >
                Noite (18h-23h)
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setForm((p) => ({ ...p, start_time: '09:00', end_time: '21:00' }))}
              >
                Diurno (09h-21h)
              </button>
            </div>
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
              placeholder="Ex: Aniversário familiar, confraternização de final de semana"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Regras e Termos */}
          <div style={{ background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginTop: '12px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                required
                checked={form.accepted_rules}
                onChange={(e) => setForm({ ...form, accepted_rules: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', marginTop: '2px' }}
              />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Declaro ciência das normas do <strong>Regimento Interno</strong>: volume sonoro compatível até às 22h, restituição da área limpa e responsabilização por eventuais danos ao patrimônio comum.
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Validar e Confirmar Reserva</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
