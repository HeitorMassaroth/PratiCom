// Node 24 native fetch

const BASE_URL = 'http://localhost:5000/api';

async function runVehicleTests() {
  console.log('🧪 Iniciando Testes Automatizados do Fluxo de Veículos...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FALHA: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Listar veículos do Condomínio 1
    const resList = await fetch(`${BASE_URL}/vehicles`, {
      headers: { 'X-Condominium-Id': '1' }
    });
    assert(resList.status === 200, 'GET /api/vehicles retorna 200 OK');
    const initialVehicles = await resList.json();
    assert(Array.isArray(initialVehicles), 'Retorno é um array de veículos');

    // 2. Obter uma unidade válida do Condomínio 1
    const resUnits = await fetch(`${BASE_URL}/units`, {
      headers: { 'X-Condominium-Id': '1' }
    });
    const units = await resUnits.json();
    assert(units.length > 0, 'Existe pelo menos uma unidade no Condomínio 1');
    const testUnit = units[0];

    // Obter moradores dessa unidade
    const resResidents = await fetch(`${BASE_URL}/residents?unit_id=${testUnit.id}`, {
      headers: { 'X-Condominium-Id': '1' }
    });
    const residents = await resResidents.json();
    const testResident = residents.length > 0 ? residents[0] : null;

    // 3. Cadastrar um novo veículo associado à unidade e ao morador
    const newVehicleData = {
      unit_id: testUnit.id,
      resident_id: testResident ? testResident.id : null,
      plate: 'TST9Z99',
      model: 'Honda Civic Touring',
      color: 'Cinza Grafite',
      type: 'Sedan',
      parking_spot: 'Vaga Teste 101'
    };

    const resCreate = await fetch(`${BASE_URL}/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Condominium-Id': '1'
      },
      body: JSON.stringify(newVehicleData)
    });
    assert(resCreate.status === 201, 'POST /api/vehicles cria o veículo (201 Created)');
    const createdVehicle = await resCreate.json();
    assert(createdVehicle.id > 0, `Veículo criado com ID: ${createdVehicle.id}`);
    assert(createdVehicle.plate === 'TST9Z99', 'Placa normalizada em maiúsculo (TST9Z99)');
    assert(createdVehicle.model === 'Honda Civic Touring', 'Modelo persistido corretamente');
    assert(createdVehicle.unit_number !== undefined, 'Retorna número da unidade associada');

    // 4. Buscar detalhes do veículo via GET /api/vehicles/:id
    const resGet = await fetch(`${BASE_URL}/vehicles/${createdVehicle.id}`, {
      headers: { 'X-Condominium-Id': '1' }
    });
    assert(resGet.status === 200, `GET /api/vehicles/${createdVehicle.id} responde 200 OK`);
    const fetchedVehicle = await resGet.json();
    assert(fetchedVehicle.id === createdVehicle.id, 'ID coincide');

    // 5. Testar isolamento multi-tenant: tentar editar/deletar a partir de outro condomínio (ex: ID 999 ou 2)
    const resCrossEdit = await fetch(`${BASE_URL}/vehicles/${createdVehicle.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Condominium-Id': '2'
      },
      body: JSON.stringify({ color: 'Cor Invasora' })
    });
    assert(resCrossEdit.status === 404 || resCrossEdit.status === 400 || resCrossEdit.status === 403, 'Acesso cruzado de outro condomínio é impedido no PATCH');

    // 6. Editar informações do veículo pelo condomínio correto
    const resUpdate = await fetch(`${BASE_URL}/vehicles/${createdVehicle.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Condominium-Id': '1'
      },
      body: JSON.stringify({
        model: 'Honda Civic Si 2.0 Turbo',
        color: 'Preto Cristal',
        parking_spot: 'Vaga G1-01'
      })
    });
    assert(resUpdate.status === 200, `PATCH /api/vehicles/${createdVehicle.id} responde 200 OK`);
    const updatedVehicle = await resUpdate.json();
    assert(updatedVehicle.model === 'Honda Civic Si 2.0 Turbo', 'Modelo atualizado persistido');
    assert(updatedVehicle.color === 'Preto Cristal', 'Cor atualizada persistida');

    // 7. Excluir o veículo
    const resDelete = await fetch(`${BASE_URL}/vehicles/${createdVehicle.id}`, {
      method: 'DELETE',
      headers: { 'X-Condominium-Id': '1' }
    });
    assert(resDelete.status === 200, `DELETE /api/vehicles/${createdVehicle.id} responde 200 OK`);

    // 8. Confirmar que o veículo foi removido do banco
    const resVerify = await fetch(`${BASE_URL}/vehicles/${createdVehicle.id}`, {
      headers: { 'X-Condominium-Id': '1' }
    });
    assert(resVerify.status === 404, 'Veículo excluído não é mais encontrado (404)');

    // 9. Confirmar que a unidade e o morador continuam existindo normalmente
    const resUnitCheck = await fetch(`${BASE_URL}/units/${testUnit.id}`, {
      headers: { 'X-Condominium-Id': '1' }
    });
    assert(resUnitCheck.status === 200, 'Unidade foi preservada (não foi excluída junto com o veículo)');

    if (testResident) {
      const resResCheck = await fetch(`${BASE_URL}/residents?unit_id=${testUnit.id}`, {
        headers: { 'X-Condominium-Id': '1' }
      });
      const residentsAfter = await resResCheck.json();
      assert(residentsAfter.some(r => r.id === testResident.id), 'Morador foi preservado (não foi excluído junto com o veículo)');
    }

  } catch (err) {
    console.error('Erro na execução dos testes:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`📊 Total: ${passed + failed} | Aprovados: ${passed} | Falhas: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runVehicleTests();
