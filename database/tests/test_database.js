// ============================================================================
// PratiCom ERP - Suíte de Testes Automatizados do Banco de Dados SQLite
// Valida classes de tabela, validações DDD, constraints, integridade e migrações
// ============================================================================

import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { DatabaseEngine } from '../DatabaseEngine.js';
import { ALL_TABLE_CLASSES } from '../tables/index.js';
import { DomainValidationError } from '../core/BaseTable.js';

console.log('🧪 Iniciando Suíte de Testes do Banco de Dados SQLite PratiCom...');

const testDbPath = path.resolve(process.cwd(), 'database', 'test_database.sqlite');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

const engine = new DatabaseEngine({
  filePath: testDbPath,
  verbose: false
});

engine.registerTables(ALL_TABLE_CLASSES);
engine.initializeSchema();

const Condos = engine.getTable('condominiums');
const Blocks = engine.getTable('blocks');
const Units = engine.getTable('units');
const Residents = engine.getTable('residents');
const Spaces = engine.getTable('spaces');
const Reservations = engine.getTable('reservations');
const Financial = engine.getTable('financial_transactions');

// ----------------------------------------------------------------------------
// Teste 1: Inserção válida e recuperação por ID
// ----------------------------------------------------------------------------
console.log('  [Teste 1] Inserção e Leitura Básica com BaseTable...');
const condo = Condos.insert({
  name: 'Condomínio Teste Alpha',
  cnpj: '11222333000199',
  address: 'Rua dos Testes, 100',
  city: 'Curitiba',
  state: 'PR',
  status: 'ACTIVE'
});
assert.strictEqual(condo.name, 'Condomínio Teste Alpha');
assert.strictEqual(condo.status, 'ACTIVE');
assert.ok(condo.id > 0);

const foundCondo = Condos.findById(condo.id);
assert.strictEqual(foundCondo.name, 'Condomínio Teste Alpha');
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 2: Validação DDD de Invariantes de Negócio (DomainValidationError)
// ----------------------------------------------------------------------------
console.log('  [Teste 2] Validação DDD Pré-Persistência...');
let errorCaught = false;
try {
  Condos.insert({
    name: 'AB', // Inválido (< 3 caracteres)
    status: 'ACTIVE'
  });
} catch (err) {
  if (err instanceof DomainValidationError && err.field === 'name') {
    errorCaught = true;
  }
}
assert.ok(errorCaught, 'Deveria ter lançado DomainValidationError para nome com menos de 3 caracteres');

errorCaught = false;
try {
  Financial.insert({
    condominium_id: condo.id,
    type: 'invalid_type', // Inválido
    category: 'Geral',
    description: 'Teste',
    amount: -50, // Inválido (deve ser > 0)
    due_date: '2026-10-20'
  });
} catch (err) {
  if (err instanceof DomainValidationError) {
    errorCaught = true;
  }
}
assert.ok(errorCaught, 'Deveria ter lançado DomainValidationError para valor negativo e tipo inválido');
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 3: Chaves Estrangeiras e Integridade Relacional Estrita
// ----------------------------------------------------------------------------
console.log('  [Teste 3] Enforçamento de Foreign Keys do SQLite...');
let fkError = false;
try {
  Blocks.insert({
    condominium_id: 999999, // Não existe
    name: 'Torre Fantasma'
  });
} catch (err) {
  fkError = true;
}
assert.ok(fkError, 'SQLite deveria ter bloqueado a inserção com violação de FK');
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 4: Regra de Conflito de Horários em Reservas de Áreas Comuns
// ----------------------------------------------------------------------------
console.log('  [Teste 4] Detecção de Sobreposição de Reservas de Espaços...');
const block = Blocks.insert({ condominium_id: condo.id, name: 'Torre 1' });
const unit = Units.insert({ block_id: block.id, number: '101' });
const resident = Residents.insert({ unit_id: unit.id, name: 'Morador Teste', role: 'Proprietário' });
const space = Spaces.insert({ condominium_id: condo.id, name: 'Churrasqueira 1', capacity: 20 });

// Primeira reserva: 14h às 18h
Reservations.insert({
  space_id: space.id,
  resident_id: resident.id,
  unit_id: unit.id,
  reservation_date: '2026-12-25',
  start_time: '14:00',
  end_time: '18:00',
  status: 'CONFIRMED'
});

