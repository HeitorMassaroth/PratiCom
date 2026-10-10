import express from 'express';
import cors from 'cors';
import { DAOFactory } from './dao/DAOFactory.js';
import AppConfigSingleton from './config/AppConfigSingleton.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
app.get('/api/dashboard', async (req, res) => {
  try {
    const deliveries = deliveryDAO.getDeliveries();
    const pendingDeliveries = deliveries.filter(d => d.status === 'pending' || d.status === 'PENDING');
    const accessLogs = accessDAO.getAccessLogs();
    const activeAccess = accessLogs.filter(a => a.status === 'IN_PROPERTY' || a.status === 'inside');
    const summary = financialDAO.getSummary();
    const announcements = announcementDAO.getAnnouncements();
    const urgentAnnouncements = announcements.filter(a => a.priority === 'URGENTE' || a.priority === 'high');
    const reservations = spaceDAO.getReservations();

    const data = {
      metrics: {
        pendingDeliveries: pendingDeliveries.length,
        activeAccess: activeAccess.length,
        overdueAmount: summary.default_amount || 0,
        defaultRate: summary.default_rate || 0
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
app.get('/api/deliveries', (req, res) => {
  try {
    const { status, unit_id } = req.query;
    const deliveries = deliveryDAO.getDeliveries({ status, unit_id });
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/deliveries', (req, res) => {
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

app.patch('/api/deliveries/:id/pickup', (req, res) => {
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
app.get('/api/access', (req, res) => {
  try {
    const { status, type, search } = req.query;
    const logs = accessDAO.getAccessLogs({ status, type, search });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/access/entry', (req, res) => {
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

app.patch('/api/access/:id/exit', (req, res) => {
  try {
    const { id } = req.params;
    const updated = accessDAO.registerExit(id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 4. CADASTRO DE PESSOAS, UNIDADES & VEÍCULOS
// ==========================================
app.get('/api/units', (req, res) => {
  try {
    const units = residentDAO.getUnits();
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/residents', (req, res) => {
  try {
    const { unit_id, search } = req.query;
    const residents = residentDAO.getResidents({ unit_id, search });
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
    const vehicles = residentDAO.getVehicles();
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
    const created = residentDAO.createVehicle(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pets', (req, res) => {
  try {
    const pets = residentDAO.getPets();
    res.json(pets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. RESERVAS DE ESPAÇOS COMUNS
// ==========================================
app.get('/api/spaces', (req, res) => {
  try {
    const spaces = spaceDAO.getSpaces();
    res.json(spaces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reservations', (req, res) => {
  try {
    const { space_id, date } = req.query;
    const reservations = spaceDAO.getReservations({ space_id, date });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reservations', (req, res) => {
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

app.patch('/api/reservations/:id/cancel', (req, res) => {
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
app.get('/api/financial/transactions', (req, res) => {
  try {
    const { status, type, search } = req.query;
    const txs = financialDAO.getTransactions({ status, type, search });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/financial/summary', (req, res) => {
  try {
    const summary = financialDAO.getSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/financial/transactions', (req, res) => {
  try {
    const { type, category, description, amount, due_date } = req.body;
    if (!type || !category || !description || !amount || !due_date) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }
    const created = financialDAO.createTransaction(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/financial/transactions/:id/pay', (req, res) => {
  try {
    const { id } = req.params;
    const updated = financialDAO.payTransaction(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint extra para relatório via Template Method
app.get('/api/financial/report', (req, res) => {
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
    const announcements = announcementDAO.getAnnouncements({ category, search });
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
    const created = announcementDAO.createAnnouncement(req.body);
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
app.get('/api/market/products', checkFeature('ENABLE_MARKETPLACE'), (req, res) => {
  try {
    const { category, search } = req.query;
    const products = marketDAO.getProducts({ category, search });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/market/products', checkFeature('ENABLE_MARKETPLACE'), (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || (!price && price !== 0)) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios.' });
    }
    const created = marketDAO.createProduct(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/market/products/:id/stock', checkFeature('ENABLE_MARKETPLACE'), (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, action } = req.body;
    const updated = marketDAO.updateStock(id, { quantity, action });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/market/checkout', checkFeature('ENABLE_MARKETPLACE'), (req, res) => {
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

app.get('/api/market/sales', checkFeature('ENABLE_MARKETPLACE'), (req, res) => {
  try {
    const sales = marketDAO.getSales();
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
  console.log(`🚀 Servidor Praticon ERP (SQLite + GoF + LPS) online em http://localhost:${PORT}`);
});
