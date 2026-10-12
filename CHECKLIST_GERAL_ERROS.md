# CHECKLIST GERAL DE ERROS, INCONSISTÊNCIAS E RISCOS — PRATICOM ERP

Este documento consolida o diagnóstico técnico completo realizado em todas as camadas do **Praticom ERP** (`Banco de dados → DAOs/Models → Backend/API → Serviços do Frontend → Componentes e Telas → Usuário`), sem suposições e baseado exclusivamente no código e no banco de dados reais.

---

## Índice da Checklist

| ID | Título Resumido | Status | Prioridade | Camada |
|---|---|---|---|---|
| **BUG-001** | Restrição `UNIQUE(block, number)` colide unidades entre condomínios distintos | Confirmado | P0 Crítico | Banco de Dados |
| **BUG-002** | Checkout no PDV em cota condominial omite `condominium_id` vazando para Condomínio 1 | Confirmado | P0 Crítico | Backend / Integração |
| **BUG-003** | Mutação e exclusão por ID sem checagem de tenant (Vulnerabilidade IDOR Cross-Tenant) | Confirmado | P0 Crítico | Segurança / Backend |
| **BUG-004** | Criação de dependentes sem validar condomínio da unidade/espaço (ID Spoofing) | Confirmado | P1 Alto | Segurança / Backend |
| **BUG-005** | Incompatibilidade de Enum de status em Reservas (`CONFIRMED` vs `Confirmada`) | Confirmado | P1 Alto | Frontend / Integração |
| **BUG-006** | Contrato quebrado no Dashboard (`/api/dashboard` vs `DashboardView` e `Sidebar`) | Confirmado | P1 Alto | Integração / Frontend |
| **BUG-007** | Divergência entre DDL declarada e banco real (Foreign Keys ausentes em runtime) | Confirmado | P1 Alto | Banco de Dados / Integridade |
| **BUG-008** | Filtro de prioridade na tela de comunicados é ignorado pelo backend | Confirmado | P2 Médio | Backend / Integração |
| **BUG-009** | Listagens com potencial de crescimento contínuo sem paginação (`LIMIT`/`OFFSET`) | Confirmado | P2 Médio | Backend / Desempenho |
| **BUG-010** | Cláusula booleana duplicada/redundante no teste de conflito de reservas | Confirmado | P3 Baixo | Backend / Lógica |
| **BUG-011** | Nome de condomínio estático hardcoded no banner de boas-vindas do Dashboard | Confirmado | P2 Médio | Frontend / Interface |
| **BUG-012** | Seletor de Perfil (Role Switcher) é meramente visual sem autorização real | Confirmado | P2 Médio | Segurança / Frontend |
| **RISK-001** | Ausência total de autenticação/sessão e confiança cega no header `X-Condominium-Id` | Risco Potencial | P1 Alto | Segurança / Arquitetura |
| **RISK-002** | Concorrência síncrona do SQLite (`better-sqlite3`) bloqueando Event Loop em writes | Risco Potencial | P2 Médio | Banco de Dados / Arquitetura |
| **RISK-003** | Risco de orfandade de dados territoriais em exclusões manuais sem cascade | Risco Potencial | P2 Médio | Banco de Dados / Integridade |
| **INV-001** | Regra "Limite de 1h de reserva por morador/dia" não fiscalizada no Backend | Precisa Investigar | P2 Médio | Backend / Regra de Negócio |
| **INV-002** | Ausência de restrição de unicidade para CPF, Placa de Veículo e Documento | Precisa Investigar | P2 Médio | Banco de Dados / Integridade |

---

## Detalhamento Individual dos Problemas

