import { Router } from 'express';
import { BaseController } from '../controllers/BaseController.js';
import { BaseService } from '../services/BaseService.js';
import { BaseRepository } from '../database/BaseRepository.js';
import {
  Condominium,
  Block,
  Unit,
  Resident,
  Vehicle,
  Space,
  Announcement,
  MarketProduct
} from '../models/index.js';
import {
  DeliveryService,
  AccessService,
  ReservationService,
  FinancialService,
  MarketService,
  DashboardService
} from '../services/specializedServices.js';
import db from '../config/database.js';

const router = Router();

// ----------------------------------------------------
// 1. Instanciação dos Serviços
// ----------------------------------------------------
const condoService = new BaseService(new BaseRepository('condominiums', { hasDirectTenant: false }), Condominium);
const blockService = new BaseService(new BaseRepository('blocks'), Block);
const unitService = new BaseService(new BaseRepository('units', { hasDirectTenant: false }), Unit);
const residentService = new BaseService(new BaseRepository('residents', { hasDirectTenant: false }), Resident);
const vehicleService = new BaseService(new BaseRepository('vehicles', { hasDirectTenant: false }), Vehicle);
const spaceService = new BaseService(new BaseRepository('spaces'), Space);
const announcementService = new BaseService(new BaseRepository('announcements'), Announcement);

const deliveryService = new DeliveryService();
const accessService = new AccessService();
const reservationService = new ReservationService();
const financialService = new FinancialService();
const marketService = new MarketService();

// ----------------------------------------------------
// 2. Controladores Base
// ----------------------------------------------------
const condoCtrl = new BaseController(condoService);
const blockCtrl = new BaseController(blockService);
const unitCtrl = new BaseController(unitService);
const residentCtrl = new BaseController(residentService);
const vehicleCtrl = new BaseController(vehicleService);
const spaceCtrl = new BaseController(spaceService);
const announcementCtrl = new BaseController(announcementService);

