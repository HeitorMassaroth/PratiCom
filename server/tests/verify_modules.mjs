/**
 * Teste Automatizado de Módulos Ativáveis por Condomínio
 * Valida isolamento, persistência, regras de acesso e bloqueio de rotas no backend.
 */

const BASE_URL = process.env.API_BASE || 'http://localhost:5000/api';

async function runModulesVerification() {
  console.log('------------------------------------------------------------');
  console.log('🧪 TESTE AUTOMATIZADO: MÓDULOS ATIVÁVEIS POR CONDOMÍNIO');
  console.log('------------------------------------------------------------');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`✅ ${message}`);
      passed++;
    } else {
      console.error(`❌ FALHA: ${message}`);
      failed++;
    }
  };

  try {
    // 1. Validar Condomínio Padrão (ID 1 - Alpha)
    console.log('\n--- 1. Validando retrocompatibilidade do Condomínio Padrão (ID 1) ---');
    const alphaModulesRes = await fetch(`${BASE_URL}/condominiums/1/modules`);
    const alphaModules = await alphaModulesRes.json();
    
    assert(alphaModulesRes.ok, 'Endpoint GET /api/condominiums/1/modules respondeu 200 OK');
    assert(Array.isArray(alphaModules) && alphaModules.length === 6, 'Retornou os 6 módulos opcionais');
    
    const allAlphaEnabled = alphaModules.every(m => m.enabled === true);
    assert(allAlphaEnabled, 'Todos os 6 módulos do Condomínio 1 estão ATIVOS por retrocompatibilidade');

    // 2. Validar que as 3 áreas obrigatórias estão ativas
    console.log('\n--- 2. Validando disponibilidade das 3 áreas obrigatórias ---');
    const [resResidents, resTerritory, resAnnouncements] = await Promise.all([
      fetch(`${BASE_URL}/residents`, { headers: { 'X-Condominium-Id': '1' } }),
      fetch(`${BASE_URL}/territory/pending-units`, { headers: { 'X-Condominium-Id': '1' } }),
      fetch(`${BASE_URL}/announcements`, { headers: { 'X-Condominium-Id': '1' } })
    ]);
    assert(resResidents.ok, 'Área obrigatória "Cadastro de Pessoas" respondeu 200 OK');
    assert(resTerritory.ok, 'Área obrigatória "Condomínios & Blocos" respondeu 200 OK');
    assert(resAnnouncements.ok, 'Área obrigatória "Mural de Avisos" respondeu 200 OK');

    // 3. Criar Novo Condomínio de Teste "Condomínio Delta Modular"
    console.log('\n--- 3. Criando Condomínio Delta com módulos desabilitados por padrão ---');
    const randomCNPJ = `88.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}/0001-${Math.floor(10 + Math.random() * 89)}`;
    const createCondoRes = await fetch(`${BASE_URL}/condominiums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Condomínio Delta Modular',
        cnpj: randomCNPJ,
        city: 'São Paulo',
        state: 'SP'
      })
    });
    const deltaCondo = await createCondoRes.json();
    assert(createCondoRes.ok && deltaCondo.id, `Condomínio Delta criado com ID: ${deltaCondo.id}`);

    const deltaId = String(deltaCondo.id);
    const deltaHeaders = {
      'Content-Type': 'application/json',
      'X-Condominium-Id': deltaId
    };

    // 4. Verificar que novo condomínio tem os 6 módulos desabilitados por padrão
    console.log('\n--- 4. Verificando configuração padrão isolada do novo condomínio ---');
    const deltaModulesRes = await fetch(`${BASE_URL}/condominiums/${deltaId}/modules`);
    const deltaModules = await deltaModulesRes.json();
    
    const allDeltaDisabled = deltaModules.every(m => m.enabled === false);
    assert(allDeltaDisabled, 'Novo condomínio Delta iniciou com os 6 módulos opcionais DESABILITADOS');

    // 5. Testar bloqueio 403 Forbidden em rotas dos módulos desabilitados
    console.log('\n--- 5. Verificando proteção de rotas no backend (403 Forbidden) ---');
    const [resDeliv, resAcc, resFin, resMkt, resSpc, resDash] = await Promise.all([
      fetch(`${BASE_URL}/deliveries`, { headers: deltaHeaders }),
      fetch(`${BASE_URL}/access`, { headers: deltaHeaders }),
      fetch(`${BASE_URL}/financial/summary`, { headers: deltaHeaders }),
      fetch(`${BASE_URL}/market/products`, { headers: deltaHeaders }),
      fetch(`${BASE_URL}/spaces`, { headers: deltaHeaders }),
      fetch(`${BASE_URL}/dashboard`, { headers: deltaHeaders })
    ]);

    assert(resDeliv.status === 403, 'Rota de Encomendas bloqueada com 403 Forbidden');
    assert(resAcc.status === 403, 'Rota de Portaria/Acesso bloqueada com 403 Forbidden');
    assert(resFin.status === 403, 'Rota de Financeiro bloqueada com 403 Forbidden');
    assert(resMkt.status === 403, 'Rota de Mercadinho bloqueada com 403 Forbidden');
    assert(resSpc.status === 403, 'Rota de Reservas bloqueada com 403 Forbidden');
    assert(resDash.status === 403, 'Rota de Dashboard bloqueada com 403 Forbidden');

    // Mas as áreas obrigatórias continuam 200 OK no condomínio Delta
    const resDeltaResidents = await fetch(`${BASE_URL}/residents`, { headers: deltaHeaders });
    const resDeltaAnnounce = await fetch(`${BASE_URL}/announcements`, { headers: deltaHeaders });
    assert(resDeltaResidents.ok, 'Área obrigatória Pessoas continua 200 OK no condomínio Delta');
    assert(resDeltaAnnounce.ok, 'Área obrigatória Avisos continua 200 OK no condomínio Delta');

    // 6. Ativar seletivamente módulos apenas no Condomínio Delta (Dashboard + Portaria)
    console.log('\n--- 6. Habilitando seletivamente módulos para o Condomínio Delta ---');
    const updateModulesRes = await fetch(`${BASE_URL}/condominiums/${deltaId}/modules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modules: {
          dashboard: true,
          access: true,
          deliveries: false,
          reservations: false,
          financial: false,
          market: false
        }
      })
    });
    assert(updateModulesRes.ok, 'Atualização de módulos PUT respondeu 200 OK');

    // 7. Testar que Portaria agora responde 200 OK e Dashboard trata submódulos desativados
    console.log('\n--- 7. Validando liberação seletiva e resiliência do Dashboard ---');
    const resAccUnlocked = await fetch(`${BASE_URL}/access`, { headers: deltaHeaders });
    assert(resAccUnlocked.ok, 'Portaria agora responde 200 OK no condomínio Delta');

    const resDashUnlocked = await fetch(`${BASE_URL}/dashboard`, { headers: deltaHeaders });
    const dashData = await resDashUnlocked.json();
    assert(resDashUnlocked.ok, 'Dashboard respondeu 200 OK');
    assert(dashData.metrics.overdueAmount === null, 'Dashboard tratou submódulo financeiro inativo definindo métrica como null');
    assert(dashData.metrics.pendingDeliveries === null, 'Dashboard tratou submódulo encomendas inativo definindo métrica como null');
    assert(typeof dashData.metrics.activeAccess === 'number', 'Dashboard calculou métrica de acessos ativa com sucesso');

    // Financeiro continua 403 no condomínio Delta
    const resFinStillLocked = await fetch(`${BASE_URL}/financial/summary`, { headers: deltaHeaders });
    assert(resFinStillLocked.status === 403, 'Financeiro continua bloqueado com 403 Forbidden no condomínio Delta');

    // E Condomínio 1 continua com Financeiro 200 OK (isolamento cruzado)
    const resAlphaFin = await fetch(`${BASE_URL}/financial/summary`, { headers: { 'X-Condominium-Id': '1' } });
    assert(resAlphaFin.ok, 'Condomínio 1 permanece com Financeiro 200 OK (zero vazamento de configuração)');

    // 8. Teste de Preservação de Dados
    console.log('\n--- 8. Testando preservação dos dados ao desativar e reativar ---');
    // Desativar Portaria no Delta
    await fetch(`${BASE_URL}/condominiums/${deltaId}/modules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modules: { access: false } })
    });
    const resAccLockedAgain = await fetch(`${BASE_URL}/access`, { headers: deltaHeaders });
    assert(resAccLockedAgain.status === 403, 'Portaria bloqueada após desativação');

    // Reativar Portaria no Delta
    await fetch(`${BASE_URL}/condominiums/${deltaId}/modules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modules: { access: true } })
    });
    const resAccReactivated = await fetch(`${BASE_URL}/access`, { headers: deltaHeaders });
    assert(resAccReactivated.ok, 'Portaria desbloqueada após reativação');

    // 9. Limpeza do condomínio de teste
    console.log('\n--- 9. Limpando condomínio de teste ---');
    await fetch(`${BASE_URL}/condominiums/${deltaId}`, { method: 'DELETE' });
    console.log('✅ Condomínio Delta excluído.');

    console.log('\n------------------------------------------------------------');
    console.log(`📊 RESULTADO FINAL: ${passed} APROVADOS, ${failed} FALHAS`);
    console.log('------------------------------------------------------------');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ ERRO NO TESTE DE MÓDULOS:', err);
    process.exit(1);
  }
}

runModulesVerification();