// Tentativa de reserva em conflito: 16h às 20h
let conflictCaught = false;
try {
  Reservations.insert({
    space_id: space.id,
    resident_id: resident.id,
    unit_id: unit.id,
    reservation_date: '2026-12-25',
    start_time: '16:00',
    end_time: '20:00',
    status: 'CONFIRMED'
  });
} catch (err) {
  if (err instanceof DomainValidationError) {
    conflictCaught = true;
  }
}
assert.ok(conflictCaught, 'Deveria ter impedido reserva com sobreposição de horário no mesmo espaço');
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 5: Suporte a Migrações Versionadas para Crescimento Futuro
// ----------------------------------------------------------------------------
console.log('  [Teste 5] Sistema de Migrações Versionadas...');
const migrationResult = engine.runMigration('1.1.0', 'Add Tags Column to Units Table', (db) => {
  db.exec('ALTER TABLE "units" ADD COLUMN "tags" TEXT DEFAULT NULL;');
});
assert.strictEqual(migrationResult, true);

// Tentativa de rodar a mesma versão novamente deve retornar false (idempotente)
const reRunResult = engine.runMigration('1.1.0', 'Duplicate Migration', () => {});
assert.strictEqual(reRunResult, false);
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 6: Tabelas Pets e Ocorrências com Validações DDD
// ----------------------------------------------------------------------------
console.log('  [Teste 6] Validação de Pets e Ocorrências...');
const Pets = engine.getTable('pets');
const Occurrences = engine.getTable('occurrences');

const pet = Pets.insert({
  condominium_id: condo.id,
  unit_id: unit.id,
  name: 'Rex',
  species: 'Cão',
  breed: 'Labrador',
  size: 'Grande',
  vaccine_status: 'VACCINATED'
});
assert.strictEqual(pet.name, 'Rex');

let petError = false;
try {
  Pets.insert({
    condominium_id: condo.id,
    unit_id: unit.id,
    name: 'X', // Inválido (< 2 caracteres)
    species: 'Dragão' // Inválido
  });
} catch (err) {
  if (err instanceof DomainValidationError) petError = true;
}
assert.ok(petError, 'Deveria ter lançado erro de validação para pet inválido');

const occ = Occurrences.insert({
  condominium_id: condo.id,
  unit_id: unit.id,
  title: 'Vazamento na Garagem G1',
  category: 'Estrutural',
  priority: 'alta',
  description: 'Goteira no teto próximo ao pilar 14'
});
assert.strictEqual(occ.status, 'OPEN');
console.log('    ✓ Sucesso!');

// ----------------------------------------------------------------------------
// Teste 7: Votações Virtuais e Constraint de Voto Único por Unidade
// ----------------------------------------------------------------------------
console.log('  [Teste 7] Unicidade de Voto por Unidade em Assembleias (PollVotes)...');
const Polls = engine.getTable('polls');
const PollVotes = engine.getTable('poll_votes');

const poll = Polls.insert({
  condominium_id: condo.id,
  title: 'Pintura da Fachada Externa',
  description: 'Contratação de empresa para reforma e pintura.',
  category: 'Obras',
  quorum_type: 'TWO_THIRDS',
  start_date: '2026-10-01',
  end_date: '2026-10-31'
});

const vote1 = PollVotes.insert({
  poll_id: poll.id,
  unit_id: unit.id,
  resident_id: resident.id,
  selected_option: 'Aprovar'
});
assert.strictEqual(vote1.selected_option, 'Aprovar');

let voteDuplicateError = false;
try {
  PollVotes.insert({
    poll_id: poll.id,
    unit_id: unit.id, // Mesma unidade no mesmo poll
    resident_id: resident.id,
    selected_option: 'Rejeitar'
  });
} catch (err) {
  voteDuplicateError = true;
}
assert.ok(voteDuplicateError, 'SQLite deveria ter bloqueado voto duplicado da mesma unidade via UNIQUE constraint');
console.log('    ✓ Sucesso!');

// Encerramento
engine.close();
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

console.log('\n🌟 Todos os testes unitários e de integração passaram com 100% de sucesso!');
