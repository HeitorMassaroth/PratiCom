import DatabaseSingleton from '../config/DatabaseSingleton.js';
const db = DatabaseSingleton.getDb();

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
const fkList = db.prepare("SELECT * FROM sqlite_master WHERE type='trigger' OR sql LIKE '%FOREIGN KEY%'").all();
const indexes = db.prepare("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' ORDER BY tbl_name").all();

for (const t of tables) {
  const cols = db.prepare(`PRAGMA table_info(${t.name})`).all();
  const fks = db.prepare(`PRAGMA foreign_key_list(${t.name})`).all();
  const count = db.prepare(`SELECT COUNT(*) as n FROM "${t.name}"`).get();
  const idxs = indexes.filter(i => i.tbl_name === t.name);
  console.log(`\n=== TABLE: ${t.name} (${count.n} rows) ===`);
  for (const c of cols) {
    console.log(`  [${c.cid}] ${c.name} ${c.type}${c.notnull ? ' NOT NULL' : ''}${c.dflt_value != null ? ' DEFAULT ' + c.dflt_value : ''}${c.pk ? ' PK' : ''}`);
  }
  if (fks.length > 0) {
    console.log('  Foreign Keys:');
    for (const fk of fks) console.log(`    ${fk.from} -> ${fk.table}(${fk.to}) ON DELETE ${fk.on_delete}`);
  }
  if (idxs.length > 0) {
    console.log('  Indexes:');
    for (const ix of idxs) console.log(`    ${ix.name}`);
  }
}

// Check for orphan data
console.log('\n=== ORPHAN CHECK ===');
const unitsNoBlock = db.prepare("SELECT COUNT(*) as n FROM units WHERE block_id IS NULL").get();
const spacesNoCondo = db.prepare("SELECT COUNT(*) as n FROM spaces WHERE condominium_id IS NULL").get();
const ftNoCondo = db.prepare("SELECT COUNT(*) as n FROM financial_transactions WHERE condominium_id IS NULL").get();
const annNoCondo = db.prepare("SELECT COUNT(*) as n FROM announcements WHERE condominium_id IS NULL").get();
const mpNoCondo = db.prepare("SELECT COUNT(*) as n FROM market_products WHERE condominium_id IS NULL").get();
console.log('units WITHOUT block_id:', unitsNoBlock.n);
console.log('spaces WITHOUT condominium_id:', spacesNoCondo.n);
console.log('financial_transactions WITHOUT condominium_id:', ftNoCondo.n);
console.log('announcements WITHOUT condominium_id:', annNoCondo.n);
console.log('market_products WITHOUT condominium_id:', mpNoCondo.n);

// Sample data
console.log('\n=== CONDOMINIUMS ===');
console.log(db.prepare('SELECT * FROM condominiums').all());
console.log('\n=== BLOCKS ===');
console.log(db.prepare('SELECT * FROM blocks').all());
console.log('\n=== UNITS (first 5) ===');
console.log(db.prepare('SELECT id, block, block_id, number, floor, type FROM units LIMIT 5').all());
console.log('\n=== APP_FEATURES ===');
console.log(db.prepare('SELECT * FROM app_features').all());
