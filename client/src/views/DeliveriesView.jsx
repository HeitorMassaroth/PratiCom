import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  CheckCircle, 
  Key, 
  Send, 
  X, 
  Filter,
  CheckCircle2,
  Clock,
  Building,
  Pencil,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';

const EMPTY_DELIVERY = {
  unit_id: '',
  resident_id: '',
  courier: 'Mercado Livre',
  tracking_code: '',
  description: '',
  notes: ''
};

export default function DeliveriesView({ showToast }) {
  const [deliveries, setDeliveries] = useState([]);
  const [units, setUnits] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Estados de seleção
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [pickupPinInput, setPickupPinInput] = useState('');
  const [pickedUpByInput, setPickedUpByInput] = useState('');
  const [cancelReasonInput, setCancelReasonInput] = useState('');

  // null = criando, objeto = editando
  const [editingDelivery, setEditingDelivery] = useState(null);

  // Form de encomenda
  const [formData, setFormData] = useState(EMPTY_DELIVERY);

  // Form de edição
  const [editFormData, setEditFormData] = useState({
    id: null,
    unit_id: '',
    resident_id: '',
    courier: '',
    tracking_code: '',
    description: '',
    notes: '',
    picked_up_by: ''
  });

  const isPending = (status) => ['pending', 'PENDING', 'RECEBIDA'].includes(status);
  const isDelivered = (status) => ['delivered', 'DELIVERED', 'PICKED_UP', 'ENTREGUE'].includes(status);
  const isCancelled = (status) => ['cancelled', 'CANCELLED', 'CANCELADA'].includes(status);

  const loadData = async () => {
    try {
      setLoading(true);
      const [delRes, unitRes, resRes] = await Promise.all([
        api.getDeliveries({ status: statusFilter }),
        api.getUnits(),
        api.getResidents()
      ]);
      setDeliveries(delRes);
      setUnits(unitRes);
      setResidents(resRes);
    } catch (err) {
      showToast('Erro ao carregar encomendas', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const openCreateModal = () => {
    setEditingDelivery(null);
    setFormData(EMPTY_DELIVERY);
    setIsNewModalOpen(true);
  };

  const openEditModal = (pkg) => {
    setEditingDelivery(pkg);
    setFormData({
      unit_id: String(pkg.unit_id),
      resident_id: pkg.resident_id ? String(pkg.resident_id) : '',
      courier: pkg.courier || 'Mercado Livre',
      tracking_code: pkg.tracking_code || '',
      description: pkg.description || '',
      notes: pkg.notes || ''
    });
    setIsNewModalOpen(true);
  };

  const closeDeliveryModal = () => {
    setIsNewModalOpen(false);
    setEditingDelivery(null);
    setFormData(EMPTY_DELIVERY);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.unit_id || !formData.courier) {
      showToast('Preencha os campos obrigatórios.', 'warning');
      return;
    }
    try {
      if (editingDelivery) {
        await api.updateDelivery(editingDelivery.id, formData);
        showToast('Encomenda atualizada com sucesso!', 'success');
      } else {
        const created = await api.createDelivery(formData);
        showToast(`Encomenda cadastrada! PIN de retirada gerado: ${created.pickup_code}`, 'success');
      }
      closeDeliveryModal();
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar encomenda.', 'danger');
    }
  };

  const handleDelete = async (pkg) => {
    if (!window.confirm(`Deseja realmente excluir a encomenda ${pkg.courier} do ${pkg.block} - Apto ${pkg.unit_number}?`)) return;
    try {
      await api.deleteDelivery(pkg.id);
      showToast('Encomenda excluída.', 'info');
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao excluir encomenda.', 'danger');
    }
  };

  const handlePickup = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    try {
      await api.pickupDelivery(selectedDelivery.id, {
        pickup_code: pickupPinInput,
        picked_up_by: pickedUpByInput || 'Morador'
      });
      showToast('Encomenda entregue e retirada confirmada!', 'success');
      setIsPickupModalOpen(false);
      setSelectedDelivery(null);
      setPickupPinInput('');
      setPickedUpByInput('');
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao confirmar retirada. Verifique o PIN.', 'danger');
    }
  };

  const openEditModal = (pkg) => {
    setSelectedDelivery(pkg);
    setEditFormData({
      id: pkg.id,
      unit_id: pkg.unit_id || '',
      resident_id: pkg.resident_id || '',
      courier: pkg.courier || 'Mercado Livre',
      tracking_code: pkg.tracking_code || '',
      description: pkg.description || '',
      notes: pkg.notes || '',
      picked_up_by: pkg.picked_up_by || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editFormData.id) return;
    try {
      await api.updateDelivery(editFormData.id, editFormData);
      showToast('Encomenda atualizada com sucesso!', 'success');
      setIsEditModalOpen(false);
      setSelectedDelivery(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar encomenda.', 'danger');
    }
  };

  const openCancelModal = (pkg) => {
    setSelectedDelivery(pkg);
    setCancelReasonInput('');
    setIsCancelModalOpen(true);
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;
    if (!cancelReasonInput.trim()) {
      showToast('Informe o motivo do cancelamento.', 'warning');
      return;
    }
    try {
      await api.cancelDelivery(selectedDelivery.id, {
        reason: cancelReasonInput.trim(),
        cancelled_by: 'Portaria'
      });
      showToast('Encomenda cancelada com sucesso.', 'info');
      setIsCancelModalOpen(false);
      setSelectedDelivery(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao cancelar encomenda.', 'danger');
    }
  };

  const handleDelete = async () => {
    if (!selectedDelivery) return;
    if (!window.confirm('Tem certeza que deseja excluir definitivamente este registro do banco de dados?')) {
      return;
    }
    try {
      await api.deleteDelivery(selectedDelivery.id);
      showToast('Registro excluído com sucesso.', 'success');
      setIsCancelModalOpen(false);
      setSelectedDelivery(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao excluir registro.', 'danger');
    }
  };

  const filteredDeliveries = deliveries.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.block?.toLowerCase().includes(term) ||
      String(item.unit_number)?.toLowerCase().includes(term) ||
      item.resident_name?.toLowerCase().includes(term) ||
      item.courier?.toLowerCase().includes(term) ||
      item.tracking_code?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.pickup_code?.toLowerCase().includes(term)
    );
  });

  const availableResidentsForNew = formData.unit_id 
    ? residents.filter(r => r.unit_id === parseInt(formData.unit_id, 10))
    : [];

  const availableResidentsForEdit = editFormData.unit_id 
    ? residents.filter(r => r.unit_id === parseInt(editFormData.unit_id, 10))
    : [];

  return (
    <div>
      {/* Barra de Ações Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ width: '280px' }}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Buscar unidade, código, PIN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="form-control" 
            style={{ width: '190px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="pending">Aguardando Retirada</option>
            <option value="delivered">Já Entregues</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>

        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Registrar Recebimento de Pacote
        </button>
      </div>

      {/* Tabela de Encomendas */}
      <div className="card">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Unidade / Morador</th>
                <th>Transportadora</th>
                <th>Descrição / Rastreio</th>
                <th>Recebido em</th>
                <th>PIN de Retirada</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>Carregando encomendas...</td></tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Nenhuma encomenda encontrada.</td></tr>
              ) : (
                filteredDeliveries.map((pkg) => {
                  const pending = isPending(pkg.status);
                  const delivered = isDelivered(pkg.status);
                  const cancelled = isCancelled(pkg.status);

                  return (
                    <tr key={pkg.id}>
                      <td>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{pkg.block} - Apto {pkg.unit_number}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pkg.resident_name || 'Destinatário Geral'}</div>
                      </td>
                      <td>
                        <span className="badge badge-purple">{pkg.courier}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{pkg.description || 'Pacote sem descrição'}</div>
                        {pkg.tracking_code && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                            Cod: {pkg.tracking_code}
                          </div>
                        )}
                        {pkg.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                            Obs: {pkg.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{new Date(pkg.received_at).toLocaleDateString('pt-BR')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {new Date(pkg.received_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{new Date(pkg.received_at).toLocaleDateString('pt-BR')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(pkg.received_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontWeight: '700',
                        color: '#60a5fa'
                      }}>
                        <Key size={14} /> {pkg.pickup_code}
                      </div>
                    </td>
                    <td>
                      {pkg.status === 'pending' ? (
                        <span className="badge badge-warning">
                          <Clock size={12} /> Aguardando Retirada
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> Retirado em {new Date(pkg.picked_up_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {pkg.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            title="Simular Notificação WhatsApp"
                            onClick={() => showToast(`Notificação enviada ao morador da unidade ${pkg.block} - ${pkg.unit_number} com PIN: ${pkg.pickup_code}`, 'info')}
                          >
                            <Send size={14} /> Notificar
                          </button>
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              setSelectedDelivery(pkg);
                              setIsPickupModalOpen(true);
                            }}
                          >
                            <CheckCircle size={14} /> Dar Baixa
                          </button>
                          <button
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '4px' }}
                            title="Editar encomenda"
                            onClick={() => openEditModal(pkg)}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                            title="Excluir encomenda"
                            onClick={() => handleDelete(pkg)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            Por: {pkg.picked_up_by || 'Morador'}
                          </span>
                          <button
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                            title="Excluir encomenda"
                            onClick={() => handleDelete(pkg)}
                          >
                            <Trash2 size={15} />
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
      </div>

      {/* Modal: Novo Recebimento de Pacote */}
      {isNewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingDelivery
                  ? <><Pencil size={20} color="var(--accent-primary)" /> Editar Encomenda</>
                  : <><Package size={20} color="var(--accent-primary)" /> Registrar Encomenda</>
                }
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={closeDeliveryModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Unidade de Destino *</label>
                  <select 
                    className="form-control" 
                    required
                    value={formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value, resident_id: '' })}
                  >
                    <option value="">Selecione o Apartamento</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.block} - Apto {u.number}</option>
                    ))}
                  </select>
                </div>

                {formData.unit_id && (
                  <div className="form-group">
                    <label>Morador Destinatário (Opcional)</label>
                    <select 
                      className="form-control"
                      value={formData.resident_id}
                      onChange={(e) => setFormData({ ...formData, resident_id: e.target.value })}
                    >
                      <option value="">Morador / Toda Unidade</option>
                      {availableResidentsForNew.map((r) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Empresa / Transportadora *</label>
                    <select 
                      className="form-control"
                      value={formData.courier}
                      onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
                    >
                      <option value="Mercado Livre">Mercado Livre</option>
                      <option value="Amazon Brasil">Amazon Brasil</option>
                      <option value="Correios (SEDEX / PAC)">Correios</option>
                      <option value="Shopee">Shopee</option>
                      <option value="Magalu">Magalu</option>
                      <option value="iFood">iFood</option>
                      <option value="Transportadora Jadlog">Jadlog</option>
                      <option value="Outra Transportadora">Outra</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Código de Rastreio</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: BR123456789" 
                      value={formData.tracking_code}
                      onChange={(e) => setFormData({ ...formData, tracking_code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Descrição do Pacote / Volume</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: Caixa média Mercado Livre, Envelope lacrado..." 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Observações da Portaria</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    placeholder="Ex: Deixado na gaveta 3 da portaria"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeDeliveryModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDelivery ? 'Salvar Alterações' : 'Registrar e Gerar PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Informações da Encomenda */}
      {isEditModalOpen && selectedDelivery && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} color="var(--accent-primary)" /> Editar Encomenda #{selectedDelivery.id}
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                {isDelivered(selectedDelivery.status) ? (
                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.85rem' }}>
                    <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    Esta encomenda já foi retirada. Para preservar a integridade histórica, apenas observações e o nome de quem retirou podem ser ajustados.
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Unidade de Destino *</label>
                      <select 
                        className="form-control" 
                        required
                        value={editFormData.unit_id}
                        onChange={(e) => setEditFormData({ ...editFormData, unit_id: e.target.value, resident_id: '' })}
                      >
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>{u.block} - Apto {u.number}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Morador Destinatário (Opcional)</label>
                      <select 
                        className="form-control"
                        value={editFormData.resident_id}
                        onChange={(e) => setEditFormData({ ...editFormData, resident_id: e.target.value })}
                      >
                        <option value="">Morador / Toda Unidade</option>
                        {availableResidentsForEdit.map((r) => (
                          <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Empresa / Transportadora *</label>
                        <select 
                          className="form-control"
                          value={editFormData.courier}
                          onChange={(e) => setEditFormData({ ...editFormData, courier: e.target.value })}
                        >
                          <option value="Mercado Livre">Mercado Livre</option>
                          <option value="Amazon Brasil">Amazon Brasil</option>
                          <option value="Correios (SEDEX / PAC)">Correios</option>
                          <option value="Shopee">Shopee</option>
                          <option value="Magalu">Magalu</option>
                          <option value="iFood">iFood</option>
                          <option value="Transportadora Jadlog">Jadlog</option>
                          <option value="Outra Transportadora">Outra</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Código de Rastreio</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Ex: BR123456789" 
                          value={editFormData.tracking_code}
                          onChange={(e) => setEditFormData({ ...editFormData, tracking_code: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Descrição do Pacote / Volume</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ex: Caixa média Mercado Livre..." 
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {isDelivered(selectedDelivery.status) && (
                  <div className="form-group">
                    <label>Retirado por</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={editFormData.picked_up_by}
                      onChange={(e) => setEditFormData({ ...editFormData, picked_up_by: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Observações da Portaria</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    placeholder="Ex: Deixado na gaveta 3 da portaria"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Cancelamento / Exclusão */}
      {isCancelModalOpen && selectedDelivery && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ban size={20} color="var(--accent-danger)" /> Cancelar Encomenda #{selectedDelivery.id}
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsCancelModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCancel}>
              <div className="modal-body">
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{selectedDelivery.block} - Apto {selectedDelivery.unit_number}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedDelivery.courier} • {selectedDelivery.description || 'Sem descrição'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>PIN de retirada: {selectedDelivery.pickup_code}</div>
                </div>

                <div className="form-group">
                  <label>Motivo do Cancelamento *</label>
                  <textarea 
                    className="form-control"
                    required
                    rows="3"
                    placeholder="Ex: Encomenda recusada pelo morador, pacote violado devolvido à transportadora, cadastro duplicado..."
                    value={cancelReasonInput}
                    onChange={(e) => setCancelReasonInput(e.target.value)}
                  ></textarea>
                  <small style={{ color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                    O cancelamento é mantido no histórico de segurança e auditoria do condomínio.
                  </small>
                </div>
              </div>

              <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  style={{ color: 'var(--accent-danger)' }}
                  onClick={handleDelete}
                  title="Remove definitivamente do banco de dados (apenas para erros de digitação imediatos)"
                >
                  <Trash2 size={14} /> Excluir Registro
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsCancelModalOpen(false)}>
                    Fechar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--accent-danger)', borderColor: 'var(--accent-danger)' }}>
                    Confirmar Cancelamento
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Baixa / Retirada */}
      {isPickupModalOpen && selectedDelivery && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} color="var(--accent-success)" /> Baixa de Encomenda
              </h3>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsPickupModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePickup}>
              <div className="modal-body">
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
                  <div style={{ fontWeight: '700', fontSize: '1rem' }}>{selectedDelivery.block} - Apto {selectedDelivery.unit_number}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Morador: {selectedDelivery.resident_name || 'Qualquer morador da unidade'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginTop: '4px' }}>{selectedDelivery.courier} • {selectedDelivery.description}</div>
                </div>

                <div className="form-group">
                  <label>Digite o PIN de Retirada (4 Dígitos do Morador) *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="Ex: 7492"
                    maxLength={4}
                    style={{ fontSize: '1.4rem', letterSpacing: '0.3em', textAlign: 'center', fontWeight: 'bold' }}
                    value={pickupPinInput}
                    onChange={(e) => setPickupPinInput(e.target.value)}
                  />
                  <small style={{ color: 'var(--text-dim)', display: 'block', marginTop: '6px' }}>
                    O morador recebeu este código no aviso de entrega. PIN de teste: <strong>{selectedDelivery.pickup_code}</strong>
                  </small>
                </div>

                <div className="form-group">
                  <label>Nome de quem está retirando na portaria</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ex: O próprio morador, filho, funcionário..." 
                    value={pickedUpByInput}
                    onChange={(e) => setPickedUpByInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsPickupModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  Confirmar Entrega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
