import DatabaseSingleton from '../config/DatabaseSingleton.js';

console.log('🔍 INICIANDO AUDITORIA PROFUNDA DE INTEGRIDADE DO BANCO SQLITE...');

const db = DatabaseSingleton.getDb();

// 1. PRAGMA integrity_check
console.log('\n--- 1. Verificação de Integridade Física do Arquivo SQLite ---');
const integrityResult = db.prepare('PRAGMA integrity_check;').all();
console.log('PRAGMA integrity_check:', integrityResult);

// 2. PRAGMA foreign_key_check
console.log('\n--- 2. Verificação de Chaves Estrangeiras (Foreign Key Check) ---');
const fkCheck = db.prepare('PRAGMA foreign_key_check;').all();
console.log('PRAGMA foreign_key_check violações:', fkCheck.length > 0 ? fkCheck : 'Nenhuma violação encontrada ✅');

// 3. Verificação de tabelas existentes
console.log('\n--- 3. Mapeamento de Tabelas do Banco de Dados ---');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
console.log('Tabelas encontradas:', tables.map(t => t.name));

// 4. Censo de Registros por Tabela
console.log('\n--- 4. Censo de Registros por Tabela ---');
for (const t of tables) {
  const count = db.prepare(`SELECT COUNT(*) as total FROM ${t.name}`).get().total;
  console.log(`  - ${t.name}: ${count} registros`);
}

// 5. Auditoria de Órfãos e Inconsistências Relacionais
console.log('\n--- 5. Auditoria de Registros Órfãos / Relacionamentos Quebrados ---');

// 5.1 Unidades sem Bloco ou Bloco Inexistente
const orphanUnits = db.prepare(`
  SELECT u.id, u.number, u.block_id, u.block 
  FROM units u 
  LEFT JOIN blocks b ON u.block_id = b.id 
  WHERE u.block_id IS NOT NULL AND b.id IS NULL
`).all();
console.log('Unidades com block_id inexistente:', orphanUnits.length > 0 ? orphanUnits : '0 órfãos ✅');

const nullBlockUnits = db.prepare(`SELECT count(*) as c FROM units WHERE block_id IS NULL`).get().c;
console.log(`Unidades com block_id NULL (pendentes de mapeamento): ${nullBlockUnits}`);

// 5.2 Moradores com unidade inexistente
const orphanResidents = db.prepare(`
  SELECT r.id, r.name, r.unit_id 
  FROM residents r 
  LEFT JOIN units u ON r.unit_id = u.id 
  WHERE r.unit_id IS NOT NULL AND u.id IS NULL
`).all();
console.log('Moradores com unit_id inexistente:', orphanResidents.length > 0 ? orphanResidents : '0 órfãos ✅');

// 5.3 Veículos com unidade inexistente
const orphanVehicles = db.prepare(`
  SELECT v.id, v.plate, v.unit_id 
  FROM vehicles v 
  LEFT JOIN units u ON v.unit_id = u.id 
  WHERE v.unit_id IS NOT NULL AND u.id IS NULL
`).all();
console.log('Veículos com unit_id inexistente:', orphanVehicles.length > 0 ? orphanVehicles : '0 órfãos ✅');

// 5.4 Encomendas com unidade inexistente
const orphanDeliveries = db.prepare(`
  SELECT d.id, d.unit_id 
  FROM deliveries d 
  LEFT JOIN units u ON d.unit_id = u.id 
  WHERE d.unit_id IS NOT NULL AND u.id IS NULL
`).all();
console.log('Encomendas com unit_id inexistente:', orphanDeliveries.length > 0 ? orphanDeliveries : '0 órfãos ✅');

// 5.5 Reservas com espaço ou morador ou unidade inexistente
const orphanReservations = db.prepare(`
  SELECT r.id, r.space_id, r.unit_id, r.resident_id
  FROM reservations r
  LEFT JOIN spaces s ON r.space_id = s.id
  LEFT JOIN units u ON r.unit_id = u.id
  LEFT JOIN residents res ON r.resident_id = res.id
  WHERE (r.space_id IS NOT NULL AND s.id IS NULL)
     OR (r.unit_id IS NOT NULL AND u.id IS NULL)
     OR (r.resident_id IS NOT NULL AND res.id IS NULL)
`).all();
console.log('Reservas órfãs:', orphanReservations.length > 0 ? orphanReservations : '0 órfãos ✅');

