import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Settings, 
  Shield, 
  Clock, 
  Users, 
  Package, 
  Bell, 
  FileText, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  Sliders, 
  Calendar,
  Lock,
  Phone,
  Mail,
  MapPin,
  Layers
} from 'lucide-react';
import { api, getActiveCondoId } from '../services/api';

export default function CondoSettingsView() {
  const [condo, setCondo] = useState(null);
  const [settings, setSettings] = useState({
    sindico_name: '',
    sindico_email: '',
    sindico_phone: '',
    mandate_start: '',
    mandate_end: '',
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    guest_limit_per_reservation: 30,
    require_pin_for_deliveries: true,
    visitor_tolerance_minutes: 15,
    auto_notify_whatsapp: true,
    auto_notify_email: true,
    rules_summary: ''
  });
  const [modules, setModules] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const condoId = getActiveCondoId();

  const loadData = async () => {
    try {
      setLoading(true);
      const [condoData, settingsData, modulesData] = await Promise.all([
        api.get(`/condominiums/${condoId}`),
        api.get(`/condominiums/${condoId}/settings`),
        api.get(`/condominiums/${condoId}/modules`)
      ]);
      setCondo(condoData);
      setSettings(settingsData || {});
      setModules(modulesData || {});
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
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

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch(`/condominiums/${condoId}/settings`, settings);
      await api.patch(`/condominiums/${condoId}/modules`, modules);
      window.showToast?.('Parâmetros do condomínio salvos com sucesso!', 'success');
    } catch (err) {
      window.showToast?.(err.message || 'Erro ao salvar configurações', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleModule = (key) => {
    setModules((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="view-container">
      {/* Cabeçalho */}
      <div className="view-header">
        <div>
          <h1>Configurações & Parâmetros do Condomínio</h1>
          <p className="subtitle">
            Defina diretrizes operacionais, mandato da administração, regras de convivência e módulos ativos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} /> Atualizar
          </button>
          <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saving}>
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Banner Informativo do Condomínio Selecionado */}
      <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
              {condo?.name || 'Carregando condomínio...'}
            </h2>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span><strong>CNPJ:</strong> {condo?.cnpj || 'Não informado'}</span>
              <span><strong>Localidade:</strong> {condo?.city} - {condo?.state}</span>
              <span><strong>Status:</strong> <span style={{ color: 'var(--success)' }}>Operacional</span></span>
            </div>
          </div>
        </div>
        <div className="badge badge-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
          Ambiente Multi-Tenant Ativo
        </div>
      </div>

      {/* Navegação por Abas de Configuração */}
      <div className="segmented-tabs" style={{ marginBottom: '20px' }}>
        <button
          className={`segmented-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Building2 size={16} /> Dados Oficiais & Mandato
        </button>
        <button
          className={`segmented-tab ${activeTab === 'portaria' ? 'active' : ''}`}
          onClick={() => setActiveTab('portaria')}
        >
          <Shield size={16} /> Portaria & Encomendas
        </button>
        <button
          className={`segmented-tab ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <Clock size={16} /> Convivência & Horários
        </button>
        <button
          className={`segmented-tab ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => setActiveTab('modules')}
        >
          <Layers size={16} /> Módulos Habilitados
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <form onSubmit={handleSaveSettings}>
        {/* Aba 1: Dados Oficiais & Mandato */}
        {activeTab === 'general' && (
          <div className="card form-layout">
            <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              Representação Legal e Corpo Diretivo
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>Nome do Síndico Responsável Eleito *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do Síndico"
                  value={settings.sindico_name || ''}
                  onChange={(e) => setSettings({ ...settings, sindico_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>E-mail Oficial do Síndico *</label>
                <input
                  type="email"
                  required
                  placeholder="sindico@condominio.com.br"
                  value={settings.sindico_email || ''}
                  onChange={(e) => setSettings({ ...settings, sindico_email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Telefone / Plantão da Administração</label>
                <input
                  type="text"
                  placeholder="(41) 98888-0000"
                  value={settings.sindico_phone || ''}
                  onChange={(e) => setSettings({ ...settings, sindico_phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Início do Mandato Atual</label>
                <input
                  type="date"
                  value={settings.mandate_start || ''}
                  onChange={(e) => setSettings({ ...settings, mandate_start: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Término do Mandato Atual</label>
                <input
                  type="date"
                  value={settings.mandate_end || ''}
                  onChange={(e) => setSettings({ ...settings, mandate_end: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Aba 2: Portaria & Encomendas */}
        {activeTab === 'portaria' && (
          <div className="card form-layout">
            <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              Parâmetros de Segurança e Recepção
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>Tolerância de Permanência para Visitantes (minutos)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={settings.visitor_tolerance_minutes || 15}
                  onChange={(e) => setSettings({ ...settings, visitor_tolerance_minutes: Number(e.target.value) })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  Tempo padrão para alertar a portaria caso o visitante não confirme a saída.
                </span>
              </div>

              <div className="form-group">
                <label>Exigência de PIN para Retirada de Encomendas</label>
                <select
                  value={settings.require_pin_for_deliveries ? 'true' : 'false'}
                  onChange={(e) => setSettings({ ...settings, require_pin_for_deliveries: e.target.value === 'true' })}
                >
                  <option value="true">Obrigatório (Gera código de 4 dígitos na portaria)</option>
                  <option value="false">Opcional (Liberação por assinatura visual)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>Canais de Notificação Instantânea</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.auto_notify_whatsapp ?? true}
                    onChange={(e) => setSettings({ ...settings, auto_notify_whatsapp: e.target.checked })}
                  />
                  <span>Disparar notificação automática via WhatsApp ao registrar nova encomenda</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.auto_notify_email ?? true}
                    onChange={(e) => setSettings({ ...settings, auto_notify_email: e.target.checked })}
                  />
                  <span>Enviar e-mail automático com comunicados de urgência do síndico</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Aba 3: Convivência & Horários */}
        {activeTab === 'rules' && (
          <div className="card form-layout">
            <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              Regras do Regimento Interno e Áreas Comuns
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>Início do Horário de Silêncio</label>
                <input
                  type="time"
                  value={settings.quiet_hours_start || '22:00'}
                  onChange={(e) => setSettings({ ...settings, quiet_hours_start: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Término do Horário de Silêncio</label>
                <input
                  type="time"
                  value={settings.quiet_hours_end || '08:00'}
                  onChange={(e) => setSettings({ ...settings, quiet_hours_end: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Limite Máximo de Convidados por Espaço</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={settings.guest_limit_per_reservation || 30}
                  onChange={(e) => setSettings({ ...settings, guest_limit_per_reservation: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '14px' }}>
              <label>Síntese das Normas de Convivência e Mudanças</label>
              <textarea
                rows="4"
                placeholder="Insira as diretrizes principais do condomínio..."
                value={settings.rules_summary || ''}
                onChange={(e) => setSettings({ ...settings, rules_summary: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Aba 4: Módulos Habilitados */}
        {activeTab === 'modules' && (
          <div className="card form-layout">
            <h3 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              Habilitação Seletiva de Recursos (Feature Flags)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Módulos desativados são ocultados da barra de navegação para usuários comuns deste condomínio.
            </p>

            <div className="module-toggle-grid">
              {[
                { key: 'deliveries', label: 'Encomendas & Armário Digital', desc: 'Controle de pacotes com PIN' },
                { key: 'access', label: 'Portaria & Acessos', desc: 'Controle de visitantes e prestadores' },
                { key: 'residents', label: 'Moradores & Veículos', desc: 'Gestão de pessoas e garagens' },
                { key: 'reservations', label: 'Áreas & Reservas', desc: 'Agendamento de salões e churrasqueiras' },
                { key: 'financial', label: 'Financeiro & Taxas', desc: 'Gestão de cotas e fluxo de caixa' },
                { key: 'market', label: 'Mercadinho Autônomo', desc: 'Autoatendimento Honest Market' },
                { key: 'announcements', label: 'Mural de Avisos', desc: 'Publicação de comunicados e alertas' }
              ].map((m) => {
                const isEnabled = modules[m.key] !== false;
                return (
                  <div key={m.key} className="module-toggle-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{m.label}</span>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleToggleModule(m.key)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{m.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
