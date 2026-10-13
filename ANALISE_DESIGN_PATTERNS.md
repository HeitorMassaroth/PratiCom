# 🏛️ ANÁLISE DE DESIGN PATTERNS DO PRATICOM ERP

**Documento:** Auditoria Técnica e Diagnóstico de Padrões de Projeto  
**Projeto:** Praticom ERP (Sistema Integrado de Gestão Condominial)  
**Ambiente:** Node.js v24 + Express 4.18 | better-sqlite3 | React 18 + Vite 5  
**Data:** Outubro de 2026  
**Finalidade:** Diagnóstico estritamente analítico (sem alterações no código-fonte), avaliando aderência, consistência e oportunidades de reutilização dos Design Patterns existentes.

---

## 1. Visão Geral dos Padrões Identificados

A análise do código-fonte real do **Praticom ERP** revelou uma arquitetura com clara intenção de padronização, especialmente no backend. O sistema adota padrões formais da **Gang of Four (GoF)** para desacoplamento de persistência, regras de negócio e controle de produto, além de padrões arquiteturais em camadas e no frontend.

A tabela a seguir consolida o inventário dos padrões detectados e sua situação técnica atual:

| Item | Descrição |
|---|---|
| **Design Pattern** | **SINGLETON** (GoF Criacional) |
| **Localização** | `server/config/DatabaseSingleton.js`<br>`server/config/AppConfigSingleton.js` |
| **Situação** | **Correto** |
| **Evidência** | Construtores validam `instance` existente (`if (DatabaseSingleton.instance) return DatabaseSingleton.instance;`), instanciam e congelam o objeto exportado com `Object.freeze(instance)`. |
| **Recomendação** | **Manter**. Padrão maduro, estável e indispensável para a integridade de conexão do SQLite (`PRAGMA foreign_keys = ON;`, `journal_mode = WAL`) e cache de Feature Flags. |

| Item | Descrição |
|---|---|
| **Design Pattern** | **DATA ACCESS OBJECT — DAO** (GoF Estrutural) |
| **Localização** | `server/dao/CondominiumDAO.js`<br>`server/dao/ResidentDAO.js`<br>`server/dao/DeliveryDAO.js`<br>`server/dao/FinancialDAO.js`<br>`server/dao/MarketDAO.js`<br>`server/dao/OperationsDAO.js`<br>`server/dao/ReservationDAO.js` |
| **Situação** | **Correto** (com ressalvas menores de organização) |
| **Evidência** | Todas as queries SQL DML/DQL estão 100% isoladas dentro dos métodos dos DAOs. As rotas HTTP em `server.js` nunca executam queries SQL brutas diretamente. |
| **Recomendação** | **Manter e Ajustar Organização**. Manter o padrão em novas funcionalidades. O único ajuste recomendado é separar `OperationsDAO.js`, que agrupa duas classes não relacionadas no mesmo arquivo (`AccessDAO` e `AnnouncementDAO`). |

| Item | Descrição |
|---|---|
| **Design Pattern** | **FACTORY METHOD** (GoF Criacional) |
| **Localização** | `server/dao/DAOFactory.js` (`DAOFactory.getDAO(type)`) |
| **Situação** | **Correto** |
| **Evidência** | Utilizado na inicialização de `server.js` (linhas 16–23) e em testes para obter instâncias de DAOs sem acoplamento direto com as classes concretas. |
| **Recomendação** | **Manter e Ajustar Instanciação em Middlewares**. Em `server/middleware/moduleGuard.js`, `DAOFactory.getDAO('condominium')` é chamado a cada requisição HTTP, instanciando um novo objeto por request. Recomenda-se cachear ou injetar a instância para evitar alocações repetitivas. |

| Item | Descrição |
|---|---|
| **Design Pattern** | **TEMPLATE METHOD** (GoF Comportamental) |
| **Localização** | `server/services/templates/ReportTemplate.js`<br>`server/services/templates/PaymentTemplate.js`<br>`server/services/templates/NotificationTemplate.js` |
| **Situação** | **Parcial** |
| **Evidência** | As classes abstratas definem algoritmos de esqueleto perfeitos (`generateReport()`, `processPayment()`, `sendNotification()`). No entanto, o `FinancialReportGenerator` é chamado apenas em uma rota de relatório pontual (`/api/financial/report`), os dispatchers de notificação apenas imprimem logs via `console.log`, e o processador de pagamento simula autorizações em memória antes da transação SQL do PDV. |
| **Recomendação** | **Ajustar e Reutilizar**. O esqueleto algorítmico é excelente, mas está subutilizado. Pode ser aproveitado de forma real para despachar notificações de reservas e acessos, e para padronizar relatórios de moradores e encomendas. |

