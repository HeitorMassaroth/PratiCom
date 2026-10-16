import React, { useState, useEffect } from 'react';
import { Package, Plus, CheckCircle2, XCircle, KeyRound, Search, AlertCircle, Delete, Clock, Check } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

export default function DeliveriesView() {
  const [deliveries, setDeliveries] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Formulários
  const [newForm, setNewForm] = useState({ unit_id: '', courier: '', tracking_code: '', description: '' });
  const [pickupForm, setPickupForm] = useState({ pickup_code: '', picked_up_by: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = () => {
    Promise.all([api.get('/deliveries'), api.get('/units')])
      .then(([delData, unitData]) => {
        setDeliveries(delData || []);
        setUnits(unitData || []);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('condo-changed', loadData);
    return () => window.removeEventListener('condo-changed', loadData);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const created = await api.post('/deliveries', newForm);
      setIsNewModalOpen(false);
      setNewForm({ unit_id: '', courier: '', tracking_code: '', description: '' });
      showToast(`Pacote registrado com sucesso. PIN do armário: ${created.pickup_code}`);
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handlePickup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.patch(`/deliveries/${selectedDelivery.id}/pickup`, pickupForm);
      setIsPickupModalOpen(false);
      setSelectedDelivery(null);
      setPickupForm({ pickup_code: '', picked_up_by: '' });
      showToast('Baixa de encomenda confirmada com sucesso.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCancel = async (id) => {
    const reason = prompt('Informe a justificativa formal para cancelamento da encomenda:');
    if (!reason) return;
    try {
      await api.patch(`/deliveries/${id}/cancel`, { reason });
      showToast('Encomenda cancelada com sucesso.', 'info');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleKeypadPress = (val) => {
    if (val === 'DEL') {
      setPickupForm((prev) => ({ ...prev, pickup_code: prev.pickup_code.slice(0, -1) }));
    } else if (val === 'CLEAR') {
      setPickupForm((prev) => ({ ...prev, pickup_code: '' }));
    } else if (pickupForm.pickup_code.length < 4) {
      setPickupForm((prev) => ({ ...prev, pickup_code: prev.pickup_code + val }));
    }
  };

  const filtered = deliveries.filter((d) => {
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    const term = search.toLowerCase();
    return (
      d.courier?.toLowerCase().includes(term) ||
      d.unit_number?.toString().includes(term) ||
      d.tracking_code?.toLowerCase().includes(term) ||
      d.resident_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Gestão de Encomendas & Armário Digital</h1>
          <p>Recepção de volumes, controle de guarda na portaria e entrega autenticada por PIN de 4 dígitos.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
          <Plus size={16} />
          <span>Receber Encomenda</span>
        </button>
      </div>

      {/* Filtros e Busca */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por morador, unidade, transportadora..."
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
            Todas ({deliveries.length})
          </button>
          <button
            className={`segmented-tab ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            Aguardando Retirada ({deliveries.filter((d) => d.status === 'PENDING').length})
          </button>
          <button
            className={`segmented-tab ${statusFilter === 'PICKED_UP' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PICKED_UP')}
          >
            Entregues ({deliveries.filter((d) => d.status === 'PICKED_UP').length})
          </button>
          <button
            className={`segmented-tab ${statusFilter === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('CANCELLED')}
          >
            Canceladas ({deliveries.filter((d) => d.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      {/* Tabela de Encomendas */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '70px' }}>Protocolo</th>
              <th>Destinatário</th>
              <th>Transportadora</th>
              <th>Código de Rastreio</th>
              <th style={{ textAlign: 'center' }}>PIN Armário</th>
              <th>Data Recebimento</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  Nenhuma encomenda encontrada com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id}>
                  <td className="num-cell">#{d.id}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.resident_name || 'Destinatário não especificado'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Unidade {d.unit_number} {d.block_name ? `• ${d.block_name}` : ''}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{d.courier}</span>
                    {d.description && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{d.description}</div>
                    )}
                  </td>
                  <td className="num-cell" style={{ color: 'var(--text-muted)' }}>
                    {d.tracking_code || '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        padding: '3px 8px',
                        background: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {d.pickup_code}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {d.received_at ? new Date(d.received_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td>
                    {d.status === 'PENDING' && <span className="badge badge-warning">Aguardando</span>}
                    {d.status === 'PICKED_UP' && <span className="badge badge-success">Retirado</span>}
                    {d.status === 'CANCELLED' && <span className="badge badge-neutral">Cancelado</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {d.status === 'PENDING' && (
                        <>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              setSelectedDelivery(d);
                              setIsPickupModalOpen(true);
                              setErrorMsg('');
                            }}
                          >
                            <KeyRound size={13} />
                            <span>Validar PIN</span>
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            title="Cancelar recebimento"
                            onClick={() => handleCancel(d.id)}
                          >
                            <XCircle size={13} color="var(--danger)" />
                          </button>
                        </>
                      )}
                      {d.status === 'PICKED_UP' && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          Por: {d.picked_up_by || 'Titular'}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Receber Nova Encomenda */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Receber Nova Encomenda">
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Unidade Destinatária <span className="required">*</span></label>
            <select
              className="form-control"
              required
              value={newForm.unit_id}
              onChange={(e) => setNewForm({ ...newForm, unit_id: e.target.value })}
            >
              <option value="">Selecione o apartamento / unidade...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  Unidade {u.number} {u.block_name ? `(${u.block_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Transportadora <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="Ex: Correios, Mercado Livre, Amazon"
                value={newForm.courier}
                onChange={(e) => setNewForm({ ...newForm, courier: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Código de Rastreio</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: BR123456789XP"
                value={newForm.tracking_code}
                onChange={(e) => setNewForm({ ...newForm, tracking_code: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Descrição do Volume</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Caixa média, envelope de documento"
              value={newForm.description}
              onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Registrar & Gerar PIN</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Baixa por PIN (Armário Digital) */}
      <Modal
        isOpen={isPickupModalOpen}
        onClose={() => {
          setIsPickupModalOpen(false);
          setSelectedDelivery(null);
          setPickupForm({ pickup_code: '', picked_up_by: '' });
        }}
        title="Liberação de Encomenda via PIN"
      >
        {selectedDelivery && (
          <div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Destinatário:</div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedDelivery.resident_name || 'Morador'} • Unidade {selectedDelivery.unit_number}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>Transportadora: {selectedDelivery.courier}</div>
            </div>

            {errorMsg && (
              <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handlePickup}>
              {/* Display visual dos 4 dígitos */}
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  Digite o PIN de 4 dígitos informado pelo morador:
                </span>
              </div>

              <div className="pin-display">
                {[0, 1, 2, 3].map((idx) => {
                  const char = pickupForm.pickup_code[idx];
                  return (
                    <div key={idx} className={`pin-slot ${char ? 'filled' : ''}`}>
                      {char || '•'}
                    </div>
                  );
                })}
              </div>

              {/* Keypad Virtual de Alta Precisão */}
              <div className="pin-keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'DEL'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className="pin-key"
                    onClick={() => handleKeypadPress(val)}
                    style={val === 'CLEAR' || val === 'DEL' ? { fontSize: '0.75rem', fontWeight: 700 } : {}}
                  >
                    {val === 'DEL' ? '⌫' : val === 'CLEAR' ? 'C' : val}
                  </button>
                ))}
              </div>

              <div className="form-group" style={{ marginTop: '18px' }}>
                <label>Identificação de Quem Retirou <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Nome completo de quem está retirando"
                  value={pickupForm.picked_up_by}
                  onChange={(e) => setPickupForm({ ...pickupForm, picked_up_by: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsPickupModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={pickupForm.pickup_code.length !== 4 || !pickupForm.picked_up_by.trim()}
                >
                  <CheckCircle2 size={16} />
                  <span>Confirmar Baixa</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
