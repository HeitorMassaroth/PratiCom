import React, { useState, useEffect } from 'react';
import { 
  Vote, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Clock, 
  Calendar, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Lock, 
  FileText,
  Users,
  Building,
  BarChart2,
  Printer,
  ShieldCheck,
  Sparkles,
  Share2
} from 'lucide-react';
import { api, getActiveCondoId, getActiveProfile } from '../services/api';
import Modal from '../components/Modal';

export default function AssembliesPollsView() {
  const [polls, setPolls] = useState([]);
  const [units, setUnits] = useState([]);
  const [condoInfo, setCondoInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAtaModal, setShowAtaModal] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState('1'); // Morador mock unit 101

  // Filtros
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [formData, setFormData] = useState({
    title: '',
    category: 'Melhorias & Obras',
    description: '',
    deadline: ''
  });

  const condoId = getActiveCondoId();
  const profile = getActiveProfile();

  const loadData = async () => {
    try {
      setLoading(true);
      const [pollsData, unitsData, condoData] = await Promise.all([
        api.get('/polls'),
        api.get('/units'),
        api.get(`/condominiums/${condoId}`).catch(() => null)
      ]);
      setPolls(pollsData || []);
      setUnits(unitsData || []);
      if (condoData) setCondoInfo(condoData);
    } catch (err) {
      console.error('Erro ao carregar votações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleCondoChange = () => loadData();
    window.addEventListener('condo-changed', handleCondoChange);
    return () => window.removeEventListener('condo-changed', handleCondoChange);
  }, []);

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    try {
      await api.post('/polls', formData);
      window.showToast?.('Pauta de assembleia criada com sucesso!', 'success');
      setShowCreateModal(false);
      setFormData({ title: '', category: 'Melhorias & Obras', description: '', deadline: '' });
      loadData();
    } catch (err) {
      window.showToast?.(err.message || 'Erro ao criar pauta', 'error');
    }
  };

  const handleVote = async (pollId, voteType) => {
    try {
      await api.post(`/polls/${pollId}/vote`, {
        unit_id: Number(selectedUnitId),
        vote: voteType
      });
      window.showToast?.('Voto computado com sucesso!', 'success');
      loadData();
    } catch (err) {
      window.showToast?.(err.message || 'Erro ao computar voto', 'error');
    }
  };

  const handleClosePoll = async (pollId) => {
    try {
      await api.patch(`/polls/${pollId}/close`, {});
      window.showToast?.('Deliberação encerrada com sucesso!', 'info');
      loadData();
    } catch (err) {
      window.showToast?.(err.message, 'error');
    }
  };

  const totalUnitsCount = units.length || 32;

  // Filtros
  const filteredPolls = polls.filter((p) => {
    if (statusFilter === 'OPEN') return p.status === 'OPEN';
    if (statusFilter === 'CLOSED') return p.status === 'CLOSED';
    return true;
  });

  // Métricas de Quórum Global
  const openPollsCount = polls.filter((p) => p.status === 'OPEN').length;
  const closedPollsCount = polls.filter((p) => p.status === 'CLOSED').length;

  return (
    <div className="view-container">
      {/* Cabeçalho */}
      <div className="view-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>Assembleias Virtuais & Votações Online</h1>
            <span className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={11} /> Votação Conforme Lei 14.309/2022
            </span>
          </div>
          <p className="subtitle">
            Participe das deliberações oficiais, consulte pautas vigentes e gere atas homologadas com quórum qualificado
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowAtaModal(true)} title="Gerar Ata Oficial da Assembleia">
            <FileText size={16} /> Ata da Assembleia
          </button>
          <button className="btn btn-secondary" onClick={loadData} title="Recarregar">
            <RefreshCw size={16} /> Atualizar
          </button>
          {(profile === 'admin' || profile === 'sindico') && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Nova Pauta
            </button>
          )}
        </div>
      </div>

      {/* Cards de Métricas de Quórum */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Pautas em Votação</span>
            <Vote size={18} className="stat-icon" color="var(--primary)" />
          </div>
          <div className="stat-value">{openPollsCount}</div>
          <span className="stat-subtext">Deliberações com prazo aberto</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Pautas Homologadas</span>
            <Lock size={18} className="stat-icon" color="var(--success)" />
          </div>
          <div className="stat-value">{closedPollsCount}</div>
          <span className="stat-subtext">Votações encerradas com ata</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total de Unidades Aptas</span>
            <Building size={18} className="stat-icon" color="#8b5cf6" />
          </div>
          <div className="stat-value">{totalUnitsCount}</div>
          <span className="stat-subtext">1 voto por fração ideal</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Quórum Legal Mínimo</span>
            <ShieldCheck size={18} className="stat-icon" color="var(--info)" />
          </div>
          <div className="stat-value">50% + 1</div>
          <span className="stat-subtext">Maioria simples das presentes</span>
        </div>
      </div>

      {/* Banner de Contexto de Voto do Morador */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Vote size={22} color="var(--primary)" />
          <div>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Unidade Titular para Votação Online:</span>
            <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Cada unidade habitacional tem direito a 1 voto computado por pauta conforme a Convenção Condominial.
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="vote-unit-select" style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Sua Unidade:</label>
          <select
            id="vote-unit-select"
            className="filter-select"
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.block_name} - Apto {u.number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtro de Abas */}
      <div className="segmented-tabs" style={{ marginBottom: '20px' }}>
        <button
          className={`segmented-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setStatusFilter('ALL')}
        >
          Todas as Pautas ({polls.length})
        </button>
        <button
          className={`segmented-tab ${statusFilter === 'OPEN' ? 'active' : ''}`}
          onClick={() => setStatusFilter('OPEN')}
        >
          🟢 Em Votação Aberta ({openPollsCount})
        </button>
        <button
          className={`segmented-tab ${statusFilter === 'CLOSED' ? 'active' : ''}`}
          onClick={() => setStatusFilter('CLOSED')}
        >
          🔒 Encerradas / Homologadas ({closedPollsCount})
        </button>
      </div>

      {/* Lista de Pautas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando deliberações e pautas...
          </div>
        ) : filteredPolls.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhuma assembleia ou deliberação localizada com o filtro selecionado.
          </div>
        ) : (
          filteredPolls.map((poll) => {
            const totalVotes = poll.votes_for + poll.votes_against + poll.votes_abstain;
            const pctFor = totalVotes > 0 ? ((poll.votes_for / totalVotes) * 100).toFixed(1) : 0;
            const pctAgainst = totalVotes > 0 ? ((poll.votes_against / totalVotes) * 100).toFixed(1) : 0;
            const pctAbstain = totalVotes > 0 ? ((poll.votes_abstain / totalVotes) * 100).toFixed(1) : 0;
            const quorumPct = ((totalVotes / totalUnitsCount) * 100).toFixed(1);

            const hasVoted = poll.voted_units?.includes(Number(selectedUnitId));
            const isOpen = poll.status === 'OPEN';

            return (
              <div key={poll.id} className="card" style={{ padding: '24px' }}>
                {/* Cabeçalho da Pauta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span className="badge badge-primary">{poll.category}</span>
                      {isOpen ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={11} /> Votação Aberta (Até {poll.deadline || 'Final do Mandato'})
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={11} /> Votação Encerrada & Homologada
                        </span>
                      )}
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{poll.title}</h2>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        const text = `🗳️ *PAUTA DE ASSEMBLEIA VIRTUAL*\n\n*${poll.title}*\nStatus: ${isOpen ? 'Em votação' : 'Encerrada'}\nA Favor: ${poll.votes_for} | Contra: ${poll.votes_against}\n\nAcesse o PratiCom ERP para votar.`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      title="Compartilhar pauta no WhatsApp"
                    >
                      <Share2 size={13} /> WhatsApp
                    </button>
                    {(profile === 'admin' || profile === 'sindico') && isOpen && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleClosePoll(poll.id)}
                        title="Encerrar deliberação e homologar resultado"
                      >
                        <Lock size={13} /> Encerrar Pauta
                      </button>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
                  {poll.description}
                </p>

                {/* Barra de Progresso de Apuração */}
                <div style={{ background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 600 }}>Apuração dos Votos ({totalVotes} votos de {totalUnitsCount} unidades)</span>
                    <span style={{ color: 'var(--text-dim)' }}>
                      Quórum de Participação: <strong style={{ color: Number(quorumPct) >= 50 ? 'var(--success)' : 'var(--warning)' }}>{quorumPct}%</strong>
                    </span>
                  </div>

                  {/* Barra Visual Tricolor */}
                  <div style={{ height: '12px', background: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${pctFor}%`, background: 'var(--success)', transition: 'width 0.3s ease' }} title={`A Favor: ${pctFor}%`} />
                    <div style={{ width: `${pctAgainst}%`, background: 'var(--danger)', transition: 'width 0.3s ease' }} title={`Contra: ${pctAgainst}%`} />
                    <div style={{ width: `${pctAbstain}%`, background: 'var(--text-dim)', transition: 'width 0.3s ease' }} title={`Abstenções: ${pctAbstain}%`} />
                  </div>

                  {/* Legenda de Apuração */}
                  <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></span>
                      <span><strong>A Favor:</strong> {poll.votes_for} ({pctFor}%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)' }}></span>
                      <span><strong>Contra:</strong> {poll.votes_against} ({pctAgainst}%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--text-dim)' }}></span>
                      <span><strong>Abstenções:</strong> {poll.votes_abstain} ({pctAbstain}%)</span>
                    </div>
                  </div>
                </div>

                {/* Painel de Votação da Unidade */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    {hasVoted ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}>
                        <CheckCircle2 size={16} /> Sua unidade já registrou voto soberano nesta deliberação.
                      </span>
                    ) : isOpen ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Selecione a sua manifestação soberana para a unidade selecionada:
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        Deliberação finalizada. Votação encerrada para apuração oficial.
                      </span>
                    )}
                  </div>

                  {isOpen && !hasVoted && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleVote(poll.id, 'for')}
                        style={{ color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.35)' }}
                      >
                        <CheckCircle2 size={16} /> A Favor
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleVote(poll.id, 'against')}
                        style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.35)' }}
                      >
                        <XCircle size={16} /> Contra
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleVote(poll.id, 'abstain')}
                      >
                        <MinusCircle size={16} /> Abster-se
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nova Pauta */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Criar Nova Pauta de Assembleia / Deliberação"
      >
        <form onSubmit={handleCreatePoll} className="form-layout">
          <div className="form-group">
            <label>Título da Pauta *</label>
            <input
              type="text"
              required
              placeholder="Ex: Reforma da Fachada e Pintura Externa"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Categoria *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Melhorias & Obras">Melhorias & Obras</option>
                <option value="Convivência">Convivência & Regimento</option>
                <option value="Financeiro">Financeiro & Orçamento</option>
                <option value="Segurança">Segurança & Portaria</option>
              </select>
            </div>

            <div className="form-group">
              <label>Prazo Limite para Votação *</label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Texto Descritivo / Justificativa da Deliberação *</label>
            <textarea
              required
              rows="4"
              placeholder="Apresente a proposta detalhada, custos estimados ou contexto necessário para a deliberação dos condôminos..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="modal-actions" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Publicar Pauta de Votação
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Ata Oficial da Assembleia Geral */}
      {showAtaModal && (
        <Modal isOpen={showAtaModal} onClose={() => setShowAtaModal(false)} title="Ata Oficial de Assembleia Geral">
          <div className="official-doc-sheet" style={{ margin: '10px 0' }}>
            <div className="official-doc-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="official-doc-stamp">Documento Homologado</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Livro Digital de Atas • Folha 42</span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0', textTransform: 'uppercase' }}>
                ATA DA ASSEMBLEIA GERAL EXTRAORDINÁRIA VIRTUAL
              </h2>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                {condoInfo?.name || 'CONDOMÍNIO RESIDENCIAL PARQUE DAS FLORES'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                CNPJ: {condoInfo?.cnpj || '12.345.678/0001-90'} • Realizada nos termos da Lei Federal nº 14.309/2022
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: '1.7', marginBottom: '20px' }}>
              <p>
                Aos <strong>{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>, reuniu-se a Assembleia Geral dos condôminos através da plataforma digital homologada <strong>PratiCom ERP</strong>, com quórum verificado de <strong>{totalUnitsCount} frações ideais</strong> aptas para a ordem do dia.
              </p>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '16px 0 8px 0', textTransform: 'uppercase', color: '#0f172a' }}>
                Ordem do Dia e Apuração Soberana dos Votos:
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {polls.map((p, index) => {
                  const total = p.votes_for + p.votes_against + p.votes_abstain;
                  const isApproved = p.votes_for > p.votes_against;
                  return (
                    <div key={p.id} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                        Item {index + 1}: {p.title} ({p.category})
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                        {p.description}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.82rem', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                        <span>
                          Votos: <strong>{p.votes_for} a favor</strong>, <strong>{p.votes_against} contra</strong>, {p.votes_abstain} abstenções.
                        </span>
                        <span style={{ fontWeight: 800, color: isApproved ? '#059669' : '#dc2626' }}>
                          RESULTADO: {isApproved ? 'APROVADO' : 'REJEITADO'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p style={{ marginTop: '20px' }}>
                Nada mais havendo a tratar, foram encerrados os trabalhos e lavrada a presente ata que, lida e achada conforme por todos os presentes através de assinatura eletrônica, segue assinada pelo Síndico e pelo Secretário da mesa.
              </p>
            </div>

            {/* Assinaturas */}
            <div style={{ marginTop: '36px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', fontSize: '0.78rem', color: '#475569' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #334155', marginBottom: '6px', width: '80%', margin: '0 auto 6px auto' }}></div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Presidente da Mesa / Síndico Geral</div>
                <div style={{ fontSize: '0.72rem', color: '#059669' }}>Certificado Digital PratiCom ICP-Brasil</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #334155', marginBottom: '6px', width: '80%', margin: '0 auto 6px auto' }}></div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>Secretário da Assembleia</div>
                <div style={{ fontSize: '0.72rem', color: '#059669' }}>Certificado Digital PratiCom ICP-Brasil</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => setShowAtaModal(false)}>
              Fechar
            </button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <Printer size={16} />
              <span>Imprimir / Exportar Ata</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
