import React, { useState, useEffect } from 'react';
import { Package, Plus, CheckCircle2, XCircle, KeyRound } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function DeliveriesView() {
  const [deliveries, setDeliveries] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Formulários
  const [newForm, setNewForm] = useState({ unit_id: '', courier: '', tracking_code: '', description: '' });
  const [pickupForm, setPickupForm] = useState({ pickup_code: '', picked_up_by: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([api.get('/deliveries'), api.get('/units')])
      .then(([delData, unitData]) => {
        setDeliveries(delData || []);
        setUnits(unitData || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
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
      await api.post('/deliveries', newForm);
      setIsNewModalOpen(false);
      setNewForm({ unit_id: '', courier: '', tracking_code: '', description: '' });
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
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Gestão de Encomendas na Portaria</h1>
          <p>Controle de recebimento de pacotes, rastreio e entrega segura por PIN.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
          <Plus size={18} />
          <span>Receber Pacote</span>
        </button>
      </div>

      <div className="glass-card table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Destinatário / Unidade</th>
              <th>Transportadora</th>
              <th>Código / Rastreio</th>
              <th>PIN Retirada</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Nenhuma encomenda cadastrada neste condomínio.
                </td>
              </tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d.id}>
                  <td>#{d.id}</td>
                  <td>
                    <strong>Apto {d.unit_number || d.unit_id}</strong>
                    {d.block_name && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>{d.block_name}</span>}
                  </td>
                  <td>{d.courier}</td>
                  <td>{d.tracking_code || '-'}</td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: '2px', background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: '4px' }}>
                      {d.pickup_code}
                    </span>
                  </td>
                  <td>
                    {d.status === 'PENDING' && <span className="badge badge-warning">Pendente</span>}
                    {d.status === 'PICKED_UP' && <span className="badge badge-success">Entregue</span>}
                    {d.status === 'CANCELLED' && <span className="badge badge-danger">Cancelada</span>}
                  </td>
                  <td>
                    {d.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => {
                            setSelectedDelivery(d);
                            setIsPickupModalOpen(true);
                          }}
                        >
                          <KeyRound size={14} />
                          <span>Baixar PIN</span>
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          onClick={() => handleCancel(d.id)}
                          title="Cancelar Encomenda"
                        >
                          <XCircle size={14} />
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

      {/* Modal de Nova Encomenda */}
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
            <label>Transportadora / Entregador *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Mercado Livre, Amazon, Correios..."
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
              placeholder="Ex: Caixa média, envelope..."
              value={newForm.description}
              onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Registrar e Gerar PIN</button>
          </div>
        </form>
      </Modal>

      {/* Modal de Baixa com PIN */}
      <Modal isOpen={isPickupModalOpen} onClose={() => setIsPickupModalOpen(false)} title="Confirmar Retirada de Encomenda">
        <form onSubmit={handlePickup}>
          {errorMsg && <div className="badge badge-danger" style={{ marginBottom: 16, width: '100%' }}>{errorMsg}</div>}
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Para liberar a entrega da encomenda #{selectedDelivery?.id}, insira o código PIN de 4 dígitos informado pelo morador.
          </p>
          <div className="form-group">
            <label>Código PIN de 4 Dígitos *</label>
            <input
              type="text"
              maxLength={4}
              className="form-control"
              placeholder="Ex: 4821"
              value={pickupForm.pickup_code}
              onChange={(e) => setPickupForm({ ...pickupForm, pickup_code: e.target.value })}
              style={{ fontSize: '1.4rem', textAlign: 'center', letterSpacing: '6px', fontWeight: 700 }}
              required
            />
          </div>
          <div className="form-group">
            <label>Nome de quem retirou (Opcional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Próprio morador, Cônjuge..."
              value={pickupForm.picked_up_by}
              onChange={(e) => setPickupForm({ ...pickupForm, picked_up_by: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPickupModalOpen(false)}>Voltar</button>
            <button type="submit" className="btn btn-success">Confirmar Baixa</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
