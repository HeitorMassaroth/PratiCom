import React, { useState, useEffect } from 'react';
import { Package, Plus, CheckCircle2, XCircle, KeyRound, Search, Delete } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

export default function DeliveriesView() {
  const [deliveries, setDeliveries] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState('');

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
      showToast(`📦 Pacote recebido com sucesso! PIN de retirada: ${created.pickup_code}`);
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
      showToast('🎉 Encomenda entregue e baixada com sucesso!');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCancel = async (id) => {
    const reason = prompt('Informe o motivo do cancelamento da encomenda:');
    if (!reason) return;
    try {
      await api.patch(`/deliveries/${id}/cancel`, { reason });
      showToast('Encomenda cancelada.', 'info');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleKeypadPress = (val) => {
    if (val === 'DEL') {
      setPickupForm((prev) => ({ ...prev, pickup_code: prev.pickup_code.slice(0, -1) }));
    } else if (pickupForm.pickup_code.length < 4) {
      setPickupForm((prev) => ({ ...prev, pickup_code: prev.pickup_code + val }));
    }
  };

  const filtered = deliveries.filter((d) => {
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
          <p>Recebimento rápido de pacotes, rastreio unificado e liberação por PIN de 4 dígitos.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
          <Plus size={18} />
          <span>Receber Pacote</span>
        </button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div style={{ marginBottom: '22px', display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por transportadora, morador, unidade..."
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
              <th>ID</th>
              <th>Destinatário / Unidade</th>
              <th>Transportadora</th>
              <th>Código / Rastreio</th>
              <th>PIN Armário</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Nenhuma encomenda encontrada com os filtros informados.
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id}>
                  <td><strong>#{d.id}</strong></td>
                  <td>
                    <div><strong>Apto {d.unit_number || d.unit_id}</strong></div>
                    <small style={{ color: 'var(--text-muted)' }}>
                      {d.resident_name || d.block_name || 'Morador'}
                    </small>
                  </td>
                  <td><strong>{d.courier}</strong></td>
                  <td>{d.tracking_code || <span style={{ color: 'var(--text-dim)' }}>Não informado</span>}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: '3px', background: 'var(--bg-surface)', padding: '6px 10px', borderRadius: '6px', fontSize: '1rem', color: 'var(--primary)' }}>
                      {d.pickup_code}
                    </span>
                  </td>
                  <td>
                    {d.status === 'PENDING' && <span className="badge badge-warning">Aguardando Retirada</span>}
                    {d.status === 'PICKED_UP' && <span className="badge badge-success">Retirada Concluída</span>}
                    {d.status === 'CANCELLED' && <span className="badge badge-danger">Cancelada</span>}
                  </td>
                  <td>
                    {d.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success"
                          style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                          onClick={() => {
                            setSelectedDelivery(d);
                            setPickupForm({ pickup_code: '', picked_up_by: '' });
                            setIsPickupModalOpen(true);
                          }}
                        >
                          <KeyRound size={15} />
                          <span>Liberar PIN</span>
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                          onClick={() => handleCancel(d.id)}
                          title="Cancelar Encomenda"
                        >
                          <XCircle size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Encomenda */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Registrar Nova Encomenda">
        <form onSubmit={handleCreate}>
          {errorMsg && <div className="badge badge-danger" style={{ marginBottom: 16, width: '100%' }}>{errorMsg}</div>}
          <div className="form-group">
            <label>Unidade de Destino *</label>
            <select
              className="form-control"
              value={newForm.unit_id}
              onChange={(e) => setNewForm({ ...newForm, unit_id: e.target.value })}
              required
            >
              <option value="">Selecione a Unidade...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>Apto {u.number} ({u.block_name || 'Bloco'})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Transportadora ou Entregador *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Mercado Livre, Amazon, Jadlog, Correios..."
              value={newForm.courier}
              onChange={(e) => setNewForm({ ...newForm, courier: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Código de Rastreio (Opcional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: BR123456789"
              value={newForm.tracking_code}
              onChange={(e) => setNewForm({ ...newForm, tracking_code: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Descrição do Pacote</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Caixa média, envelope de documentos..."
              value={newForm.description}
              onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Registrar e Gerar PIN</button>
          </div>
        </form>
      </Modal>

      {/* Modal Baixa com PIN e Keypad Interativo */}
      <Modal isOpen={isPickupModalOpen} onClose={() => setIsPickupModalOpen(false)} title="Liberar Pacote por PIN">
        <form onSubmit={handlePickup}>
          {errorMsg && <div className="badge badge-danger" style={{ marginBottom: 16, width: '100%' }}>{errorMsg}</div>}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              Digite o PIN informado pelo morador do <strong>Apto {selectedDelivery?.unit_number}</strong>:
            </p>
            <div
              style={{
                fontSize: '2.2rem',
                fontFamily: 'monospace',
                fontWeight: 800,
                letterSpacing: '12px',
                padding: '12px',
                background: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                marginTop: '10px',
                color: 'var(--primary)'
              }}
            >
              {pickupForm.pickup_code.padEnd(4, '•')}
            </div>
          </div>

          {/* Teclado Virtual Numérico Tátil */}
          <div className="pin-keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'DEL'].map((k, idx) => (
              k === '' ? <div key={idx} /> : (
                <button
                  key={k}
                  type="button"
                  className="pin-key"
                  onClick={() => handleKeypadPress(k)}
                >
                  {k}
                </button>
              )
            ))}
          </div>

          <div className="form-group" style={{ marginTop: '14px' }}>
            <label>Retirado por (Opcional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Próprio morador, familiar..."
              value={pickupForm.picked_up_by}
              onChange={(e) => setPickupForm({ ...pickupForm, picked_up_by: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPickupModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-success" disabled={pickupForm.pickup_code.length !== 4}>
              Confirmar e Liberar Pacote
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
