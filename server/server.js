import express from 'express';
import cors from 'cors';
import { DAOFactory } from './dao/DAOFactory.js';
import AppConfigSingleton from './config/AppConfigSingleton.js';
import { tenantContextMiddleware } from './middleware/tenantContext.js';
import { checkModuleAvailability } from './middleware/moduleGuard.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(tenantContextMiddleware);

// DAOs instanciadas via Padrão FACTORY METHOD
const residentDAO = DAOFactory.getDAO('resident');
const deliveryDAO = DAOFactory.getDAO('delivery');
const accessDAO = DAOFactory.getDAO('access');
const spaceDAO = DAOFactory.getDAO('reservation');
const financialDAO = DAOFactory.getDAO('financial');
const announcementDAO = DAOFactory.getDAO('announcement');
const marketDAO = DAOFactory.getDAO('market');
const condominiumDAO = DAOFactory.getDAO('condominium');

// ==========================================
// CONDOMÍNIOS, BLOCOS E GESTÃO TERRITORIAL
// ==========================================
app.get('/api/condominiums', asyncHandler((req, res) => {
  res.json(condominiumDAO.getCondominiums({ status: req.query.status }));
}));

app.post('/api/condominiums', asyncHandler((req, res) => {
  res.status(201).json(condominiumDAO.createCondominium(req.body));
}));

app.get('/api/condominiums/:id', asyncHandler((req, res) => {
  const value = condominiumDAO.getCondominium(req.params.id);
  if (!value) return res.status(404).json({ error: 'Condomínio não encontrado.' });
  res.json(value);
}));

app.patch('/api/condominiums/:id', asyncHandler((req, res) => {
  res.json(condominiumDAO.updateCondominium(req.params.id, req.body));
}));

app.patch('/api/condominiums/:id/status', asyncHandler((req, res) => {
  res.json(condominiumDAO.setCondominiumStatus(req.params.id, req.body.status));
}));

app.delete('/api/condominiums/:id', asyncHandler((req, res) => {
  condominiumDAO.deleteCondominium(req.params.id);
  res.status(204).end();
}));

app.get('/api/condominiums/:id/blocks', asyncHandler((req, res) => {
  res.json(condominiumDAO.getBlocks(req.params.id));
}));

app.post('/api/condominiums/:id/blocks', asyncHandler((req, res) => {
  res.status(201).json(condominiumDAO.createBlock(req.params.id, req.body));
}));

app.get('/api/blocks/:id', asyncHandler((req, res) => {
  const value = condominiumDAO.getBlock(req.params.id);
  if (!value) return res.status(404).json({ error: 'Bloco não encontrado.' });
  res.json(value);
}));

app.patch('/api/blocks/:id', asyncHandler((req, res) => {
  res.json(condominiumDAO.updateBlock(req.params.id, req.body));
}));

app.patch('/api/blocks/:id/status', asyncHandler((req, res) => {
  res.json(condominiumDAO.setBlockStatus(req.params.id, req.body.status));
}));

app.delete('/api/blocks/:id', asyncHandler((req, res) => {
  condominiumDAO.deleteBlock(req.params.id);
  res.status(204).end();
}));

app.get('/api/territory/pending-units', asyncHandler((req, res) => {
  res.json(condominiumDAO.getPendingUnits());
}));

app.patch('/api/blocks/:id/map-legacy-units', asyncHandler((req, res) => {
  res.json(condominiumDAO.mapPendingUnits(req.params.id, req.body.legacy_block));
}));

// ==========================================
// GESTÃO DE MÓDULOS POR CONDOMÍNIO
// ==========================================
app.get('/api/condominiums/active/modules', asyncHandler((req, res) => {
  res.json(condominiumDAO.getModules(req.condominiumId));
}));

app.get('/api/condominiums/:id/modules', asyncHandler((req, res) => {
  res.json(condominiumDAO.getModules(req.params.id));
}));

app.put('/api/condominiums/:id/modules', asyncHandler((req, res) => {
  const updated = condominiumDAO.setModules(req.params.id, req.body.modules || req.body);
  res.json(updated);
}));

// Middleware para Feature Flags (LPS)
const checkFeature = (featureName) => (req, res, next) => {
  if (!AppConfigSingleton.isFeatureEnabled(featureName)) {
    return res.status(403).json({ error: `A funcionalidade '${featureName}' está desativada na configuração (LPS).` });
  }
  next();
};

