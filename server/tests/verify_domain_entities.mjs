import assert from 'node:assert/strict';
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
  BaseDomainEntity
} from '../domain/index.js';

console.log('🧪 Iniciando Suíte de Testes Unitários das 10 Entidades de Domínio...');

// 1. Condominium
console.log('\n--- 1. Validando Entidade Condominium ---');
const condo = new Condominium({
  id: 1,
  name: 'Condomínio Residencial Alpha',
  address: 'Av. Paulista, 1000',
  cnpj: '12.345.678/0001-90',
  status: 'ACTIVE'
});
assert.equal(condo.id, 1);
assert.equal(condo.name, 'Condomínio Residencial Alpha');
assert.equal(condo.isActive(), true);
condo.validate();
assert.throws(() => new Condominium({ name: '' }).validate(), /Nome do condomínio é obrigatório/);
console.log('✅ Condominium validado com sucesso.');

// 2. Block
console.log('\n--- 2. Validando Entidade Block ---');
const block = new Block({
  id: 10,
  condominium_id: 1,
  name: 'Torre das Flores',
  description: 'Bloco A'
});
assert.equal(block.id, 10);
assert.equal(block.condominiumId, 1);
assert.equal(block.normalizeName(), 'TORRE DAS FLORES');
assert.equal(block.isActive(), true);
block.validate();
assert.throws(() => new Block({ name: 'B' }).validate(), /ID do condomínio é obrigatório/);
console.log('✅ Block validado com sucesso.');

// 3. Unit
console.log('\n--- 3. Validando Entidade Unit ---');
const unit = new Unit({
  id: 101,
  block_id: 10,
  block: 'Torre das Flores',
  number: '101',
  floor: 1,
  type: 'APARTMENT'
});
assert.equal(unit.id, 101);
assert.equal(unit.number, '101');
assert.equal(unit.getFullIdentifier(), 'Torre das Flores - 101');
assert.equal(unit.isPenthouse(), false);
unit.validate();
assert.throws(() => new Unit({ number: '' }).validate(), /Número da unidade é obrigatório/);
console.log('✅ Unit validada com sucesso.');

// 4. Resident
console.log('\n--- 4. Validando Entidade Resident ---');
const res = new Resident({
  id: 50,
  unit_id: 101,
  name: 'Carlos Drummond',
  email: 'carlos@example.com',
  role: 'PROPRIETÁRIO',
  emergency_contact: '11999998888'
});
assert.equal(res.id, 50);
assert.equal(res.name, 'Carlos Drummond');
assert.equal(res.isOwner(), true);
assert.equal(res.isTenant(), false);
assert.equal(res.hasEmergencyContact(), true);
res.validate();
assert.throws(() => new Resident({ name: 'Carlos' }).validate(), /Unidade é obrigatória/);
console.log('✅ Resident validado com sucesso.');

// 5. Vehicle
console.log('\n--- 5. Validando Entidade Vehicle ---');
const vehicle = new Vehicle({
  id: 20,
  unit_id: 101,
  plate: 'abc-1234',
  model: 'Civic',
  type: 'CAR'
});
assert.equal(vehicle.normalizePlate(), 'ABC1234');
assert.equal(vehicle.isCar(), true);
assert.equal(vehicle.isMotorcycle(), false);
vehicle.validate();
assert.throws(() => new Vehicle({ unit_id: 101, plate: '' }).validate(), /Placa é obrigatória/);
console.log('✅ Vehicle validado com sucesso.');

// 6. Delivery
console.log('\n--- 6. Validando Entidade Delivery ---');
const delivery = new Delivery({
  id: 30,
  unit_id: 101,
  courier: 'Mercado Livre',
  pickup_code: '4321',
  status: 'pending'
});
assert.equal(delivery.isPending(), true);
assert.equal(delivery.verifyPin('4321'), true);
assert.equal(delivery.verifyPin('0000'), false);
assert.throws(() => delivery.markAsDelivered('0000'), /Código PIN incorreto/);
delivery.markAsDelivered('4321');
assert.equal(delivery.isDelivered(), true);
console.log('✅ Delivery validada com sucesso.');

// 7. AccessLog
console.log('\n--- 7. Validando Entidade AccessLog ---');
const access = new AccessLog({
  id: 40,
  condominium_id: 1,
  visitor_name: 'João Silva',
  destination_unit_id: 101,
  entry_time: '2026-10-14T08:00:00.000Z'
});
assert.equal(access.isInProperty(), true);
access.registerExit('2026-10-14T09:30:00.000Z');
assert.equal(access.isInProperty(), false);
assert.equal(access.status, 'EXITED');
assert.equal(access.calculateStayDurationMinutes(), 90);
console.log('✅ AccessLog validado com sucesso.');

// 8. Reservation
console.log('\n--- 8. Validando Entidade Reservation ---');
const reservation = new Reservation({
  id: 70,
  space_id: 1,
  unit_id: 101,
  reservation_date: '2026-12-25',
  start_time: '14:00',
  end_time: '18:00',
  status: 'CONFIRMED'
});
assert.equal(reservation.calculateDurationHours(), 4);
assert.equal(reservation.isConfirmed(), true);
const conflicting = new Reservation({
  space_id: 1,
  reservation_date: '2026-12-25',
  start_time: '16:00',
  end_time: '20:00'
});
const nonConflicting = new Reservation({
  space_id: 1,
  reservation_date: '2026-12-25',
  start_time: '18:00',
  end_time: '22:00'
});
assert.equal(reservation.hasConflictWith(conflicting), true);
assert.equal(reservation.hasConflictWith(nonConflicting), false);
console.log('✅ Reservation validada com sucesso.');

// 9. FinancialTransaction
console.log('\n--- 9. Validando Entidade FinancialTransaction ---');
const tx = new FinancialTransaction({
  id: 80,
  condominium_id: 1,
  description: 'Taxa Condominial Outubro',
  amount: 450.00,
  type: 'INCOME',
  status: 'PENDING',
  due_date: '2026-10-20'
});
assert.equal(tx.isIncome(), true);
assert.equal(tx.isExpense(), false);
assert.equal(tx.isPaid(), false);
tx.markAsPaid('2026-10-14');
assert.equal(tx.isPaid(), true);
assert.equal(tx.paymentDate, '2026-10-14');
console.log('✅ FinancialTransaction validada com sucesso.');

// 10. Announcement
console.log('\n--- 10. Validando Entidade Announcement ---');
const announcement = new Announcement({
  id: 90,
  condominium_id: 1,
  title: 'Manutenção Preventiva no Elevador',
  message: 'O elevador social passará por manutenção das 9h às 12h.',
  priority: 'HIGH',
  pinned: 1,
  expires_at: '2026-10-15T00:00:00.000Z'
});
assert.equal(announcement.isPinned(), true);
assert.equal(announcement.isHighPriority(), true);
announcement.validate();
assert.throws(() => new Announcement({ title: '' }).validate(), /ID do condomínio é obrigatório/);
console.log('✅ Announcement validado com sucesso.');

console.log('\n🎉 SUCESSO: Todas as 10 Entidades de Domínio foram aprovadas nos testes unitários!\n');