| Item | Descrição |
|---|---|
| **Design Pattern** | **CHAIN OF RESPONSIBILITY / INTERCEPTOR** (GoF Comportamental / Padrão Middleware) |
| **Localização** | `server/middleware/tenantContext.js`<br>`server/middleware/moduleGuard.js`<br>`server/server.js` (`checkFeature`) |
| **Situação** | **Correto** |
| **Evidência** | Middlewares encadeados no Express interceptam o pipeline HTTP: 1º valida tenant ativo (`tenantContextMiddleware`), 2º valida contratação de módulo (`checkModuleAvailability`), 3º valida feature flag (`checkFeature`). |
| **Recomendação** | **Manter e Reutilizar**. Padrão muito bem estruturado e extensível. Novas restrições ou validações (como controle de permissões por perfil de usuário) devem seguir este mesmo formato de middleware. |

| Item | Descrição |
|---|---|
| **Design Pattern** | **FACADE / SERVICE LAYER** (GoF Estrutural) |
| **Localização** | `client/src/services/api.js` |
| **Situação** | **Correto** |
| **Evidência** | Centraliza toda a infraestrutura de comunicação HTTP Fetch, parsing de JSON, tratamento inicial de erros e injeção automática do cabeçalho `X-Condominium-Id`, expondo métodos simples e declarativos (`api.getResidents()`, `api.createVehicle()`). |
| **Recomendação** | **Manter e Expandir**. Todo acesso do frontend a dados deve continuar passando exclusivamente por este serviço, impedindo chamadas `fetch` diretas espalhadas nos componentes. |

| Item | Descrição |
|---|---|
| **Design Pattern** | **OBSERVER / EVENT-DRIVEN** (GoF Comportamental) |
| **Localização** | `client/src/views/CondominiumsBlocksView.jsx` (despacho)<br>`client/src/components/CondominiumSelector.jsx` (escuta) |
| **Situação** | **Inconsistente** |
| **Evidência** | `CondominiumsBlocksView.jsx` emite `window.dispatchEvent(new Event('condo-list-changed'))` ao alterar condomínios, e `CondominiumSelector.jsx` recarrega sua lista via `window.addEventListener`. Porém, ao alterar o condomínio selecionado, a comunicação com o restante da aplicação ocorre por prop drilling (`onCondoChange`), `localStorage` e recarregamentos manuais, sem um barramento ou Contexto reativo unificado. |
| **Recomendação** | **Ajustar**. Padronizar o estado global de tenant usando **React Context** (`CondoContext`) para que todas as telas reajam instantaneamente à troca de condomínio sem precisar de eventos `window` customizados ou callbacks manuais. |

| Item | Descrição |
|---|---|
| **Design Pattern** | **CONTAINER & PRESENTATIONAL COMPONENTS** (Padrão de Interface React) |
| **Localização** | `client/src/views/*` vs `client/src/components/*` |
| **Situação** | **Inconsistente (Oportunidade Crítica de Melhoria)** |
| **Evidência** | Cada uma das 9 views atua como "God Component", concentrando gerenciamento de estado complexo, regras de validação, requisições de API, modais HTML/CSS completos, inputs de busca e tabelas customizadas de forma duplicada. |
| **Recomendação** | **Ajustar**. Extrair componentes reutilizáveis para `<Modal>`, `<SearchFilterBar>` e `<DataTable>`, reduzindo centenas de linhas repetidas no frontend. |

---

## 2. Análise Detalhada por Camada

### 2.1 Backend: Padrões de Persistência e Infraestrutura

#### A. Singleton (`DatabaseSingleton` & `AppConfigSingleton`)
* **Aplicação Técnica:** O `DatabaseSingleton` garante que a conexão com o arquivo SQLite (`condo_database.sqlite`) seja aberta apenas uma vez durante todo o ciclo de vida do processo Node.js. Isso é vital para drivers baseados em C como o `better-sqlite3`, pois evita travamentos de arquivo por múltiplos handles concorrentes e centraliza a execução obrigatória de:
  ```javascript
  this.db.pragma('foreign_keys = ON');
  this.db.pragma('journal_mode = WAL');
  this.db.pragma('busy_timeout = 5000');
  ```