// ==========================================
// 1. DASHBOARD & MÉTRICAS CONSOLIDADAS
// ==========================================
app.get('/api/dashboard', checkModuleAvailability('dashboard'), asyncHandler(async (req, res) => {
  const condominiumId = req.condominiumId;

  const hasDeliveries = condominiumDAO.isModuleEnabled(condominiumId, 'deliveries');
  const hasAccess = condominiumDAO.isModuleEnabled(condominiumId, 'access');
  const hasFinancial = condominiumDAO.isModuleEnabled(condominiumId, 'financial');
  const hasReservations = condominiumDAO.isModuleEnabled(condominiumId, 'reservations');
  const hasMarket = condominiumDAO.isModuleEnabled(condominiumId, 'market');

  const deliveries = hasDeliveries ? deliveryDAO.getDeliveries({ condominiumId }) : [];
  const pendingDeliveries = deliveries.filter(d => ['pending', 'PENDING', 'RECEBIDA'].includes(d.status));

  const accessLogs = hasAccess ? accessDAO.getAccessLogs({ condominiumId }) : [];
  const activeAccess = accessLogs.filter(a => a.status === 'IN_PROPERTY' || a.status === 'inside');

  const summary = hasFinancial ? financialDAO.getSummary({ condominiumId }) : null;

  const announcements = announcementDAO.getAnnouncements({ condominiumId });
  const isUrgentOrPinned = (a) => {
    const p = String(a.priority || '').toLowerCase();
    const isUrgent = p === 'urgente' || p === 'urgent' || p === 'high' || p === 'alta';
    const isPinned = a.is_pinned === 1 || a.is_pinned === true;
    return isUrgent || isPinned;
  };
  const urgentAnnouncements = announcements
    .filter(isUrgentOrPinned)
    .sort((a, b) => {
      const aPinned = (a.is_pinned === 1 || a.is_pinned === true) ? 1 : 0;
      const bPinned = (b.is_pinned === 1 || b.is_pinned === true) ? 1 : 0;
      if (bPinned !== aPinned) return bPinned - aPinned;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

  const today = new Date().toLocaleDateString('en-CA');
  const reservations = hasReservations ? spaceDAO.getReservations({ condominiumId }) : [];
  const todayReservations = reservations.filter(r => r.reservation_date === today && (r.status === 'CONFIRMED' || r.status === 'Confirmada'));

  const marketProducts = hasMarket ? marketDAO.getProducts({ condominiumId }) : [];
  const lowStockItems = marketProducts.filter(p => (p.stock_quantity ?? p.stock ?? 0) <= (p.min_stock ?? 5));

  const data = {
    metrics: {
      pendingDeliveries: hasDeliveries ? pendingDeliveries.length : null,
      activeAccess: hasAccess ? activeAccess.length : null,
      activeVisitors: hasAccess ? activeAccess.length : null,
      balance: hasFinancial ? (summary?.currentBalance ?? 0) : null,
      overdueAmount: hasFinancial ? (summary?.default_amount ?? summary?.income?.overdue ?? 0) : null,
      overdueCount: hasFinancial ? (summary?.overdue_count ?? summary?.delinquencyByUnit?.length ?? 0) : null,
      defaultRate: hasFinancial ? (summary?.default_rate ?? 0) : null,
      todayReservations: hasReservations ? todayReservations.length : null,
      lowStockItems: hasMarket ? lowStockItems.length : null
    },
    recentAccess: activeAccess.slice(0, 5),
    recentDeliveries: pendingDeliveries.slice(0, 5),
    urgentAnnouncements,
    upcomingReservations: reservations.slice(0, 5)
  };

  res.json(data);
}));

// ==========================================
// 2. ENCOMENDAS (DELIVERIES)
// ==========================================
app.get('/api/deliveries', checkModuleAvailability('deliveries'), asyncHandler((req, res) => {
  const { status, unit_id } = req.query;
  const deliveries = deliveryDAO.getDeliveries({ condominiumId: req.condominiumId, status, unit_id });
  res.json(deliveries);
}));

app.get('/api/deliveries/:id', checkModuleAvailability('deliveries'), asyncHandler((req, res) => {
  const delivery = deliveryDAO.getDeliveryById(req.params.id, { condominiumId: req.condominiumId });
  if (!delivery) {
    return res.status(404).json({ error: 'Encomenda não encontrada ou não pertence ao condomínio ativo.' });
  }
  res.json(delivery);
}));

app.post('/api/deliveries', checkModuleAvailability('deliveries'), asyncHandler((req, res) => {
  const { unit_id, courier } = req.body;
  if (!unit_id || !courier) {
    return res.status(400).json({ error: 'Unidade e transportadora são obrigatórios.' });
  }
  const created = deliveryDAO.createDelivery(req.body, req.condominiumId);
  res.status(201).json(created);
}));

app.patch('/api/deliveries/:id', checkModuleAvailability('deliveries'), asyncHandler((req, res) => {
  if (req.body.courier !== undefined && !req.body.courier) {
    return res.status(400).json({ error: 'Transportadora é obrigatória.' });
  }
  const updated = deliveryDAO.updateDelivery(req.params.id, req.body, req.condominiumId);
  res.json(updated);
}));

app.delete('/api/deliveries/:id', checkModuleAvailability('deliveries'), asyncHandler((req, res) => {
  const deleted = deliveryDAO.deleteDelivery(req.params.id, req.condominiumId);
  if (!deleted) {
    return res.status(404).json({ error: 'Encomenda não encontrada.' });
  }
  res.json({ message: 'Encomenda excluída com sucesso.' });
}));

app.patch('/api/deliveries/:id/pickup', checkModuleAvailability('deliveries'), asyncHandler((req, res) => {
  const { id } = req.params;
  const { pickup_code, picked_up_by } = req.body;

  // Respeita Feature Flag de Notificação Avançada com PIN (LPS)
  const isAdvanced = AppConfigSingleton.isFeatureEnabled('ENABLE_ADVANCED_DELIVERIES');
  const codeToVerify = isAdvanced ? pickup_code : null;

  const updated = deliveryDAO.pickupDelivery(id, { pickup_code: codeToVerify, picked_up_by }, req.condominiumId);
  res.json(updated);
}));

app.patch('/api/deliveries/:id/cancel', checkModuleAvailability('deliveries'), asyncHandler((req, res) => {
  const { id } = req.params;
  const { reason, cancelled_by } = req.body;
  const cancelled = deliveryDAO.cancelDelivery(id, {
    reason,
    cancelledBy: cancelled_by,
    condominiumId: req.condominiumId
  });
  res.json(cancelled);
}));

// ==========================================
// 3. ENTRADA E SAÍDA DE PESSOAS (PORTARIA)
// ==========================================
app.get('/api/access', checkModuleAvailability('access'), asyncHandler((req, res) => {
  const { status, type, search } = req.query;
  const logs = accessDAO.getAccessLogs({ condominiumId: req.condominiumId, status, type, search });
  res.json(logs);
}));

app.post('/api/access/entry', checkModuleAvailability('access'), asyncHandler((req, res) => {
  const { visitor_name, document, destination_unit_id, unit_id } = req.body;
  if (!visitor_name || !document) {
    return res.status(400).json({ error: 'Nome e documento são obrigatórios.' });
  }
  const targetUnit = destination_unit_id || unit_id;
  if (!targetUnit) {
    return res.status(400).json({ error: 'Unidade de destino é obrigatória.' });
  }
  const created = accessDAO.registerEntry(req.body);
  res.status(201).json(created);
}));

app.patch('/api/access/:id/exit', checkModuleAvailability('access'), asyncHandler((req, res) => {
  const { id } = req.params;
  const updated = accessDAO.registerExit(id);
  res.json(updated);
}));

app.delete('/api/access/:id', checkModuleAvailability('access'), asyncHandler((req, res) => {
  const { id } = req.params;
  const deleted = accessDAO.deleteAccess(id, req.condominiumId);
  if (!deleted) {
    return res.status(404).json({ error: 'Registro de acesso não encontrado.' });
  }
  res.json({ message: 'Registro de acesso excluído com sucesso.' });
}));

// ==========================================
// 4. CADASTRO DE PESSOAS, UNIDADES & VEÍCULOS
// ==========================================
app.get('/api/units', asyncHandler((req, res) => {
  const units = residentDAO.getUnits({ condominiumId: req.condominiumId });
  res.json(units);
}));

app.post('/api/units', asyncHandler((req, res) => {
  const { block_id, number } = req.body;
  if (!block_id || !number) {
    return res.status(400).json({ error: 'Bloco e número da unidade são obrigatórios.' });
  }
  const created = residentDAO.createUnit(req.body, { condominiumId: req.condominiumId });
  res.status(201).json(created);
}));

app.get('/api/units/:id', asyncHandler((req, res) => {
  const unit = residentDAO.getUnit(req.params.id);
  if (!unit) return res.status(404).json({ error: 'Unidade não encontrada.' });
  res.json(unit);
}));

app.patch('/api/units/:id', asyncHandler((req, res) => {
  const updated = residentDAO.updateUnit(req.params.id, req.body, { condominiumId: req.condominiumId });
  res.json(updated);
}));

app.delete('/api/units/:id', asyncHandler((req, res) => {
  residentDAO.deleteUnit(req.params.id);
  res.json({ message: 'Unidade excluída com sucesso.' });
}));

app.get('/api/residents', asyncHandler((req, res) => {
  const { unit_id, search } = req.query;
  const residents = residentDAO.getResidents({ condominiumId: req.condominiumId, unit_id, search });
  res.json(residents);
}));

app.post('/api/residents', asyncHandler((req, res) => {
  const { unit_id, name } = req.body;
  if (!unit_id || !name) {
    return res.status(400).json({ error: 'Unidade e nome são obrigatórios.' });
  }
  const created = residentDAO.createResident(req.body);
  res.status(201).json(created);
}));

app.patch('/api/residents/:id', asyncHandler((req, res) => {
  const { id } = req.params;
  if (!req.body.name) {
    return res.status(400).json({ error: 'Nome é obrigatório.' });
  }
  const updated = residentDAO.updateResident(id, req.body, req.condominiumId);
  res.json(updated);
}));

app.delete('/api/residents/:id', asyncHandler((req, res) => {
  const { id } = req.params;
  const deleted = residentDAO.deleteResident(id, req.condominiumId);
  if (!deleted) {
    return res.status(404).json({ error: 'Morador não encontrado neste condomínio.' });
  }
  res.json({ message: 'Morador removido com sucesso.' });
}));

app.get('/api/vehicles', asyncHandler((req, res) => {
  const vehicles = residentDAO.getVehicles({ condominiumId: req.condominiumId });
  res.json(vehicles);
}));

app.post('/api/vehicles', asyncHandler((req, res) => {
  const { unit_id, plate, model } = req.body;
  if (!unit_id || !plate || !model) {
    return res.status(400).json({ error: 'Unidade, placa e modelo do veículo são obrigatórios.' });
  }
  const created = residentDAO.createVehicle(req.body, req.condominiumId);
  res.status(201).json(created);
}));

app.get('/api/vehicles/:id', asyncHandler((req, res) => {
  const vehicle = residentDAO.getVehicle(req.params.id, req.condominiumId);
  if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado.' });
  res.json(vehicle);
}));

app.patch('/api/vehicles/:id', asyncHandler((req, res) => {
  const updated = residentDAO.updateVehicle(req.params.id, req.body, req.condominiumId);
  res.json(updated);
}));

app.delete('/api/vehicles/:id', asyncHandler((req, res) => {
  residentDAO.deleteVehicle(req.params.id, req.condominiumId);
  res.json({ message: 'Veículo removido com sucesso.' });
}));

// ==========================================
// 5. RESERVAS DE ESPAÇOS COMUNS
// ==========================================
app.get('/api/spaces', checkModuleAvailability('reservations'), asyncHandler((req, res) => {
  const spaces = spaceDAO.getSpaces({ condominiumId: req.condominiumId });
  res.json(spaces);
}));

app.post('/api/spaces', checkModuleAvailability('reservations'), asyncHandler((req, res) => {
  const created = spaceDAO.createSpace({ ...req.body, condominium_id: req.condominiumId });
  res.status(201).json(created);
}));

app.patch('/api/spaces/:id', checkModuleAvailability('reservations'), asyncHandler((req, res) => {
  const updated = spaceDAO.updateSpace(req.params.id, req.body);
  res.json(updated);
}));

app.delete('/api/spaces/:id', checkModuleAvailability('reservations'), asyncHandler((req, res) => {
  spaceDAO.deleteSpace(req.params.id);
  res.json({ message: 'Área removida com sucesso.' });
}));

app.get('/api/reservations', checkModuleAvailability('reservations'), asyncHandler((req, res) => {
  const { space_id, date } = req.query;
  const reservations = spaceDAO.getReservations({ condominiumId: req.condominiumId, space_id, date });
  res.json(reservations);
}));

app.post('/api/reservations', checkModuleAvailability('reservations'), asyncHandler((req, res) => {
  const { space_id, resident_id, unit_id, reservation_date, start_time, end_time } = req.body;
  if (!space_id || !resident_id || !unit_id || !reservation_date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Todos os campos de espaço, morador, data e horário são obrigatórios.' });
  }
  const created = spaceDAO.createReservation(req.body);
  res.status(201).json(created);
}));

app.patch('/api/reservations/:id', checkModuleAvailability('reservations'), asyncHandler((req, res) => {
  const updated = spaceDAO.updateReservation(req.params.id, req.body);
  res.json(updated);
}));

app.patch('/api/reservations/:id/cancel', checkModuleAvailability('reservations'), asyncHandler((req, res) => {
  const { id } = req.params;
  spaceDAO.cancelReservation(id);
  res.json({ message: 'Reserva cancelada com sucesso.' });
}));

app.delete('/api/reservations/:id', checkModuleAvailability('reservations'), asyncHandler((req, res) => {
  spaceDAO.deleteReservation(req.params.id);
  res.json({ message: 'Reserva excluída com sucesso.' });
}));

// ==========================================
// 6. FINANCEIRO CONDOMINIAL
// ==========================================
app.get('/api/financial/transactions', checkModuleAvailability('financial'), asyncHandler((req, res) => {
  const { status, type, category, search } = req.query;
  const txs = financialDAO.getTransactions({ condominiumId: req.condominiumId, status, type, category, search });
  res.json(txs);
}));

app.get('/api/financial/summary', checkModuleAvailability('financial'), asyncHandler((req, res) => {
  const summary = financialDAO.getSummary({ condominiumId: req.condominiumId });
  res.json(summary);
}));

app.post('/api/financial/transactions', checkModuleAvailability('financial'), asyncHandler((req, res) => {
  const { type, category, description, amount, due_date } = req.body;
  if (!type || !category || !description?.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !due_date) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }
  if (!['income', 'expense'].includes(String(type).toLowerCase())) {
    return res.status(400).json({ error: 'Tipo de lançamento inválido.' });
  }
  const created = financialDAO.createTransaction({ ...req.body, condominium_id: req.condominiumId });
  res.status(201).json(created);
}));

app.patch('/api/financial/transactions/:id', checkModuleAvailability('financial'), asyncHandler((req, res) => {
  const { type, category, description, amount, due_date } = req.body;
  if (!['income', 'expense'].includes(String(type).toLowerCase()) || !category || !description?.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !due_date) {
    return res.status(400).json({ error: 'Preencha corretamente os campos obrigatórios.' });
  }
  const updated = financialDAO.updateTransaction(req.params.id, req.body, req.condominiumId);
  if (!updated) return res.status(404).json({ error: 'Lançamento não encontrado neste condomínio.' });
  res.json(updated);
}));

app.delete('/api/financial/transactions/:id', checkModuleAvailability('financial'), asyncHandler((req, res) => {
  const deleted = financialDAO.deleteTransaction(req.params.id, req.condominiumId);
  if (!deleted) return res.status(404).json({ error: 'Lançamento não encontrado neste condomínio.' });
  res.json({ message: 'Lançamento excluído com sucesso.' });
}));

app.patch('/api/financial/transactions/:id/pay', checkModuleAvailability('financial'), asyncHandler((req, res) => {
  const { id } = req.params;
  const updated = financialDAO.payTransaction(id, req.condominiumId);
  if (!updated) {
    return res.status(404).json({ error: 'Lançamento financeiro não encontrado.' });
  }
  res.json(updated);
}));

// Endpoint extra para relatório via Template Method
app.get('/api/financial/report', checkModuleAvailability('financial'), asyncHandler((req, res) => {
  const report = financialDAO.generateReport();
  res.json(report);
}));

// ==========================================
// 7. MURAL DE COMUNICADOS
// ==========================================
app.get('/api/announcements', asyncHandler((req, res) => {
  const { category, priority, search } = req.query;
  const announcements = announcementDAO.getAnnouncements({ condominiumId: req.condominiumId, category, priority, search });
  res.json(announcements);
}));

app.post('/api/announcements', asyncHandler((req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
  }
  const created = announcementDAO.createAnnouncement({ ...req.body, condominium_id: req.condominiumId });
  res.status(201).json(created);
}));

