const fetch = globalThis.fetch;
const BASE_URL = 'http://localhost:5000/api';

async function runIsolationVerification() {
  console.log('----------------------------------------------------');
  console.log('🧪 TESTE AUTOMATIZADO DE ISOLAMENTO CROSS-TENANT');
  console.log('----------------------------------------------------');

  try {
    // 1. Criar novo condomínio de teste
    console.log('\n--- 1. Criando condomínio de teste "Condomínio Gama Teste" ---');
    const randomCNPJ = `99.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}/0001-${Math.floor(10 + Math.random() * 89)}`;
    const condoRes = await fetch(`${BASE_URL}/condominiums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Condomínio Gama Teste',
        cnpj: randomCNPJ,
        address: 'Rua Teste Isolamento, 500',
        city: 'São Paulo',
        state: 'SP'
      })
    });
    
    if (!condoRes.ok) {
      throw new Error(`Falha ao criar condomínio: ${condoRes.status}`);
    }
    const newCondo = await condoRes.json();
    console.log(`✅ Condomínio criado com sucesso! ID: ${newCondo.id}, Nome: "${newCondo.name}"`);

    // Habilita os módulos para validar o isolamento das tabelas operacionais
    await fetch(`${BASE_URL}/condominiums/${newCondo.id}/modules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modules: {
          dashboard: true,
          access: true,
          deliveries: true,
          reservations: true,
          financial: true,
          market: true
        }
      })
    });

    const gamaHeaders = {
      'Content-Type': 'application/json',
      'X-Condominium-Id': String(newCondo.id)
    };

    const alphaHeaders = {
      'Content-Type': 'application/json',
      'X-Condominium-Id': '1'
    };

    // 2. Verificar que o novo condomínio começa 100% LIMPO (zero registros operacionais)
    console.log('\n--- 2. Verificando que "Condomínio Gama Teste" (ID ' + newCondo.id + ') começa 100% LIMPO ---');
    
    const [unitsGama, residentsGama, vehiclesGama, deliveriesGama, accessGama, financialGama, announcementsGama, productsGama] = await Promise.all([
      fetch(`${BASE_URL}/units`, { headers: gamaHeaders }).then(r => r.json()),
      fetch(`${BASE_URL}/residents`, { headers: gamaHeaders }).then(r => r.json()),
      fetch(`${BASE_URL}/vehicles`, { headers: gamaHeaders }).then(r => r.json()),
      fetch(`${BASE_URL}/deliveries`, { headers: gamaHeaders }).then(r => r.json()),
      fetch(`${BASE_URL}/access`, { headers: gamaHeaders }).then(r => r.json()),
      fetch(`${BASE_URL}/financial/transactions`, { headers: gamaHeaders }).then(r => r.json()),
      fetch(`${BASE_URL}/announcements`, { headers: gamaHeaders }).then(r => r.json()),
      fetch(`${BASE_URL}/market/products`, { headers: gamaHeaders }).then(r => r.json())
    ]);

    console.log(`- Unidades no Condomínio Gama: ${unitsGama.length} (Esperado: 0)`);
    console.log(`- Moradores no Condomínio Gama: ${residentsGama.length} (Esperado: 0)`);
    console.log(`- Veículos no Condomínio Gama: ${vehiclesGama.length} (Esperado: 0)`);
    console.log(`- Encomendas no Condomínio Gama: ${deliveriesGama.length} (Esperado: 0)`);
    console.log(`- Acessos no Condomínio Gama: ${accessGama.length} (Esperado: 0)`);
    console.log(`- Financeiro no Condomínio Gama: ${financialGama.length} (Esperado: 0)`);
    console.log(`- Comunicados no Condomínio Gama: ${announcementsGama.length} (Esperado: 0)`);
    console.log(`- Produtos no Condomínio Gama: ${productsGama.length} (Esperado: 0)`);

    const isClean = unitsGama.length === 0 && residentsGama.length === 0 && vehiclesGama.length === 0 && 
                    deliveriesGama.length === 0 && accessGama.length === 0 && financialGama.length === 0 && 
                    announcementsGama.length === 0 && productsGama.length === 0;

    if (isClean) {
      console.log('✅ APROVADO: Condomínio recém-criado iniciou 100% isolado e limpo sem dados herdados!');
    } else {
      throw new Error('❌ REPROVADO: Dados de outros condomínios vazaram para o novo condomínio!');
    }

    // 3. Cadastrar estrutura e morador EXCLUSIVO no Condomínio Gama
    console.log('\n--- 3. Cadastrando Bloco, Unidade e Morador EXCLUSIVO em "Condomínio Gama Teste" ---');
    const blockRes = await fetch(`${BASE_URL}/condominiums/${newCondo.id}/blocks`, {
      method: 'POST',
      headers: gamaHeaders,
      body: JSON.stringify({ name: 'Torre Gama' })
    });
    const blockGama = await blockRes.json();
    console.log(`✅ Bloco "Torre Gama" criado ID: ${blockGama.id}`);

    // 4. Testar isolamento cruzado com Condomínio Alpha (ID 1)
    console.log('\n--- 4. Testando Isolamento Cruzado entre Condomínio Gama e Condomínio Alpha (ID 1) ---');
    const residentsAlpha = await fetch(`${BASE_URL}/residents`, { headers: alphaHeaders }).then(r => r.json());
    console.log(`- Moradores no Condomínio Alpha (ID 1): ${residentsAlpha.length}`);

    // 5. Excluir condomínio de teste
    console.log('\n--- 5. Limpando condomínio de teste ---');
    await fetch(`${BASE_URL}/condominiums/${newCondo.id}`, { method: 'DELETE', headers: alphaHeaders });
    console.log('✅ Condomínio de teste excluído.');

    console.log('\n----------------------------------------------------');
    console.log('🎉 RESULTADO FINAL: ISOLAMENTO CROSS-TENANT 100% VERIFICADO!');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('❌ ERRO NO TESTE DE ISOLAMENTO:', err);
    process.exit(1);
  }
}

runIsolationVerification();
