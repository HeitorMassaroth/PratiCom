# 📋 Especificação Completa e Catálogo de Requisitos — PratiCom ERP

> **Documento Mestre de Requisitos de Software, Regras de Negócio e Arquitetura**  
> **Versão:** 2.0 (Clean MVC + DDD + Ultra-Reuso)  
> **Sistema:** PratiCom — Sistema Integrado de Gestão Condominial  
> **Diretriz Arquitetural:** Model-Route-Controller-Service-Database com validação estrita DDD pré-persistência e máxima redução de código repetitivo (DRY).

---

## 🏛️ 1. Arquitetura Alvo: Clean MVC + DDD

O sistema reescrito adota uma separação rigorosa em 5 camadas concisas, reutilizáveis e desacopladas:

```
[ Cliente HTTP / Frontend ]
          │
          ▼
┌──────────────────┐
│     ROUTES       │ ➔ Mapeia verbos HTTP (GET, POST, PATCH, DELETE) para os Controllers
└─────────┬────────┘
          ▼
┌──────────────────┐
│   CONTROLLERS    │ ➔ Extrai parâmetros (params, body, query, tenantContext) e delega ao Service
└─────────┬────────┘
          ▼
┌──────────────────┐
│    SERVICES      │ ➔ Orquestra as regras de negócio, transações e fluxo operacional
└────┬────────┬────┘
     │        │
     ▼        ▼
┌────────┐ ┌──────────────────┐
│ MODELS │ │     DATABASE     │
│ (DDD)  │ │   (SQLite/WAL)   │
└────────┘ └──────────────────┘
```

### Regra de Ouro (DDD Obrigatório):
> **Toda e qualquer informação destinada à persistência no banco de dados DEVE obrigatoriamente ser instanciada e validada por uma Entidade de Domínio (DDD) antes de tocar na camada de dados.** Se a entidade violar qualquer invariante de negócio no método `.validate()`, a persistência é imediatamente bloqueada.

---

## 📦 2. As 10 Entidades de Domínio (Domain-Driven Design)

Todas as entidades estendem uma base comum `BaseDomainEntity`, encapsulando id, timestamps e o contrato `validate()`.

| # | Entidade | Atributos Principais | Invariantes e Regras de Validação DDD |
|---|---|---|---|
| **1** | **Condominium** | `id`, `name`, `cnpj`, `address`, `city`, `state`, `phone`, `status` | Nome obrigatório (>=3 caracteres); Status deve ser 'ACTIVE' ou 'INACTIVE'; CNPJ único. |
| **2** | **Block** | `id`, `condominium_id`, `name`, `description`, `status` | Vínculo mandatório com condomínio; Nome do bloco obrigatório e único dentro do mesmo condomínio. |
| **3** | **Unit** | `id`, `block_id`, `number`, `floor`, `type` | Número da unidade obrigatório; Vínculo com bloco; Combinação `(block_id, number)` estritamente única. |
| **4** | **Resident** | `id`, `unit_id`, `name`, `email`, `phone`, `cpf`, `role`, `emergency_contact` | Nome obrigatório (>=3 letras); Unidade válida; Role válida ('Proprietário', 'Inquilino', 'Dependente'); CPF sanitizado. |
| **5** | **Vehicle** | `id`, `unit_id`, `resident_id`, `plate`, `model`, `color`, `type`, `parking_spot` | Placa obrigatória e normalizada em maiúsculas sem traços (7 caracteres alfanuméricos); Modelo obrigatório. |
| **6** | **Delivery** | `id`, `unit_id`, `courier`, `tracking_code`, `description`, `status`, `pickup_code`, `received_at`, `picked_up_at` | Unidade e transportadora obrigatórias; Geração de PIN numérico seguro de 4 dígitos; Baixa requer conferência exata do PIN. |
| **7** | **AccessLog** | `id`, `visitor_name`, `document`, `destination_unit_id`, `type`, `status`, `company`, `vehicle_plate`, `entered_at`, `exited_at` | Nome e documento obrigatórios; Unidade de destino obrigatória; Status transita de 'IN_PROPERTY' para 'EXITED'. |
| **8** | **Reservation** | `id`, `space_id`, `resident_id`, `unit_id`, `reservation_date`, `start_time`, `end_time`, `status`, `notes` | Horário inicial deve ser anterior ao final; Data não pode ser no passado; Bloqueio inegociável de sobreposição no mesmo espaço. |
| **9** | **FinancialTransaction** | `id`, `condominium_id`, `unit_id`, `type`, `category`, `description`, `amount`, `due_date`, `status`, `payment_date` | Tipo deve ser 'income' ou 'expense'; Valor deve ser positivo (>0); Data de vencimento válida; Status 'PENDING' ou 'PAID'. |
| **10**| **Announcement** | `id`, `condominium_id`, `title`, `content`, `category`, `priority`, `is_pinned`, `expires_at` | Título e conteúdo obrigatórios; Prioridade ('normal', 'urgente', 'alta'); Fixação booleana para topo do mural. |

