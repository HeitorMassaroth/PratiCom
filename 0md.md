# 0md — Plano de ação para eliminar persistência e dependências internas de JSON

**Status:** executado em 10/10/2026. `features.json`, o importador legado e a coluna `items_json` foram removidos; flags e itens de venda agora persistem em SQLite.

## Objetivo e limite técnico

Eliminar os usos de JSON que representam **dados de negócio, configuração própria e serialização interna no banco**, sem alterar o contrato HTTP JSON da API nem remover os manifestos exigidos pelo Node.js.

Não é viável nem desejável deixar o repositório literalmente sem qualquer `.json`: `package.json` é indispensável ao npm, `package-lock.json` garante instalações reprodutíveis e HTTP JSON é o contrato atual entre React, testes e Express. A meta segura é: **zero arquivo JSON de dados/configuração do Praticom e zero JSON armazenado como texto no SQLite**.

## Diagnóstico validado

| Item | Local | Uso real | Decisão |
| --- | --- | --- | --- |
| `features.json` | `server/config/` | Feature flags; é lido na inicialização e sobrescrito por `PATCH /api/config/features`. | Migrar para SQLite antes de excluir. |
| `items_json` | tabela `market_sales` | Lista dos itens de cada venda; `MarketDAO` usa `JSON.stringify` ao gravar e `JSON.parse` ao listar. | Normalizar em uma tabela relacional antes de remover a coluna. |
| `migrate.js` | `server/` | Importador histórico de `condo_store.json`, arquivo que não existe no workspace. Não é chamado por script npm. | Preservar ou remover somente após a decisão acadêmica sobre a evidência de migração. |
| `package.json` | `client/` e `server/` | Manifestos necessários para `npm run dev`, build e dependências. | Manter. |
| `package-lock.json` | `client/` e `server/` | Travamento reprodutível das versões instaladas. | Manter. |
| JSON HTTP | `client/src/services/api.js`, `server/server.js`, testes | Corpo e resposta da API REST. | Manter; não é persistência em arquivo. |

Os documentos também registram `condo_store.json`, `condo_store.json.bak`, `server/database.js`, `server/legacy/` e alguns DAOs que já não existem. Eles precisam ser corrigidos após as alterações, para que a documentação descreva o estado real.

## Pré-condições

1. Criar uma cópia verificável de `server/condo_database.sqlite` fora do repositório e registrar data, tamanho e checksum.
2. Confirmar se o requisito acadêmico exige manter o código/evidência da migração JSON → SQLite. Se sim, arquivar `migrate.js` como evidência fora da execução normal, em vez de apagá-lo.
3. Executar e registrar os testes de baseline: build do cliente e a suíte de API com servidor ativo.
4. Fazer uma cópia do banco de produção antes de executar a migração SQL; a alteração de `items_json` é irreversível sem backup.

## Fase 1 — Remover JSON de configuração própria

1. Criar no SQLite uma tabela `app_features` com `feature` como chave primária, `enabled` como inteiro booleano e `updated_at`.
2. Inserir as duas flags atuais (`ENABLE_MARKETPLACE` e `ENABLE_ADVANCED_DELIVERIES`) a partir do valor vigente de `features.json`.
3. Refatorar `AppConfigSingleton` para carregar, consultar e atualizar as flags pela conexão `DatabaseSingleton`, com valores-padrão apenas para a primeira inicialização.
4. Manter inalterados os endpoints `/api/config/features` e o formato de resposta, para não exigir mudanças no frontend.
5. Cobrir com teste: alterar flag, reiniciar o servidor e confirmar que o valor persistiu no SQLite.
6. Só após o teste passar, excluir `server/config/features.json` e remover o uso de `fs`, `path`, `JSON.parse` e `JSON.stringify` desse módulo.

**Critério de aceite:** nenhuma busca no código próprio encontra `features.json`; ambas as flags continuam funcionando e persistem após reinício.

## Fase 2 — Normalizar itens de venda no SQLite

1. Adicionar a tabela `market_sale_items` com `sale_id`, `product_id` opcional, `product_name`, `unit_price`, `quantity` e `line_total`, com chaves estrangeiras e índice por `sale_id`.
2. Criar uma migração transacional e idempotente que leia cada `market_sales.items_json`, valide o formato, insira as linhas normalizadas e registre qualquer venda inválida para revisão.
3. Atualizar `MarketDAO.checkout()` para inserir os itens em `market_sale_items` dentro da mesma transação que reduz estoque, cria a venda e registra eventual débito condominial.
4. Atualizar `MarketDAO.getSales()` para montar `items` por `JOIN`/consulta agrupada, preservando o campo `items` entregue ao frontend.
5. Comparar, por venda, quantidade de itens e total calculado antes/depois; corrigir discrepâncias antes de continuar.
6. Em uma segunda migração, remover `items_json` apenas quando não houver divergências e quando a aplicação já estiver usando exclusivamente a nova tabela.

**Critério de aceite:** `rg "items_json|JSON\\.(parse|stringify)" server` não retorna persistência de itens de venda; checkout e histórico de vendas continuam aprovados.

## Fase 3 — Decidir e retirar o importador legado

1. Confirmar que não existe fonte JSON legada a ser migrada e que o banco SQLite contém os dados esperados.
2. Se a migração não for mais requisito acadêmico, remover `server/migrate.js`.
3. Se ela for evidência obrigatória, mover o arquivo para documentação/arquivo histórico fora do caminho operacional, documentando que ele não deve ser executado sobre a base atual.
4. Atualizar os documentos que o citam para não sugerirem a existência de `condo_store.json` ou backups ausentes.

**Critério de aceite:** não há código executável que dependa de `condo_store.json`; a decisão sobre a evidência acadêmica está registrada.

## Fase 4 — Atualizar documentação e validar

1. Corrigir `README.md` para indicar SQLite como armazenamento e remover a descrição de persistência JSON/local inexistente.
2. Atualizar `APRENDIZADO.md`, `MIGRACAO_BANCO.md`, `PLANO_ACAO.md`, `PLANO_PREPARACAO_E_TESTES.md`, `PLANO_REFATORACAO.md`, relatórios e requisitos acadêmicos para refletir a decisão da Fase 3 e a nova tabela de itens.
3. Corrigir caminhos `file:///` e referências a arquivos inexistentes; usar apenas caminhos relativos do repositório.
4. Executar `npm run build` em `client`, iniciar o servidor e executar `node tests/suite.js` em `server`.
5. Verificar o resultado final com:

```powershell
rg -n -i --glob '!node_modules/**' 'condo_store|features\.json|items_json|JSON\.(parse|stringify)' .
Get-ChildItem -Recurse -File -Filter *.json | Where-Object { $_.FullName -notmatch 'node_modules' }
```

O resultado esperado é somente `package.json` e `package-lock.json`, além de usos de JSON necessários ao transporte HTTP e aos testes.

## Ordem de execução e rollback

Executar as fases na ordem 1 → 2 → 3 → 4, em commits separados. Nunca excluir `features.json`, `items_json` ou `migrate.js` na mesma mudança que introduz seu substituto. Caso haja falha, restaurar o backup do SQLite, reverter somente o commit da fase correspondente e manter o código anterior em operação.
