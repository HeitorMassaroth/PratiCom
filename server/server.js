import express from 'express';
import cors from 'cors';
import { DAOFactory } from './dao/DAOFactory.js';
import AppConfigSingleton from './config/AppConfigSingleton.js';
import { tenantContextMiddleware } from './middleware/tenantContext.js';
import { checkModuleAvailability } from './middleware/moduleGuard.js';

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

const territoryError = (res, err) => {
  const message = err.message || 'Erro ao processar operação territorial.';
  const status = /não encontrado/i.test(message) ? 404 : /excluir|duplicad|restri/i.test(message) ? 409 : 400;
  return res.status(status).json({ error: message });
};

app.get('/api/condominiums', (req, res) => { try { res.json(condominiumDAO.getCondominiums({ status: req.query.status })); } catch (err) { territoryError(res, err); } });
app.post('/api/condominiums', (req, res) => { try { res.status(201).json(condominiumDAO.createCondominium(req.body)); } catch (err) { territoryError(res, err); } });
app.get('/api/condominiums/:id', (req, res) => { try { const value = condominiumDAO.getCondominium(req.params.id); if (!value) return res.status(404).json({ error: 'Condomínio não encontrado.' }); res.json(value); } catch (err) { territoryError(res, err); } });
app.patch('/api/condominiums/:id', (req, res) => { try { res.json(condominiumDAO.updateCondominium(req.params.id, req.body)); } catch (err) { territoryError(res, err); } });
app.patch('/api/condominiums/:id/status', (req, res) => { try { res.json(condominiumDAO.setCondominiumStatus(req.params.id, req.body.status)); } catch (err) { territoryError(res, err); } });
app.delete('/api/condominiums/:id', (req, res) => { try { condominiumDAO.deleteCondominium(req.params.id); res.status(204).end(); } catch (err) { territoryError(res, err); } });
app.get('/api/condominiums/:id/blocks', (req, res) => { try { res.json(condominiumDAO.getBlocks(req.params.id)); } catch (err) { territoryError(res, err); } });
app.post('/api/condominiums/:id/blocks', (req, res) => { try { res.status(201).json(condominiumDAO.createBlock(req.params.id, req.body)); } catch (err) { territoryError(res, err); } });
app.get('/api/blocks/:id', (req, res) => { try { const value = condominiumDAO.getBlock(req.params.id); if (!value) return res.status(404).json({ error: 'Bloco não encontrado.' }); res.json(value); } catch (err) { territoryError(res, err); } });
app.patch('/api/blocks/:id', (req, res) => { try { res.json(condominiumDAO.updateBlock(req.params.id, req.body)); } catch (err) { territoryError(res, err); } });
app.patch('/api/blocks/:id/status', (req, res) => { try { res.json(condominiumDAO.setBlockStatus(req.params.id, req.body.status)); } catch (err) { territoryError(res, err); } });
app.delete('/api/blocks/:id', (req, res) => { try { condominiumDAO.deleteBlock(req.params.id); res.status(204).end(); } catch (err) { territoryError(res, err); } });
app.get('/api/territory/pending-units', (req, res) => { try { res.json(condominiumDAO.getPendingUnits()); } catch (err) { territoryError(res, err); } });
app.patch('/api/blocks/:id/map-legacy-units', (req, res) => { try { res.json(condominiumDAO.mapPendingUnits(req.params.id, req.body.legacy_block)); } catch (err) { territoryError(res, err); } });

// ==========================================
// GESTÃO DE MÓDULOS POR CONDOMÍNIO
// ==========================================
app.get('/api/condominiums/active/modules', (req, res) => {
  try {
    res.json(condominiumDAO.getModules(req.condominiumId));
  } catch (err) {
    territoryError(res, err);
  }
});

app.get('/api/condominiums/:id/modules', (req, res) => {
  try {
    res.json(condominiumDAO.getModules(req.params.id));
  } catch (err) {
    territoryError(res, err);
  }
});

