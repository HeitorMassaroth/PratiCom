# 🏢 PratiCom ERP v2 — Gestão Condominial Inteligente

<p align="center">
  <b>Plataforma reescrita do zero sob arquitetura Clean MVC + DDD, máxima simplificação, reuso de código e interface moderna.</b>
</p>

---

## 🏛️ Arquitetura Clean MVC + DDD

O sistema foi repensado para ser simples, irredutível e altamente reutilizável:

```
[ Frontend: React 18 + Vite ]
               │
               ▼
┌──────────────────────────────┐
│  ROUTES (/server/routes)     │ ➔ Mapeia os endpoints HTTP para os controladores
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ CONTROLLERS (/controllers)   │ ➔ BaseController conciso e reutilizável
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│  SERVICES (/server/services) │ ➔ BaseService com validação estrita DDD pré-persistência
└──────┬───────────────┬───────┘
       │               │
       ▼               ▼
┌──────────────┐ ┌──────────────────────────────┐
│ MODELS (DDD) │ │ DATABASE (/server/database)  │
│ BaseEntity + │ │ BaseRepository com SQLite 3  │
│ 10 Entidades │ │ WAL Mode + Foreign Keys ON   │
└──────────────┘ └──────────────────────────────┘
```

> **Classificação DDD Obrigatória**: Qualquer dado antes de ser inserido ou atualizado no banco de dados SQLite passa obrigatoriamente pela validação de invariantes de sua respectiva classe de Domínio DDD (`.validate()`).

---

## 📋 Catálogo Completo de Requisitos

Consulte a especificação detalhada de todos os 12 CRUDs, fluxos e regras de negócio no arquivo:
👉 [REQUISITOS_SISTEMA_PRATICOM.md](REQUISITOS_SISTEMA_PRATICOM.md)

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* [Node.js](https://nodejs.org/) v18+ e `npm`

---

### Opção 1: Inicialização Automática (Windows PowerShell)
```powershell
.\start_app.ps1
```

---

### Opção 2: Inicialização Manual

#### 1. Iniciar o Backend
```bash
cd server
npm.cmd install
npm.cmd run dev
```
*Disponível em: `http://localhost:5000`*

#### 2. Iniciar o Frontend
```bash
cd client
npm.cmd install
npm.cmd run dev
```
*Disponível em: `http://localhost:5173`*

---

## 🧪 Suíte de Testes Automatizados

Para rodar a verificação de integridade do banco SQLite, validações DDD e serviços:
```bash
cd server
node tests/verify_all.mjs
```