### - [ ] ID: BUG-001
- **Título:** Restrição `UNIQUE(block, number)` em `units` causa colisão e falha de inserção cross-condomínio.
- **Status:** Confirmado.
- **Prioridade:** P0 Crítico.
- **Camada:** Banco de Dados.
- **Localização:** `server/schema.sql` (linha 39), `server/condo_database.sqlite` (índice automático `sqlite_autoindex_units_1`), `server/dao/ResidentDAO.js` (linhas 77-80 e 87-93).
- **Evidência:** No SQLite real e no schema, a constraint declarada é `UNIQUE(block, number)` onde `block` é a string do bloco. Se o Condomínio 1 cadastrar a unidade "101" na "Torre A", o Condomínio 2 recebe o erro `UNIQUE constraint failed: units.block, units.number` ao tentar cadastrar o apartamento "101" na sua própria "Torre A".
- **Causa raiz:** Resquício do schema inicial monousuário, antes da introdução da tabela relacional `blocks` e do particionamento multi-tenant.
- **Impacto:** Impede o cadastramento de apartamentos em novos condomínios sempre que os nomes dos blocos e os números de apartamentos coincidirem.
- **Dependências:** Nenhuma.
- **Correção proposta:** Substituir a restrição de unicidade na tabela `units` para `UNIQUE(block_id, number)` e garantir que `block_id` seja obrigatório para novos registros. Em bancos existentes, recriar a tabela preservando os dados via tabela temporária.
- **Arquivos que provavelmente precisarão ser alterados:** `server/schema.sql`, `server/config/DatabaseSingleton.js`, `server/dao/ResidentDAO.js`.
- **Testes de validação:** Criar dois condomínios de teste, adicionar o bloco "Torre A" em ambos e cadastrar a unidade "101" em ambos simultaneamente via `POST /api/units`.
- **Risco da correção:** Risco médio em migração de dados legados que ainda possuam `block_id IS NULL`. As unidades pendentes devem ser mapeadas previamente ou receber fallback.
- **Critério de conclusão:** Dois condomínios diferentes conseguem cadastrar a mesma numeração de unidade sob seus respectivos blocos sem erro de constraint.

---

### - [ ] ID: BUG-002
- **Título:** Checkout no PDV em cota condominial omite `condominium_id` vazando lançamento para o Condomínio 1.
- **Status:** Confirmado.
- **Prioridade:** P0 Crítico.
- **Camada:** Backend / Integração.
- **Localização:** `server/dao/MarketDAO.js` (linhas 176-181) e `server/server.js` (linhas 529-540).
- **Evidência:** No método `MarketDAO.checkout`, a gravação de transação financeira executa:
  ```javascript
  INSERT INTO financial_transactions (unit_id, description, amount, type, category, status, due_date)
  VALUES (?, 'Mercadinho Autônomo - Compra PDV', ?, 'INCOME', 'Mercadinho', 'PENDING', DATE('now', '+30 days'))
  ```
  O campo `condominium_id` não é passado e fica gravado como `NULL`. Devido à regra de retrocompatibilidade do Condomínio 1 (`WHERE (f.condominium_id = 1 OR f.condominium_id IS NULL)`), essa receita é creditada no extrato do Condomínio 1 e desaparece do extrato do condomínio real do comprador.
- **Causa raiz:** O endpoint `POST /api/market/checkout` não repassa `req.condominiumId` para o método `checkout` do `MarketDAO`, e o DAO não inclui a coluna no `INSERT`.
- **Impacto:** Corrupção contábil entre condomínios, violação de isolamento multi-tenant e inconsistência nos balanços do mercadinho.
- **Dependências:** Nenhuma.
- **Correção proposta:** Atualizar a rota em `server.js` para repassar `condominiumId: req.condominiumId` ao `marketDAO.checkout` e alterar a query de inserção para incluir `condominium_id`.
- **Arquivos que provavelmente precisarão ser alterados:** `server/server.js`, `server/dao/MarketDAO.js`.
- **Testes de validação:** Executar compra no PDV com `X-Condominium-Id: 2` com método `condo_bill` e consultar `GET /api/financial/transactions` com `X-Condominium-Id: 2` e `X-Condominium-Id: 1`.
- **Risco da correção:** Baixo.
- **Critério de conclusão:** A transação financeira gerada possui o `condominium_id` correto e aparece apenas no condomínio que realizou a compra.

---

### - [ ] ID: BUG-003
- **Título:** Mutação e exclusão por ID sem checagem de tenant (Vulnerabilidade IDOR Cross-Tenant).
- **Status:** Confirmado.
- **Prioridade:** P0 Crítico.
- **Camada:** Segurança / Backend.
- **Localização:**
  - `server/dao/DeliveryDAO.js` (`pickupDelivery`, linhas 83-104)
  - `server/dao/OperationsDAO.js` (`registerExit`, linhas 88-102)
  - `server/dao/OperationsDAO.js` (`deleteAnnouncement`, linhas 190-194)
  - `server/dao/ReservationDAO.js` (`cancelReservation`, linhas 112-118)
  - `server/dao/ResidentDAO.js` (`deleteResident`, linhas 248-252)
  - `server/dao/ResidentDAO.js` (`deleteUnit`, linhas 138-165)
  - `server/dao/MarketDAO.js` (`updateStock`, linhas 74-103)
