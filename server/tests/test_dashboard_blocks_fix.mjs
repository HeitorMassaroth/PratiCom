import assert from 'assert';

const apiBase = 'http://localhost:5000/api';
const condo1 = { 'X-Condominium-Id': '1' };

async function req(endpoint, options = {}) {
  const res = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...condo1,
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

console.log('------------------------------------------------------------');
console.log('🧪 SUÍTE DE TESTES: CORREÇÃO DO DASHBOARD E BLOCOS (PRATICOM ERP)');
console.log('------------------------------------------------------------');

let passed = 0;
let failed = 0;

function test(name, fn) {
  return (async () => {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  })();
}

(async () => {
  // ==========================================
  // 1. TESTE DO SALDO EM CAIXA E INADIMPLÊNCIA
  // ==========================================
  await test('1.1 Dashboard retorna saldo em caixa correspondente ao financialDAO', async () => {
    const dashRes = await req('/dashboard');
    assert.strictEqual(dashRes.status, 200);
    assert.strictEqual(typeof dashRes.data.metrics.balance, 'number', 'metrics.balance deve ser número');
    assert.strictEqual(dashRes.data.metrics.balance, dashRes.data.metrics.currentBalance, 'balance e currentBalance devem ser idênticos');

    const finRes = await req('/financial/summary');
    assert.strictEqual(finRes.status, 200);
    assert.strictEqual(dashRes.data.metrics.balance, finRes.data.currentBalance, 'Saldo no dashboard deve bater exatamente com financial/summary');
  });

  await test('1.2 Isolamento multi-tenant contábil não vaza despesas corporativas para o Condomínio 1', async () => {
    const finRes = await req('/financial/summary');
    assert.strictEqual(finRes.status, 200);
    // Verificar que despesas corporativas pertencentes a condomínio 2 não foram somadas
    const transRes = await req('/financial/transactions');
    assert.strictEqual(transRes.status, 200);
    const foreignTrans = transRes.data.filter(t => t.condominium_id && t.condominium_id !== 1);
    assert.strictEqual(foreignTrans.length, 0, 'Nenhuma transação com outro condominium_id deve aparecer no condomínio 1');
  });

  // ==========================================
  // 2. TESTE DE RESERVAS DE HOJE
  // ==========================================
  await test('2.1 Dashboard calcula e retorna todayReservations', async () => {
    const dashRes = await req('/dashboard');
    assert.strictEqual(dashRes.status, 200);
    assert.strictEqual(typeof dashRes.data.metrics.todayReservations, 'number', 'metrics.todayReservations deve ser numérico');
  });

  await test('2.2 Criação e cancelamento de reserva atualizam todayReservations', async () => {
    const now = new Date();
    const todayStr = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');

    // Pegar espaços e unidades
    const spacesRes = await req('/spaces');
    const unitsRes = await req('/units');
    const residentsRes = await req('/residents');
    assert(spacesRes.data.length > 0 && unitsRes.data.length > 0, 'Deve haver espaços e unidades');

    const initialDash = await req('/dashboard');
    const initialTodayCount = initialDash.data.metrics.todayReservations;

    // Criar reserva para hoje
    const createRes = await req('/reservations', {
      method: 'POST',
      body: JSON.stringify({
        space_id: spacesRes.data[0].id,
        unit_id: unitsRes.data[0].id,
        resident_id: residentsRes.data[0]?.id || 1,
        reservation_date: todayStr,
        start_time: '23:00',
        end_time: '23:59'
      })
    });
    assert.strictEqual(createRes.status, 201, 'Reserva deve ser criada com sucesso');
    const createdId = createRes.data.id;

    // Verificar se incrementou no dashboard
    const afterCreateDash = await req('/dashboard');
    assert.strictEqual(afterCreateDash.data.metrics.todayReservations, initialTodayCount + 1, 'todayReservations deve incrementar em 1');

    // Cancelar a reserva
    const cancelRes = await req(`/reservations/${createdId}/cancel`, { method: 'PATCH' });
    assert.strictEqual(cancelRes.status, 200, 'Reserva deve ser cancelada');

    // Verificar se decrementou de volta
    const afterCancelDash = await req('/dashboard');
    assert.strictEqual(afterCancelDash.data.metrics.todayReservations, initialTodayCount, 'todayReservations deve decrementar após cancelamento');
  });

  // ==========================================
  // 3. TESTE DE ESTOQUE DO MERCADINHO & PRODUTOS EM FALTA
  // ==========================================
  await test('3.1 Dashboard integra métricas do Mercadinho', async () => {
    const dashRes = await req('/dashboard');
    assert.strictEqual(dashRes.status, 200);
    assert.strictEqual(typeof dashRes.data.metrics.totalMarketProducts, 'number');
    assert.strictEqual(typeof dashRes.data.metrics.outOfStockItems, 'number');
    assert.strictEqual(typeof dashRes.data.metrics.lowStockItems, 'number');
  });

  await test('3.2 Diferenciação entre produtos em falta (0) e abaixo do mínimo (> 0 e <= min)', async () => {
    // Criar produto com estoque 0 (em falta)
    const pZero = await req('/market/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Produto Teste Sem Estoque',
        category: 'Bebidas',
        price: 10,
        stock_quantity: 0,
        min_stock: 5
      })
    });
    assert.strictEqual(pZero.status, 201);

    // Criar produto com estoque baixo (2 unidades, min 5)
    const pLow = await req('/market/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Produto Teste Estoque Baixo',
        category: 'Bebidas',
        price: 10,
        stock_quantity: 2,
        min_stock: 5
      })
    });
    assert.strictEqual(pLow.status, 201);

    const dashRes = await req('/dashboard');
    assert(dashRes.data.metrics.outOfStockItems >= 1, 'Deve haver ao menos 1 item em falta');
    assert(dashRes.data.metrics.lowStockOnlyItems >= 1, 'Deve haver ao menos 1 item com estoque baixo > 0');
    assert(dashRes.data.metrics.criticalStockItems >= dashRes.data.metrics.outOfStockItems + dashRes.data.metrics.lowStockOnlyItems, 'criticalStockItems deve ser o somatório');

    // Limpar produtos de teste
    await req(`/market/products/${pZero.data.id}`, { method: 'DELETE' });
    await req(`/market/products/${pLow.data.id}`, { method: 'DELETE' });
  });

  // ==========================================
  // 4. TESTE DE AVISOS EM DESTAQUE
  // ==========================================
  await test('4.1 Avisos com prioridade "urgent" aparecem em destaque no dashboard', async () => {
    const createAnn = await req('/announcements', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Aviso Teste Prioridade Urgent',
        content: 'Conteúdo de aviso urgente de teste automatizado.',
        priority: 'urgent',
        category: 'Segurança'
      })
    });
    assert.strictEqual(createAnn.status, 201);

    const dashRes = await req('/dashboard');
    const found = dashRes.data.urgentAnnouncements.find(a => a.id === createAnn.data.id);
    assert(found, 'Aviso cadastrado com priority="urgent" deve constar em urgentAnnouncements do dashboard');

    // Excluir aviso de teste
    await req(`/announcements/${createAnn.data.id}`, { method: 'DELETE' });
  });

  // ==========================================
  // 5. TESTE DE ALTERAÇÃO DO NOME DO BLOCO E SINCRONIZAÇÃO DE UNIDADES
  // ==========================================
  await test('5.1 Renomear bloco atualiza o nome em todas as unidades vinculadas', async () => {
    // Criar bloco de teste no Condomínio 1
    const blockRes = await req('/condominiums/1/blocks', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bloco Teste Sincronia', description: 'Bloco temporário' })
    });
    assert.strictEqual(blockRes.status, 201);
    const blockId = blockRes.data.id;

    // Criar 2 unidades no bloco de teste
    const u1 = await req('/units', {
      method: 'POST',
      body: JSON.stringify({ block_id: blockId, number: '101A' })
    });
    assert.strictEqual(u1.status, 201);
    assert.strictEqual(u1.data.block, 'Bloco Teste Sincronia');

    const u2 = await req('/units', {
      method: 'POST',
      body: JSON.stringify({ block_id: blockId, number: '102A' })
    });
    assert.strictEqual(u2.status, 201);
    assert.strictEqual(u2.data.block, 'Bloco Teste Sincronia');

    // Renomear o bloco
    const updateBlockRes = await req(`/blocks/${blockId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Bloco Teste Renomeado', description: 'Descrição atualizada' })
    });
    assert.strictEqual(updateBlockRes.status, 200);
    assert.strictEqual(updateBlockRes.data.name, 'Bloco Teste Renomeado');

    // Verificar se as unidades retornam o novo nome na listagem geral GET /api/units
    const allUnits = await req('/units');
    const foundU1 = allUnits.data.find(u => u.id === u1.data.id);
    const foundU2 = allUnits.data.find(u => u.id === u2.data.id);

    assert.strictEqual(foundU1.block, 'Bloco Teste Renomeado', 'Unidade 1 deve refletir o novo nome do bloco');
    assert.strictEqual(foundU2.block, 'Bloco Teste Renomeado', 'Unidade 2 deve refletir o novo nome do bloco');

    // Verificar na rota individual GET /api/units/:id
    const singleU1 = await req(`/units/${u1.data.id}`);
    assert.strictEqual(singleU1.data.block, 'Bloco Teste Renomeado', 'Consulta individual de unidade deve retornar nome atualizado');

    // Limpar unidades e bloco de teste
    await req(`/units/${u1.data.id}`, { method: 'DELETE' });
    await req(`/units/${u2.data.id}`, { method: 'DELETE' });
    await req(`/blocks/${blockId}`, { method: 'DELETE' });
  });

  await test('5.2 Alteração de bloco não afeta blocos de outros condomínios', async () => {
    // Criar condomínio 2 e bloco com mesmo nome
    const c2 = await req('/condominiums', {
      method: 'POST',
      body: JSON.stringify({ name: 'Condomínio Isolamento Teste' })
    });
    assert.strictEqual(c2.status, 201);
    const c2Id = c2.data.id;

    const b2 = await req(`/condominiums/${c2Id}/blocks`, {
      method: 'POST',
      body: JSON.stringify({ name: 'Bloco Comum' }),
      headers: { 'X-Condominium-Id': String(c2Id) }
    });
    assert.strictEqual(b2.status, 201);

    const b1 = await req('/condominiums/1/blocks', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bloco Comum' })
    });
    assert.strictEqual(b1.status, 201);

    // Renomear bloco do Condomínio 1
    await req(`/blocks/${b1.data.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Bloco Comum Alpha' })
    });

    // Bloco do Condomínio 2 deve continuar intacto
    const checkB2 = await req(`/blocks/${b2.data.id}`, {
      headers: { 'X-Condominium-Id': String(c2Id) }
    });
    assert.strictEqual(checkB2.data.name, 'Bloco Comum', 'Bloco do Condomínio 2 não deve ser modificado');

    // Limpar
    await req(`/blocks/${b1.data.id}`, { method: 'DELETE' });
    await req(`/blocks/${b2.data.id}`, { method: 'DELETE', headers: { 'X-Condominium-Id': String(c2Id) } });
    await req(`/condominiums/${c2Id}`, { method: 'DELETE' });
  });

  console.log('------------------------------------------------------------');
  console.log(`📊 RESULTADO FINAL: ${passed} Aprovados, ${failed} Falhas.`);
  console.log('------------------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
})();