app.put('/api/condominiums/:id/modules', (req, res) => {
  try {
    const updated = condominiumDAO.setModules(req.params.id, req.body.modules || req.body);
    res.json(updated);
  } catch (err) {
    territoryError(res, err);
  }
});

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
app.get('/api/dashboard', checkModuleAvailability('dashboard'), async (req, res) => {
  try {
    const condominiumId = req.condominiumId;

    const hasDeliveries = condominiumDAO.isModuleEnabled(condominiumId, 'deliveries');
    const hasAccess = condominiumDAO.isModuleEnabled(condominiumId, 'access');
    const hasFinancial = condominiumDAO.isModuleEnabled(condominiumId, 'financial');
    const hasReservations = condominiumDAO.isModuleEnabled(condominiumId, 'reservations');

    const deliveries = hasDeliveries ? deliveryDAO.getDeliveries({ condominiumId }) : [];
    const pendingDeliveries = deliveries.filter(d => d.status === 'pending' || d.status === 'PENDING');

    const accessLogs = hasAccess ? accessDAO.getAccessLogs({ condominiumId }) : [];
    const activeAccess = accessLogs.filter(a => a.status === 'IN_PROPERTY' || a.status === 'inside');

    const summary = hasFinancial ? financialDAO.getSummary({ condominiumId }) : { default_amount: 0, default_rate: 0 };

    const announcements = announcementDAO.getAnnouncements({ condominiumId });
    const urgentAnnouncements = announcements.filter(a => a.priority === 'URGENTE' || a.priority === 'high');

    const reservations = hasReservations ? spaceDAO.getReservations({ condominiumId }) : [];

    const data = {
      metrics: {
        pendingDeliveries: hasDeliveries ? pendingDeliveries.length : null,
        activeAccess: hasAccess ? activeAccess.length : null,
        overdueAmount: hasFinancial ? (summary.default_amount || 0) : null,
        defaultRate: hasFinancial ? (summary.default_rate || 0) : null
      },
      recentAccess: activeAccess.slice(0, 5),
      recentDeliveries: pendingDeliveries.slice(0, 5),
      urgentAnnouncements,
      upcomingReservations: reservations.slice(0, 5)
    };

    res.json(data);
  } catch (err) {
    console.error('Erro no Dashboard:', err);
    res.status(500).json({ error: 'Erro ao carregar dados do dashboard.' });
  }
});

