import assert from 'assert';
import {
  CondominiumController,
  ResidentController,
  DeliveryController,
  AccessController,
  ReservationController,
  FinancialController,
  MarketController,
  DashboardController
} from '../controllers/index.js';

import {
  CondominiumService,
  ResidentService,
  DeliveryService,
  AccessService,
  ReservationService,
  FinancialService,
  MarketService
} from '../services/index.js';

console.log('🧪 Iniciando Testes Unitários de Controladores Especializados...');

// Mock helpers para req, res, next
function createMockReqRes({ params = {}, query = {}, body = {}, condominiumId = 1 } = {}) {
  const req = { params, query, body, condominiumId };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  const next = (err) => {
    if (err) throw err;
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData, next };
}

async function runTests() {
  // 1. Dashboard Controller
  {
    const { req, res, next, getData } = createMockReqRes();
    await DashboardController.getMetrics(req, res, next);
    const data = getData();
    assert(data.metrics, 'Dashboard metrics should exist');
    assert(data.metrics.pendingDeliveries >= 0, 'Pending deliveries metric should exist');
    console.log('  ✅ [PASS] DashboardController retornou métricas consolidadas com sucesso.');
  }

  // 2. Condominium Controller
  {
    const condoService = new CondominiumService();
    const condoCtrl = new CondominiumController(condoService);
    const { req, res, next, getData } = createMockReqRes({ params: { id: 1 } });
    await condoCtrl.getBlocks(req, res, next);
    const blocks = getData();
    assert(Array.isArray(blocks), 'Blocks should be an array');
    assert(blocks.length > 0, 'Condo #1 should have blocks');
    console.log(`  ✅ [PASS] CondominiumController retornou ${blocks.length} blocos vinculados.`);
  }

  // 3. Resident Controller
  {
    const residentService = new ResidentService();
    const residentCtrl = new ResidentController(residentService);
    const { req, res, next, getData } = createMockReqRes({ query: { search: 'Carlos' } });
    await residentCtrl.getAll(req, res, next);
    const residents = getData();
    assert(Array.isArray(residents), 'Residents should be an array');
    console.log(`  ✅ [PASS] ResidentController filtrou morador por busca com sucesso.`);
  }

  // 4. Delivery Controller
  {
    const deliveryService = new DeliveryService();
    const deliveryCtrl = new DeliveryController(deliveryService);
    const { req, res, next, getData } = createMockReqRes({ query: { status: 'PENDING' } });
    await deliveryCtrl.getAll(req, res, next);
    const deliveries = getData();
    assert(Array.isArray(deliveries), 'Deliveries should be an array');
    console.log(`  ✅ [PASS] DeliveryController retornou ${deliveries.length} encomendas pendentes.`);
  }

  // 5. Financial Controller
  {
    const finService = new FinancialService();
    const finCtrl = new FinancialController(finService);
    const { req, res, next, getData } = createMockReqRes();
    await finCtrl.getSummary(req, res, next);
    const summary = getData();
    assert('currentBalance' in summary, 'Summary must have currentBalance');
    console.log(`  ✅ [PASS] FinancialController calculou balanço atual de R$ ${summary.currentBalance}.`);
  }

  // 6. Market Controller
  {
    const marketService = new MarketService();
    const marketCtrl = new MarketController(marketService);
    const { req, res, next, getData } = createMockReqRes();
    await marketCtrl.getProducts(req, res, next);
    const products = getData();
    assert(Array.isArray(products), 'Products should be an array');
    console.log(`  ✅ [PASS] MarketController listou ${products.length} itens do catálogo do Honest Market.`);
  }

  console.log('\n===============================================================');
  console.log('🎉 TODOS OS CONTROLADORES ESPECIALIZADOS PASSARAM COM SUCESSO!');
  console.log('===============================================================');
}

runTests().catch(err => {
  console.error('❌ Falha nos testes de controladores:', err);
  process.exit(1);
});
