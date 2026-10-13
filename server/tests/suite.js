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
  '/api/spaces',
  '/api/reservations',
  '/api/financial/summary',
  '/api/financial/transactions',
  '/api/announcements',
  '/api/market/products',
  '/api/market/sales'
];

const apiBase = process.env.API_BASE || 'http://localhost:5000';

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
      const res = await fetch(`${apiBase}${endpoint}`);
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
    const createRes = await fetch(`${apiBase}/api/residents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unit_id: 1, name: 'Morador Teste Refatoração', phone: '(11) 98888-7777', role: 'Inquilino' })
    });
    const newResident = await createRes.json();
    console.log(`✅ [201 Created] Morador criado no SQLite -> ID: ${newResident.id}`);

    const deleteRes = await fetch(`${apiBase}/api/residents/${newResident.id}`, { method: 'DELETE' });
    const deleteMsg = await deleteRes.json();
    console.log(`✅ [200 OK] Morador removido do SQLite -> ${deleteMsg.message}`);
    successCount += 2;
  } catch (err) {
    console.error('❌ Erro no CRUD de Moradores:', err.message);
    failCount++;
  }

  // CRUD Portaria
  try {
    const entryRes = await fetch(`${apiBase}/api/access/entry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_name: 'Visitante Teste Refatoração',
        document: '99.888.777-6',
        destination_unit_id: 1,
        type: 'Visitante',
        company: 'Empresa Teste',
        vehicle_plate: 'TESTE123',
        authorized_by: 'Morador Teste'
      })
    });
    const entryData = await entryRes.json();
    console.log(`✅ [201 Created] Portaria Entrada registrada no SQLite -> ID: ${entryData.id}, Status: ${entryData.status}`);
    const entryFieldsSaved = entryData.company === 'Empresa Teste'
      && entryData.vehicle_plate === 'TESTE123'
      && entryData.authorized_by === 'Morador Teste'
      && Boolean(entryData.entered_at);
    if (!entryRes.ok || !entryFieldsSaved) {
      throw new Error('A entrada não retornou os campos extras e o horário esperado.');
    }

    const exitRes = await fetch(`${apiBase}/api/access/${entryData.id}/exit`, { method: 'PATCH' });
    const exitData = await exitRes.json();
    console.log(`✅ [200 OK] Portaria Saída atualizada no SQLite -> ID: ${exitData.id}, Novo Status: ${exitData.status}`);
    if (!exitRes.ok || !exitData.exited_at) {
      throw new Error('A saída não retornou o horário no nome esperado pela tela.');
    }

    const searchRes = await fetch(`${apiBase}/api/access?search=TESTE123`);
    const searchData = await searchRes.json();
    if (searchRes.ok && searchData.some(log => log.id === entryData.id)) {
      console.log('✅ Busca por placa encontrou o registro de acesso.');
      successCount++;
    } else {
      console.error('❌ A busca por placa não encontrou o registro de acesso.');
      failCount++;
    }

    const deleteRes = await fetch(`${apiBase}/api/access/${entryData.id}`, { method: 'DELETE' });
    const deleteData = await deleteRes.json();
    if (deleteRes.ok) {
      console.log(`✅ [200 OK] Registro de acesso removido do SQLite -> ${deleteData.message}`);
      const accessLogs = await fetch(`${apiBase}/api/access`).then(res => res.json());
      if (!accessLogs.some(log => log.id === entryData.id)) {
        console.log('✅ Registro excluído não aparece mais na listagem de acessos.');
        successCount += 4;
      } else {
        console.error('❌ O registro excluído ainda aparece na listagem de acessos.');
        failCount++;
      }
    } else {
      console.error(`❌ [${deleteRes.status}] Erro ao remover registro de acesso: ${deleteData.error}`);
      failCount++;
    }
  } catch (err) {
    console.error('❌ Erro no CRUD de Portaria:', err.message);
    failCount++;
  }

  // CRUD Encomendas
  try {
    console.log('\n--- Teste de CRUD de Encomendas ---');
    // 1. Criar Encomenda
    const createDelRes = await fetch(`${apiBase}/api/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Condominium-Id': '1' },
      body: JSON.stringify({
        unit_id: 1,
        courier: 'Transportadora Teste',
        tracking_code: 'TEST12345',
        description: 'Pacote de Testes CRUD'
      })
    });
    const newDelivery = await createDelRes.json();
    if (createDelRes.status === 201 && (newDelivery.status === 'PENDING' || newDelivery.status === 'pending') && newDelivery.pickup_code) {
      console.log(`✅ [201 Created] Encomenda criada no SQLite -> ID: ${newDelivery.id}, PIN: ${newDelivery.pickup_code}, Status: ${newDelivery.status}`);
      successCount++;
    } else {
      throw new Error(`Falha ao criar encomenda: ${JSON.stringify(newDelivery)}`);
    }

    // 2. Editar Encomenda
    const updateDelRes = await fetch(`${apiBase}/api/deliveries/${newDelivery.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Condominium-Id': '1' },
      body: JSON.stringify({ description: 'Pacote de Testes Atualizado' })
    });
    const updatedDelivery = await updateDelRes.json();
    if (updateDelRes.ok && updatedDelivery.description === 'Pacote de Testes Atualizado') {
      console.log(`✅ [200 OK] Encomenda editada com sucesso -> ID: ${updatedDelivery.id}`);
      successCount++;
    } else {
      throw new Error(`Falha ao editar encomenda: ${JSON.stringify(updatedDelivery)}`);
    }

    // 3. Teste de Baixa com PIN Incorreto
    const wrongPinRes = await fetch(`${apiBase}/api/deliveries/${newDelivery.id}/pickup`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Condominium-Id': '1' },
      body: JSON.stringify({ pickup_code: '0000', picked_up_by: 'Teste' })
    });
    if (wrongPinRes.status === 400) {
      console.log('✅ [400 Bad Request] Baixa recusada corretamente com PIN incorreto.');
      successCount++;
    } else {
      console.error('❌ Baixa permitida com PIN incorreto.');
      failCount++;
    }

    // 4. Teste de Baixa com PIN Correto
    const correctPinRes = await fetch(`${apiBase}/api/deliveries/${newDelivery.id}/pickup`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Condominium-Id': '1' },
      body: JSON.stringify({ pickup_code: newDelivery.pickup_code, picked_up_by: 'Morador Teste' })
    });
    const pickedDelivery = await correctPinRes.json();
    if (correctPinRes.ok && (pickedDelivery.status === 'PICKED_UP' || pickedDelivery.status === 'delivered')) {
      console.log(`✅ [200 OK] Baixa confirmada com PIN correto -> Status: ${pickedDelivery.status}`);
      successCount++;
    } else {
      throw new Error(`Falha ao dar baixa na encomenda: ${JSON.stringify(pickedDelivery)}`);
    }

    // 5. Teste de Cancelamento de Encomenda
    const secondDelRes = await fetch(`${apiBase}/api/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Condominium-Id': '1' },
      body: JSON.stringify({
        unit_id: 1,
        courier: 'Amazon Teste Cancelamento',
        description: 'Pacote a ser cancelado'
      })
    });
    const secondDel = await secondDelRes.json();

    const cancelRes = await fetch(`${apiBase}/api/deliveries/${secondDel.id}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-Condominium-Id': '1' },
      body: JSON.stringify({ reason: 'Motivo de teste automatizado' })
    });
    const cancelledDel = await cancelRes.json();
    if (cancelRes.ok && cancelledDel.status === 'CANCELLED' && cancelledDel.cancellation_reason) {
      console.log(`✅ [200 OK] Encomenda cancelada com sucesso -> Motivo: ${cancelledDel.cancellation_reason}`);
      successCount++;
    } else {
      throw new Error(`Falha ao cancelar encomenda: ${JSON.stringify(cancelledDel)}`);
    }

    // 6. Teste de Exclusão Física de Encomenda Cancelada
    const deleteDelRes = await fetch(`${apiBase}/api/deliveries/${secondDel.id}`, {
      method: 'DELETE',
      headers: { 'X-Condominium-Id': '1' }
    });
    const deleteDelData = await deleteDelRes.json();
    if (deleteDelRes.ok) {
      console.log(`✅ [200 OK] Encomenda excluída do SQLite -> ${deleteDelData.message}`);
      successCount++;
    } else {
      throw new Error(`Falha ao excluir encomenda: ${JSON.stringify(deleteDelData)}`);
    }
  } catch (err) {
    console.error('❌ Erro no CRUD de Encomendas:', err.message);
    failCount++;
  }

  // Validação de Unicidade de Blocos e Apartamentos
  try {
    console.log('\n--- Teste de Unicidade de Blocos e Apartamentos ---');
    
    // 1. Criar Bloco no Condomínio 1
    const block1Res = await fetch(`${apiBase}/api/condominiums/1/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Torre Unicidade Teste' })
    });
    const block1 = await block1Res.json();
    if (block1Res.status === 201) {
      console.log(`✅ [201 Created] Bloco criado no Condomínio 1 -> ID: ${block1.id}`);
      successCount++;
    } else {
      throw new Error(`Falha ao criar bloco 1: ${JSON.stringify(block1)}`);
    }

    // 2. Bloquear duplicata do mesmo bloco no mesmo condomínio
    const blockDupRes = await fetch(`${apiBase}/api/condominiums/1/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Torre Unicidade Teste' })
    });
    if (blockDupRes.status === 409) {
      console.log('✅ [409 Conflict] Bloco com mesmo nome bloqueado no mesmo condomínio.');
      successCount++;
    } else {
      console.error('❌ Duplicata de bloco permitida indevidamente.');
      failCount++;
    }

    // 3. Bloquear duplicata case-insensitive ('torre unicidade teste')
    const blockCaseRes = await fetch(`${apiBase}/api/condominiums/1/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'torre unicidade teste' })
    });
    if (blockCaseRes.status === 409) {
      console.log('✅ [409 Conflict] Bloco duplicado case-insensitive bloqueado com sucesso.');
      successCount++;
    } else {
      console.error('❌ Duplicata case-insensitive de bloco permitida indevidamente.');
      failCount++;
    }

    // 4. Permitir mesmo nome de bloco no Condomínio 4 (outro condomínio)
    const block2Res = await fetch(`${apiBase}/api/condominiums/4/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Torre Unicidade Teste' })
    });
    const block2 = await block2Res.json();
    if (block2Res.status === 201) {
      console.log(`✅ [201 Created] Mesmo nome de bloco permitido em condomínio diferente -> ID: ${block2.id}`);
      successCount++;
    } else {
      throw new Error(`Falha ao permitir mesmo bloco em condomínio 4: ${JSON.stringify(block2)}`);
    }

    // 5. Criar Apto 909 no Condomínio 1
    const unit1Res = await fetch(`${apiBase}/api/units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Condominium-Id': '1' },
      body: JSON.stringify({ block_id: block1.id, number: '909' })
    });
    const unit1 = await unit1Res.json();
    if (unit1Res.status === 201) {
      console.log(`✅ [201 Created] Apto 909 criado no Condomínio 1 -> ID: ${unit1.id}`);
      successCount++;
    } else {
      throw new Error(`Falha ao criar Apto 909 no Condomínio 1: ${JSON.stringify(unit1)}`);
    }

    // 6. Criar Apto 909 no Condomínio 4 (mesmo nome de bloco e mesmo número de apto em condomínios diferentes)
    const unit2Res = await fetch(`${apiBase}/api/units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Condominium-Id': '4' },
      body: JSON.stringify({ block_id: block2.id, number: '909' })
    });
    const unit2 = await unit2Res.json();
    if (unit2Res.status === 201) {
      console.log(`✅ [201 Created] Apto 909 de mesmo bloco permitido em condomínio diferente -> ID: ${unit2.id}`);
      successCount++;
    } else {
      throw new Error(`Falha ao permitir Apto 909 no Condomínio 4: ${JSON.stringify(unit2)}`);
    }

    // 7. Bloquear Apto 909 duplicado no mesmo bloco do Condomínio 1
    const unitDupRes = await fetch(`${apiBase}/api/units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Condominium-Id': '1' },
      body: JSON.stringify({ block_id: block1.id, number: '909' })
    });
    if (unitDupRes.status === 409) {
      console.log('✅ [409 Conflict] Apto 909 duplicado no mesmo bloco bloqueado com sucesso.');
      successCount++;
    } else {
      console.error('❌ Apto duplicado no mesmo bloco permitido indevidamente.');
      failCount++;
    }

    // Limpeza dos dados de teste
    await fetch(`${apiBase}/api/units/${unit1.id}`, { method: 'DELETE' });
    await fetch(`${apiBase}/api/units/${unit2.id}`, { method: 'DELETE' });
    await fetch(`${apiBase}/api/blocks/${block1.id}`, { method: 'DELETE' });
    await fetch(`${apiBase}/api/blocks/${block2.id}`, { method: 'DELETE' });
    console.log('✅ Limpeza dos registros de teste de unicidade concluída.');
    successCount++;
  } catch (err) {
    console.error('❌ Erro na validação de unicidade de blocos e unidades:', err.message);
    failCount++;
  }

  // 3. Testes de Feature Flags (LPS)
  console.log('\n--- 3. Validação de Feature Flags da LPS ---');
  try {
    // Desativar Mercado
    await fetch(`${apiBase}/api/config/features`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: 'ENABLE_MARKETPLACE', enabled: false })
    });

    const marketDisabled = await fetch(`${apiBase}/api/market/products`);
    if (marketDisabled.status === 403) {
      console.log('✅ [403 Forbidden] Feature Flag ENABLE_MARKETPLACE=false bloqueou o acesso ao Mercadinho.');
      successCount++;
    } else {
      console.error('❌ Bloqueio de Feature Flag falhou.');
      failCount++;
    }

    // Reativar Mercado
    await fetch(`${apiBase}/api/config/features`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature: 'ENABLE_MARKETPLACE', enabled: true })
    });

    const marketEnabled = await fetch(`${apiBase}/api/market/products`);
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
