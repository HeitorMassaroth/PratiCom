import React from 'react';
import { AlertOctagon, RefreshCw, Home, Copy, Check, Terminal, Bug } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[PratiCom ERP ErrorBoundary] Exceção capturada na interface:', error, errorInfo);

    // Registra o erro no histórico de erros local para a Central de Diagnósticos
    try {
      const existingErrors = JSON.parse(localStorage.getItem('praticom_system_errors') || '[]');
      const newEntry = {
        id: `ERR-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        level: 'CRITICAL',
        type: 'REACT_CRASH',
        message: error?.message || 'Erro desconhecido em componente React',
        stack: error?.stack || '',
        componentStack: errorInfo?.componentStack || '',
        url: window.location.href,
        status: 'UNRESOLVED'
      };
      localStorage.setItem('praticom_system_errors', JSON.stringify([newEntry, ...existingErrors.slice(0, 49)]));
    } catch (e) {
      // Ignora erro de persistência em modo estrito
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  handleCopyDiagnostics = () => {
    const report = {
      title: 'PratiCom ERP - Relatório de Diagnóstico de Erro',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      error: {
        message: this.state.error?.message,
        stack: this.state.error?.stack
      },
      componentStack: this.state.errorInfo?.componentStack
    };

    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-screen-wrapper">
          <div className="error-screen-card animate-fade-in">
            {/* Ícone com Efeito Glow */}
            <div className="error-screen-icon-container">
              <div className="error-screen-icon-halo"></div>
              <AlertOctagon size={48} className="error-screen-icon" />
            </div>

            {/* Cabeçalho */}
            <span className="error-screen-badge">Erro Inesperado de Interface (500)</span>
            <h1 className="error-screen-title">Ops! Algo saiu do esperado</h1>
            <p className="error-screen-subtitle">
              Ocorreu uma exceção não tratada neste módulo. O PratiCom isolou a falha com segurança para impedir perda de dados e manter o restante do condomínio operando.
            </p>

            {/* Detalhes Técnicos Colapsáveis */}
            <div className="error-screen-terminal">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="terminal-title">
                  <Terminal size={14} /> stacktrace.log
                </div>
              </div>
              <div className="terminal-body">
                <code>
                  <strong>Exceção:</strong> {this.state.error?.toString()}
                  {this.state.error?.stack && (
                    <div className="terminal-stack">
                      {this.state.error.stack.split('\n').slice(0, 6).join('\n')}
                    </div>
                  )}
                </code>
              </div>
            </div>

            {/* Ações de Recuperação */}
            <div className="error-screen-actions">
              <button 
                type="button" 
                className="btn btn-primary btn-lg" 
                onClick={this.handleReset}
              >
                <RefreshCw size={18} /> Recarregar Módulo
              </button>

              <button 
                type="button" 
                className="btn btn-secondary btn-lg" 
                onClick={() => {
                  this.setState({ hasError: false });
                  if (this.props.onNavigate) {
                    this.props.onNavigate('dashboard');
                  } else {
                    window.location.href = '/';
                  }
                }}
              >
                <Home size={18} /> Voltar ao Dashboard
              </button>

              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={this.handleCopyDiagnostics}
              >
                {this.state.copied ? <Check size={16} className="text-emerald" /> : <Copy size={16} />}
                {this.state.copied ? 'Diagnóstico Copiado!' : 'Copiar Diagnóstico'}
              </button>
            </div>

            {/* Rodapé Informativo */}
            <div className="error-screen-footer">
              <Bug size={14} />
              <span>O incidente foi registrado automaticamente na Central de Diagnósticos do PratiCom ERP.</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
