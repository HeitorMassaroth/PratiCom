import express from 'express';
import cors from 'cors';
import { models } from './database.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// 1. DASHBOARD & MÉTRICAS CONSOLIDADAS
// ==========================================
app.get('/api/dashboard', async (req, res) => {
  try {
    const data = models.getDashboardData();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar dados do dashboard.' });
  }
});

// ==========================================
// 2. ENCOMENDAS (DELIVERIES)
// ==========================================
app.get('/api/deliveries', (req, res) => {
  try {
    const { status, unit_id } = req.query;
    const deliveries = models.getDeliveries({ status, unit_id });
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/deliveries', (req, res) => {
  try {
    const { unit_id, resident_id, courier, tracking_code, description, notes } = req.body;
    if (!unit_id || !courier) {
      return res.status(400).json({ error: 'Unidade e transportadora são obrigatórios.' });
    }
    const created = models.createDelivery(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/deliveries/:id/pickup', (req, res) => {
  try {
    const { id } = req.params;
    const { pickup_code, picked_up_by } = req.body;
    const updated = models.pickupDelivery(id, { pickup_code, picked_up_by });
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
    const logs = models.getAccessLogs({ status, type, search });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/access/entry', (req, res) => {
  try {
    const { visitor_name, document, type } = req.body;
    if (!visitor_name || !document) {
      return res.status(400).json({ error: 'Nome e documento são obrigatórios.' });
    }
    const created = models.registerEntry(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/access/:id/exit', (req, res) => {
  try {
    const { id } = req.params;
    const updated = models.registerExit(id);
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
    const units = models.getUnits();
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/residents', (req, res) => {
  try {
    const { unit_id, search } = req.query;
    const residents = models.getResidents({ unit_id, search });
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
    const created = models.createResident(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/residents/:id', (req, res) => {
  try {
    const { id } = req.params;
    models.deleteResident(id);
    res.json({ message: 'Morador removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vehicles', (req, res) => {
  try {
    const vehicles = models.getVehicles();
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
    const created = models.createVehicle(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/pets', (req, res) => {
  try {
    const pets = models.getPets();
    res.json(pets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. RESERVAS (REGRA: 1 HORA POR PESSOA/DIA)
// ==========================================
app.get('/api/spaces', (req, res) => {
  try {
    const spaces = models.getSpaces();
    res.json(spaces);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reservations', (req, res) => {
  try {
    const { date, space_id, resident_id } = req.query;
    const reservations = models.getReservations({ date, space_id, resident_id });
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
    const created = models.createReservation(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/reservations/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    models.cancelReservation(id);
    res.json({ message: 'Reserva cancelada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. FINANCEIRO
// ==========================================
app.get('/api/financial/transactions', (req, res) => {
  try {
    const { type, status, unit_id, category } = req.query;
    const txs = models.getFinancialTransactions({ type, status, unit_id, category });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/financial/summary', (req, res) => {
  try {
    const summary = models.getFinancialSummary();
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
    const created = models.createFinancialTransaction(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/financial/transactions/:id/pay', (req, res) => {
  try {
    const { id } = req.params;
    const updated = models.payFinancialTransaction(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. COMUNICADOS
// ==========================================
app.get('/api/announcements', (req, res) => {
  try {
    const { category, priority } = req.query;
    const announcements = models.getAnnouncements({ category, priority });
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
    const created = models.createAnnouncement(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/announcements/:id', (req, res) => {
  try {
    const { id } = req.params;
    models.deleteAnnouncement(id);
    res.json({ message: 'Comunicado excluído com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 8. MERCADINHO (ESTOQUE & PDV AUTOATENDIMENTO)
// ==========================================
app.get('/api/market/products', (req, res) => {
  try {
    const { category, low_stock } = req.query;
    const products = models.getMarketProducts({ category, low_stock });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/market/products', (req, res) => {
  try {
    const { name, sale_price } = req.body;
    if (!name || !sale_price) {
      return res.status(400).json({ error: 'Nome e preço de venda são obrigatórios.' });
    }
    const created = models.createMarketProduct(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/market/products/:id/stock', (req, res) => {
  try {
    const { id } = req.params;
    const { delta, new_quantity } = req.body;
    const updated = models.updateMarketStock(id, { delta, new_quantity });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/market/checkout', (req, res) => {
  try {
    const { items, payment_method, unit_id, resident_name } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio.' });
    }
    const result = models.checkoutMarket({ items, payment_method, unit_id, resident_name });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/market/sales', (req, res) => {
  try {
    const sales = models.getMarketSales();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Praticon ERP online na porta http://localhost:${PORT}`);
});
