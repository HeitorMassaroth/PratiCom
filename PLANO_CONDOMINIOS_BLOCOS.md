# Plano de Ação — Condomínios, Blocos e SQLite

**Etapa:** implementação inicial concluída. As tabelas, API e página foram criadas; as unidades legadas continuam pendentes de associação explícita para evitar vínculo inventado.

## 1. Diagnóstico atual

O Praticom usa uma única conexão SQLite (`server/condo_database.sqlite`) via `DatabaseSingleton`, com chaves estrangeiras habilitadas. Há 14 tabelas de negócio/configuração, mas não existem tabelas para condomínios ou blocos nem chaves que representem essa hierarquia.

`units` é hoje a raiz prática dos vínculos: possui `id`, `block` (texto), `number`, `floor`, `type` e unicidade em `(block, number)`. As 12 unidades existentes usam somente os valores textuais `Torre A` (6) e `Torre B` (6). Não há dado que permita concluir, sem intervenção humana, a qual condomínio essas torres pertencem. Os 7 comunicados têm `target_block = 'Todos'`.

As relações atuais são:

| Contexto | Relação atual |
| --- | --- |
| Moradores, veículos, pets, entregas, acessos, reservas e vendas | Referenciam uma unidade, diretamente ou também via morador. |
| Financeiro | Pode referenciar unidade; o vínculo é opcional. |
| Espaços comuns e produtos | Não têm vínculo territorial. |
| Comunicados | Têm apenas `target_block` textual, sem integridade referencial. |
| Itens de venda | Referenciam a venda; não precisam de contexto territorial próprio. |

O frontend é uma SPA React sem roteador: `App.jsx` seleciona views por estado e `Sidebar.jsx` declara os itens de navegação. `ResidentsView.jsx` é a principal referência de cadastro: lista, filtros, modais, `showToast` e chamadas centralizadas por `client/src/services/api.js`.

## 2. Modelo relacional recomendado

Adotar a hierarquia normalizada abaixo:

```text
condominiums (1) ──< blocks (N) ──< units (N) ──< registros dependentes
                                      ├─ residents / vehicles / pets
                                      ├─ deliveries / access_logs / reservations
                                      ├─ financial_transactions / market_sales
                                      └─ demais relações já existentes
```

### `condominiums`

Campos propostos: `id`, `name` (obrigatório), `cnpj` (opcional, único quando informado), `address`, `city`, `state`, `postal_code`, `phone`, `status` (`ACTIVE`/`INACTIVE`) e `created_at`.

O endereço e contato são propriedades do condomínio; não devem ser repetidos nos blocos ou unidades.

### `blocks`

Campos propostos: `id`, `condominium_id` (FK obrigatória), `name` (obrigatório), `description`, `status` e `created_at`, com `UNIQUE(condominium_id, name)`.

Um bloco só pertence a um condomínio. O nome pode se repetir em condomínios diferentes, mas não no mesmo condomínio.

### `units`

Adicionar `block_id` como FK de `blocks`. O condomínio da unidade deve ser obtido por `units.block_id → blocks.condominium_id`; não acrescentar `condominium_id` em `units`, pois duplicaria uma verdade e permitiria combinações inconsistentes.

Durante a migração `block_id` deve iniciar como nulo. Somente depois de todas as unidades serem mapeadas e validadas ele se torna obrigatório. O campo textual `block` fica apenas como fonte temporária de mapeamento e deve ser removido na reconstrução final da tabela SQLite, preservando `number`, `floor`, `type` e os IDs existentes.

**Vantagem:** um único caminho confiável para determinar condomínio e bloco. **Risco controlado:** o SQLite exige recriar `units` para tornar/remover colunas; por isso a mudança só ocorre em transação, após backup e auditoria das FKs dependentes.

## 3. Mapa de relações e impacto por entidade

| Entidade | Vínculo atual | Modelo futuro | Alteração necessária |
| --- | --- | --- | --- |
| `units` | texto `block` | `block_id`; condomínio herdado | Migração controlada e adaptação de consultas. |
| `residents`, `vehicles`, `pets`, `deliveries`, `access_logs` | unidade | Herda bloco/condomínio da unidade | Sem FK territorial extra; joins devem devolver nomes do bloco/condomínio. |
| `reservations` | unidade e espaço | Herda da unidade; espaço pertence ao condomínio | Validar que unidade e espaço são do mesmo condomínio. |
| `financial_transactions` | unidade opcional | `condominium_id` obrigatório; unidade continua opcional | Necessário porque transações gerais não têm unidade. Validar coerência quando houver unidade. |
| `spaces` | sem contexto | `condominium_id` obrigatório | Espaços são compartilhados pelo condomínio, não por bloco. |
| `announcements` | `target_block` textual | `condominium_id` obrigatório, `block_id` opcional | `block_id = NULL` representa todos os blocos do condomínio; retirar texto após migração. |
| `market_products` | sem contexto | `condominium_id` obrigatório | Catálogo/estoque deve ser próprio por condomínio. |
| `market_sales`, `market_sale_items` | unidade/morador; venda | Venda herda unidade; item herda venda | Não adicionar FKs redundantes. Validar unidade/morador coerentes. |
| `app_features` | global | Global, sem alteração | Não faz parte da hierarquia de negócio. |

