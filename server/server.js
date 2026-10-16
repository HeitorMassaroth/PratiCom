import express from 'express';
import cors from 'cors';
import { tenantMiddleware } from './middleware/tenant.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/api.js';
import { seedDatabase } from './database/seed.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Inicializa seed no SQLite caso seja a primeira execução
seedDatabase();

app.use(cors());
app.use(express.json());
app.use(tenantMiddleware);

// Rotas da API
app.use('/api', apiRouter);

// Rota de Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'PratiCom ERP v2 (Clean MVC + DDD)',
    timestamp: new Date().toISOString()
  });
});

// Middleware Centralizado de Tratamento de Erros e Validações DDD
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 PratiCom ERP Backend v2 (Clean MVC + DDD) online em http://localhost:${PORT}`);
});

export default app;