app.patch('/api/announcements/:id', asyncHandler((req, res) => {
  const { title, content } = req.body;
  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
  }
  const updated = announcementDAO.updateAnnouncement(req.params.id, req.body, req.condominiumId);
  if (!updated) return res.status(404).json({ error: 'Comunicado não encontrado neste condomínio.' });
  res.json(updated);
}));

app.delete('/api/announcements/:id', asyncHandler((req, res) => {
  const { id } = req.params;
  const deleted = announcementDAO.deleteAnnouncement(id, req.condominiumId);
  if (!deleted) return res.status(404).json({ error: 'Comunicado não encontrado neste condomínio.' });
  res.json({ message: 'Comunicado excluído com sucesso.' });
}));

// ==========================================
// 8. MERCADINHO AUTÔNOMO (LPS: ENABLE_MARKETPLACE)
// ==========================================
app.get('/api/market/products', checkModuleAvailability('market'), checkFeature('ENABLE_MARKETPLACE'), asyncHandler((req, res) => {
  const { category, search } = req.query;
  const products = marketDAO.getProducts({ condominiumId: req.condominiumId, category, search });
  res.json(products);
}));

app.post('/api/market/products', checkModuleAvailability('market'), checkFeature('ENABLE_MARKETPLACE'), asyncHandler((req, res) => {
  const { name } = req.body;
  const price = req.body.price ?? req.body.sale_price;
  if (!name || (!price && price !== 0)) {
    return res.status(400).json({ error: 'Nome e preço são obrigatórios.' });
  }
  // O condomínio vem sempre do contexto da requisição, nunca do corpo enviado pela tela
  const created = marketDAO.createProduct({ ...req.body, condominium_id: req.condominiumId });
  res.status(201).json(created);
}));