// ==========================================
// 2. ENCOMENDAS (DELIVERIES)
// ==========================================
app.get('/api/deliveries', checkModuleAvailability('deliveries'), (req, res) => {
  try {
    const { status, unit_id } = req.query;
    const deliveries = deliveryDAO.getDeliveries({ condominiumId: req.condominiumId, status, unit_id });
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/deliveries', checkModuleAvailability('deliveries'), (req, res) => {
  try {
    const { unit_id, courier } = req.body;
    if (!unit_id || !courier) {
      return res.status(400).json({ error: 'Unidade e transportadora são obrigatórios.' });
    }
    const created = deliveryDAO.createDelivery(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/deliveries/:id/pickup', checkModuleAvailability('deliveries'), (req, res) => {
  try {
    const { id } = req.params;
    const { pickup_code, picked_up_by } = req.body;
    
    // Respeita Feature Flag de Notificação Avançada com PIN (LPS)
    const isAdvanced = AppConfigSingleton.isFeatureEnabled('ENABLE_ADVANCED_DELIVERIES');
    const codeToVerify = isAdvanced ? pickup_code : null;

    const updated = deliveryDAO.pickupDelivery(id, { pickup_code: codeToVerify, picked_up_by });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 3. ENTRADA E SAÍDA DE PESSOAS (PORTARIA)
// ==========================================
app.get('/api/access', checkModuleAvailability('access'), (req, res) => {
  try {
    const { status, type, search } = req.query;
    const logs = accessDAO.getAccessLogs({ condominiumId: req.condominiumId, status, type, search });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/access/entry', checkModuleAvailability('access'), (req, res) => {
  try {
    const { visitor_name, document } = req.body;
    if (!visitor_name || !document) {
      return res.status(400).json({ error: 'Nome e documento são obrigatórios.' });
    }
    const created = accessDAO.registerEntry(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/access/:id/exit', checkModuleAvailability('access'), (req, res) => {
  try {
    const { id } = req.params;
    const updated = accessDAO.registerExit(id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/access/:id', checkModuleAvailability('access'), (req, res) => {
  try {
    const { id } = req.params;
    const deleted = accessDAO.deleteAccess(id, req.condominiumId);
    if (!deleted) {
      return res.status(404).json({ error: 'Registro de acesso não encontrado.' });
    }
    res.json({ message: 'Registro de acesso excluído com sucesso.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 4. CADASTRO DE PESSOAS, UNIDADES & VEÍCULOS
// ==========================================
app.get('/api/units', (req, res) => {
  try {
    const units = residentDAO.getUnits({ condominiumId: req.condominiumId });
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/units', (req, res) => {
  try {
    const { block_id, number } = req.body;
    if (!block_id || !number) {
      return res.status(400).json({ error: 'Bloco e número da unidade são obrigatórios.' });
    }
    const created = residentDAO.createUnit(req.body);
    res.status(201).json(created);
  } catch (err) {
    const status = /já existe|já está|duplicad/i.test(err.message) ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.get('/api/units/:id', (req, res) => {
  try {
    const unit = residentDAO.getUnit(req.params.id);
    if (!unit) return res.status(404).json({ error: 'Unidade não encontrada.' });
    res.json(unit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/units/:id', (req, res) => {
  try {
    const updated = residentDAO.updateUnit(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    const status = /já existe|duplicad/i.test(err.message) ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.delete('/api/units/:id', (req, res) => {
  try {
    residentDAO.deleteUnit(req.params.id);
    res.json({ message: 'Unidade excluída com sucesso.' });
  } catch (err) {
    const status = /possui|vinculad|histórico/i.test(err.message) ? 409 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.get('/api/residents', (req, res) => {
  try {
    const { unit_id, search } = req.query;
    const residents = residentDAO.getResidents({ condominiumId: req.condominiumId, unit_id, search });
    res.json(residents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/residents', (req, res) => {
  try {
    const { unit_id, name } = req.body;
    if (!unit_id || !name) {
      return res.status(400).json({ error: 'Unidade e nome são obrigatórios.' });
    }
    const created = residentDAO.createResident(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/residents/:id', (req, res) => {
  try {
    const { id } = req.params;
    if (!req.body.name) {
      return res.status(400).json({ error: 'Nome é obrigatório.' });
    }
    const updated = residentDAO.updateResident(id, req.body);
    res.json(updated);
  } catch (err) {
    const status = /não encontrado/i.test(err.message) ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.delete('/api/residents/:id', (req, res) => {
  try {
    const { id } = req.params;
    residentDAO.deleteResident(id);
    res.json({ message: 'Morador removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vehicles', (req, res) => {
  try {
    const vehicles = residentDAO.getVehicles({ condominiumId: req.condominiumId });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vehicles', (req, res) => {
  try {
    const { unit_id, plate, model } = req.body;
    if (!unit_id || !plate || !model) {
      return res.status(400).json({ error: 'Unidade, placa e modelo do veículo são obrigatórios.' });
    }
    const created = residentDAO.createVehicle(req.body, req.condominiumId);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/vehicles/:id', (req, res) => {
  try {
    const vehicle = residentDAO.getVehicle(req.params.id, req.condominiumId);
    if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado.' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/vehicles/:id', (req, res) => {
  try {
    const updated = residentDAO.updateVehicle(req.params.id, req.body, req.condominiumId);
    res.json(updated);
  } catch (err) {
    const status = /não encontrado/i.test(err.message) ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.delete('/api/vehicles/:id', (req, res) => {
  try {
    residentDAO.deleteVehicle(req.params.id, req.condominiumId);
    res.json({ message: 'Veículo removido com sucesso.' });
  } catch (err) {
    const status = /não encontrado/i.test(err.message) ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.get('/api/pets', (req, res) => {
  try {
    const pets = residentDAO.getPets({ condominiumId: req.condominiumId });
    res.json(pets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ==========================================
// 5. RESERVAS DE ESPAÇOS COMUNS
// ==========================================
app.get('/api/spaces', checkModuleAvailability('reservations'), (req, res) => {
  try {
    const spaces = spaceDAO.getSpaces({ condominiumId: req.condominiumId });
    res.json(spaces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reservations', checkModuleAvailability('reservations'), (req, res) => {
  try {
    const { space_id, date } = req.query;
    const reservations = spaceDAO.getReservations({ condominiumId: req.condominiumId, space_id, date });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reservations', checkModuleAvailability('reservations'), (req, res) => {
  try {
    const { space_id, resident_id, unit_id, reservation_date, start_time, end_time } = req.body;
    if (!space_id || !resident_id || !unit_id || !reservation_date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Todos os campos de espaço, morador, data e horário são obrigatórios.' });
    }
    const created = spaceDAO.createReservation(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/reservations/:id/cancel', checkModuleAvailability('reservations'), (req, res) => {
  try {
    const { id } = req.params;
    spaceDAO.cancelReservation(id);
    res.json({ message: 'Reserva cancelada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. FINANCEIRO CONDOMINIAL
// ==========================================
app.get('/api/financial/transactions', checkModuleAvailability('financial'), (req, res) => {
  try {
    const { status, type, category, search } = req.query;
    const txs = financialDAO.getTransactions({ condominiumId: req.condominiumId, status, type, category, search });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/financial/summary', checkModuleAvailability('financial'), (req, res) => {
  try {
    const summary = financialDAO.getSummary({ condominiumId: req.condominiumId });
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/financial/transactions', checkModuleAvailability('financial'), (req, res) => {
  try {
    const { type, category, description, amount, due_date } = req.body;
    if (!type || !category || !description || !amount || !due_date) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }
    const created = financialDAO.createTransaction({ condominium_id: req.condominiumId, ...req.body });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/financial/transactions/:id/pay', checkModuleAvailability('financial'), (req, res) => {
  try {
    const { id } = req.params;
    const updated = financialDAO.payTransaction(id, req.condominiumId);
    if (!updated) {
      return res.status(404).json({ error: 'Lançamento financeiro não encontrado.' });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint extra para relatório via Template Method
app.get('/api/financial/report', checkModuleAvailability('financial'), (req, res) => {
  try {
    const report = financialDAO.generateReport();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. MURAL DE COMUNICADOS
// ==========================================
app.get('/api/announcements', (req, res) => {
  try {
    const { category, search } = req.query;
    const announcements = announcementDAO.getAnnouncements({ condominiumId: req.condominiumId, category, search });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/announcements', (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
    }
    const created = announcementDAO.createAnnouncement({ condominium_id: req.condominiumId, ...req.body });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/announcements/:id', (req, res) => {
  try {
    const { id } = req.params;
    announcementDAO.deleteAnnouncement(id);
    res.json({ message: 'Comunicado excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. MERCADINHO AUTÔNOMO (LPS: ENABLE_MARKETPLACE)
// ==========================================
app.get('/api/market/products', checkModuleAvailability('market'), checkFeature('ENABLE_MARKETPLACE'), (req, res) => {
  try {
    const { category, search } = req.query;
    const products = marketDAO.getProducts({ condominiumId: req.condominiumId, category, search });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/market/products', checkModuleAvailability('market'), checkFeature('ENABLE_MARKETPLACE'), (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || (!price && price !== 0)) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios.' });
    }
    const created = marketDAO.createProduct({ condominium_id: req.condominiumId, ...req.body });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/market/products/:id/stock', checkModuleAvailability('market'), checkFeature('ENABLE_MARKETPLACE'), (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, action } = req.body;
    const updated = marketDAO.updateStock(id, { quantity, action });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/market/checkout', checkModuleAvailability('market'), checkFeature('ENABLE_MARKETPLACE'), (req, res) => {
  try {
    const { items, payment_method, unit_id, resident_id, total_amount } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho de compras vazio.' });
    }
    const result = marketDAO.checkout({ unit_id, resident_id, total_amount, payment_method, items });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/market/sales', checkModuleAvailability('market'), checkFeature('ENABLE_MARKETPLACE'), (req, res) => {
  try {
    const sales = marketDAO.getSales({ condominiumId: req.condominiumId });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint de controle de Feature Flags (LPS)
app.get('/api/config/features', (req, res) => {
  res.json(AppConfigSingleton.getFeatures());
});

app.patch('/api/config/features', (req, res) => {
  try {
    const { feature, enabled } = req.body;
    AppConfigSingleton.updateFeature(feature, enabled);
    res.json({ message: `Feature '${feature}' atualizada para ${enabled}.`, features: AppConfigSingleton.getFeatures() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Praticon ERP (SQLite + GoF + LPS + Multi-Tenant Context) online em http://localhost:${PORT}`);
});
