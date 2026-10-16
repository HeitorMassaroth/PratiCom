import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, LogOut, Search, UserCheck, Clock, Check, QrCode, MessageSquare, Copy, Sparkles, Share2 } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

export default function AccessControlView() {
  const [logs, setLogs] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ visitor_name: '', unit_id: '', valid_until: '23:59' });
  const [generatedPass, setGeneratedPass] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    destination_unit_id: '',
    visitor_name: '',
    document: '',
    type: 'Visitante',
    company: '',
    vehicle_plate: ''
  });

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
      showToast('Entrada de visitante registrada com sucesso.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleExit = async (id) => {
    try {
      await api.patch(`/access/${id}/exit`, {});
      showToast('Saída de visitante registrada.');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (statusFilter === 'IN_PROPERTY') return log.status === 'IN_PROPERTY';
    if (statusFilter === 'EXITED') return log.status === 'EXITED';
    return true;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Portaria & Controle de Acessos</h1>
          <p>Registro rigoroso de entrada e saída de visitantes, prestadores de serviço e terceiros.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => { setIsInviteModalOpen(true); setGeneratedPass(null); }}>
            <QrCode size={16} />
            <span>Gerar Passe QR Code</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Registrar Entrada</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nome, documento ou placa..."
            style={{ paddingLeft: '36px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="segmented-tabs">
          <button
            className={`segmented-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Todos ({logs.length})
          </button>
          <button
            className={`segmented-tab ${statusFilter === 'IN_PROPERTY' ? 'active' : ''}`}
            onClick={() => setStatusFilter('IN_PROPERTY')}
          >
            No Perímetro ({logs.filter((l) => l.status === 'IN_PROPERTY').length})
          </button>
          <button
            className={`segmented-tab ${statusFilter === 'EXITED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('EXITED')}
          >
            Saída Concluída ({logs.filter((l) => l.status === 'EXITED').length})
          </button>
        </div>
      </div>

      {/* Tabela de Controle de Portaria */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Identificação / Nome</th>
              <th>Documento (RG/CPF)</th>
              <th>Classificação</th>
              <th>Unidade Destino</th>
              <th>Placa Veículo</th>
              <th>Entrada</th>
              <th>Saída</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Nenhum registro de acesso encontrado.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{log.visitor_name}</div>
                    {log.company && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Empresa: {log.company}</div>
                    )}
                  </td>
                  <td className="num-cell" style={{ color: 'var(--text-muted)' }}>
                    {log.document}
                  </td>
                  <td>
                    <span className="badge badge-info">{log.type}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>Unidade {log.destination_unit}</span>
                    {log.destination_block && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}> • {log.destination_block}</span>
                    )}
                  </td>
                  <td>
                    {log.vehicle_plate ? (
                      <span className="license-plate" style={{ fontSize: '0.78rem' }}>
                        <span className="license-plate-number">{log.vehicle_plate}</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {log.entered_at ? new Date(log.entered_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {log.exited_at ? new Date(log.exited_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td>
                    {log.status === 'IN_PROPERTY' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span className="badge badge-warning">No Perímetro</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> Desde {log.entered_at ? new Date(log.entered_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="badge badge-neutral">Liberado</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {log.status === 'IN_PROPERTY' && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => handleExit(log.id)}
                        title="Registrar saída do condomínio"
                      >
                        <LogOut size={13} color="var(--primary)" />
                        <span>Baixar Saída</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Registrar Entrada */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Entrada de Terceiros">
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleEntry}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Nome Completo <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="Ex: João da Silva"
                value={form.visitor_name}
                onChange={(e) => setForm({ ...form, visitor_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Documento (RG / CPF) <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="Ex: 12.345.678-9"
                value={form.document}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Classificação <span className="required">*</span></label>
              <select
                className="form-control"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="Visitante">Visitante</option>
                <option value="Prestador de Serviço">Prestador de Serviço</option>
                <option value="Delivery">Entregador / Delivery</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Unidade de Destino <span className="required">*</span></label>
              <select
                className="form-control"
                required
                value={form.destination_unit_id}
                onChange={(e) => setForm({ ...form, destination_unit_id: e.target.value })}
              >
                <option value="">Selecione o apartamento...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    Unidade {u.number} {u.block_name ? `(${u.block_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Empresa (opcional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Copel, Sanepar, Claro"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Placa do Veículo (opcional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: ABC1D23"
                value={form.vehicle_plate}
                onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Confirmar Liberação</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Gerador de Passe Digital / QR Code de Convidado */}
      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Gerador de Passe de Visitante (QR Code)">
        <div>
          {!generatedPass ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              const unit = units.find(u => u.id === inviteForm.unit_id);
              setGeneratedPass({
                visitor_name: inviteForm.visitor_name,
                unit_number: unit ? unit.number : 'Geral',
                code: 'PRATI-PASS-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                valid_until: inviteForm.valid_until
              });
              showToast('Passe de visitante gerado com sucesso!');
            }}>
              <div className="form-group">
                <label>Nome do Convidado / Visitante <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={inviteForm.visitor_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, visitor_name: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Unidade Destino <span className="required">*</span></label>
                  <select
                    className="form-control"
                    required
                    value={inviteForm.unit_id}
                    onChange={(e) => setInviteForm({ ...inviteForm, unit_id: e.target.value })}
                  >
                    <option value="">Selecione o apartamento...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        Unidade {u.number} {u.block_name ? `(${u.block_name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Válido Até Hoje às</label>
                  <input
                    type="time"
                    className="form-control"
                    value={inviteForm.valid_until}
                    onChange={(e) => setInviteForm({ ...inviteForm, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsInviteModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <QrCode size={16} />
                  <span>Gerar Passe Digital</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              {/* Cartão de Passe Digital */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(139,92,246,0.12) 100%)',
                border: '1.5px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'inline-flex', padding: '12px', background: '#ffffff', borderRadius: 'var(--radius-sm)', marginBottom: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  {/* QR Code SVG Visual */}
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <rect width="120" height="120" fill="#ffffff" />
                    <rect x="10" y="10" width="30" height="30" fill="#000000" />
                    <rect x="15" y="15" width="20" height="20" fill="#ffffff" />
                    <rect x="20" y="20" width="10" height="10" fill="#000000" />
                    <rect x="80" y="10" width="30" height="30" fill="#000000" />
                    <rect x="85" y="15" width="20" height="20" fill="#ffffff" />
                    <rect x="90" y="20" width="10" height="10" fill="#000000" />
                    <rect x="10" y="80" width="30" height="30" fill="#000000" />
                    <rect x="15" y="85" width="20" height="20" fill="#ffffff" />
                    <rect x="20" y="90" width="10" height="10" fill="#000000" />
                    <circle cx="60" cy="60" r="14" fill="#2563eb" />
                    <path d="M50 50h8v8h-8zM62 50h8v8h-8zM50 62h8v8h-8zM62 62h8v8h-8z" fill="#000000" />
                  </svg>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>
                  {generatedPass.visitor_name}
                </h3>
                <span className="badge badge-primary" style={{ marginBottom: '12px', display: 'inline-block' }}>
                  Acesso Autorizado • Unidade {generatedPass.unit_number}
                </span>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  <div>Código de Liberação: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{generatedPass.code}</strong></div>
                  <div>Válido até hoje às <strong>{generatedPass.valid_until}</strong></div>
                </div>
              </div>

              {/* Ações do Passe */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    navigator.clipboard?.writeText(generatedPass.code);
                    showToast('Código do passe copiado!');
                  }}
                >
                  <Copy size={14} />
                  <span>Copiar Código</span>
                </button>
                <a
                  href={`https://wa.me/?text=Olá%20${encodeURIComponent(generatedPass.visitor_name)},%20seu%20passe%20digital%20de%20acesso%20para%20o%20Condomínio%20PratiCom%20(Unid.%20${generatedPass.unit_number})%20foi%20liberado.%20Código:%20${generatedPass.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  <MessageSquare size={14} />
                  <span>Enviar por WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