- **Evidência:** Os métodos realizam `UPDATE ... WHERE id = ?` ou `DELETE ... WHERE id = ?` filtrando apenas pela chave primária informada na URL, sem validar se o registro pertence ao condomínio do requisitante. Um usuário enviando `X-Condominium-Id: 2` consegue excluir um morador do Condomínio 1 através de `DELETE /api/residents/1`.
- **Causa raiz:** Os métodos das DAOs foram escritos sem receber o parâmetro `condominiumId` de escopo.
- **Impacto:** Vulnerabilidade de segurança gravíssima (OWASP Top 10 - Broken Object Level Authorization), permitindo destruição ou alteração maliciosa de dados entre clientes distintos.
- **Dependências:** Nenhuma.
- **Correção proposta:** Adicionar o parâmetro `condominiumId` em todas as rotas e métodos de mutação/exclusão, verificando a posse do registro antes da operação ou incluindo o escopo no `WHERE` com `JOIN`/subquery.
- **Arquivos que provavelmente precisarão ser alterados:** `server/server.js`, `server/dao/DeliveryDAO.js`, `server/dao/OperationsDAO.js`, `server/dao/ReservationDAO.js`, `server/dao/ResidentDAO.js`, `server/dao/MarketDAO.js`.
- **Testes de validação:** Enviar requisição de exclusão com `X-Condominium-Id: 2` para um registro pertencente ao Condomínio 1 e esperar status `404 Not Found` ou `403 Forbidden` sem exclusão real no banco.
- **Risco da correção:** Baixo, desde que as consultas de verificação considerem o fallback do condomínio legado 1.
- **Critério de conclusão:** Nenhuma rota de alteração ou exclusão aceita mutação de registros de outros condomínios.

---

### - [ ] ID: BUG-004
- **Título:** Criação de registros dependentes sem validar vínculo territorial com o condomínio ativo (ID Spoofing).
- **Status:** Confirmado.
- **Prioridade:** P1 Alto.
- **Camada:** Segurança / Backend.
- **Localização:**
  - `server/dao/ResidentDAO.js` (`createResident`, `createVehicle`)
  - `server/dao/DeliveryDAO.js` (`createDelivery`)
  - `server/dao/OperationsDAO.js` (`registerEntry`)
  - `server/dao/ReservationDAO.js` (`createReservation`)
- **Evidência:** Os endpoints aceitam `unit_id` ou `space_id` no payload JSON e gravam os registros sem checar se a unidade ou o espaço pertencem ao `req.condominiumId`. Um cliente no Condomínio 2 pode cadastrar um veículo ou visitante associado ao apartamento do Condomínio 1.
- **Causa raiz:** Ausência de validação de pertinência relacional entre a chave estrangeira enviada e o tenant da requisição.
- **Impacto:** Corrupção lógica dos dados e possibilidade de poluição de dados de terceiros.
- **Dependências:** BUG-003.
- **Correção proposta:** Criar método utilitário nas DAOs para validar se a `unit_id` ou `space_id` pertence ao condomínio autenticado antes de executar o `INSERT`.
- **Arquivos que provavelmente precisarão ser alterados:** `server/dao/ResidentDAO.js`, `server/dao/DeliveryDAO.js`, `server/dao/OperationsDAO.js`, `server/dao/ReservationDAO.js`.
- **Testes de validação:** Tentar cadastrar um morador no Condomínio 2 passando a `unit_id` do Condomínio 1 e verificar se a API retorna `400 Bad Request` com mensagem explicativa.
- **Risco da correção:** Baixo.
- **Critério de conclusão:** Toda criação com `unit_id` ou `space_id` de outro condomínio é rejeitada no backend.

---

