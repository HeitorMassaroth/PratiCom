import assert from 'assert';
import { BaseRepository } from '../repositories/BaseRepository.js';
import { RepositoryFactory } from '../repositories/RepositoryFactory.js';
import { ResidentRepository } from '../repositories/ResidentRepository.js';
import { DeliveryRepository } from '../repositories/DeliveryRepository.js';

console.log('🧪 Iniciando Testes Unitários e Integrados do Padrão Repository e Compactação...');

// 1. Instanciação via RepositoryFactory
console.log('\n--- 1. Validação de RepositoryFactory ---');
const condoRepo = RepositoryFactory.getRepository('condominiums');
assert(condoRepo instanceof BaseRepository, 'condoRepo deve ser instância de BaseRepository');
console.log('  ✅ [PASS] RepositoryFactory instancia BaseRepository corretamente');

const resRepo = RepositoryFactory.getRepository('residents');
assert(resRepo instanceof ResidentRepository, 'resRepo deve ser instância de ResidentRepository');
console.log('  ✅ [PASS] RepositoryFactory instancia ResidentRepository especializado');

// 2. Operações CRUD compactadas via BaseRepository em blocos
console.log('\n--- 2. Operações CRUD Genéricas (Compactação de Código) ---');
const blockRepo = RepositoryFactory.getRepository('blocks');

// Count inicial
const initialCount = blockRepo.count({ condominiumId: 1 });
assert(typeof initialCount === 'number', 'count deve retornar número');
console.log(`  ✅ [PASS] BaseRepository.count() executado com sucesso: ${initialCount} blocos no Condomínio 1`);

// Create genérico
const newBlock = blockRepo.create({
  condominium_id: 1,
  name: 'Bloco Teste Repo ' + Date.now(),
  description: 'Criado via BaseRepository genérico',
  status: 'ACTIVE'
});
assert(newBlock && newBlock.id, 'newBlock deve ter id gerado');
console.log(`  ✅ [PASS] BaseRepository.create() compactado: ID gerado ${newBlock.id}`);

// findById
const fetchedBlock = blockRepo.findById(newBlock.id, { condominiumId: 1 });
assert.strictEqual(fetchedBlock.name, newBlock.name, 'Nomes devem coincidir');
console.log('  ✅ [PASS] BaseRepository.findById() recuperou o registro com integridade');

// update genérico
const updatedBlock = blockRepo.update(newBlock.id, { description: 'Descrição Atualizada via Repo' }, { condominiumId: 1 });
assert.strictEqual(updatedBlock.description, 'Descrição Atualizada via Repo');
console.log('  ✅ [PASS] BaseRepository.update() atualizou parcialmente os campos');

// exists
const exists = blockRepo.exists({ id: newBlock.id }, { condominiumId: 1 });
assert.strictEqual(exists, true, 'Registro deve existir');
console.log('  ✅ [PASS] BaseRepository.exists() confirmou a presença do registro');

// delete genérico
const deleted = blockRepo.delete(newBlock.id, { condominiumId: 1 });
assert.strictEqual(deleted, true, 'delete deve retornar true');
const afterDelete = blockRepo.findById(newBlock.id);
assert.strictEqual(afterDelete, null, 'Registro deletado não deve mais existir');
console.log('  ✅ [PASS] BaseRepository.delete() removeu o registro com sucesso');

// 3. Validação do ResidentRepository especializado
console.log('\n--- 3. Validação de ResidentRepository ---');
const residents = resRepo.findWithUnitDetails({ condominiumId: 1 });
assert(Array.isArray(residents), 'Deve retornar array de moradores');
console.log(`  ✅ [PASS] ResidentRepository.findWithUnitDetails() retornou ${residents.length} moradores com JOIN de unidades`);

console.log('\n====================================================');
console.log('🎉 TODAS AS VALIDAÇÕES DO PADRÃO REPOSITORY APROVADAS!');
console.log('====================================================\n');