---

## 🔄 3. Catálogo Detalhado de CRUDs e Rotas RESTful

### 🏢 Módulo 1: Condomínios e Gestão Territorial
1. **CRUD Condomínios** (`/api/condominiums`)
   - `GET /`: Lista todos os condomínios (filtro por `status`).
   - `POST /`: Cadastro de novo condomínio com validação de CNPJ e dados cadastrais.
   - `GET /:id`: Detalhes de um condomínio específico.
   - `PATCH /:id`: Atualização cadastral.
   - `PATCH /:id/status`: Ativação/desativação rápida.
   - `DELETE /:id`: Remoção (com validação de dependências filhas).

2. **CRUD Blocos / Torres** (`/api/blocks` e `/api/condominiums/:id/blocks`)
   - `GET /api/condominiums/:id/blocks`: Blocos pertencentes ao condomínio.
   - `POST /api/condominiums/:id/blocks`: Criação de bloco com checagem de unicidade local.
   - `PATCH /api/blocks/:id`: Edição de bloco.
   - `DELETE /api/blocks/:id`: Exclusão de bloco sem unidades vinculadas.

3. **CRUD Unidades (Apartamentos/Casas)** (`/api/units`)
   - `GET /`: Unidades do condomínio ativo.
   - `POST /`: Cadastro de unidade (impede número duplicado no mesmo bloco).
   - `GET /:id`: Detalhes da unidade, morador e veículos vinculados.
   - `PATCH /:id`: Atualização de informações da unidade.
   - `DELETE /:id`: Exclusão segura.

---

### 👥 Módulo 2: Moradores e Veículos
4. **CRUD Moradores** (`/api/residents`)
   - `GET /`: Moradores do condomínio ativo (filtros por `unit_id`, busca por nome/CPF).
   - `POST /`: Inclusão de morador com vínculo com unidade habitacional.
   - `PATCH /:id`: Atualização de contato, role ou emergência.
   - `DELETE /:id`: Remoção de morador preservando histórico da unidade.

5. **CRUD Veículos** (`/api/vehicles`)
   - `GET /`: Veículos cadastrados na unidade/condomínio.
   - `POST /`: Cadastro de veículo (validação e normalização de placa Mercosul).
   - `GET /:id`: Busca veículo específico.
   - `PATCH /:id`: Atualização de vaga de garagem ou dados do veículo.
   - `DELETE /:id`: Remoção de veículo da portaria.

---

### 📦 Módulo 3: Portaria e Encomendas
6. **CRUD Encomendas** (`/api/deliveries`)
   - `GET /`: Encomendas ativas/pendentes (filtros por status e unidade).
   - `POST /`: Registro de novo pacote na portaria com geração automática de PIN de 4 dígitos.
   - `PATCH /:id`: Atualização de dados da encomenda.
   - `PATCH /:id/pickup`: Confirmação de retirada do pacote mediante conferência do PIN de segurança.
   - `PATCH /:id/cancel`: Cancelamento de recebimento com justificativa registrada.
   - `DELETE /:id`: Exclusão física de registros cancelados.