### - [ ] ID: BUG-005
- **Título:** Incompatibilidade de enum de status na tela de Reservas (`'CONFIRMED'` no Backend vs `'Confirmada'` no Frontend).
- **Status:** Confirmado.
- **Prioridade:** P1 Alto.
- **Camada:** Frontend / Integração.
- **Localização:** `client/src/views/ReservationsView.jsx` (linhas 98, 362, 369) e `server/dao/ReservationDAO.js` (linha 91).
- **Evidência:** O backend grava e retorna `status: 'CONFIRMED'`. No frontend `ReservationsView.jsx`:
  - Linha 98: `occupiedSlots = reservations.filter(r => r.space_id === activeSpace?.id && r.status === 'Confirmada')` -> Sempre resulta em lista vazia.
  - Linhas 362-366: Tabela testa `res.status === 'Confirmada'` para badge verde; como recebe `'CONFIRMED'`, exibe badge vermelho com o texto cru.
  - Linhas 369-377: Botão de cancelar só aparece se `res.status === 'Confirmada'` -> Nunca é renderizado.
- **Causa raiz:** Falta de padronização contratual no enum de status entre camadas.
- **Impacto:** A grade de agendamentos exibe horários já ocupados como "Disponível", permitindo tentativas de duplo agendamento, exibe status de erro visual na tabela e impede o cancelamento de reservas.
- **Dependências:** Nenhuma.
- **Correção proposta:** Padronizar a checagem no frontend para aceitar tanto `'CONFIRMED'` quanto `'Confirmada'`, ou normalizar `status.toUpperCase() === 'CONFIRMED'`.
- **Arquivos que provavelmente precisarão ser alterados:** `client/src/views/ReservationsView.jsx`.
- **Testes de validação:** Agendar um horário, verificar se a grade bloqueia o botão daquele horário em vermelho ("Reservado"), se o badge na tabela fica verde ("Confirmada") e se o botão "Cancelar" está visível e funcional.
- **Risco da correção:** Mínimo.
- **Critério de conclusão:** Grade bloqueia slots ocupados, tabela exibe badge verde e cancelamento funciona perfeitamente.

---

### - [ ] ID: BUG-006
- **Título:** Contrato quebrado no Dashboard (`/api/dashboard` retorna chaves divergentes das consumidas pelo Frontend).
- **Status:** Confirmado.
- **Prioridade:** P1 Alto.
- **Camada:** Integração / Frontend.
- **Localização:** `server/server.js` (linhas 108-118), `client/src/views/DashboardView.jsx` (linhas 69-97), `client/src/components/Sidebar.jsx` (linhas 20-27).
- **Evidência:** O backend retorna:
  ```json
  {
    "metrics": {
      "pendingDeliveries": 6,
      "activeAccess": 2,
      "overdueAmount": 0,
      "defaultRate": 0
    }
  }
  ```
  Porém, a `DashboardView.jsx` busca:
  - `metrics.balance` -> Não existe (exibe R$ 0,00 fixo).
  - `metrics.overdueCount` -> Não existe.
  - `metrics.activeVisitors` -> Não existe (backend retorna `activeAccess`).
  - `metrics.todayReservations` -> Não existe.
  E a `Sidebar.jsx` busca: `stats?.overdueCount`, `stats?.activeVisitors`, `stats?.todayReservations`, `stats?.lowStockItems`.
- **Causa raiz:** Desalinhamento histórico entre as propriedades geradas no endpoint agregador e as propriedades lidas pelos componentes visuais.
- **Impacto:** O painel inicial do sistema apresenta informações zeradas ou incompletas, transmitindo a impressão de sistema quebrado.
- **Dependências:** Nenhuma.
- **Correção proposta:** Alinhar o payload retornado por `server.js` em `/api/dashboard` para conter: `pendingDeliveries`, `activeVisitors` (alias de `activeAccess`), `balance` (calculado via `financialDAO.getSummary`), `overdueAmount`, `defaultRate`, `todayReservations` (contagem de reservas do dia) e `lowStockItems`.
- **Arquivos que provavelmente precisarão ser alterados:** `server/server.js`, `client/src/views/DashboardView.jsx`.
- **Testes de validação:** Acessar o Dashboard com dados pré-cadastrados no condomínio e conferir se todos os 4 cards exibem valores reais diferentes de zero.
- **Risco da correção:** Baixo.
- **Critério de conclusão:** Todos os cards do Dashboard e os badges da Sidebar refletem os números reais retornados pelo banco.

---