// ----------------------------------------------------
// 3. Rotas - Dashboard
// ----------------------------------------------------
router.get('/dashboard', (req, res, next) => {
  try {
    const data = DashboardService.getMetrics(req.condominiumId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// 4. Rotas - Condomínios e Blocos
// ----------------------------------------------------
router.get('/condominiums', condoCtrl.getAll);
router.post('/condominiums', condoCtrl.create);
router.get('/condominiums/:id', condoCtrl.getById);
router.patch('/condominiums/:id', condoCtrl.update);
router.delete('/condominiums/:id', condoCtrl.delete);

router.get('/condominiums/:id/blocks', (req, res, next) => {
  try {
    const blocks = blockService.getAll({ condominium_id: req.params.id });
    res.json(blocks);
  } catch (err) {
    next(err);
  }
});

router.post('/condominiums/:id/blocks', (req, res, next) => {
  try {
    const created = blockService.create({ ...req.body, condominium_id: req.params.id });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.get('/blocks', blockCtrl.getAll);
router.get('/blocks/:id', blockCtrl.getById);
router.patch('/blocks/:id', blockCtrl.update);
router.delete('/blocks/:id', blockCtrl.delete);

// ----------------------------------------------------
// 5. Rotas - Unidades (Apartamentos/Casas)
// ----------------------------------------------------
router.get('/units', (req, res, next) => {
  try {
    const units = db.prepare(`
      SELECT u.*, b.name as block_name
      FROM units u
      JOIN blocks b ON u.block_id = b.id
      WHERE b.condominium_id = ?
      ORDER BY u.number ASC
    `).all(req.condominiumId);
    res.json(units);
  } catch (err) {
    next(err);
  }
});
router.post('/units', unitCtrl.create);
router.get('/units/:id', unitCtrl.getById);
router.patch('/units/:id', unitCtrl.update);
router.delete('/units/:id', unitCtrl.delete);

// ----------------------------------------------------
// 6. Rotas - Moradores
// ----------------------------------------------------
router.get('/residents', (req, res, next) => {
  try {
    let sql = `
      SELECT r.*, u.number as unit_number, b.name as block_name
      FROM residents r
      JOIN units u ON r.unit_id = u.id
      JOIN blocks b ON u.block_id = b.id
      WHERE b.condominium_id = ?
    `;
    const params = [req.condominiumId];

    if (req.query.unit_id) {
      sql += ' AND r.unit_id = ?';
      params.push(req.query.unit_id);
    }
    if (req.query.search) {
      sql += ' AND (r.name LIKE ? OR r.email LIKE ? OR r.cpf LIKE ?)';
      const term = `%${req.query.search}%`;
      params.push(term, term, term);
    }
    sql += ' ORDER BY r.name ASC';
    const residents = db.prepare(sql).all(...params);
    res.json(residents);
  } catch (err) {
    next(err);
  }
});
router.post('/residents', residentCtrl.create);
router.get('/residents/:id', residentCtrl.getById);
router.patch('/residents/:id', residentCtrl.update);
router.delete('/residents/:id', residentCtrl.delete);

// ----------------------------------------------------
// 7. Rotas - Veículos
// ----------------------------------------------------
router.get('/vehicles', (req, res, next) => {
  try {
    const vehicles = db.prepare(`
      SELECT v.*, u.number as unit_number, r.name as resident_name, b.name as block_name
      FROM vehicles v
      JOIN units u ON v.unit_id = u.id
      JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents r ON v.resident_id = r.id
      WHERE b.condominium_id = ?
      ORDER BY v.id DESC
    `).all(req.condominiumId);
    res.json(vehicles);
  } catch (err) {
    next(err);
  }
});
router.post('/vehicles', vehicleCtrl.create);
router.get('/vehicles/:id', vehicleCtrl.getById);
router.patch('/vehicles/:id', vehicleCtrl.update);
router.delete('/vehicles/:id', vehicleCtrl.delete);

// ----------------------------------------------------
// 8. Rotas - Encomendas (Portaria)
// ----------------------------------------------------
router.get('/deliveries', (req, res, next) => {
  try {
    const list = deliveryService.getAllWithUnits(req.condominiumId, req.query.status);
    res.json(list);
  } catch (err) {
    next(err);
  }
});
router.post('/deliveries', (req, res, next) => {
  try {
    const created = deliveryService.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});
router.get('/deliveries/:id', (req, res, next) => {
  try {
    const delivery = deliveryService.getById(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Encomenda não encontrada.' });
    res.json(delivery);
  } catch (err) {
    next(err);
  }
});
router.patch('/deliveries/:id', (req, res, next) => {
  try {
    const updated = deliveryService.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
router.patch('/deliveries/:id/pickup', (req, res, next) => {
  try {
    const updated = deliveryService.pickup(req.params.id, req.body.pickup_code, req.body.picked_up_by);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
router.patch('/deliveries/:id/cancel', (req, res, next) => {
  try {
    const updated = deliveryService.cancel(req.params.id, req.body.reason);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
router.delete('/deliveries/:id', (req, res, next) => {
  try {
    const deleted = deliveryService.delete(req.params.id);
    res.json({ message: 'Encomenda removida com sucesso.' });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// 9. Rotas - Controle de Acesso (Portaria)
// ----------------------------------------------------
router.get('/access', (req, res, next) => {
  try {
    const logs = accessService.getAllWithUnits(req.condominiumId, req.query.status, req.query.search);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});
router.post('/access/entry', (req, res, next) => {
  try {
    const created = accessService.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});
router.patch('/access/:id/exit', (req, res, next) => {
  try {
    const updated = accessService.registerExit(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
router.delete('/access/:id', (req, res, next) => {
  try {
    accessService.delete(req.params.id);
    res.json({ message: 'Registro de acesso removido.' });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// 10. Rotas - Espaços e Reservas
// ----------------------------------------------------
router.get('/spaces', spaceCtrl.getAll);
router.post('/spaces', spaceCtrl.create);
router.patch('/spaces/:id', spaceCtrl.update);
router.delete('/spaces/:id', spaceCtrl.delete);

router.get('/reservations', (req, res, next) => {
  try {
    const list = reservationService.getAllWithDetails(req.condominiumId, req.query.date, req.query.space_id);
    res.json(list);
  } catch (err) {
    next(err);
  }
});
router.post('/reservations', (req, res, next) => {
  try {
    const created = reservationService.createWithConflictCheck(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});
router.patch('/reservations/:id/cancel', (req, res, next) => {
  try {
    const updated = reservationService.update(req.params.id, { status: 'CANCELLED' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
router.delete('/reservations/:id', (req, res, next) => {
  try {
    reservationService.delete(req.params.id);
    res.json({ message: 'Reserva removida.' });
  } catch (err) {
    next(err);
  }
});

// ----------------------------------------------------
// 11. Rotas - Financeiro
// ----------------------------------------------------
router.get('/financial/summary', (req, res, next) => {
  try {
    const summary = financialService.getSummary(req.condominiumId);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});
router.get('/financial/transactions', (req, res, next) => {
  try {
    const filters = { condominium_id: req.condominiumId };
    if (req.query.status) filters.status = req.query.status;
    if (req.query.type) filters.type = req.query.type;
    const txs = financialService.getAll(filters);
    res.json(txs);
  } catch (err) {
    next(err);
  }
});
router.post('/financial/transactions', (req, res, next) => {
  try {
    const created = financialService.create(req.body, { condominiumId: req.condominiumId });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});
router.patch('/financial/transactions/:id/pay', (req, res, next) => {
  try {
    const paid = financialService.pay(req.params.id);
    res.json(paid);
  } catch (err) {
    next(err);
  }
});
router.delete('/financial/transactions/:id', (req, res, next) => {
  try {
    financialService.delete(req.params.id);
    res.json({ message: 'Lançamento financeiro removido.' });
  } catch (err) {
    next(err);
  }
});

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
router.get('/market/products', (req, res, next) => {
  try {
    const products = marketService.getAll({ condominium_id: req.condominiumId });
    res.json(products);
  } catch (err) {
    next(err);
  }
});
router.post('/market/products', (req, res, next) => {
  try {
    const created = marketService.create(req.body, { condominiumId: req.condominiumId });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});
router.patch('/market/products/:id/stock', (req, res, next) => {
  try {
    const { delta, quantity } = req.body;
    const prod = marketService.getById(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Produto não encontrado.' });

    let newStock = prod.stock_quantity;
    if (quantity !== undefined) newStock = Number(quantity);
    else if (delta !== undefined) newStock += Number(delta);

    const updated = marketService.update(req.params.id, { stock_quantity: Math.max(0, newStock) });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});
router.delete('/market/products/:id', (req, res, next) => {
  try {
    marketService.delete(req.params.id);
    res.json({ message: 'Produto removido do catálogo.' });
  } catch (err) {
    next(err);
  }
});

router.post('/market/checkout', (req, res, next) => {
  try {
    const result = marketService.checkout(req.condominiumId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/market/sales', (req, res, next) => {
  try {
    const sales = db.prepare(`
      SELECT s.*, u.number as unit_number, r.name as resident_name
      FROM market_sales s
      LEFT JOIN units u ON s.unit_id = u.id
      LEFT JOIN residents r ON s.resident_id = r.id
      WHERE s.condominium_id = ?
      ORDER BY s.id DESC
    `).all(req.condominiumId);
    res.json(sales);
  } catch (err) {
    next(err);
  }
});

export default router;
