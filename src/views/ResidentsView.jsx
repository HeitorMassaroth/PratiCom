import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Car, 
  Plus, 
  Trash2, 
  Search, 
  Check, 
  Shield, 
  MessageSquare, 
  ExternalLink,
  Heart,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

export default function ResidentsView() {
  const [activeSubTab, setActiveSubTab] = useState('residents'); // 'residents', 'vehicles', 'pets'
  const [residents, setResidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [pets, setPets] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState('');

  // Modais
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [isVehModalOpen, setIsVehModalOpen] = useState(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);

  const [resForm, setResForm] = useState({ unit_id: '', name: '', email: '', phone: '', cpf: '', role: 'Proprietário', emergency_contact: '' });
  const [vehForm, setVehForm] = useState({ unit_id: '', plate: '', model: '', color: '', type: 'Carro', parking_spot: '' });
  const [petForm, setPetForm] = useState({ unit_id: '', name: '', species: 'Cão', breed: '', size: 'Médio', vaccine_status: 'VACCINATED', vaccine_date: new Date().toISOString().split('T')[0], notes: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = () => {
    Promise.all([
      api.get('/residents'), 
      api.get('/vehicles'), 
      api.get('/pets').catch(() => []), 
      api.get('/units')
    ])
      .then(([resData, vehData, petData, unitData]) => {
        setResidents(resData || []);
        setVehicles(vehData || []);
        setPets(petData || []);
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

  const handleCreatePet = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/pets', petForm);
      setIsPetModalOpen(false);
      setPetForm({ unit_id: '', name: '', species: 'Cão', breed: '', size: 'Médio', vaccine_status: 'VACCINATED', vaccine_date: new Date().toISOString().split('T')[0], notes: '' });
      showToast('Pet cadastrado no censo condominial.');
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

  const handleDeletePet = async (id) => {
    if (!confirm('Deseja realmente remover o cadastro deste animal de estimação?')) return;
    try {
      await api.delete(`/pets/${id}`);
      showToast('Registro de pet removido.', 'info');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredResidents = residents.filter((r) => {
    const term = search.toLowerCase();
    return (
      (r.name || '').toLowerCase().includes(term) ||
      (r.email || '').toLowerCase().includes(term) ||
      (r.cpf || '').includes(term) ||
      String(r.unit_number || '').includes(term)
    );
  });

  const filteredVehicles = vehicles.filter((v) => {
    const term = search.toLowerCase();
    return (
      (v.plate || '').toLowerCase().includes(term) ||
      (v.model || '').toLowerCase().includes(term) ||
      String(v.unit_number || '').includes(term) ||
      (v.resident_name || '').toLowerCase().includes(term)
    );
  });

  const filteredPets = pets.filter((p) => {
    const term = search.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(term) ||
      (p.breed || '').toLowerCase().includes(term) ||
      (p.species || '').toLowerCase().includes(term) ||
      String(p.unit_number || '').includes(term) ||
      (p.resident_name || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>Moradores, Unidades & Frotas</h1>
            <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={11} /> Censo Completo
            </span>
          </div>
          <p>Cadastro oficial de condôminos, inquilinos, frotas veiculares autorizadas e censo de animais de estimação.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeSubTab === 'residents' && (
            <button className="btn btn-primary" onClick={() => setIsResModalOpen(true)}>
              <Plus size={16} />
              <span>Novo Morador</span>
            </button>
          )}
          {activeSubTab === 'vehicles' && (
            <button className="btn btn-primary" onClick={() => setIsVehModalOpen(true)}>
              <Plus size={16} />
              <span>Cadastrar Veículo</span>
            </button>
          )}
          {activeSubTab === 'pets' && (
            <button className="btn btn-primary" onClick={() => setIsPetModalOpen(true)}>
              <Plus size={16} />
              <span>Cadastrar Pet</span>
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
            <span>Moradores ({residents.length})</span>
          </button>
          <button
            className={`segmented-tab ${activeSubTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('vehicles')}
          >
            <Car size={15} />
            <span>Frotas de Veículos ({vehicles.length})</span>
          </button>
          <button
            className={`segmented-tab ${activeSubTab === 'pets' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('pets')}
          >
            <Heart size={15} />
            <span>Pets & Vacinas ({pets.length})</span>
          </button>
        </div>

        <div style={{ position: 'relative', width: '340px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-control"
            placeholder={
              activeSubTab === 'residents' ? "Buscar por nome, CPF ou unidade..." :
              activeSubTab === 'vehicles' ? "Buscar por placa, modelo ou unidade..." :
              "Buscar por pet, raça, dono ou apartamento..."
            }
            style={{ paddingLeft: '36px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Sub-Aba 1: Moradores */}
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
                    <td className="num-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{r.phone || '—'}</span>
                        {r.phone && (
                          <a
                            href={`https://wa.me/55${r.phone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(r.name)},%20mensagem%20da%20administração%20do%20condomínio`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm"
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '2px 7px',
                              fontSize: '0.72rem',
                              borderRadius: 'var(--radius-xs)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              textDecoration: 'none'
                            }}
                            title="Conversar via WhatsApp com o morador"
                          >
                            <MessageSquare size={11} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </td>
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

      {/* Sub-Aba 2: Veículos com Placa Mercosul */}
      {activeSubTab === 'vehicles' && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Placa Oficial</th>
                <th>Marca & Modelo</th>
                <th>Cor</th>
                <th>Categoria</th>
                <th>Unidade Titular</th>
                <th>Morador Vinculado</th>
                <th>Vaga Designada</th>
                <th style={{ textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Nenhum veículo localizado.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div className="mercosul-plate" title="Placa Padrão Mercosul Autêntica">
                        <div className="mercosul-header">
                          <span className="mercosul-flag">🇧🇷</span>
                          <span className="mercosul-country">BRASIL</span>
                        </div>
                        <div className="mercosul-code">{v.plate}</div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{v.model}</span>
                    </td>
                    <td>{v.color || '—'}</td>
                    <td>
                      <span className="badge badge-neutral">{v.type}</span>
                    </td>
                    <td>Unidade {v.unit_number}</td>
                    <td style={{ fontSize: '0.84rem' }}>{v.resident_name || '—'}</td>
                    <td>
                      <span className="badge badge-info">{v.parking_spot || 'Livre'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-icon"
                        style={{ width: 28, height: 28, display: 'inline-flex' }}
                        onClick={() => handleDeleteVehicle(v.id)}
                        title="Desautorizar veículo"
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

      {/* Sub-Aba 3: Animais de Estimação (Pets & Vacinas) */}
      {activeSubTab === 'pets' && (
        <div>
          <div className="pets-cards-grid">
            {filteredPets.length === 0 ? (
              <div className="erp-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Nenhum animal de estimação cadastrado com o termo pesquisado.
              </div>
            ) : (
              filteredPets.map((pet) => {
                const isVaccinated = pet.vaccine_status === 'VACCINATED';
                const petEmoji = pet.species === 'Gato' ? '🐱' : pet.species === 'Ave' ? '🦜' : '🐶';
                return (
                  <div key={pet.id} className="pet-profile-card">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div className="pet-avatar-wrapper">
                            <span>{petEmoji}</span>
                          </div>
                          <div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{pet.name}</h3>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {pet.breed || 'SRD'} • Porte {pet.size}
                            </div>
                          </div>
                        </div>

                        <button
                          className="btn-icon"
                          style={{ width: 28, height: 28 }}
                          onClick={() => handleDeletePet(pet.id)}
                          title="Remover cadastro do pet"
                        >
                          <Trash2 size={13} color="var(--danger)" />
                        </button>
                      </div>

                      <div style={{ background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-dim)' }}>Tutor / Responsável:</span>
                          <span style={{ fontWeight: 600 }}>{pet.resident_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-dim)' }}>Apartamento:</span>
                          <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>Apto {pet.unit_number}</span>
                        </div>
                      </div>

                      {pet.notes && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 12px 0' }}>
                          Obs: {pet.notes}
                        </p>
                      )}
                    </div>

                    <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`badge ${isVaccinated ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {isVaccinated ? <ShieldCheck size={12} /> : <AlertCircle size={12} />}
                        <span>{isVaccinated ? 'Antirrábica em Dia' : 'Vacina Pendente'}</span>
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Dose: {pet.vaccine_date || '—'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Novo Morador */}
      <Modal isOpen={isResModalOpen} onClose={() => setIsResModalOpen(false)} title="Cadastrar Morador Oficial">
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
      <Modal isOpen={isVehModalOpen} onClose={() => setIsVehModalOpen(false)} title="Cadastrar Veículo Autorizado">
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

      {/* Modal 3: Novo Pet */}
      <Modal isOpen={isPetModalOpen} onClose={() => setIsPetModalOpen(false)} title="Cadastrar Animal de Estimação (Pet)">
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreatePet}>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Unidade Habitacional <span className="required">*</span></label>
              <select
                className="form-control"
                required
                value={petForm.unit_id}
                onChange={(e) => setPetForm({ ...petForm, unit_id: e.target.value })}
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
              <label>Nome do Pet <span className="required">*</span></label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="Ex: Thor, Mel, Pipoca"
                value={petForm.name}
                onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>Espécie <span className="required">*</span></label>
              <select
                className="form-control"
                value={petForm.species}
                onChange={(e) => setPetForm({ ...petForm, species: e.target.value })}
              >
                <option value="Cão">Cão (Cachorro)</option>
                <option value="Gato">Gato</option>
                <option value="Ave">Ave</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Raça</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Golden, Siamês, SRD"
                value={petForm.breed}
                onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Porte</label>
              <select
                className="form-control"
                value={petForm.size}
                onChange={(e) => setPetForm({ ...petForm, size: e.target.value })}
              >
                <option value="Pequeno">Pequeno (até 10kg)</option>
                <option value="Médio">Médio (11 a 25kg)</option>
                <option value="Grande">Grande (acima de 25kg)</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Vacina Antirrábica</label>
              <select
                className="form-control"
                value={petForm.vaccine_status}
                onChange={(e) => setPetForm({ ...petForm, vaccine_status: e.target.value })}
              >
                <option value="VACCINATED">Em Dia (Comprovada)</option>
                <option value="PENDING">Pendente de Atualização</option>
              </select>
            </div>
            <div className="form-group">
              <label>Data da Última Vacinação</label>
              <input
                type="date"
                className="form-control"
                value={petForm.vaccine_date}
                onChange={(e) => setPetForm({ ...petForm, vaccine_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Observações de Convivência</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Animal calmo, transita apenas de guia na coleira"
              value={petForm.notes}
              onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPetModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Cadastrar Pet</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