### - [ ] ID: BUG-007
- **Título:** Divergência entre DDL declarada e banco real (Foreign Keys ausentes em tempo de execução).
- **Status:** Confirmado.
- **Prioridade:** P1 Alto.
- **Camada:** Banco de Dados / Integridade.
- **Localização:** `server/condo_database.sqlite`, `server/config/DatabaseSingleton.js` (linhas 41-60), `server/schema.sql`.
- **Evidência:** `PRAGMA foreign_key_list` comprova que `announcements`, `spaces`, `market_products` e `units(block_id)` não possuem chaves estrangeiras ativas no banco real, apesar de declaradas em `schema.sql`. Isso ocorreu devido ao uso de `ALTER TABLE ADD COLUMN` em bancos que já existiam fisicamente.
- **Causa raiz:** Limitação arquitetural do SQLite em que o comando `ALTER TABLE ADD COLUMN` não aceita declaração de constraints de Foreign Key.
- **Impacto:** Falha na garantia de integridade referencial nativa do motor do banco; registros órfãos podem surgir se registros pai forem apagados fora do controle da aplicação.
- **Dependências:** Nenhuma.
- **Correção proposta:** Criar script seguro de migração DDL que recrie as tabelas afetadas com o schema canônico completo através do padrão de tabela temporária (`CREATE TABLE new_...`, `INSERT INTO new_... SELECT ...`, `DROP TABLE old_...`, `ALTER TABLE new_... RENAME TO old_...`), preservando 100% dos dados existentes.
- **Arquivos que provavelmente precisarão ser alterados:** `server/config/DatabaseSingleton.js`, `server/schema.sql`.
- **Testes de validação:** Executar `PRAGMA foreign_key_list` para cada tabela e verificar se as constraints apontam corretamente para `condominiums(id)` e `blocks(id)`.
- **Risco da correção:** Médio. Requer backup prévio e transação SQLite estrita.
- **Critério de conclusão:** Todas as tabelas no SQLite real possuem as chaves estrangeiras ativas validadas por `PRAGMA foreign_key_list`.

---

### - [ ] ID: BUG-008
- **Título:** Filtro de prioridade na tela de comunicados é ignorado pelo backend.
- **Status:** Confirmado.
- **Prioridade:** P2 Médio.
- **Camada:** Backend / Integração.
- **Localização:** `client/src/views/AnnouncementsView.jsx` (linhas 40-42) e `server/dao/OperationsDAO.js` (linhas 135-162).
- **Evidência:** O frontend envia `priority` na query string (`api.getAnnouncements({ category, priority })`), mas o método `AnnouncementDAO.getAnnouncements` só implementa filtros para `category` e `search`. O parâmetro `priority` é descartado.
- **Causa raiz:** Omissão da cláusula `if (priority) sql += ' AND priority = ?'` no DAO.
- **Impacto:** O usuário seleciona uma prioridade no filtro da tela de avisos, mas a lista não é filtrada.
- **Dependências:** Nenhuma.
- **Correção proposta:** Adicionar suporte ao parâmetro `priority` no método `getAnnouncements` da classe `AnnouncementDAO` e repassar `req.query.priority` em `server.js`.
- **Arquivos que provavelmente precisarão ser alterados:** `server/server.js`, `server/dao/OperationsDAO.js`.
- **Testes de validação:** Realizar requisição `GET /api/announcements?priority=urgent` e verificar se apenas comunicados urgentes são retornados.
- **Risco da correção:** Mínimo.
- **Critério de conclusão:** Filtro de prioridade na tela de avisos reflete os registros correspondentes.

---

### - [ ] ID: BUG-009
- **Título:** Listagens com potencial de crescimento contínuo sem paginação (`LIMIT`/`OFFSET`).
- **Status:** Confirmado.
- **Prioridade:** P2 Médio.
- **Camada:** Backend / Desempenho.
- **Localização:** `server/dao/OperationsDAO.js` (`getAccessLogs`), `server/dao/DeliveryDAO.js` (`getDeliveries`), `server/dao/FinancialDAO.js` (`getTransactions`), `server/dao/MarketDAO.js` (`getSales`).
- **Evidência:** As consultas SQL realizam `SELECT ... ORDER BY ...` sem limites de quantidade. Em um condomínio real com meses de uso, dezenas de milhares de registros de acesso ou encomendas são lidos na íntegra para a memória do Node.js e enviados pela rede.
- **Causa raiz:** Implementação inicial orientada a protótipo sem paginação.
- **Impacto:** Lentidão crescente e aumento de uso de memória no navegador e no servidor conforme o condomínio acumula histórico.
- **Dependências:** Nenhuma.
- **Correção proposta:** Adicionar suporte a parâmetros opcionais `page` e `limit` com valores padrão razoáveis (ex: limit 50 ou 100) nas rotas e DAOs.
- **Arquivos que provavelmente precisarão ser alterados:** `server/server.js`, `server/dao/OperationsDAO.js`, `server/dao/DeliveryDAO.js`, `server/dao/FinancialDAO.js`, `server/dao/MarketDAO.js`.
- **Testes de validação:** Chamar os endpoints com `?limit=10&page=1` e validar a quantidade de itens retornada.
- **Risco da correção:** Baixo, mantendo retrocompatibilidade quando os parâmetros não forem fornecidos.
- **Critério de conclusão:** As consultas aceitam paginação sem quebrar o consumo das telas existentes.

