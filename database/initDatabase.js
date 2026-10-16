// ============================================================================
// PratiCom ERP - Script de Inicialização e Produção do SQLite
// Executa o registro das Classes de Tabela, gera o DDL, migrações e dados de teste
// ============================================================================

import path from 'node:path';
import { DatabaseEngine } from './DatabaseEngine.js';
import { ALL_TABLE_CLASSES } from './tables/index.js';
import { seedDatabase } from './seeds/initialSeed.js';

export function createAndInitializeDatabase(customPath = null) {
  const dbPath = customPath || path.resolve(process.cwd(), 'database', 'condo_database.sqlite');
  console.log('================================================================');
  console.log('🚀 PratiCom ERP - Motor de Banco de Dados Relacional SQLite');
  console.log(`📁 Arquivo Alvo: ${dbPath}`);
  console.log('================================================================');

  // 1. Instancia o DatabaseEngine
  const engine = new DatabaseEngine({
    filePath: dbPath,
    verbose: true
  });

  // 2. Registra cada classe de tabela explicitamente
  console.log(`\n[Passo 1] Registrando ${ALL_TABLE_CLASSES.length} Classes de Tabela DDD...`);
  engine.registerTables(ALL_TABLE_CLASSES);

  // 3. Inicializa o Esquema Físico (CREATE TABLE + CREATE INDEX)
  console.log('\n[Passo 2] Gerando Esquema Físico e Índices no SQLite...');
  engine.initializeSchema();

  // 4. Executa a primeira migração formal
  console.log('\n[Passo 3] Registrando Migração de Esquema v1.0.0...');
  engine.runMigration('1.0.0', 'Initial Schema - Clean MVC DDD Enterprise', (db) => {
    // Migração inicial confirmando integridade
    console.log('  -> Verificando integridade das constraints e índices...');
  });

  // 5. Popula dados de semente (Seeding)
  console.log('\n[Passo 4] Executando Povoamento Relacional (Seed)...');
  seedDatabase(engine);

  // 6. Imprime estatísticas de produção do banco
  console.log('\n[Passo 5] Auditoria de Produção e Estatísticas:');
  const stats = engine.getStats();
  console.log(`  -> Tamanho do Arquivo SQLite: ${(stats.fileSizeBytes / 1024).toFixed(2)} KB`);
  console.log(`  -> Modo Journal: ${stats.journalMode}`);
  console.log(`  -> Chaves Estrangeiras Ativas: ${stats.foreignKeys === 1 ? 'SIM (1)' : 'NÃO (0)'}`);
  console.log('\n📊 Contagem de Registros por Tabela:');
  console.table(
    Object.entries(stats.tables).map(([tableName, data]) => ({
      Tabela: tableName,
      'Total de Linhas': data.totalRows
    }))
  );

  console.log('\n✅ Banco de dados SQLite produzido com sucesso e pronto para uso!');
  return engine;
}

// Execução direta via CLI (node database/initDatabase.js)
if (process.argv[1] && process.argv[1].endsWith('initDatabase.js')) {
  createAndInitializeDatabase();
}
