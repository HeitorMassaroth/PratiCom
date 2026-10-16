import React, { useState, useEffect } from 'react';
import { Sun, Moon, Building, Bell } from 'lucide-react';
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
      <div className="condo-picker">
        <Building size={18} color="var(--primary)" />
        <select value={selectedCondo} onChange={handleCondoChange}>
          {condos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="header-actions">
        <button
          className="btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <div className="badge badge-success" style={{ padding: '6px 14px' }}>
          ● Sistema Online
        </div>
      </div>
    </header>
  );
}
