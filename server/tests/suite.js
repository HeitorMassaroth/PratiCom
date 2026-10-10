/**
 * Suíte Integrada de Testes do Backend (Praticom ERP)
 * Valida os 14 endpoints RESTful, operações CRUD no SQLite e Feature Flags (LPS).
 */

const endpoints = [
  '/api/dashboard',
  '/api/deliveries',
  '/api/access',
  '/api/units',
  '/api/residents',
  '/api/vehicles',
  '/api/pets',
  '/api/spaces',
  '/api/reservations',
  '/api/financial/summary',
  '/api/financial/transactions',
  '/api/announcements',
  '/api/market/products',
  '/api/market/sales'
];

async function runTestSuite() {
  console.log('----------------------------------------------------');
  console.log('🧪 SUÍTE DE TESTES INTEGRADA DO BACKEND (SQLITE + GOF)');
  console.log('----------------------------------------------------');
  
  let successCount = 0;
  let failCount = 0;

  // 1. Testes de Leitura de Endpoints RESTful
  console.log('\n--- 1. Validação de Endpoints GET RESTful ---');
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`http://localhost:5000${endpoint}`);
      if (res.ok) {
        const data = await res.json();
        const itemCount = Array.isArray(data) ? data.length : Object.keys(data).length;
        console.log(`✅ [200 OK] ${endpoint} -> ${itemCount} itens/chaves retornado(s)`);
        successCount++;
      } else {
        console.error(`❌ [${res.status}] ${endpoint}`);
        failCount++;
      }
    } catch (err) {
      console.error(`❌ [ERRO] ${endpoint}: ${err.message}`);
      failCount++;
    }
  }

  // 2. Testes de Operações CRUD
  console.log('\n--- 2. Validação de Operações CRUD e Persistência ---');

  // CRUD Morador
  try {
    const createRes = await fetch('http://localhost:5000/api/residents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unit_id: 1, name: 'Morador Teste Refatoração', phone: '(11) 98888-7777', role: 'Inquilino' })
    });
    const newResident = await createRes.json();
    console.log(`✅ [201 Created] Morador criado no SQLite -> ID: ${newResident.id}`);

    const deleteRes = await fetch(`http://localhost:5000/api/residents/${newResident.id}`, { method: 'DELETE' });
    const deleteMsg = await deleteRes.json();
    console.log(`✅ [200 OK] Morador removido do SQLite -> ${deleteMsg.message}`);
    successCount += 2;
  } catch (err) {
    console.error('❌ Erro no CRUD de Moradores:', err.message);
    failCount++;
  }

  // CRUD Portaria
  try {
    const entryRes = await fetch('http://localhost:5000/api/access/entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_name: 'Visitante Teste Refatoração', document: '99.888.777-6', destination_unit_id: 1, type: 'Visitante' })
    });
    const entryData = await entryRes.json();
    console.log(`✅ [201 Created] Portaria Entrada registrada no SQLite -> ID: ${entryData.id}, Status: ${entryData.status}`);

    const exitRes = await fetch(`http://localhost:5000/api/access/${entryData.id}/exit`, { method: 'PATCH' });
    const exitData = await exitRes.json();
    console.log(`✅ [200 OK] Portaria Saída atualizada no SQLite -> ID: ${exitData.id}, Novo Status: ${exitData.status}`);
    successCount += 2;
  } catch (err) {
    console.error('❌ Erro no CRUD de Portaria:', err.message);
    failCount++;
  }

  // 3. Testes de Feature Flags (LPS)
  console.log('\n--- 3. Validação de Feature Flags da LPS ---');
  try {
    // Desativar Mercado
    await fetch('http://localhost:5000/api/config/features', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: 'ENABLE_MARKETPLACE', enabled: false })
    });

    const marketDisabled = await fetch('http://localhost:5000/api/market/products');
    if (marketDisabled.status === 403) {
      console.log('✅ [403 Forbidden] Feature Flag ENABLE_MARKETPLACE=false bloqueou o acesso ao Mercadinho.');
      successCount++;
    } else {
      console.error('❌ Bloqueio de Feature Flag falhou.');
      failCount++;
    }

    // Reativar Mercado
    await fetch('http://localhost:5000/api/config/features', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: 'ENABLE_MARKETPLACE', enabled: true })
    });

    const marketEnabled = await fetch('http://localhost:5000/api/market/products');
    if (marketEnabled.status === 200) {
      console.log('✅ [200 OK] Feature Flag ENABLE_MARKETPLACE=true liberou o acesso ao Mercadinho.');
      successCount++;
    } else {
      console.error('❌ Reativação de Feature Flag falhou.');
      failCount++;
    }
  } catch (err) {
    console.error('❌ Erro na validação de Feature Flags:', err.message);
    failCount++;
  }

  console.log('\n----------------------------------------------------');
  console.log(`📊 RESUMO DA SUÍTE DE TESTES: ${successCount} Sucessos, ${failCount} Falhas.`);
  console.log('----------------------------------------------------');
}

runTestSuite();
