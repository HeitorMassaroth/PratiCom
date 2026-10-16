import React, { useState, useEffect } from 'react';
import { Users, Car, Plus, Trash2, Search, Check, Shield } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

export default function ResidentsView() {
  const [activeSubTab, setActiveSubTab] = useState('residents');
  const [residents, setResidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState('');

  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [isVehModalOpen, setIsVehModalOpen] = useState(false);

  const [resForm, setResForm] = useState({ unit_id: '', name: '', email: '', phone: '', cpf: '', role: 'Proprietário', emergency_contact: '' });
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
      setResForm({ unit_id: '', name: '', email: '', phone: '', cpf: '', role: 'Proprietário', emergency_contact: '' });
      showToast('Morador cadastrado com sucesso.');
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
      showToast('Veículo cadastrado e autorizado com sucesso.');
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteResident = async (id) => {
    if (!confirm('Deseja realmente remover o registro deste morador?')) return;
    try {
      await api.delete(`/residents/${id}`);
      showToast('Registro de morador removido.', 'info');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!confirm('Deseja realmente remover a autorização deste veículo?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      showToast('Veículo desautorizado.', 'info');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredResidents = residents.filter((r) => {
    const term = search.toLowerCase();
    return (
      r.name?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.cpf?.includes(term) ||
      r.unit_number?.toString().includes(term)
    );
  });

  const filteredVehicles = vehicles.filter((v) => {
    const term = search.toLowerCase();
    return (
      v.plate?.toLowerCase().includes(term) ||
      v.model?.toLowerCase().includes(term) ||
      v.unit_number?.toString().includes(term) ||
      v.resident_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Moradores, Unidades & Frotas</h1>
          <p>Cadastro oficial de condôminos, inquilinos, frotas veiculares e identificação predial.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeSubTab === 'residents' ? (
            <button className="btn btn-primary" onClick={() => setIsResModalOpen(true)}>
              <Plus size={16} />
              <span>Novo Morador</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsVehModalOpen(true)}>
              <Plus size={16} />
              <span>Cadastrar Veículo</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Abas Segmentadas & Barra de Busca */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div className="segmented-tabs">
          <button
            className={`segmented-tab ${activeSubTab === 'residents' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('residents')}
          >
            <Users size={15} />
            <span>Moradores Cadastrados ({residents.length})</span>
          </button>
          <button
            className={`segmented-tab ${activeSubTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('vehicles')}
          >
            <Car size={15} />
            <span>Frotas de Veículos ({vehicles.length})</span>
          </button>
        </div>

        <div style={{ position: 'relative', width: '340px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-control"
            placeholder={activeSubTab === 'residents' ? "Buscar por nome, CPF ou unidade..." : "Buscar por placa, modelo ou unidade..."}
            style={{ paddingLeft: '36px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Visualização de Moradores */}
      {activeSubTab === 'residents' && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome Completo</th>
                <th>Unidade / Bloco</th>
                <th>Contato Principal</th>
                <th>CPF</th>
                <th>Papel Legal</th>
                <th>Contato de Emergência</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Nenhum morador localizado com o termo pesquisado.
                  </td>
                </tr>
              ) : (
                filteredResidents.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.email || 'Sem e-mail cadastrado'}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>Unidade {r.unit_number}</span>
                      {r.block_name && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.block_name}</div>
                      )}
                    </td>
                    <td className="num-cell">{r.phone || '—'}</td>
                    <td className="num-cell" style={{ color: 'var(--text-muted)' }}>{r.cpf || '—'}</td>
                    <td>
                      <span className={`badge ${r.role === 'Proprietário' ? 'badge-primary' : r.role === 'Inquilino' ? 'badge-info' : 'badge-neutral'}`}>
                        {r.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.emergency_contact || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-icon"
                        style={{ width: 28, height: 28, display: 'inline-flex' }}
                        onClick={() => handleDeleteResident(r.id)}
                        title="Remover morador"
                      >
                        <Trash2 size={14} color="var(--danger)" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Visualização de Veículos */}
      {activeSubTab === 'vehicles' && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Placa Mercosul</th>
                <th>Modelo & Marca</th>
                <th>Cor</th>
                <th>Categoria</th>
                <th>Vaga Demarcada</th>
                <th>Unidade / Morador</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Nenhum veículo localizado.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div className="license-plate">
                        <div className="license-plate-header">BRASIL</div>
                        <div className="license-plate-number">{v.plate}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{v.model}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{v.color || 'Não informada'}</td>
                    <td>
                      <span className="badge badge-neutral">{v.type || 'Carro'}</span>
                    </td>
                    <td>
                      <span className="num-cell" style={{ fontWeight: 600 }}>{v.parking_spot || 'Livre'}</span>
                    </td>
                    <td>
                      <div>Unidade {v.unit_number} {v.block_name ? `• ${v.block_name}` : ''}</div>
                      {v.resident_name && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Condutor: {v.resident_name}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-icon"
                        style={{ width: 28, height: 28, display: 'inline-flex' }}
                        onClick={() => handleDeleteVehicle(v.id)}
                        title="Remover autorização de veículo"
                      >
                        <Trash2 size={14} color="var(--danger)" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Novo Morador */}
      <Modal isOpen={isResModalOpen} onClose={() => setIsResModalOpen(false)} title="Cadastrar Morador">
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreateResident}>
          <div className="form-group">
            <label>Unidade Habitacional <span className="required">*</span></label>
            <select
              className="form-control"
              required
              value={resForm.unit_id}
              onChange={(e) => setResForm({ ...resForm, unit_id: e.target.value })}
            >
              <option value="">Selecione o apartamento...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  Unidade {u.number} {u.block_name ? `(${u.block_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Nome Completo <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="Ex: Carlos Eduardo Santos"
                value={resForm.name}
                onChange={(e) => setResForm({ ...resForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Papel Legal <span className="required">*</span></label>
              <select
                className="form-control"
                value={resForm.role}
                onChange={(e) => setResForm({ ...resForm, role: e.target.value })}
              >
                <option value="Proprietário">Proprietário</option>
                <option value="Inquilino">Inquilino</option>
                <option value="Dependente">Dependente</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>E-mail</label>
              <input
                type="email"
                className="form-control"
                placeholder="carlos@email.com"
                value={resForm.email}
                onChange={(e) => setResForm({ ...resForm, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Telefone / WhatsApp</label>
              <input
                type="text"
                className="form-control"
                placeholder="(41) 99999-0000"
                value={resForm.phone}
                onChange={(e) => setResForm({ ...resForm, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>CPF (apenas dígitos)</label>
              <input
                type="text"
                className="form-control"
                placeholder="123.456.789-00"
                value={resForm.cpf}
                onChange={(e) => setResForm({ ...resForm, cpf: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Contato de Emergência</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Esposa: (41) 98888-1111"
                value={resForm.emergency_contact}
                onChange={(e) => setResForm({ ...resForm, emergency_contact: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsResModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Salvar Cadastro</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Novo Veículo */}
      <Modal isOpen={isVehModalOpen} onClose={() => setIsVehModalOpen(false)} title="Cadastrar Veículo">
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreateVehicle}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Unidade Titular <span className="required">*</span></label>
              <select
                className="form-control"
                required
                value={vehForm.unit_id}
                onChange={(e) => setVehForm({ ...vehForm, unit_id: e.target.value })}
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
              <label>Placa do Veículo (Mercosul) <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                required
                maxLength={8}
                placeholder="Ex: ABC1D23"
                value={vehForm.plate}
                onChange={(e) => setVehForm({ ...vehForm, plate: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Marca & Modelo <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="Ex: Honda Civic, Jeep Compass"
                value={vehForm.model}
                onChange={(e) => setVehForm({ ...vehForm, model: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Cor Predominante</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Prata, Preto, Branco"
                value={vehForm.color}
                onChange={(e) => setVehForm({ ...vehForm, color: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Categoria</label>
              <select
                className="form-control"
                value={vehForm.type}
                onChange={(e) => setVehForm({ ...vehForm, type: e.target.value })}
              >
                <option value="Carro">Carro</option>
                <option value="Moto">Moto</option>
                <option value="SUV">SUV</option>
                <option value="Caminhonete">Caminhonete</option>
              </select>
            </div>
            <div className="form-group">
              <label>Vaga de Garagem</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Vaga G1-04"
                value={vehForm.parking_spot}
                onChange={(e) => setVehForm({ ...vehForm, parking_spot: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsVehModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Autorizar Veículo</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