7. **CRUD Controle de Acesso de Visitantes** (`/api/access`)
   - `GET /`: Logs de acesso (filtros por status 'IN_PROPERTY' e busca por documento/placa/nome).
   - `POST /api/access/entry`: Registro de entrada de visitante, prestador ou serviço.
   - `PATCH /api/access/:id/exit`: Baixa com registro automático do timestamp de saída e cálculo do tempo de permanência.
   - `DELETE /api/access/:id`: Remoção administrativa do registro.

---

### 📅 Módulo 4: Áreas Comuns e Reservas
8. **CRUD Espaços Comuns** (`/api/spaces`)
   - `GET /`: Espaços disponíveis no condomínio (churrasqueira, salão de festas, academia).
   - `POST /`: Cadastro de novo espaço com capacidade e regras de uso.
   - `PATCH /:id`: Edição de espaço.
   - `DELETE /:id`: Remoção de espaço.

9. **CRUD Reservas** (`/api/reservations`)
   - `GET /`: Consulta de reservas por data ou espaço.
   - `POST /`: Realização de agendamento com validação estrita contra sobreposição de horários.
   - `PATCH /:id`: Edição de reserva.
   - `PATCH /:id/cancel`: Cancelamento de reserva liberando o espaço.
   - `DELETE /:id`: Exclusão de agendamento cancelado.

---

### 💰 Módulo 5: Financeiro e Balancetes
10. **CRUD Transações Financeiras** (`/api/financial/transactions`)
    - `GET /`: Extrato de transações com filtros de tipo (`income`/`expense`), status (`PAID`/`PENDING`) e período.
    - `GET /api/financial/summary`: Resumo consolidado (Saldo Atual, Total de Receitas, Total de Despesas, Inadimplência acumulada e Taxa de default).
    - `POST /`: Lançamento de nova conta/taxa condominial.
    - `PATCH /:id`: Atualização de lançamento não quitado.
    - `PATCH /:id/pay`: Baixa de pagamento com registro da data de quitação.
    - `DELETE /:id`: Exclusão de lançamento.

---

### 📢 Módulo 6: Mural de Comunicados
11. **CRUD Comunicados** (`/api/announcements`)
    - `GET /`: Lista de comunicados com suporte a busca textual e categorização.
    - `POST /`: Publicação de novo comunicado com prioridade e opção de fixação no topo.
    - `PATCH /:id`: Edição do conteúdo ou título.
    - `DELETE /:id`: Remoção do comunicado.

---

### 🛒 Módulo 7: Mercadinho Autônomo & Ponto de Venda (PDV)
12. **CRUD Produtos do Mercado** (`/api/market/products`)
    - `GET /`: Catálogo de produtos com status de estoque (alerta visual de estoque baixo).
    - `POST /`: Cadastro de item para venda no PDV.
    - `PATCH /:id`: Edição de preço e descrição.
    - `PATCH /:id/stock`: Ajuste rápido ou reposição de inventário.
    - `DELETE /:id`: Remoção de produto do catálogo.

13. **Fluxo de Venda / Checkout PDV** (`/api/market/checkout`)
    - `POST /api/market/checkout`: Conclusão de compra atômica com decremento transacional de estoque e suporte a formas de pagamento: **PIX**, **Cartão de Crédito/Débito** e **Débito em Boleto Condominial**.
    - `GET /api/market/sales`: Histórico consolidado de vendas e faturamento do minimercado.

---

### 📊 Módulo 8: Dashboard Executivo
14. **Consolidação em Tempo Real** (`/api/dashboard`)
    - `GET /api/dashboard`: Retorna métricas essenciais consolidadas por condomínio:
      - Encomendas pendentes de retirada.
      - Visitantes atualmente dentro do condomínio (`IN_PROPERTY`).
      - Saldo em caixa e taxa de inadimplência.
      - Reservas agendadas para o dia corrente.
      - Itens de mercado em ponto crítico de reposição.
      - Avisos urgentes em destaque.

