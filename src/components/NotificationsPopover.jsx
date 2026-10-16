import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Package,
  Wrench,
  Vote,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  X
} from 'lucide-react';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Nova encomenda disponível',
    description: 'Pacote Amazon recebido na portaria. PIN de retirada: 4821',
    target: 'deliveries',
    time: 'Há 5 minutos',
    unread: true,
    icon: Package,
    iconColor: '#f59e0b',
    iconBg: 'rgba(245, 158, 11, 0.15)'
  },
  {
    id: 'notif-2',
    title: 'Chamado urgente registrado',
    description: 'Vazamento hidráulico reportado no Bloco B (Subsolo).',
    target: 'occurrences',
    time: 'Há 25 minutos',
    unread: true,
    icon: Wrench,
    iconColor: '#ef4444',
    iconBg: 'rgba(239, 68, 68, 0.15)'
  },
  {
    id: 'notif-3',
    title: 'Assembleia Aberta para Votação',
    description: 'Deliberação sobre revitalização da Portaria e Câmeras.',
    target: 'polls',
    time: 'Há 1 hora',
    unread: true,
    icon: Vote,
    iconColor: '#8b5cf6',
    iconBg: 'rgba(139, 92, 246, 0.15)'
  },
  {
    id: 'notif-4',
    title: 'Acesso Liberado na Portaria',
    description: 'Visitante João Silva registrado com destino ao Apto 203.',
    target: 'access',
    time: 'Há 2 horas',
    unread: false,
    icon: ShieldCheck,
    iconColor: '#10b981',
    iconBg: 'rgba(16, 185, 129, 0.15)'
  }
];

export default function NotificationsPopover({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const popoverRef = useRef(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleSelectNotif = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(notif.target);
    }
  };

  return (
    <div className="notifications-container" ref={popoverRef}>
      {/* Botão do Sininho */}
      <button
        className="btn-icon notifications-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Notificações e Alertas em Tempo Real"
        aria-label="Abrir notificações"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="notifications-badge">{unreadCount}</span>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="notifications-popover">
          <div className="notifications-popover-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Notificações</span>
              {unreadCount > 0 && (
                <span className="badge badge-primary" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                  {unreadCount} novas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                className="notifications-mark-read-btn"
                onClick={handleMarkAllRead}
              >
                Marcar lidas
              </button>
            )}
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nenhuma notificação no momento.
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = notif.icon;
                return (
                  <div
                    key={notif.id}
                    className={`notification-item ${notif.unread ? 'unread' : ''}`}
                    onClick={() => handleSelectNotif(notif)}
                  >
                    <div
                      className="notification-icon"
                      style={{ background: notif.iconBg, color: notif.iconColor }}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="notification-content">
                      <div className="notification-title-row">
                        <span className="notification-title">{notif.title}</span>
                        <span className="notification-time">{notif.time}</span>
                      </div>
                      <p className="notification-desc">{notif.description}</p>
                    </div>
                    {notif.unread && <span className="notification-dot" />}
                  </div>
                );
              })
            )}
          </div>

          <div className="notifications-popover-footer">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Alertas disparados em tempo real pelo sistema
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
