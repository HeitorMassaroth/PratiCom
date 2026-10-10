import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { DAOFactory } from '../dao/DAOFactory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'condo_database.sqlite');

console.log('🧪 Iniciando Teste de Validação Multi-Tenant (Alternativa C)...');
const db = new Database(dbPath);

// 1. Criar um segundo condomínio para testes de isolamento cruzado
const existingCondo2 = db.prepare('SELECT * FROM condominiums WHERE name = ?').get('Condomínio Beta Praticom');
let condo2Id;

if (!existingCondo2) {
  const condo2Res = db.prepare(`
    INSERT INTO condominiums (name, cnpj, address, city, state, status)
    VALUES ('Condomínio Beta Praticom', '99.888.777/0001-99', 'Rua Secundária, 500', 'Campinas', 'SP', 'ACTIVE')
  `).run();
  condo2Id = condo2Res.lastInsertRowid;
  console.log(`  + Criado Condomínio de Teste 2 (Beta), ID: ${condo2Id}`);
} else {
  condo2Id = existingCondo2.id;
  console.log(`  ✓ Condomínio de Teste 2 (Beta) já existe, ID: ${condo2Id}`);
}

// 2. Criar dados isolados no Condomínio Beta (ID: condo2Id)
const financialDAO = DAOFactory.getDAO('financial');
const announcementDAO = DAOFactory.getDAO('announcement');
const residentDAO = DAOFactory.getDAO('resident');

financialDAO.createTransaction({
  description: 'Taxa Condominial Beta Teste',
  amount: 450.00,
  type: 'INCOME',
  category: 'Condomínio',
  status: 'PAID',
  due_date: '2026-10-10'
}, condo2Id);

announcementDAO.createAnnouncement({
  title: 'Aviso Exclusivo do Condomínio Beta',
  content: 'Esta mensagem deve aparecer SOMENTE no Condomínio Beta.',
  category: 'Geral',
  priority: 'high'
}, condo2Id);

// 3. Testar consultas do Condomínio 1 (Alpha) vs Condomínio 2 (Beta)
console.log('\n📊 Teste de Isolamento de Dados:');

const condo1Id = db.prepare('SELECT id FROM condominiums ORDER BY id ASC LIMIT 1').get().id;

const alphaSummary = financialDAO.getSummary(condo1Id);
const betaSummary = financialDAO.getSummary(condo2Id);
console.log(`  - Resumo Financeiro Alpha (ID ${condo1Id}): Saldo Total R$ ${alphaSummary.total_balance}`);
console.log(`  - Resumo Financeiro Beta (ID ${condo2Id}): Saldo Total R$ ${betaSummary.total_balance}`);

const alphaAnnouncements = announcementDAO.getAnnouncements({ condominiumId: condo1Id });
const betaAnnouncements = announcementDAO.getAnnouncements({ condominiumId: condo2Id });

console.log(`  - Comunicados Alpha (ID ${condo1Id}): ${alphaAnnouncements.length} comunicados encontados.`);
console.log(`  - Comunicados Beta (ID ${condo2Id}): ${betaAnnouncements.length} comunicados encontados.`);

const betaAnnounceTitles = betaAnnouncements.map(a => a.title);
const alphaAnnounceTitles = alphaAnnouncements.map(a => a.title);

const crossLeaked = alphaAnnounceTitles.includes('Aviso Exclusivo do Condomínio Beta');
if (!crossLeaked) {
  console.log('✅ SUCESSO: Zero vazamento cruzado de dados detectado entre condomínios (Row-Level Multi-Tenancy Ok)!');
} else {
  console.error('❌ ERRO: Comunicado do Condomínio Beta vazou no Condomínio Alpha!');
  process.exit(1);
}

db.close();