## 4. Migração segura dos dados existentes

1. Parar escritas, criar backup externo verificável do SQLite e registrar checksum, contagens e `PRAGMA foreign_key_check`.
2. Criar apenas as tabelas `condominiums` e `blocks` e adicionar `units.block_id` anulável, sem remover colunas ou dados existentes.
3. Exibir/gerar uma pendência administrativa com as 12 unidades e os valores distintos de `units.block` (`Torre A`, `Torre B`). Um administrador cadastra o condomínio real e cria/mapeia os blocos. Não criar condomínio padrão nem inferir associação.
4. Validar que todas as unidades possuem `block_id`; comparar quantidade e IDs de unidades antes/depois e validar bloco/condomínio por amostragem aprovada.
5. Popular os vínculos diretos necessários para `spaces`, `market_products`, `financial_transactions` e `announcements` somente após seleção explícita do condomínio responsável. Registros sem informação suficiente permanecem em uma fila de pendências; não recebem valor arbitrário.
6. Adaptar DAOs e interface para usar os novos vínculos enquanto `units.block` ainda existe como compatibilidade de leitura.
7. Em migração posterior e transacional, recriar as tabelas que precisarem tornar a FK obrigatória/remover texto legado, copiar dados, verificar contagens, FKs e totais, e só então substituir as tabelas.

**Reversão:** interromper antes da etapa irreversível, restaurar o arquivo SQLite de backup e reexecutar as verificações. Cada fase deve ser um commit/migração independente; não combinar criação, preenchimento e remoção em uma única operação.

## 5. Backend e API planejados

Criar `CondominiumDAO` e `BlockDAO` (ou um módulo territorial coeso) usando exclusivamente `DatabaseSingleton`; registrar os tipos na `DAOFactory`.

| Método | Endpoint | Regra principal |
| --- | --- | --- |
| `GET` | `/api/condominiums` | Lista, com filtros de status e contagens. |
| `POST` | `/api/condominiums` | Nome obrigatório; validar CNPJ único quando fornecido. |
| `GET` | `/api/condominiums/:id` | Retorna condomínio, blocos e resumo de unidades. |
| `PATCH` | `/api/condominiums/:id` | Atualização validada de campos permitidos. |
| `PATCH` | `/api/condominiums/:id/status` | Desativação preferida; bloquear se política exigir condomínio ativo para novas operações. |
| `DELETE` | `/api/condominiums/:id` | Somente se não houver blocos, unidades ou recursos associados; caso contrário `409`. |
| `GET` | `/api/condominiums/:id/blocks` | Lista blocos e quantidade de unidades. |
| `POST` | `/api/condominiums/:id/blocks` | Nome obrigatório e único no condomínio; condomínio deve existir/estar ativo. |
| `GET` | `/api/blocks/:id` | Detalhe e unidades vinculadas. |
| `PATCH` | `/api/blocks/:id` | Atualiza nome, descrição e status; preservar unicidade. |
| `PATCH` | `/api/blocks/:id/status` | Desativar sem criar órfãos. |
| `DELETE` | `/api/blocks/:id` | Apenas sem unidades; se houver, retornar `409`. |

Os endpoints existentes passam a aceitar filtros opcionais `condominium_id` e/ou `block_id` quando aplicável. Para manter compatibilidade, parâmetros e respostas atuais continuam válidos; campos adicionais como `condominium_id`, `condominium_name`, `block_id` e `block_name` são acrescentados gradualmente.

Validações indispensáveis: IDs inteiros existentes, status permitido, unidade pertencente ao bloco/condomínio indicado, morador pertencente à unidade, e igualdade do condomínio entre espaço e unidade em reservas. Usar `400` para entrada inválida, `404` para recurso inexistente, `409` para unicidade/dependência e `500` apenas para falha inesperada.

## 6. Nova página proposta

