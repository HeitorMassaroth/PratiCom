# 🏢 PratiCom ERP — Gestão Condominial Inteligente (Front-End Standalone)

<p align="center">
  <b>Interface corporativa de alta performance, 100% autônoma no navegador, com dados integrados e resposta instantânea (On-Click).</b>
</p>

---

## ⚡ Características do Sistema

- **Arquitetura Front-End Autônoma**: Executa diretamente no navegador via Vite + React 18, sem necessidade de servidor backend ou banco de dados externo.
- **Respostas Instantâneas (On-Click)**: Todas as ações de portaria, encomendas com PIN, checkout PDV com PIX, reservas e baixas contábeis funcionam em tempo real com estado persistido no `localStorage`.
- **Identidade Visual Corporativa**: Design system sóbrio (Slate Industrial & Blue), tipografia nítida (*Plus Jakarta Sans* e fonte tabular *Mono*), alternância Dark/Light mode e densidade de ERP profissional.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* [Node.js](https://nodejs.org/) v18+ e `npm`

### 1. Instalar dependências (se necessário)
```bash
npm.cmd install
```

### 2. Iniciar o servidor de desenvolvimento
```bash
npm.cmd run dev
```

Acesse o sistema no navegador:
👉 **`http://localhost:5173`**

---

## 📦 Módulos Disponíveis e Funcionais

1. **Dashboard Geral**: Indicadores operacionais consolidados, alertas de estoque crítico e atalhos de rotina.
2. **Encomendas & Armário Digital**: Recebimento de pacotes, geração automática de PIN de 4 dígitos, keypad numérico para conferência e cancelamento.
3. **Portaria & Controle de Acessos**: Registro de entrada de visitantes/prestadores com formatação de placas Mercosul e baixa de saída em 1 clique.
4. **Moradores & Frotas**: Gestão integrada de unidades, condôminos, contatos de emergência e veículos autorizados.
5. **Áreas Comuns & Reservas**: Catálogo de espaços e agendamentos com validação instantânea de conflitos de horário.
6. **Financeiro & Balancetes**: Livro-razão contábil com alinhamento tabular de valores, barra percentual de arrecadação mensal e baixa imediata de títulos.
7. **Mercadinho Autônomo (PDV)**: Autoatendimento com catálogo categorizado, carrinho dinâmico com controle de quantidade (+/-) e checkout via PIX com QR code e cópia de chave.
8. **Mural de Comunicados**: Publicação de avisos com níveis de prioridade e opção de fixar comunicados no topo.
