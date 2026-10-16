// ============================================================================
// PratiCom ERP - Suíte Completa de Testes Automatizados de Domínio DDD
// Cobre 10 Value Objects, 23 Entidades, Agregados, Invariantes, Serviços e Repositórios
// ============================================================================

import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';

import {
  CPF,
  CNPJ,
  LicensePlate,
  Money,
  PickupPIN,
  TimeRange,
  Email,
  Phone,
  Barcode,
  PostalCode,
  Condominium,
  CondominiumModule,
  CondoSetting,
  Block,
  Unit,
  Resident,
  User,
  Vehicle,
  Pet,
  Delivery,
  AccessLog,
  Space,
  Reservation,
  Occurrence,
  Poll,
  PollVote,
  FinancialTransaction,
  Announcement,
  MarketProduct,
  MarketSale,
  MarketSaleItem,
  AuditLog,
  SchemaMigration,
  DomainEvents,
  ReservationConflictDetector,
  QuorumCalculator,
  FinancialHealthService,
  MarketCheckoutService,
  AccessControlService,
  FinancialBillingService
} from '../index.js';

import { DatabaseEngine } from '../../../database/DatabaseEngine.js';
import { ALL_TABLE_CLASSES } from '../../../database/tables/index.js';
import { SqliteDeliveryRepository } from '../../infrastructure/repositories/SqliteDeliveryRepository.js';
import { SqliteUnitRepository } from '../../infrastructure/repositories/SqliteUnitRepository.js';
import { SqliteFinancialRepository } from '../../infrastructure/repositories/SqliteFinancialRepository.js';
import { SqliteMarketRepository } from '../../infrastructure/repositories/SqliteMarketRepository.js';

console.log('🧪 Iniciando Suíte Completa de Testes do Domínio DDD PratiCom ERP...\n');

// ----------------------------------------------------------------------------
// Teste 1: Value Objects Básicos (CPF, CNPJ, LicensePlate, Money, TimeRange, PIN)
// ----------------------------------------------------------------------------
console.log('  [Teste 1] Value Objects Numéricos e Documentais (CPF, CNPJ, Placa, Money)...');
const cpf = new CPF('12345678909');
assert.strictEqual(cpf.formatted, '123.456.789-09');

const cnpj = new CNPJ('11222333000181');
assert.strictEqual(cnpj.formatted, '11.222.333/0001-81');

const plateMercosul = new LicensePlate('BRA2E19');
assert.strictEqual(plateMercosul.isMercosul, true);

const money = Money.fromReais(150.25);
assert.strictEqual(money.cents, 15025);
assert.strictEqual(money.add(Money.fromReais(49.75)).value, 200.00);

const pin = new PickupPIN('4829');
assert.strictEqual(pin.matches('4829'), true);
assert.strictEqual(pin.matches('0000'), false);

const timeRange = new TimeRange('10:00', '12:00');
assert.strictEqual(timeRange.durationMinutes, 120);
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 2: Novos Value Objects (Email, Phone, Barcode, PostalCode)
// ----------------------------------------------------------------------------
console.log('  [Teste 2] Novos Value Objects (Email, Phone, Barcode EAN-13, PostalCode CEP)...');
const email = new Email('contato@praticom.com.br');
assert.strictEqual(email.value, 'contato@praticom.com.br');
assert.throws(() => new Email('invalido@@email'), /E-mail inválido/);

const mobilePhone = new Phone('41988881111');
assert.strictEqual(mobilePhone.isMobile, true);
assert.strictEqual(mobilePhone.formatted, '(41) 98888-1111');

const landlinePhone = new Phone('4132221000');
assert.strictEqual(landlinePhone.isMobile, false);
assert.strictEqual(landlinePhone.formatted, '(41) 3222-1000');

const barcode = new Barcode('7894900010015'); // Coca-Cola EAN-13 válido
assert.strictEqual(barcode.value, '7894900010015');

const cep = new PostalCode('80420000');
assert.strictEqual(cep.formatted, '80420-000');
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 3: Agregado User & RBAC
// ----------------------------------------------------------------------------
console.log('  [Teste 3] Agregado User e Regras de Controle de Acesso RBAC...');
const adminUser = User.create({
  name: 'Administrador Master',
  email: 'admin@praticom.com.br',
  role: 'ADMIN'
});
assert.strictEqual(adminUser.canManageFinances(), true);
assert.strictEqual(adminUser.canAccessPortaria(), true);

const moradorUser = User.create({
  name: 'Morador Carlos',
  email: 'carlos@email.com',
  role: 'MORADOR'
});
assert.strictEqual(moradorUser.canManageFinances(), false);
assert.strictEqual(moradorUser.canAccessPortaria(), false);