---

## 🗄️ 4. Especificação do Banco de Dados Relacional (SQLite)

O novo schema relacional foi simplificado e normalizado, eliminando redundâncias legadas:

1. `condominiums` (id, name, cnpj, address, city, state, phone, status, created_at)
2. `blocks` (id, condominium_id [FK], name, description, status, created_at)
3. `units` (id, block_id [FK], number, floor, type, created_at)
4. `residents` (id, unit_id [FK], name, email, phone, cpf, role, emergency_contact, created_at)
5. `vehicles` (id, unit_id [FK], resident_id [FK], plate, model, color, type, parking_spot, created_at)
6. `deliveries` (id, unit_id [FK], resident_id [FK], courier, tracking_code, description, status, pickup_code, notes, received_at, picked_up_at, cancelled_at)
7. `access_logs` (id, destination_unit_id [FK], visitor_name, document, type, status, company, vehicle_plate, entered_at, exited_at)
8. `spaces` (id, condominium_id [FK], name, capacity, description, created_at)
9. `reservations` (id, space_id [FK], resident_id [FK], unit_id [FK], reservation_date, start_time, end_time, status, notes, created_at)
10. `financial_transactions` (id, condominium_id [FK], unit_id [FK], type, category, description, amount, due_date, status, payment_date, created_at)
11. `announcements` (id, condominium_id [FK], title, content, category, priority, is_pinned, created_at)
12. `market_products` (id, condominium_id [FK], name, category, price, stock_quantity, min_stock, barcode, created_at)
13. `market_sales` (id, condominium_id [FK], unit_id [FK], resident_id [FK], total_amount, payment_method, created_at)
14. `market_sale_items` (id, sale_id [FK], product_id [FK], quantity, unit_price, subtotal)
15. `condominium_modules` (id, condominium_id [FK], module_key, is_enabled)

---

## ⚡ 5. Estratégia de Reuso Irredutível e Redução de Linhas (DRY)

Para garantir que o código seja minimalista, simples e sem repetições:

1. **`BaseRepository`**:
   - Métodos genéricos parametrizados: `findById(id)`, `findAll(filter)`, `create(data)`, `update(id, data)`, `delete(id)`, `count(filter)`.
   - Gera queries SQL seguras via SQLite Prepared Statements automaticamente, reduzindo 70% do código repetido de acesso a dados.

2. **`BaseController` e `BaseService`**:
   - Um controlador/serviço CRUD base padronizado que resolve as operações comuns em 3 a 5 linhas por recurso, deixando apenas regras de negócio personalizadas para classes filhas.

3. **`asyncHandler` + `validateAndHydrate(DomainClass)`**:
   - Middleware/helper único que pega o payload da requisição, injeta na Entidade DDD, executa `.validate()` e entrega o objeto limpo para o Service. Erros de validação retornam instantaneamente HTTP `400 Bad Request` com lista clara de violações.

---

## 🎨 6. Diretrizes do Frontend Moderno ("Não Regular")

O frontend será desenvolvido com uma experiência visual de altíssimo nível (WOW factor):
- **Design System Vanilla CSS**: Design tokens sem frameworks pesados, paletas sofisticadas (Dark/Light mode automático), tipografia Google Fonts (Plus Jakarta Sans & Outfit).
- **Glassmorphism & Micro-Interações**: Cards com desfoque de fundo suave, sombras elegantes, feedbacks de transição suaves em hover/focus.
- **Componentes Reutilizáveis de Alto Padrão**:
  - `StatCard`: Cards dinâmicos com gráficos miniaturas e badges coloridos.
  - `DataTable`: Tabela com busca em tempo real, paginação suave e filtros visuais.
  - `Modal`: Janelas modais responsivas com animação de fade/scale para criação e edição.
  - `ToastNotification`: Alertas flutuantes modernos de sucesso e erro.