---

### - [ ] ID: BUG-010
- **Título:** Cláusula booleana redundante/duplicada no teste de conflito de reservas no SQLite.
- **Status:** Confirmado.
- **Prioridade:** P3 Baixo.
- **Camada:** Backend / Lógica de Negócio.
- **Localização:** `server/dao/ReservationDAO.js` (linhas 72-78).
- **Evidência:** O SQL de verificação de sobreposição contém:
  ```sql
  AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?))
  ```
  Passando exatamente a mesma tupla de parâmetros repetida duas vezes: `data.end_time, data.start_time, data.end_time, data.start_time`.
- **Causa raiz:** Erro de edição/duplicação acidental de expressão lógica no código-fonte.
- **Impacto:** Redundância inútil na montagem da query e custo extra de avaliação pelo otimizador do SQLite.
- **Dependências:** Nenhuma.
- **Correção proposta:** Simplificar a cláusula para a verificação canônica de intervalos: `AND (start_time < ? AND end_time > ?)` recebendo `[data.end_time, data.start_time]`.
- **Arquivos que provavelmente precisarão ser alterados:** `server/dao/ReservationDAO.js`.
- **Testes de validação:** Executar tentativas de reserva no mesmo horário e verificar se o conflito continua sendo bloqueado com erro 400.
- **Risco da correção:** Mínimo.
- **Critério de conclusão:** Expressão SQL limpa e teste de conflito de horários funcionando perfeitamente.

---

### - [ ] ID: BUG-011
- **Título:** Nome de condomínio estático hardcoded no banner de boas-vindas do Dashboard.
- **Status:** Confirmado.
- **Prioridade:** P2 Médio.
- **Camada:** Frontend / Interface.
- **Localização:** `client/src/views/DashboardView.jsx` (linha 32).
- **Evidência:** No arquivo `DashboardView.jsx` está escrito estaticamente:
  `<span className="welcome-banner-condo">Condomínio Residencial Parque das Flores</span>`
  Mesmo quando o condomínio selecionado é "Condomínio Alpha Praticom" ou "Condomínio Beta Praticom".
- **Causa raiz:** Texto fixo inserido no HTML do protótipo que não foi substituído pela propriedade dinâmica do condomínio ativo.
- **Impacto:** Erro visual que confunde o usuário ao alternar entre condomínios.
- **Dependências:** Nenhuma.
- **Correção proposta:** Passar o nome do condomínio ativo via props ou lê-lo do seletor/contexto e renderizar dinamicamente `{activeCondominiumName}`.
- **Arquivos que provavelmente precisarão ser alterados:** `client/src/App.jsx`, `client/src/views/DashboardView.jsx`.
- **Testes de validação:** Alternar de condomínio na topbar e verificar se o banner do Dashboard reflete imediatamente o nome correto.
- **Risco da correção:** Nulo.
- **Critério de conclusão:** O banner exibe sempre o nome do condomínio ativo selecionado.

---