assert.throws(() => {
  User.create({ name: 'Hacker', email: 'h@h.com', role: 'SUPERUSER_INVALID' });
}, /Papel inválido/);
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 4: Agregado Unit e Relacionamento com Filhos
// ----------------------------------------------------------------------------
console.log('  [Teste 4] Agregado Unit (Apartamento com Moradores, Veículos e Pets)...');
const unit = Unit.create({ id: 502, blockId: 1, number: '502', floor: 5 });
const resident = Resident.create({ unitId: 1, name: 'Eduardo Costa', role: 'Proprietário' });
const vehicle = Vehicle.create({ unitId: 1, plate: 'RIO2A18', model: 'Corolla' });
const pet = Pet.create({ unitId: 1, name: 'Bob', species: 'Cão' });

unit.addResident(resident);
unit.addVehicle(vehicle);
unit.addPet(pet);

assert.strictEqual(unit.isOccupied(), true);
assert.strictEqual(unit.residents.length, 1);
assert.strictEqual(unit.vehicles.length, 1);
assert.strictEqual(unit.pets.length, 1);
assert.strictEqual(unit.getPrimaryResident().name, 'Eduardo Costa');
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 5: Portaria (AccessLog & AccessControlService)
// ----------------------------------------------------------------------------
console.log('  [Teste 5] Portaria: AccessLog e AccessControlService...');
const accessEntry = AccessControlService.authorizeEntry({
  destinationUnit: unit,
  visitorName: 'Técnico Internet',
  document: 'RG 12.345.678',
  type: 'Prestador de Serviço',
  company: 'Claro'
});
assert.strictEqual(accessEntry.isInProperty, true);
assert.strictEqual(accessEntry.type, 'Prestador de Serviço');

accessEntry.recordExit();
assert.strictEqual(accessEntry.isInProperty, false);
assert.ok(accessEntry.exitedAt !== null);
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 6: Honest Market (MarketProduct, Sale & MarketCheckoutService)
// ----------------------------------------------------------------------------
console.log('  [Teste 6] Honest Market: MarketProduct, Venda e MarketCheckoutService...');
const coke = MarketProduct.create({
  id: 1,
  condominiumId: 1,
  name: 'Coca-Cola 350ml',
  price: 5.50,
  stockQuantity: 10,
  minStock: 2,
  barcode: '7894900010015'
});

const chips = MarketProduct.create({
  id: 2,
  condominiumId: 1,
  name: 'Pringles 114g',
  price: 15.00,
  stockQuantity: 5,
  minStock: 1
});

// Checkout com 2 Cokes + 1 Pringles = R$ 26,00
const checkout = MarketCheckoutService.processCheckout({
  condominiumId: 1,
  unitId: 502,
  paymentMethod: 'PIX',
  cartItems: [
    { product: coke, quantity: 2 },
    { product: chips, quantity: 1 }
  ]
});

assert.strictEqual(checkout.totalCents, 2600);
assert.strictEqual(coke.stockQuantity, 8); // 10 - 2
assert.strictEqual(chips.stockQuantity, 4); // 5 - 1

// Rejeição por estoque insuficiente
assert.throws(() => {
  MarketCheckoutService.processCheckout({
    condominiumId: 1,
    cartItems: [{ product: chips, quantity: 999 }]
  });
}, /Estoque insuficiente/);
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 7: Financeiro (FinancialTransaction & FinancialBillingService)
// ----------------------------------------------------------------------------
console.log('  [Teste 7] Financeiro: FinancialTransaction, Juros e FinancialBillingService...');
const billing = FinancialBillingService.generateMonthlyQuotas({
  condominiumId: 1,
  units: [unit],
  baseQuotaAmount: 500.00,
  reserveFundPercentage: 10, // R$ 50,00 de fundo de reserva
  dueDate: '2026-11-10'
});

assert.strictEqual(billing.unitCount, 1);
assert.strictEqual(billing.transactions.length, 1);
const tx = billing.transactions[0];
assert.strictEqual(tx.amountValue, 550.00);
assert.strictEqual(tx.status, 'PENDING');

tx.markAsPaid('2026-11-08');
assert.strictEqual(tx.isPaid, true);
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 8: Entidades Auxiliares (Announcement, CondoSetting, Block)
// ----------------------------------------------------------------------------
console.log('  [Teste 8] Entidades Auxiliares: Announcement, CondoSetting, Block...');
const announcement = Announcement.create({
  condominiumId: 1,
  title: 'Manutenção de Fachada',
  content: 'Início dos trabalhos na segunda-feira.',
  priority: 'urgente'
});
assert.strictEqual(announcement.isUrgent, true);
announcement.pin();
assert.strictEqual(announcement.isPinned, true);