* **Pontos Fortes:** O uso de `Object.freeze(instance)` no módulo exportado impede mutações acidentais da referência do Singleton.
* **Pontos de Atenção:** O método `applyCompatibilityMigrations()` no `DatabaseSingleton` executa migrações dinâmicas de colunas na inicialização. Embora funcional para retrocompatibilidade, mistura a responsabilidade de *conexão* com a de *versionamento de schema*.

#### B. DAO & Factory Method
* **Separação de Responsabilidades:** O isolamento das operações de banco de dados nos 8 DAOs é um dos pontos mais fortes do repositório. O arquivo de rotas (`server.js`) funciona puramente como roteador e orquestrador HTTP.
* **Consistência do Factory:** Todas as 8 DAOs são instanciadas via `DAOFactory.getDAO()`. Não existem instâncias de DAOs criadas manualmente em `server.js`.
* **Inconsistência Identificada:**
  * Em `server/dao/OperationsDAO.js`, coexistem duas classes distintas: `AccessDAO` (portaria e controle de acessos) e `AnnouncementDAO` (mural de comunicados). Por clareza arquitetural, deveriam estar em arquivos separados (`AccessDAO.js` e `AnnouncementDAO.js`), já que lidam com domínios de negócio e tabelas totalmente diferentes.

#### C. Template Method
* **Avaliação do Algoritmo:** Os templates em `server/services/templates/` estão tecnicamente bem estruturados, utilizando o padrão canônico da GoF: método esqueleto na classe mãe (`final` por convenção) invocando métodos abstratos ou ganchos (`hooks`) sobrescritos pelas subclasses.
* **Lacuna de Integração:**
  * O `PaymentTemplate` implementa `PixPaymentProcessor` e `CondoFeePaymentProcessor`. O `MarketDAO.checkout` o invoca, mas o retorno do processador (código de autorização e recibo) é descartado sem ser gravado na transação financeira ou na venda.
  * O `NotificationTemplate` apenas emite logs no console (`console.log`), funcionando como uma casca (stub) educacional ou acadêmica, sem integração real com provedores de SMS, e-mail ou push.

---

### 2.2 Frontend: Padrões de Componentização e Comunicação

#### A. Facade (`client/src/services/api.js`)
* **Implementação:** Funciona como uma Fachada (Facade) para toda a API REST. Concentra a URL base (`http://localhost:5000/api`), a leitura e envio do token territorial (`X-Condominium-Id`) e a normalização de erros de resposta.
* **Aderência:** Excelente. Todos os componentes e telas consomem os métodos através de `api.*`, sem chamadas HTTP ad-hoc dispersas.

#### B. Duplicação de Responsabilidades de Interface (Ausência de Componentes Reutilizáveis)
Ao inspecionar as 9 telas em `client/src/views/`, detectou-se um alto grau de duplicação de código estrutural e visual:

1. **Modais:**
   Estruturas idênticas de overlay, cabeçalho com botão fechar, corpo e rodapé com botões cancelar/salvar estão repetidas dezenas de vezes em:
   - `ResidentsView.jsx` (Modal Morador + Modal Veículo)
   - `DeliveriesView.jsx` (Modal Nova Encomenda + Modal Baixa)
   - `AccessControlView.jsx` (Modal Entrada)
   - `ReservationsView.jsx` (Modal Nova Reserva)
   - `FinancialView.jsx` (Modal Novo Lançamento)
   - `AnnouncementsView.jsx` (Modal Novo Comunicado)
   - `MarketInventoryView.jsx` (Modal Novo Produto + Modal PDV)
   - `CondominiumsBlocksView.jsx` (Modal Condomínio + Modal Bloco + Modal Módulos)
2. **Barras de Busca e Filtro:**
   O bloco `<div className="search-box">...</div>` acompanhado de formulário `onSubmit` e `Search` icon é reescrito individualmente em 7 telas diferentes.
3. **Prop Drilling de Notificações (`showToast`):**
   O estado de toasts (`toasts`, `setToasts`, `showToast`) reside no componente raiz `App.jsx` e é passado manualmente como prop para praticamente todos os filhos e netos, gerando acoplamento desnecessário nas assinaturas dos componentes.

---

## 3. Resumo Diagnóstico e Respostas às Perguntas Centrais