// 5.6 Acessos com destino/unidade inexistente
const orphanAccess = db.prepare(`
  SELECT a.id, a.destination_unit_id
  FROM access_logs a
  LEFT JOIN units u ON a.destination_unit_id = u.id
  WHERE a.destination_unit_id IS NOT NULL AND u.id IS NULL
`).all();
console.log('Logs de acesso com destino inexistente:', orphanAccess.length > 0 ? orphanAccess : '0 órfãos ✅');

// 6. Auditoria de Inconsistência Multi-Tenant e Relacional
console.log('\n--- 6. Auditoria de Relacionamentos Cruzados e Multi-Tenant ---');

// 6.1 Reservas onde o condomínio do espaço é diferente do condomínio do bloco da unidade
const mismatchedReservations = db.prepare(`
  SELECT r.id as res_id, s.name as space_name, s.condominium_id as space_condo, b.condominium_id as unit_condo
  FROM reservations r
  JOIN spaces s ON r.space_id = s.id
  JOIN units u ON r.unit_id = u.id
  JOIN blocks b ON u.block_id = b.id
  WHERE s.condominium_id IS NOT NULL 
    AND b.condominium_id IS NOT NULL 
    AND s.condominium_id != b.condominium_id
`).all();
console.log('Reservas com espaço e unidade de condomínios diferentes:', mismatchedReservations.length > 0 ? mismatchedReservations : '0 inconsistências ✅');

// 6.2 Transações financeiras com condominium_id diferente do condomínio da unidade informada
const mismatchedFinancial = db.prepare(`
  SELECT f.id as tx_id, f.condominium_id as tx_condo, b.condominium_id as block_condo
  FROM financial_transactions f
  JOIN units u ON f.unit_id = u.id
  JOIN blocks b ON u.block_id = b.id
  WHERE f.condominium_id IS NOT NULL 
    AND b.condominium_id IS NOT NULL 
    AND f.condominium_id != b.condominium_id
`).all();
console.log('Transações financeiras vinculadas a unidade de outro condomínio:', mismatchedFinancial.length > 0 ? mismatchedFinancial : '0 inconsistências ✅');

// 6.3 Comunicados onde condominium_id é diferente do condomínio do bloco informado
const mismatchedAnnouncements = db.prepare(`
  SELECT a.id as ann_id, a.condominium_id as ann_condo, b.condominium_id as block_condo
  FROM announcements a
  JOIN blocks b ON a.block_id = b.id
  WHERE a.condominium_id IS NOT NULL 
    AND b.condominium_id IS NOT NULL 
    AND a.condominium_id != b.condominium_id
`).all();
console.log('Comunicados com bloco de outro condomínio:', mismatchedAnnouncements.length > 0 ? mismatchedAnnouncements : '0 inconsistências ✅');

// 6.4 Veículos vinculados a morador de unidade diferente da unidade do veículo
const mismatchedVehicles = db.prepare(`
  SELECT v.id as vehicle_id, v.unit_id as vehicle_unit, r.unit_id as resident_unit
  FROM vehicles v
  JOIN residents r ON v.resident_id = r.id
  WHERE v.unit_id != r.unit_id
`).all();
console.log('Veículos vinculados a morador de outra unidade:', mismatchedVehicles.length > 0 ? mismatchedVehicles : '0 inconsistências ✅');

// 6.5 Encomendas vinculadas a morador de outra unidade
const mismatchedDeliveries = db.prepare(`
  SELECT d.id as delivery_id, d.unit_id as delivery_unit, r.unit_id as resident_unit
  FROM deliveries d
  JOIN residents r ON d.resident_id = r.id
  WHERE d.unit_id != r.unit_id
`).all();
console.log('Encomendas vinculadas a morador de outra unidade:', mismatchedDeliveries.length > 0 ? mismatchedDeliveries : '0 inconsistências ✅');