Criar `client/src/views/CondominiumsBlocksView.jsx`, integrada em `App.jsx`, `Sidebar.jsx` e `services/api.js`. A página reutiliza cards, tabelas, modais, `form-control`, botões, confirmação de exclusão e `showToast` já usados em `ResidentsView` e nas demais views.

Funcionalidades:

- Painel/lista de condomínios com status, endereço resumido, quantidade de blocos e unidades.
- Modal de criação/edição de condomínio, com campos obrigatórios mínimos e validação de CNPJ somente quando informado.
- Seleção de condomínio que carrega a tabela de blocos, com quantidade de unidades e ações de editar, desativar e excluir.
- Modal de bloco que exige condomínio selecionado e informa duplicidade/dependências retornadas pela API.
- Área de detalhe do bloco com unidades vinculadas, inicialmente somente leitura.
- Área de pendências de migração que permite mapear unidades legadas por valor textual de bloco, antes de tornar `block_id` obrigatório.

O novo item de navegação deve usar o mesmo padrão do `Sidebar`, por exemplo `Condomínios & Blocos`, sem alterar o fluxo das páginas existentes. Filtros territoriais nas telas atuais ficam em fase posterior e devem ser opcionais enquanto existirem dados pendentes.

## 7. Fases de execução

| Fase | Arquivos/componentes previstos | Dependências e risco | Conclusão / reversão |
| --- | --- | --- | --- |
| 1. Auditoria | schema, DAOs, views, consulta somente leitura ao SQLite | Confirmar dados e processos ativos | Inventário/backup aprovado; sem alteração. |
| 2. Modelagem | `schema.sql`, especificação de migração | Decidir campos mínimos e política de desativação | Modelo revisado; reverter apenas documento. |
| 3. Banco | nova migração transacional, `schema.sql`, backup | SQLite requer reconstrução de tabelas para FKs finais | Tabelas criadas sem perda; restaurar backup se falhar. |
| 4. Backend | novos DAOs, `DAOFactory`, `server.js`, testes | Contratos e filtros compatíveis | CRUD/validações passam; reverter commit. |
| 5. Nova página | view, `App.jsx`, `Sidebar.jsx`, `api.js` | Consistência visual e falhas de API | Fluxos de CRUD e pendências aprovados. |
| 6. Integração | DAOs e views existentes | Joins/filtros não podem ocultar legado | Resultados antigos e filtrados conferidos. |
| 7. Migração final | script transacional e schema final | Associação manual incompleta | Zero unidades sem bloco antes de exigir FK; restaurar backup se necessário. |
| 8. Testes | `server/tests/suite.js` e novos testes | Cobertura de integridade e reinício | Todos os critérios abaixo aprovados. |

## 8. Plano de testes e critérios de aceite

1. Criar, editar, listar, desativar e tentar excluir condomínio/bloco com e sem dependências.
2. Confirmar `UNIQUE(condominium_id, name)` para blocos e rejeição de bloco sem condomínio válido.
3. Testar que reserva rejeita espaço de condomínio diferente da unidade e que transação financeira com unidade respeita seu condomínio.
4. Migrar cópia do banco atual, conferir as 12 unidades por ID, as contagens das 14 tabelas atuais, totais financeiros e vendas antes/depois.
5. Executar `PRAGMA integrity_check` e `PRAGMA foreign_key_check` sem erros após cada migração.
6. Testar comunicados para todos os blocos e para um bloco específico; confirmar que nenhuma tela antiga falha sem filtro territorial.
7. Executar build do cliente, a suíte de API, CRUDs territoriais e reinicialização do servidor para confirmar persistência.

Considerar concluído somente quando: não houver unidade sem `block_id`; todo bloco possuir condomínio válido; não houver FK órfã; as associações manuais tiverem sido aprovadas; exclusões respeitarem dependências; e todos os fluxos atuais e novos estiverem aprovados.

## 9. Riscos a resolver antes da implementação

- **Ausência de condomínio nos dados atuais:** requer decisão/cadastro humano; não há base para valor padrão automático.
- **Migrações SQLite destrutivas:** remoção de `units.block` e obrigatoriedade de FKs exigem backup e reconstrução controlada de tabela.
- **Contextos compartilhados sem unidade:** financeiro, espaços, anúncios e produtos precisam de seleção explícita de condomínio.
- **Filtros territoriais:** aplicá-los cedo demais pode esconder registros legados; devem ser opcionais até a conclusão do mapeamento.
- **Processo do servidor ativo:** executar migração somente com escritas controladas e versão única do backend em execução.