### - [ ] ID: BUG-012
- **Título:** Seletor de Perfil (Role Switcher) é meramente visual sem autorização real.
- **Status:** Confirmado.
- **Prioridade:** P2 Médio.
- **Camada:** Segurança / Frontend.
- **Localização:** `client/src/components/Header.jsx` (linhas 47-66), `client/src/App.jsx` (linha 19).
- **Evidência:** Os botões "Síndico", "Portaria" e "Morador" apenas alternam o estado `userRole` em `App.jsx`. Esse estado não é utilizado em nenhuma condição das telas, não oculta botões de exclusão, não é enviado nos headers da API e o backend não valida papéis.
- **Causa raiz:** Recurso de mockup visual não conectado à lógica de autorização.
- **Impacto:** Ilusão de perfil; um usuário como "Morador" consegue visualizar e acionar recursos administrativos se tiver acesso à interface.
- **Dependências:** RISK-001.
- **Correção proposta:** Condicionar visualmente as ações de gestão e botões destrutivos conforme `userRole` no frontend e preparar cabeçalho `X-User-Role` com validação no backend quando a autenticação for implementada.
- **Arquivos que provavelmente precisarão ser alterados:** `client/src/App.jsx`, `client/src/components/Sidebar.jsx`, `client/src/views/*.jsx`.
- **Testes de validação:** Alternar para perfil "Morador" e conferir que abas restritas (como Financeiro ou Gestão de Blocos) são ocultadas ou desabilitadas.
- **Risco da correção:** Baixo.
- **Critério de conclusão:** A visão do usuário adapta-se ao papel selecionado.

---

### - [ ] ID: RISK-001
- **Título:** Ausência total de autenticação/sessão e confiança cega no header `X-Condominium-Id`.
- **Status:** Risco Potencial.
- **Prioridade:** P1 Alto.
- **Camada:** Segurança / Arquitetura.
- **Localização:** `server/middleware/tenantContext.js` (linhas 10-19) e `client/src/services/api.js` (linhas 18-20).
- **Evidência:** A API inteira aceita qualquer valor numérico no header `X-Condominium-Id` sem exigência de JWT, sessão, token de API ou cookie de autenticação.
- **Causa raiz:** O projeto foi desenhado para ambiente acadêmico/demonstração funcional rápida.
- **Impacto:** Em qualquer deploy público ou em rede interna, qualquer cliente pode invadir e ler dados de qualquer condomínio alterando uma string no header HTTP.
- **Dependências:** Nenhuma.
- **Correção proposta:** Desenhar camada de autenticação com tabela de usuários (`users`), login via email/senha com hash bcrypt e geração de token JWT contendo `userId` e os `condominiumIds` autorizados.
- **Arquivos que provavelmente precisarão ser alterados:** `server/server.js`, `server/middleware/tenantContext.js`, `client/src/services/api.js`.
- **Testes de validação:** Tentar chamar endpoints sem token Bearer válido e receber `401 Unauthorized`.
- **Risco da correção:** Médio (adiciona fluxo de login e telas de autenticação).
- **Critério de conclusão:** Endpoints rejeitam requisições sem credenciais válidas.

---

### - [ ] ID: RISK-002
- **Título:** Concorrência síncrona do SQLite (`better-sqlite3`) bloqueando Event Loop em writes.
- **Status:** Risco Potencial.
- **Prioridade:** P2 Médio.
- **Camada:** Banco de Dados / Arquitetura.
- **Localização:** `server/config/DatabaseSingleton.js`, `server/dao/MarketDAO.js` (linhas 126-186).
- **Evidência:** O driver `better-sqlite3` é síncrono. Enquanto uma transação de escrita complexa roda (como o checkout do PDV iterando múltiplos itens e gerando cobrança financeira), todas as outras requisições HTTP da API ficam paradas aguardando a liberação do Event Loop.
- **Causa raiz:** Escolha do SQLite embarcado com driver síncrono para múltiplos condomínios simultâneos.
- **Impacto:** Sob carga moderada ou alta concorrência de múltiplos operadores, a API pode apresentar picos de latência e erros de `SQLITE_BUSY`.
- **Dependências:** Nenhuma.
- **Correção proposta:** Configurar `busy_timeout` apropriado no SQLite (`db.pragma('busy_timeout = 5000')`) e manter transações curtas e otimizadas.
- **Arquivos que provavelmente precisarão ser alterados:** `server/config/DatabaseSingleton.js`.
- **Testes de validação:** Teste de estresse com 50 requisições simultâneas de checkout e leitura.
- **Risco da correção:** Mínimo.
- **Critério de conclusão:** `busy_timeout` ativo e zero falhas de concorrência em requisições paralelas.

---