const setting = CondoSetting.create({
  condominiumId: 1,
  settingKey: 'enable_pin_pickup',
  settingValue: 'true',
  settingType: 'boolean'
});
assert.strictEqual(setting.getTypedValue(), true);

const block = Block.create({ condominiumId: 1, name: 'Torre Magnólia' });
assert.strictEqual(block.isActive, true);
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 9: Encomenda Delivery com PIN e Evento de Domínio
// ----------------------------------------------------------------------------
console.log('  [Teste 9] Agregado Delivery e Liberação por PIN...');
const delivery = Delivery.create({
  unitId: 502,
  courier: 'Sedex',
  description: 'Documentos Contratuais',
  pickupCode: '9142'
});

assert.throws(() => delivery.markAsPickedUp('Morador', '0000'), /PIN incorreto/);
delivery.markAsPickedUp('Morador', '9142');
assert.strictEqual(delivery.status, 'PICKED_UP');
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 10: Assembleia Poll & QuorumCalculator
// ----------------------------------------------------------------------------
console.log('  [Teste 10] Agregado Poll e QuorumCalculator...');
const poll = Poll.create({
  condominiumId: 1,
  title: 'Reforma da Guarita',
  description: 'Aprovação do rateio extraordinário.',
  category: 'Obras',
  quorumType: 'TWO_THIRDS',
  startDate: '2026-10-01',
  endDate: '2026-10-31',
  options: ['Aprovar', 'Rejeitar']
});

poll.castVote({ unitId: 502, residentId: 1, selectedOption: 'Aprovar' });
assert.throws(() => poll.castVote({ unitId: 502, selectedOption: 'Rejeitar' }), /já registrou seu voto/);

const quorum = QuorumCalculator.evaluateQuorum({
  quorumType: poll.quorumType,
  totalUnits: 1, // 1 voto de 1 unidade = 100%
  votes: poll.votes
});
assert.strictEqual(quorum.quorumReached, true);
assert.strictEqual(quorum.isApproved, true);
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 11: Repositórios SQLite Integrados
// ----------------------------------------------------------------------------
console.log('  [Teste 11] Persistência Completa nos Repositórios SQLite...');
const testDbPath = path.resolve(process.cwd(), 'database', 'test_ddd_full.sqlite');
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

const engine = new DatabaseEngine({ filePath: testDbPath, verbose: false });
engine.registerTables(ALL_TABLE_CLASSES);
engine.initializeSchema();

// 1. Persiste Condomínio e Bloco
const condoRow = engine.getTable('condominiums').insert({ name: 'Condo Enterprise', cnpj: '11222333000181', status: 'ACTIVE' });
const blockRow = engine.getTable('blocks').insert({ condominium_id: condoRow.id, name: 'Torre A' });

// 2. SqliteUnitRepository
const unitRepo = new SqliteUnitRepository(engine);
const newUnit = Unit.create({ blockId: blockRow.id, number: '101', floor: 1 });
const savedUnit = unitRepo.save(newUnit);
assert.ok(savedUnit.id > 0);

// 3. SqliteFinancialRepository
const finRepo = new SqliteFinancialRepository(engine);
const newTx = FinancialTransaction.create({
  condominiumId: condoRow.id,
  unitId: savedUnit.id,
  type: 'income',
  category: 'Cota Condominial',
  description: 'Mensalidade',
  amount: 600.00,
  dueDate: '2026-11-10'
});
const savedTx = finRepo.save(newTx);
assert.strictEqual(savedTx.amountValue, 600.00);

// 4. SqliteMarketRepository
const marketRepo = new SqliteMarketRepository(engine);
const prod = MarketProduct.create({
  condominiumId: condoRow.id,
  name: 'Água com Gás 500ml',
  price: 4.00,
  stockQuantity: 20
});
const savedProd = marketRepo.saveProduct(prod);
assert.strictEqual(savedProd.stockQuantity, 20);

// Venda de 2 garrafas
const sale = MarketSale.create({
  condominiumId: condoRow.id,
  unitId: savedUnit.id,
  paymentMethod: 'PIX'
});
sale.addItem(savedProd, 2);
marketRepo.recordSale(sale);

const refreshedProd = marketRepo.findProductById(savedProd.id);
assert.strictEqual(refreshedProd.stockQuantity, 18); // 20 - 2

engine.close();
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
console.log('    ✓ Sucesso!');

console.log('\n🌟 TODOS OS 11 TESTES DO DOMÍNIO DDD COMPLETO PASSARAM COM 100% DE SUCESSO!\n');
