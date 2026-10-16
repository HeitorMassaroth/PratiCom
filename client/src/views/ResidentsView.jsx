import React, { useState, useEffect } from 'react';
import { Users, Car, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function ResidentsView() {
  const [activeSubTab, setActiveSubTab] = useState('residents');
  const [residents, setResidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [units, setUnits] = useState([]);

  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [isVehModalOpen, setIsVehModalOpen] = useState(false);

  const [resForm, setResForm] = useState({ unit_id: '', name: '', email: '', phone: '', cpf: '', role: 'Proprietário' });
  const [vehForm, setVehForm] = useState({ unit_id: '', plate: '', model: '', color: '', type: 'Carro', parking_spot: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = () => {
    Promise.all([api.get('/residents'), api.get('/vehicles'), api.get('/units')])
      .then(([resData, vehData, unitData]) => {
        setResidents(resData || []);
        setVehicles(vehData || []);
        setUnits(unitData || []);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('condo-changed', loadData);
    return () => window.removeEventListener('condo-changed', loadData);
  }, []);

  const handleCreateResident = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/residents', resForm);
      setIsResModalOpen(false);
      setResForm({ unit_id: '', name: '', email: '', phone: '', cpf: '', role: 'Proprietário' });
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/vehicles', vehForm);
      setIsVehModalOpen(false);
      setVehForm({ unit_id: '', plate: '', model: '', color: '', type: 'Carro', parking_spot: '' });
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteResident = async (id) => {
    if (!confirm('Deseja realmente remover este morador?')) return;
    try {
      await api.delete(`/residents/${id}`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!confirm('Deseja realmente remover este veículo?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Moradores, Unidades & Veículos</h1>
          <p>Gestão unificada do cadastro de pessoas residentes e frotas de veículos.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeSubTab === 'residents' ? (
            <button className="btn btn-primary" onClick={() => setIsResModalOpen(true)}>
              <Plus size={18} />
              <span>Novo Morador</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsVehModalOpen(true)}>
              <Plus size={18} />
              <span>Cadastrar Veículo</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-abas */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          className={`btn ${activeSubTab === 'residents' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('residents')}
        >
          <Users size={18} />
          <span>Moradores ({residents.length})</span>
        </button>
        <button
          className={`btn ${activeSubTab === 'vehicles' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('vehicles')}
        >
          <Car size={18} />
          <span>Veículos ({vehicles.length})</span>
        </button>
      </div>

      {/* Tabela de Moradores */}
      {activeSubTab === 'residents' && (
        <div className="glass-card table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome Completo</th>
                <th>Unidade</th>
                <th>Contato</th>
                <th>CPF</th>
                <th>Vínculo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {residents.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td>Apto {r.unit_number} ({r.block_name})</td>
                  <td>
                    <div>{r.phone || '-'}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{r.email}</small>
                  </td>
                  <td>{r.cpf || '-'}</td>
                  <td>
                    <span className={`badge ${r.role === 'Proprietário' ? 'badge-primary' : 'badge-info'}`}>
                      {r.role}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDeleteResident(r.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabela de Veículos */}
      {activeSubTab === 'vehicles' && (
        <div className="glass-card table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Cor / Tipo</th>
                <th>Unidade / Morador</th>
                <th>Vaga Garagem</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: '1px', background: 'var(--bg-surface)', padding: '4px 10px', borderRadius: '4px' }}>
                      {v.plate}
                    </span>
                  </td>
                  <td><strong>{v.model}</strong></td>
                  <td>{v.color || '-'} ({v.type || 'Carro'})</td>
                  <td>Apto {v.unit_number} {v.resident_name && `• ${v.resident_name}`}</td>
                  <td>{v.parking_spot || '-'}</td>
                  <td>
                    <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDeleteVehicle(v.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Novo Morador */}
      <Modal isOpen={isResModalOpen} onClose={() => setIsResModalOpen(false)} title="Cadastrar Morador">
        <form onSubmit={handleCreateResident}>
          {errorMsg && <div className="badge badge-danger" style={{ marginBottom: 16, width: '100%' }}>{errorMsg}</div>}
          <div className="form-group">
            <label>Unidade Habitacional *</label>
            <select
              className="form-control"
              value={resForm.unit_id}
              onChange={(e) => setResForm({ ...resForm, unit_id: e.target.value })}
              required
            >
              <option value="">Selecione a Unidade...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>Apto {u.number} ({u.block_name || 'Bloco'})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Nome Completo *</label>
            <input
              type="text"
              className="form-control"
              value={resForm.name}
              onChange={(e) => setResForm({ ...resForm, name: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Telefone / WhatsApp</label>
              <input
                type="text"
                className="form-control"
                placeholder="(41) 99999-8888"
                value={resForm.phone}
                onChange={(e) => setResForm({ ...resForm, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Vínculo</label>
              <select className="form-control" value={resForm.role} onChange={(e) => setResForm({ ...resForm, role: e.target.value })}>
                <option value="Proprietário">Proprietário</option>
                <option value="Inquilino">Inquilino</option>
                <option value="Dependente">Dependente</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              className="form-control"
              value={resForm.email}
              onChange={(e) => setResForm({ ...resForm, email: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsResModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar Morador</button>
          </div>
        </form>
      </Modal>

      {/* Modal Novo Veículo */}
      <Modal isOpen={isVehModalOpen} onClose={() => setIsVehModalOpen(false)} title="Cadastrar Veículo">
        <form onSubmit={handleCreateVehicle}>
          {errorMsg && <div className="badge badge-danger" style={{ marginBottom: 16, width: '100%' }}>{errorMsg}</div>}
          <div className="form-group">
            <label>Unidade Vinculada *</label>
            <select
              className="form-control"
              value={vehForm.unit_id}
              onChange={(e) => setVehForm({ ...vehForm, unit_id: e.target.value })}
              required
            >
              <option value="">Selecione a Unidade...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>Apto {u.number} ({u.block_name || 'Bloco'})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Placa do Veículo (7 Dígitos) *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: BRA2E19"
                maxLength={8}
                value={vehForm.plate}
                onChange={(e) => setVehForm({ ...vehForm, plate: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="form-group">
              <label>Modelo do Veículo *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Jeep Compass"
                value={vehForm.model}
                onChange={(e) => setVehForm({ ...vehForm, model: e.target.value })}
                required
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Cor</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Prata"
                value={vehForm.color}
                onChange={(e) => setVehForm({ ...vehForm, color: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Vaga de Garagem</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: G1-02"
                value={vehForm.parking_spot}
                onChange={(e) => setVehForm({ ...vehForm, parking_spot: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsVehModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar Veículo</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