### 1. Estamos utilizando bem os Design Patterns existentes?
**Sim, no backend; Parcialmente, no frontend.**  
No backend, o isolamento alcançado pelos padrões **Singleton**, **DAO** e **Factory Method** é exemplar: impede vazamentos de queries SQL no Express, garante concorrência segura com SQLite WAL e desacopla a infraestrutura de dados da lógica de rotas.  
No frontend, o padrão **Facade** (`api.js`) funciona muito bem, mas a componentização visual carece de padrões de composição, gerando duplicações estruturais em formulários e modais.

### 2. Quais padrões devemos continuar utilizando?
1. **Singleton (`DatabaseSingleton` e `AppConfigSingleton`):** Essencial para a integridade do banco de dados e controle das Feature Flags da Linha de Produtos de Software (LPS).
2. **DAO (Data Access Object):** Todas as novas tabelas ou operações DML devem obrigatoriamente ser implementadas em classes DAO dedicadas.
3. **Factory Method (`DAOFactory`):** Centraliza a criação e injeção de DAOs; qualquer novo DAO criado no sistema deve ser registrado no `DAOFactory`.
4. **Middlewares Encadeados (Chain of Responsibility):** O pipeline `tenantContextMiddleware` -> `checkModuleAvailability` -> `checkFeature` deve ser mantido como o mecanismo padrão de segurança, isolamento e governança de rotas.
5. **Facade (`api.js`):** Qualquer nova funcionalidade deve expor suas chamadas HTTP através de métodos adicionados em `api.js`.

### 3. Onde estamos duplicando responsabilidades?
1. **Estrutura de Modais no Frontend:** O boilerplate de `<div className="modal-overlay">...</div>` está duplicado em quase todas as 9 telas.
2. **Tratamento de Erros no Backend:** Em `server.js`, praticamente todos os endpoints repetem blocos idênticos de:
   ```javascript
   try { ... } catch (err) { res.status(500).json({ error: err.message }); }
   ```
   Falta um **Middleware Global de Tratamento de Erros** (`app.use((err, req, res, next) => ...)`), que capturaria exceções lançadas nos DAOs e padronizaria os códigos HTTP e mensagens de erro do sistema.
3. **Prop Drilling de Notificações (`showToast`):** A função de emissão de feedback é repassada manualmente via props através de múltiplos níveis da árvore de componentes.

### 4. Quais melhorias simples trariam mais benefícios?
1. **Extração de um Componente Genérico `<Modal>`:**
   Criar um componente simples e reutilizável em `client/src/components/Modal.jsx` recebendo `isOpen`, `onClose`, `title` e `children`. Isso eliminaria centenas de linhas de HTML/CSS repetidas nas 9 telas.
2. **Context API para Feedback Global (`ToastContext`):**
   Substituir o repasse manual da prop `showToast` por um Hook `useToast()`, simplificando a assinatura de todas as views.
3. **Middleware Global de Erro no Express:**
   Centralizar a formatação de respostas de erro no Express, evitando os 30+ blocos `catch (err) { res.status(500)... }` repetidos em `server.js`.
4. **Separação de `OperationsDAO.js`:**
   Dividir o arquivo em `AccessDAO.js` e `AnnouncementDAO.js`, mantendo a regra de um arquivo por responsabilidade única (Single Responsibility Principle).

### 5. A implementação de novas funcionalidades deve reutilizar quais estruturas existentes?
Toda nova funcionalidade no Praticom ERP deve obrigatoriamente reutilizar:
* **No Banco de Dados:** Criar a tabela no `schema.sql` com chave estrangeira e restrições de integridade, vinculando-se a `condominium_id` ou via hierarquia de blocos/unidades.
* **No Backend (DAO & Factory):** Implementar os métodos CRUD no respectivo DAO ou em novo DAO e registrá-lo em `DAOFactory.getDAO()`.
* **Nas Rotas Express:** Proteger a rota utilizando `checkModuleAvailability('modulo')` e recuperar o tenant autenticado via `req.condominiumId`.
* **No Serviço Frontend:** Adicionar os métodos da nova rota dentro de `client/src/services/api.js`.
* **Na Interface React:** Consumir os dados exclusivamente via `api.novoMetodo()` e estilizar utilizando as classes utilitárias e variáveis CSS já consolidadas em `client/src/index.css` (`btn-primary`, `btn-secondary`, `card`, `custom-table`, `badge`, etc.).
