import assert from 'assert';
import db from '../config/database.js';
import { seedDatabase } from '../database/seed.js';
import {
  Condominium,
  Block,
  Unit,
  Resident,
  Vehicle,
  Delivery,
  AccessLog,
  Reservation,
  FinancialTransaction,
  Announcement,
  MarketProduct,
  DomainValidationError
} from '../models/index.js';
import { BaseRepository } from '../database/BaseRepository.js';
import { BaseService } from '../services/BaseService.js';
import {
  DeliveryService,
  AccessService,
  ReservationService,
  FinancialService,
  MarketService,
  DashboardService
} from '../services/specializedServices.js';

console.log('🧪 Iniciando Verificação de Conformidade Clean MVC + DDD...\n');

// 1. Banco e Seed
console.log('--- 1. Validação do Banco de Dados SQLite & Seed ---');
seedDatabase();
const condoCount = db.prepare('SELECT COUNT(*) as count FROM condominiums').get().count;
assert(condoCount >= 2, 'Deve haver ao menos 2 condomínios semeados.');
console.log(`  ✅ [PASS] Banco SQLite ativo e semeado com ${condoCount} condomínios.`);

// 2. Validações Invariantes DDD
console.log('\n--- 2. Validação das Entidades de Domínio DDD ---');

// Condominium
assert.throws(() => {
  new Condominium({ name: 'AB' }).validate();
}, DomainValidationError, 'Deve rejeitar condomínio com nome < 3 caracteres');
const validCondo = new Condominium({ name: 'Condomínio Teste', status: 'ACTIVE' });
assert(validCondo.validate() === true);
console.log('  ✅ [PASS] Entidade Condominium valida invariantes com sucesso.');

// Vehicle
assert.throws(() => {
  new Vehicle({ unit_id: 1, plate: 'ABC', model: 'Fusca' }).validate();
}, DomainValidationError, 'Deve rejeitar placa com tamanho diferente de 7 caracteres');
const validVehicle = new Vehicle({ unit_id: 1, plate: 'abc-1234', model: 'Civic' });
assert.strictEqual(validVehicle.plate, 'ABC1234', 'Placa deve ser sanitizada e em maiúsculas');
assert(validVehicle.validate() === true);
console.log('  ✅ [PASS] Entidade Vehicle sanitiza e valida placas Mercosul.');

// Delivery PIN
const delivery = new Delivery({ unit_id: 1, courier: 'FedEx' });
assert(delivery.pickup_code.length === 4, 'Deve gerar PIN de 4 dígitos automaticamente.');
assert.throws(() => {
  delivery.confirmPickup('0000');
}, DomainValidationError, 'Deve rejeitar baixa com PIN incorreto.');
delivery.confirmPickup(delivery.pickup_code, 'Morador Teste');
assert.strictEqual(delivery.status, 'PICKED_UP', 'Deve confirmar retirada com PIN correto.');
console.log('  ✅ [PASS] Entidade Delivery valida e confere PIN com segurança.');

// 3. BaseRepository
console.log('\n--- 3. Validação do BaseRepository (Reuso & DRY) ---');
const spaceRepo = new BaseRepository('spaces');
const spaces = spaceRepo.findAll({ condominium_id: 1 });
assert(spaces.length >= 3, 'Deve listar áreas comuns do condomínio 1');
console.log(`  ✅ [PASS] BaseRepository executou consulta parametrizada (${spaces.length} espaços encontrados).`);

// 4. BaseService com Validação DDD Pré-Persistência
console.log('\n--- 4. Validação do BaseService (Classificação DDD Obrigatória) ---');
const residentRepo = new BaseRepository('residents', { hasDirectTenant: false });
const residentService = new BaseService(residentRepo, Resident);

assert.throws(() => {
  residentService.create({ unit_id: 1, name: 'A' }); // nome muito curto
}, DomainValidationError, 'BaseService deve impedir inserção de dados inválidos no banco.');
console.log('  ✅ [PASS] BaseService intercepta violação de domínio antes de tocar no SQLite.');

const newRes = residentService.create({
  unit_id: 1,
  name: 'Juliana Teste DDD',
  role: 'Inquilino',
  phone: '(41) 98888-0000'
});
assert(newRes.id > 0, 'Morador deve ser persistido com sucesso.');
console.log(`  ✅ [PASS] BaseService persistiu morador #${newRes.id} após validação DDD aprovada.`);
residentService.delete(newRes.id);

// 5. Reservas e Bloqueio de Conflito de Horário
console.log('\n--- 5. Validação de Regra de Conflito de Reservas ---');
const resService = new ReservationService();
const today = new Date().toISOString().split('T')[0];

assert.throws(() => {
  // Já existe reserva no seed para o espaço 1 hoje das 14:00 às 22:00
  resService.createWithConflictCheck({
    space_id: 1,
    resident_id: 1,
    unit_id: 1,
    reservation_date: today,
    start_time: '15:00',
    end_time: '18:00'
  });
}, DomainValidationError, 'Deve bloquear conflito de horário');
console.log('  ✅ [PASS] ReservationService bloqueou agendamento concorrente no mesmo espaço.');

// 6. Checkout PDV do Mercado com ACID
console.log('\n--- 6. Validação de Vendas no Mercadinho (Transação ACID) ---');
const marketService = new MarketService();
const prodBefore = marketService.getById(1);
const stockBefore = prodBefore.stock_quantity;

const saleResult = marketService.checkout(1, {
  unit_id: 1,
  payment_method: 'PIX',
  items: [{ product_id: 1, quantity: 2 }]
});

assert(saleResult.sale_id > 0, 'Venda deve ser registrada.');
const prodAfter = marketService.getById(1);
assert.strictEqual(prodAfter.stock_quantity, stockBefore - 2, 'Estoque deve ser decrementado atomicamente.');
console.log('  ✅ [PASS] MarketService concluiu venda atômica e atualizou estoque.');

// 7. Resumo Financeiro
console.log('\n--- 7. Validação do Resumo Financeiro ---');
const finSummary = new FinancialService().getSummary(1);
assert(typeof finSummary.currentBalance === 'number');
assert(typeof finSummary.defaultRate === 'number');
console.log(`  ✅ [PASS] FinancialService calculou balanço (R$ ${finSummary.currentBalance}) e inadimplência (${finSummary.defaultRate}%).`);

// 8. Métricas Consolidadas do Dashboard
console.log('\n--- 8. Validação do Dashboard Executivo ---');
const dashData = DashboardService.getMetrics(1);
assert(dashData.metrics.pendingDeliveries >= 1);
assert(dashData.metrics.activeVisitors >= 1);
console.log(`  ✅ [PASS] DashboardService consolidou métricas: ${dashData.metrics.pendingDeliveries} encomendas, ${dashData.metrics.activeVisitors} visitantes ativos.`);

console.log('\n===============================================================');
console.log('🎉 TODAS AS VALIDAÇÕES CLEAN MVC + DDD FORAM APROVADAS COM 100%!');
console.log('===============================================================\n');
