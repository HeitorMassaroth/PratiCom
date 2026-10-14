import assert from 'assert';
import http from 'http';
import { DAOFactory } from '../dao/DAOFactory.js';
import DatabaseSingleton from '../config/DatabaseSingleton.js';

console.log('🧪 Iniciando Suíte de Testes Direcionada às Correções de Auditoria...');

const db = DatabaseSingleton.getDb();
const financialDAO = DAOFactory.getDAO('financial');
const reservationDAO = DAOFactory.getDAO('reservation');
const residentDAO = DAOFactory.getDAO('resident');
const accessDAO = DAOFactory.getDAO('access');

let passedCount = 0;

function pass(msg) {
  console.log(`  ✅ [PASS] ${msg}`);
  passedCount++;
}

// Helper para fazer requisições HTTP locais
function apiRequest(path, { method = 'GET', body = null, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Condominium-Id': '1',
      ...headers
    };
    const req = http.request(`http://localhost:5000${path}`, {
      method,
      headers: defaultHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch { json = data; }
        resolve({ status: res.statusCode, data: json });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  // ----------------------------------------------------
  // TESTE 1: BUG-001 - FinancialDAO.getSummary com parâmetro numérico e total_balance
  // ----------------------------------------------------
  console.log('\n--- 1. Validação de FinancialDAO.getSummary (BUG-001) ---');
  const summaryObj = financialDAO.getSummary({ condominiumId: 1 });
  assert(typeof summaryObj.currentBalance === 'number', 'currentBalance deve ser number');
  assert(summaryObj.total_balance === summaryObj.currentBalance, 'total_balance deve equivaler a currentBalance');
  pass('FinancialDAO.getSummary({ condominiumId: 1 }) retorna total_balance');

  const summaryDirectId = financialDAO.getSummary(1);
  assert(typeof summaryDirectId.currentBalance === 'number', 'currentBalance direto deve ser number');
  assert(summaryDirectId.total_balance === summaryDirectId.currentBalance, 'total_balance direto deve equivaler');
  pass('FinancialDAO.getSummary(1) trata ID numérico sem desestruturar undefined');

  // ----------------------------------------------------
  // TESTE 2: BUG-002 - DELETE /api/deliveries/:id retorna 404 em ID inexistente
  // ----------------------------------------------------
  console.log('\n--- 2. Validação da Rota DELETE /api/deliveries/:id (BUG-002) ---');
  const resDelNonExistent = await apiRequest('/api/deliveries/999999', { method: 'DELETE' });
  assert.strictEqual(resDelNonExistent.status, 404, `Esperava 404, recebeu ${resDelNonExistent.status}`);
  assert(/não encontrada/i.test(resDelNonExistent.data.error), 'Mensagem de erro deve ser Encomenda não encontrada');
  pass('DELETE /api/deliveries/999999 retorna 404 Not Found corretamente (sem colisão de rota)');

  // ----------------------------------------------------
  // TESTE 3: BUG-003 - ReservationDAO bloqueia conflito com reserva de status 'Confirmada'
  // ----------------------------------------------------
  console.log('\n--- 3. Validação de Conflito de Horário de Reservas (BUG-003) ---');
  const testDate = '2027-11-20';
  const space = db.prepare('SELECT id FROM spaces LIMIT 1').get();
  const unit = db.prepare('SELECT id FROM units LIMIT 1').get();
  const resident = db.prepare('SELECT id FROM residents LIMIT 1').get();

  // Inserir reserva propositalmente com status 'Confirmada' em formato legado
  db.prepare(`
    INSERT INTO reservations (space_id, unit_id, resident_id, reservation_date, start_time, end_time, guests_count, status)
    VALUES (?, ?, ?, ?, '14:00', '15:00', 2, 'Confirmada')
  `).run(space.id, unit.id, resident.id, testDate);

  let conflictDetected = false;
  try {
    reservationDAO.createReservation({
      space_id: space.id,
      unit_id: unit.id,
      resident_id: resident.id,
      reservation_date: testDate,
      start_time: '14:00',
      end_time: '15:00',
      guests_count: 3
    });
  } catch (err) {
    if (/Já existe uma reserva confirmada/i.test(err.message)) {
      conflictDetected = true;
    }
  }

  // Limpar registro de teste
  db.prepare('DELETE FROM reservations WHERE reservation_date = ? AND space_id = ?').run(testDate, space.id);

  assert.strictEqual(conflictDetected, true, 'Deveria detectar conflito com reserva Confirmada');
  pass('ReservationDAO bloqueou sobreposição de horário contra reserva com status legado "Confirmada"');

  // ----------------------------------------------------
  // TESTE 4: BUG-004 - POST /api/access/entry sem unidade retorna HTTP 400
  // ----------------------------------------------------
  console.log('\n--- 4. Validação de Validação em POST /api/access/entry (BUG-004) ---');
  const resEntryMissingUnit = await apiRequest('/api/access/entry', {
    method: 'POST',
    body: {
      visitor_name: 'Visitante Teste',
      document: '123.456.789-00'
      // destination_unit_id ausente
    }
  });
  assert.strictEqual(resEntryMissingUnit.status, 400, `Esperava status 400, recebeu ${resEntryMissingUnit.status}`);
  assert(/unidade de destino é obrigatória/i.test(resEntryMissingUnit.data.error), 'Mensagem deve indicar unidade obrigatória');
  pass('POST /api/access/entry sem unidade retorna 400 Bad Request (não 500)');

  // ----------------------------------------------------
  // TESTE 5: BUG-005 - DELETE /api/residents/:id com isolamento cross-tenant e 404
  // ----------------------------------------------------
  console.log('\n--- 5. Validação de Isolamento de Morador em DELETE (BUG-005) ---');
  // Criar morador temporário no Condomínio 1
  const unit1 = db.prepare('SELECT u.id FROM units u JOIN blocks b ON u.block_id = b.id WHERE b.condominium_id = 1 LIMIT 1').get();
  const resResident = residentDAO.createResident({
    unit_id: unit1.id,
    name: 'Morador Teste Tenant Alpha',
    email: 'alpha_tenant_test@example.com'
  });
  const residentId = resResident.id;

  // Tentar excluir com header do Condomínio 2 (ou 999)
  const crossDeleteRes = await apiRequest(`/api/residents/${residentId}`, {
    method: 'DELETE',
    headers: { 'X-Condominium-Id': '999' }
  });
  assert.strictEqual(crossDeleteRes.status, 404, `Esperava 404 cross-tenant, recebeu ${crossDeleteRes.status}`);
  pass('DELETE cross-tenant em morador de outro condomínio é barrado com 404 Not Found');

  // Morador ainda deve existir no banco
  const stillExists = residentDAO.getResident(residentId, 1);
  assert(stillExists !== null, 'Morador deve continuar intacto após tentativa cross-tenant');
  pass('Morador do Condomínio 1 foi preservado intacto');

  // Excluir morador com o condomínio correto (1)
  const validDeleteRes = await apiRequest(`/api/residents/${residentId}`, {
    method: 'DELETE',
    headers: { 'X-Condominium-Id': '1' }
  });
  assert.strictEqual(validDeleteRes.status, 200, 'Exclusão válida deve responder 200 OK');
  pass('DELETE no condomínio legítimo remove com 200 OK');

  // Nova tentativa no mesmo ID deve responder 404 (não 200 falso)
  const notFoundDeleteRes = await apiRequest(`/api/residents/${residentId}`, {
    method: 'DELETE',
    headers: { 'X-Condominium-Id': '1' }
  });
  assert.strictEqual(notFoundDeleteRes.status, 404, 'Exclusão de morador já excluído deve responder 404');
  pass('DELETE de morador inexistente responde 404 Not Found em vez de 200 falso');

  console.log(`\n====================================================`);
  console.log(`🎉 TODAS AS CORREÇÕES DIRECIONADAS FORAM VALIDADA: ${passedCount} Aprovados!`);
  console.log(`====================================================\n`);
}

runTests().catch(err => {
  console.error('❌ Falha na validação:', err);
  process.exit(1);
});
