import React, { useState, useEffect } from 'react';
import { Sun, Moon, Building, UserCircle } from 'lucide-react';
import { getActiveCondoId, setActiveCondoId, api } from '../services/api';

export default function Header({ theme, onToggleTheme }) {
  const [condos, setCondos] = useState([]);
  const [selectedCondo, setSelectedCondo] = useState(getActiveCondoId());

  useEffect(() => {
    api.get('/condominiums')
      .then((data) => setCondos(data || []))
      .catch((err) => console.error('Erro ao listar condomínios:', err));
  }, []);

  const handleCondoChange = (e) => {
    const val = e.target.value;
    setSelectedCondo(val);
    setActiveCondoId(val);
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="condo-picker">
          <Building size={16} color="var(--primary)" />
          <label htmlFor="condo-select">Condomínio:</label>
          <select id="condo-select" value={selectedCondo} onChange={handleCondoChange}>
            {condos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="header-actions">
        {/* Status Operacional */}
        <div className="system-status-indicator" title="Comunicação com o banco de dados SQLite ativa">
          <span className="status-dot"></span>
          <span>Operacional</span>
        </div>

        {/* Perfil Operador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 6px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          <UserCircle size={18} />
          <span style={{ fontWeight: 600 }}>Portaria Central</span>
        </div>

        {/* Botão de Tema */}
        <button
          className="btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          aria-label="Alternar tema de cores"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
