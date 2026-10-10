import React, { useEffect, useState } from 'react';
import { Building2, Plus, MapPin, Layers, Link2 } from 'lucide-react';
import { api } from '../services/api';

const emptyCondominium = { name: '', cnpj: '', address: '', city: '', state: '', postal_code: '', phone: '' };

export default function CondominiumsBlocksView({ showToast }) {
  const [condominiums, setCondominiums] = useState([]);
  const [selected, setSelected] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [pendingUnits, setPendingUnits] = useState([]);
  const [form, setForm] = useState(emptyCondominium);
  const [blockName, setBlockName] = useState('');
  const [legacyBlock, setLegacyBlock] = useState('');
  const [targetBlock, setTargetBlock] = useState('');

  const load = async () => {
    try {
      const [items, pending] = await Promise.all([api.getCondominiums(), api.getPendingUnits()]);
      setCondominiums(items); setPendingUnits(pending);
      const current = selected || items[0]?.id;
      if (current) { setSelected(String(current)); setBlocks(await api.getBlocks(current)); } else setBlocks([]);
    } catch (err) { showToast(err.message || 'Erro ao carregar condomínios.', 'danger'); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (selected) api.getBlocks(selected).then(setBlocks).catch(err => showToast(err.message, 'danger')); }, [selected]);

  const createCondominium = async (event) => {
    event.preventDefault();
    try { const created = await api.createCondominium(form); setForm(emptyCondominium); setSelected(String(created.id)); showToast('Condomínio cadastrado.', 'success'); await load(); }
    catch (err) { showToast(err.message, 'danger'); }
  };
  const createBlock = async (event) => {
    event.preventDefault();
    if (!selected) return showToast('Selecione um condomínio primeiro.', 'warning');
    try { await api.createBlock(selected, { name: blockName }); setBlockName(''); showToast('Bloco cadastrado.', 'success'); setBlocks(await api.getBlocks(selected)); await load(); }
    catch (err) { showToast(err.message, 'danger'); }
  };
  const mapUnits = async (event) => {
    event.preventDefault();
    if (!targetBlock || !legacyBlock) return showToast('Selecione a identificação legada e o bloco de destino.', 'warning');
    try { const result = await api.mapLegacyUnits(targetBlock, legacyBlock); showToast(`${result.mapped} unidade(s) associada(s).`, 'success'); setLegacyBlock(''); setTargetBlock(''); await load(); }
    catch (err) { showToast(err.message, 'danger'); }
  };
  const legacyBlocks = [...new Set(pendingUnits.map(unit => unit.legacy_block))];

  return <div>
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(340px, 2fr)', gap: 20, alignItems: 'start' }}>
      <form className="card" onSubmit={createCondominium}>
        <div className="card-title"><Building2 size={20} /> Novo Condomínio</div>
        {['name', 'cnpj', 'address', 'city', 'state', 'postal_code', 'phone'].map(key => <div className="form-group" key={key}>
          <label>{key === 'name' ? 'Nome *' : key.replace('_', ' ')}</label><input className="form-control" required={key === 'name'} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
        </div>)}
        <button className="btn btn-primary"><Plus size={16} /> Cadastrar condomínio</button>
      </form>
      <div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div className="card-title"><MapPin size={20} /> Condomínios cadastrados</div></div>
          {condominiums.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>Nenhum condomínio cadastrado.</p> : <div className="table-container"><table className="custom-table"><thead><tr><th>Nome</th><th>Status</th><th>Blocos</th><th>Unidades</th></tr></thead><tbody>{condominiums.map(item => <tr key={item.id} onClick={() => setSelected(String(item.id))} style={{ cursor: 'pointer', background: String(item.id) === selected ? 'var(--bg-hover)' : undefined }}><td>{item.name}</td><td><span className="badge badge-info">{item.status}</span></td><td>{item.blocks_count}</td><td>{item.units_count}</td></tr>)}</tbody></table></div>}
        </div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div className="card-title"><Layers size={20} /> Blocos do condomínio selecionado</div></div>
          <form onSubmit={createBlock} style={{ display: 'flex', gap: 8, marginBottom: 16 }}><input className="form-control" placeholder="Ex.: Torre A" value={blockName} onChange={e => setBlockName(e.target.value)} /><button className="btn btn-secondary">Adicionar bloco</button></form>
          <div className="table-container"><table className="custom-table"><thead><tr><th>Bloco</th><th>Status</th><th>Unidades</th></tr></thead><tbody>{blocks.length ? blocks.map(block => <tr key={block.id}><td>{block.name}</td><td>{block.status}</td><td>{block.units_count}</td></tr>) : <tr><td colSpan="3">Selecione ou cadastre um condomínio.</td></tr>}</tbody></table></div>
        </div>
        <form className="card" onSubmit={mapUnits}>
          <div className="card-title"><Link2 size={20} /> Associar unidades legadas</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>A associação só ocorre após seleção explícita; nenhuma unidade é enviada para um condomínio padrão.</p>
          <div className="form-row"><div className="form-group"><label>Identificação atual</label><select className="form-control" value={legacyBlock} onChange={e => setLegacyBlock(e.target.value)}><option value="">Selecione</option>{legacyBlocks.map(value => <option key={value}>{value}</option>)}</select></div><div className="form-group"><label>Bloco de destino</label><select className="form-control" value={targetBlock} onChange={e => setTargetBlock(e.target.value)}><option value="">Selecione</option>{blocks.map(block => <option key={block.id} value={block.id}>{block.name}</option>)}</select></div></div>
          <button className="btn btn-primary">Associar {pendingUnits.length} unidade(s) pendente(s)</button>
        </form>
      </div>
    </div>
  </div>;
}