app.get('/api/market/products/:id', checkModuleAvailability('market'), checkFeature('ENABLE_MARKETPLACE'), asyncHandler((req, res) => {
  const product = marketDAO.getProduct(req.params.id, req.condominiumId);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
  res.json(product);
}));

app.patch('/api/market/products/:id', checkModuleAvailability('market'), checkFeature('ENABLE_MARKETPLACE'), asyncHandler((req, res) => {
  const updated = marketDAO.updateProduct(req.params.id, req.body, req.condominiumId);
  res.json(updated);
}));

app.delete('/api/market/products/:id', checkModuleAvailability('market'), checkFeature('ENABLE_MARKETPLACE'), asyncHandler((req, res) => {
  const deleted = marketDAO.deleteProduct(req.params.id, req.condominiumId);
  if (!deleted) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }
  res.json({ message: 'Produto excluído com sucesso.' });
}));

app.patch('/api/market/products/:id/stock', checkModuleAvailability('market'), checkFeature('ENABLE_MARKETPLACE'), asyncHandler((req, res) => {
  const { id } = req.params;
  const { delta, quantity, action } = req.body;
  const updated = marketDAO.updateStock(id, { delta, quantity, action }, req.condominiumId);
  res.json(updated);
}));

app.post('/api/market/checkout', checkModuleAvailability('market'), checkFeature('ENABLE_MARKETPLACE'), asyncHandler((req, res) => {
  const { items, payment_method, unit_id, resident_id } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Carrinho de compras vazio.' });
  }
  // total_amount enviado pela tela é ignorado: o DAO calcula o total com os preços do banco
  const result = marketDAO.checkout({ unit_id, resident_id, payment_method, items }, req.condominiumId);
  res.status(201).json(result);
}));

app.get('/api/market/sales', checkModuleAvailability('market'), checkFeature('ENABLE_MARKETPLACE'), asyncHandler((req, res) => {
  const sales = marketDAO.getSales({ condominiumId: req.condominiumId });
  res.json(sales);
}));

// Endpoint de controle de Feature Flags (LPS)
app.get('/api/config/features', (req, res) => {
  res.json(AppConfigSingleton.getFeatures());
});

app.patch('/api/config/features', asyncHandler((req, res) => {
  const { feature, enabled } = req.body;
  AppConfigSingleton.updateFeature(feature, enabled);
  res.json({ message: `Feature '${feature}' atualizada para ${enabled}.`, features: AppConfigSingleton.getFeatures() });
}));

// Middleware centralizado de tratamento de erros
app.use(errorHandler);

process.on('uncaughtException', (err) => {
  console.error('❌ Exceção não capturada:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Rejeição de Promise não tratada:', reason);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Praticom ERP (SQLite + GoF + LPS + Multi-Tenant Context) online em http://localhost:${PORT}`);
});
