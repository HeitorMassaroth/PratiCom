import DatabaseSingleton from './config/DatabaseSingleton.js';

console.log('🔄 Sanitizando dados legados no SQLite...');
const db = DatabaseSingleton.getDb();

// 1. Garantir que o Condomínio Alpha (ID 1) existe
let defaultCondo = db.prepare('SELECT * FROM condominiums WHERE id = 1').get();
if (!defaultCondo) {
  db.prepare(`
    INSERT INTO condominiums (id, name, cnpj, address, city, state, postal_code, phone, status)
    VALUES (1, 'Condomínio Alpha Praticom', '00.000.000/0001-01', 'Av. Principal, 100', 'São Paulo', 'SP', '01000-000', '(11) 3000-0000', 'ACTIVE')
  `).run();
  console.log('✅ Condomínio Padrão (ID 1) criado.');
}

// 2. Garantir que o Bloco A (ID 1) do Condomínio 1 existe
let defaultBlock = db.prepare('SELECT * FROM blocks WHERE condominium_id = 1 LIMIT 1').get();
if (!defaultBlock) {
  db.prepare(`
    INSERT INTO blocks (condominium_id, name, description, status)
    VALUES (1, 'Bloco A', 'Bloco Principal Legado', 'ACTIVE')
  `).run();
  defaultBlock = db.prepare('SELECT * FROM blocks WHERE condominium_id = 1 LIMIT 1').get();
  console.log('✅ Bloco Padrão (ID 1) criado para Condomínio 1.');
}

// 3. Associar unidades legadas com block_id IS NULL ao Bloco 1
const unmappedUnits = db.prepare('UPDATE units SET block_id = ? WHERE block_id IS NULL').run(defaultBlock.id);
console.log(`✅ Unidades legadas associadas ao Bloco 1: ${unmappedUnits.changes}`);

// 4. Preencher condominium_id em tabelas operacionais onde for NULL
const txs = db.prepare('UPDATE financial_transactions SET condominium_id = 1 WHERE condominium_id IS NULL').run();
console.log(`✅ Transações financeiras associadas ao Condomínio 1: ${txs.changes}`);

const ann = db.prepare('UPDATE announcements SET condominium_id = 1 WHERE condominium_id IS NULL').run();
console.log(`✅ Comunicados associados ao Condomínio 1: ${ann.changes}`);

const prod = db.prepare('UPDATE market_products SET condominium_id = 1 WHERE condominium_id IS NULL').run();
console.log(`✅ Produtos do mercado associados ao Condomínio 1: ${prod.changes}`);

const spaces = db.prepare('UPDATE spaces SET condominium_id = 1 WHERE condominium_id IS NULL').run();
console.log(`✅ Espaços associados ao Condomínio 1: ${spaces.changes}`);

console.log('🎉 Sanitização de dados legados concluída com sucesso!');