### - [ ] ID: RISK-003
- **Título:** Risco de orfandade de dados em exclusões manuais sem cascade.
- **Status:** Risco Potencial.
- **Prioridade:** P2 Médio.
- **Camada:** Banco de Dados / Integridade.
- **Localização:** `server/dao/CondominiumDAO.js` (linhas 62-67 e 101-106).
- **Evidência:** O método `deleteCondominium` apenas checa se existem blocos vinculados. Se um condomínio tiver anúncios em `announcements`, produtos em `market_products` ou espaços em `spaces` sem blocos, a exclusão do condomínio prossegue e os registros ficam órfãos com `condominium_id` apontando para o ID apagado.
- **Causa raiz:** Checagem de dependência relacional incompleta na camada DAO.
- **Impacto:** Registros órfãos acumulados no banco de dados.
- **Dependências:** BUG-007.
- **Correção proposta:** Validar todas as entidades dependentes antes da exclusão de condomínio e bloco, ou ativar cascata relacional segura.
- **Arquivos que provavelmente precisarão ser alterados:** `server/dao/CondominiumDAO.js`.
- **Testes de validação:** Tentar excluir condomínio com comunicados ou produtos e verificar se a operação é bloqueada com erro 409.
- **Risco da correção:** Baixo.
- **Critério de conclusão:** Exclusão bloqueada caso qualquer registro dependente exista.

---

### - [ ] ID: INV-001
- **Título:** Regra "Limite de 1h de reserva por morador/dia" não fiscalizada no Backend.
- **Status:** Precisa Investigar.
- **Prioridade:** P2 Médio.
- **Camada:** Backend / Regra de Negócio.
- **Localização:** `client/src/views/ReservationsView.jsx` (linhas 181-185) vs `server/dao/ReservationDAO.js` (linhas 62-110).
- **Evidência:** A interface destaca como "Regra Oficial do Condomínio: Limite de 1 Hora por Morador / Dia". No entanto, em `ReservationDAO.createReservation`, só há checagem de sobreposição de horário no mesmo espaço (`AND space_id = ? AND reservation_date = ?`), sem conferir se o `resident_id` ou `unit_id` já atingiu 1 hora reservada naquela data.
- **Causa raiz:** Regra comunicada textualmente na interface sem implementação do validador correspondente na regra de negócio da API.
- **Impacto:** Um morador pode agendar múltiplas reservas no mesmo dia furando a política oficial do condomínio anunciada na tela.
- **Dependências:** Nenhuma.
- **Correção proposta:** Adicionar verificação em `createReservation`: consultar se a soma de horas reservadas pela unidade/morador na data solicitada ultrapassa 1 hora (ou permitir que o administrador configure se a regra é bloqueante ou consultiva).
- **Arquivos que provavelmente precisarão ser alterados:** `server/dao/ReservationDAO.js`.
- **Testes de validação:** Criar uma reserva de 1h para uma unidade no dia D e tentar agendar uma segunda reserva para a mesma unidade no mesmo dia D, esperando rejeição 400.
- **Risco da correção:** Baixo.
- **Critério de conclusão:** A API fiscaliza e bloqueia reservas excedentes no mesmo dia por morador.

---

### - [ ] ID: INV-002
- **Título:** Ausência de restrição de unicidade para CPF, Placa de Veículo e Documento.
- **Status:** Precisa Investigar.
- **Prioridade:** P2 Médio.
- **Camada:** Banco de Dados / Integridade.
- **Localização:** `server/dao/ResidentDAO.js` (`createResident`, `createVehicle`), `server/schema.sql` (linhas 45-70).
- **Evidência:** No `schema.sql` e no SQLite real, as colunas `residents.cpf` e `vehicles.plate` não possuem restrição `UNIQUE`. Um operador pode cadastrar o mesmo CPF para moradores diferentes ou a mesma placa de carro vinculada a unidades distintas do mesmo condomínio sem nenhum aviso ou bloqueio.
- **Causa raiz:** Omissão de índices únicos para identificadores cadastrais.
- **Impacto:** Dados duplicados, inconsistência no controle de acesso de veículos e duplicidade de cadastros de moradores.
- **Dependências:** Nenhuma.
- **Correção proposta:** Avaliar se a regra do condomínio exige unicidade global ou unicidade por condomínio (`UNIQUE(condominium_id, plate)`) e implementar a checagem no DAO antes da inserção.
- **Arquivos que provavelmente precisarão ser alterados:** `server/dao/ResidentDAO.js`, `server/schema.sql`.
- **Testes de validação:** Cadastrar morador com mesmo CPF duas vezes e cadastrar veículo com mesma placa duas vezes.
- **Risco da correção:** Médio caso já existam dados legados duplicados no banco.
- **Critério de conclusão:** Validador impede duplicidade acidental no mesmo condomínio.