// 6.6 Reservas vinculadas a morador de outra unidade
const mismatchedReservationResidents = db.prepare(`
  SELECT res.id as res_id, res.unit_id as reservation_unit, r.unit_id as resident_unit
  FROM reservations res
  JOIN residents r ON res.resident_id = r.id
  WHERE res.unit_id != r.unit_id
`).all();
console.log('Reservas vinculadas a morador de outra unidade:', mismatchedReservationResidents.length > 0 ? mismatchedReservationResidents : '0 inconsistências ✅');

// 6.7 Itens de venda do mercadinho onde o produto pertence a condomínio diferente da unidade compradora
const mismatchedMarketSales = db.prepare(`
  SELECT s.id as sale_id, p.condominium_id as prod_condo, b.condominium_id as buyer_condo
  FROM market_sales s
  JOIN market_sale_items i ON i.sale_id = s.id
  JOIN market_products p ON i.product_id = p.id
  JOIN units u ON s.unit_id = u.id
  JOIN blocks b ON u.block_id = b.id
  WHERE p.condominium_id IS NOT NULL
    AND b.condominium_id IS NOT NULL
    AND p.condominium_id != b.condominium_id
`).all();
console.log('Vendas de produtos para unidades de condomínio divergente:', mismatchedMarketSales.length > 0 ? mismatchedMarketSales : '0 inconsistências ✅');

// 7. Auditoria de Dados Inválidos ou Corrompidos
console.log('\n--- 7. Auditoria de Dados Inválidos, Negativos ou Extremos ---');

// 7.1 Produtos com estoque negativo
const negativeStock = db.prepare('SELECT id, name, stock_quantity FROM market_products WHERE stock_quantity < 0').all();
console.log('Produtos com estoque negativo:', negativeStock.length > 0 ? negativeStock : '0 produtos ✅');

// 7.2 Produtos com preço <= 0
const zeroPriceProducts = db.prepare('SELECT id, name, price FROM market_products WHERE price <= 0').all();
console.log('Produtos com preço zero ou negativo:', zeroPriceProducts.length > 0 ? zeroPriceProducts : '0 produtos ✅');

// 7.3 Transações com valor <= 0
const invalidTxAmount = db.prepare('SELECT id, description, amount FROM financial_transactions WHERE amount <= 0').all();
console.log('Transações financeiras com valor zero ou negativo:', invalidTxAmount.length > 0 ? invalidTxAmount : '0 transações ✅');

// 7.4 Reservas com start_time >= end_time
const invalidReservationHours = db.prepare('SELECT id, start_time, end_time FROM reservations WHERE start_time >= end_time').all();
console.log('Reservas com horários invertidos ou iguais (start >= end):', invalidReservationHours.length > 0 ? invalidReservationHours : '0 reservas ✅');

// 7.5 Unidades com número duplicado no mesmo bloco
const duplicateUnits = db.prepare(`
  SELECT block_id, number, count(*) as c 
  FROM units 
  GROUP BY block_id, number 
  HAVING c > 1
`).all();
console.log('Unidades duplicadas no mesmo bloco:', duplicateUnits.length > 0 ? duplicateUnits : '0 duplicatas ✅');

// 7.6 Blocos com mesmo nome no mesmo condomínio
const duplicateBlocks = db.prepare(`
  SELECT condominium_id, LOWER(TRIM(name)) as name, count(*) as c 
  FROM blocks 
  GROUP BY condominium_id, LOWER(TRIM(name)) 
  HAVING c > 1
`).all();
console.log('Blocos duplicados no mesmo condomínio:', duplicateBlocks.length > 0 ? duplicateBlocks : '0 duplicatas ✅');

console.log('\n====================================================');
console.log('🏁 AUDITORIA COMPLETA DE BANCO FINALIZADA COM SUCESSO');
console.log('====================================================');
