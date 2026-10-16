import { Router } from 'express';
import {
  CondominiumService,
  BlockService,
  UnitService,
  ResidentService,
  VehicleService,
  SpaceService,
  AnnouncementService,
  DeliveryService,
  AccessService,
  ReservationService,
  FinancialService,
  MarketService
} from '../services/index.js';

import {
  CondominiumController,
  BlockController,
  UnitController,
  ResidentController,
  VehicleController,
  SpaceController,
  AnnouncementController,
  DeliveryController,
  AccessController,
  ReservationController,
  FinancialController,
  MarketController,
  DashboardController
} from '../controllers/index.js';

const router = Router();

// ----------------------------------------------------
// 1. Instanciação dos Serviços de Domínio
// ----------------------------------------------------
const condoService = new CondominiumService();
const blockService = new BlockService();
const unitService = new UnitService();
const residentService = new ResidentService();
const vehicleService = new VehicleService();
const spaceService = new SpaceService();
const announcementService = new AnnouncementService();
const deliveryService = new DeliveryService();
const accessService = new AccessService();
const reservationService = new ReservationService();
const financialService = new FinancialService();
const marketService = new MarketService();

// ----------------------------------------------------
// 2. Instanciação dos Controladores Especializados
// ----------------------------------------------------
const condoCtrl = new CondominiumController(condoService);
const blockCtrl = new BlockController(blockService);
const unitCtrl = new UnitController(unitService);
const residentCtrl = new ResidentController(residentService);
const vehicleCtrl = new VehicleController(vehicleService);
const spaceCtrl = new SpaceController(spaceService);
const announcementCtrl = new AnnouncementController(announcementService);
const deliveryCtrl = new DeliveryController(deliveryService);
const accessCtrl = new AccessController(accessService);
const reservationCtrl = new ReservationController(reservationService);
const financialCtrl = new FinancialController(financialService);
const marketCtrl = new MarketController(marketService);

// ----------------------------------------------------
// 3. Rotas - Dashboard
// ----------------------------------------------------
router.get('/dashboard', DashboardController.getMetrics);

// ----------------------------------------------------
// 4. Rotas - Condomínios e Blocos
// ----------------------------------------------------
router.get('/condominiums', condoCtrl.getAll);
router.post('/condominiums', condoCtrl.create);
router.get('/condominiums/:id', condoCtrl.getById);
router.patch('/condominiums/:id', condoCtrl.update);
router.delete('/condominiums/:id', condoCtrl.delete);

router.get('/condominiums/:id/blocks', condoCtrl.getBlocks);
router.post('/condominiums/:id/blocks', condoCtrl.createBlock);

router.get('/blocks', blockCtrl.getAll);
router.get('/blocks/:id', blockCtrl.getById);
router.patch('/blocks/:id', blockCtrl.update);
router.delete('/blocks/:id', blockCtrl.delete);

// ----------------------------------------------------
// 5. Rotas - Unidades (Apartamentos/Casas)
// ----------------------------------------------------
router.get('/units', unitCtrl.getAll);
router.post('/units', unitCtrl.create);
router.get('/units/:id', unitCtrl.getById);
router.patch('/units/:id', unitCtrl.update);
router.delete('/units/:id', unitCtrl.delete);

// ----------------------------------------------------
// 6. Rotas - Moradores
// ----------------------------------------------------
router.get('/residents', residentCtrl.getAll);
router.post('/residents', residentCtrl.create);
router.get('/residents/:id', residentCtrl.getById);
router.patch('/residents/:id', residentCtrl.update);
router.delete('/residents/:id', residentCtrl.delete);

// ----------------------------------------------------
// 7. Rotas - Veículos
// ----------------------------------------------------
router.get('/vehicles', vehicleCtrl.getAll);
router.post('/vehicles', vehicleCtrl.create);
router.get('/vehicles/:id', vehicleCtrl.getById);
router.patch('/vehicles/:id', vehicleCtrl.update);
router.delete('/vehicles/:id', vehicleCtrl.delete);

// ----------------------------------------------------
// 8. Rotas - Encomendas (Portaria)
// ----------------------------------------------------
router.get('/deliveries', deliveryCtrl.getAll);
router.post('/deliveries', deliveryCtrl.create);
router.get('/deliveries/:id', deliveryCtrl.getById);
router.patch('/deliveries/:id', deliveryCtrl.update);
router.patch('/deliveries/:id/pickup', deliveryCtrl.pickup);
router.patch('/deliveries/:id/cancel', deliveryCtrl.cancel);
router.delete('/deliveries/:id', deliveryCtrl.delete);

// ----------------------------------------------------
// 9. Rotas - Controle de Acesso (Portaria)
// ----------------------------------------------------
router.get('/access', accessCtrl.getAll);
router.post('/access/entry', accessCtrl.registerEntry);
router.patch('/access/:id/exit', accessCtrl.registerExit);
router.delete('/access/:id', accessCtrl.delete);

// ----------------------------------------------------
// 10. Rotas - Espaços e Reservas
// ----------------------------------------------------
router.get('/spaces', spaceCtrl.getAll);
router.post('/spaces', spaceCtrl.create);
router.patch('/spaces/:id', spaceCtrl.update);
router.delete('/spaces/:id', spaceCtrl.delete);

router.get('/reservations', reservationCtrl.getAll);
router.post('/reservations', reservationCtrl.createWithConflictCheck);
router.patch('/reservations/:id/cancel', reservationCtrl.cancel);
router.delete('/reservations/:id', reservationCtrl.delete);

// ----------------------------------------------------
// 11. Rotas - Financeiro
// ----------------------------------------------------
router.get('/financial/summary', financialCtrl.getSummary);
router.get('/financial/transactions', financialCtrl.getAllTransactions);
router.post('/financial/transactions', financialCtrl.create);
router.patch('/financial/transactions/:id/pay', financialCtrl.pay);
router.delete('/financial/transactions/:id', financialCtrl.delete);

// ----------------------------------------------------
// 12. Rotas - Mural de Comunicados
// ----------------------------------------------------
router.get('/announcements', announcementCtrl.getAll);
router.post('/announcements', announcementCtrl.create);
router.patch('/announcements/:id', announcementCtrl.update);
router.delete('/announcements/:id', announcementCtrl.delete);

// ----------------------------------------------------
// 13. Rotas - Mercadinho Autônomo & Checkout PDV
// ----------------------------------------------------
router.get('/market/products', marketCtrl.getProducts);
router.post('/market/products', marketCtrl.createProduct);
router.patch('/market/products/:id/stock', marketCtrl.updateStock);
router.delete('/market/products/:id', marketCtrl.delete);
router.post('/market/checkout', marketCtrl.checkout);
router.get('/market/sales', marketCtrl.getSales);

export default router;
