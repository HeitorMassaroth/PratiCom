// ============================================================================
// PratiCom ERP - Servidor de API Nativo SQLite + DDD
// Executa servidor HTTP nativo Node.js com conexão direta ao SQLite e classes DDD
// ============================================================================

import http from 'node:http';
import path from 'node:path';
import { DatabaseEngine } from '../database/DatabaseEngine.js';
import { ALL_TABLE_CLASSES } from '../database/tables/index.js';
import {
  Delivery,
  Reservation,
  Occurrence,
  Poll,
  ReservationConflictDetector,
  QuorumCalculator,
  FinancialHealthService
} from '../src/domain/index.js';

const PORT = process.env.PORT || 3001;
const dbPath = path.resolve(process.cwd(), 'database', 'condo_database.sqlite');

// 1. Inicializa o motor de banco de dados SQLite
const engine = new DatabaseEngine({
  filePath: dbPath,
  verbose: true
});
engine.registerTables(ALL_TABLE_CLASSES);
engine.initializeSchema();

// Helper de cabeçalhos CORS
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-condo-id');
}

// Helper para parsear JSON do body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('JSON malformatado'));
      }
    });
    req.on('error', reject);
  });
}

// Helper para responder JSON
function jsonResponse(res, statusCode, data) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// Roteador HTTP
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  try {
    // ------------------------------------------------------------------------
    // Health Check & Stats
    // ------------------------------------------------------------------------
    if (pathname === '/api/health' && method === 'GET') {
      const stats = engine.getStats();
      return jsonResponse(res, 200, {
        status: 'UP',
        engine: 'Node 24 DatabaseSync (SQLite)',
        stats
      });
    }

    // ------------------------------------------------------------------------
    // Condomínios & Módulos
    // ------------------------------------------------------------------------
    if (pathname === '/api/condominiums' && method === 'GET') {
      const Condos = engine.getTable('condominiums');
      const rows = Condos.findAll();
      return jsonResponse(res, 200, rows);
    }

    // ------------------------------------------------------------------------
    // Blocos & Unidades
    // ------------------------------------------------------------------------
    if (pathname === '/api/blocks' && method === 'GET') {
      const Blocks = engine.getTable('blocks');
      const condoId = url.searchParams.get('condominium_id');
      const filter = condoId ? { condominium_id: Number(condoId) } : {};
      return jsonResponse(res, 200, Blocks.findAll(filter));
    }

    if (pathname === '/api/units' && method === 'GET') {
      const Units = engine.getTable('units');
      const blockId = url.searchParams.get('block_id');
      const filter = blockId ? { block_id: Number(blockId) } : {};
      return jsonResponse(res, 200, Units.findAll(filter));
    }

    // ------------------------------------------------------------------------
    // Moradores
    // ------------------------------------------------------------------------
    if (pathname === '/api/residents' && method === 'GET') {
      const Residents = engine.getTable('residents');
      const unitId = url.searchParams.get('unit_id');
      const filter = unitId ? { unit_id: Number(unitId) } : {};
      return jsonResponse(res, 200, Residents.findAll(filter));
    }

    // ------------------------------------------------------------------------
    // Veículos
    // ------------------------------------------------------------------------
    if (pathname === '/api/vehicles' && method === 'GET') {
      const Vehicles = engine.getTable('vehicles');
      const unitId = url.searchParams.get('unit_id');
      const filter = unitId ? { unit_id: Number(unitId) } : {};
      return jsonResponse(res, 200, Vehicles.findAll(filter));
    }

    // ------------------------------------------------------------------------
    // Pets
    // ------------------------------------------------------------------------
    if (pathname === '/api/pets' && method === 'GET') {
      const Pets = engine.getTable('pets');
      const condoId = url.searchParams.get('condominium_id') || 1;
      return jsonResponse(res, 200, Pets.findAll({ condominium_id: Number(condoId) }));
    }

    if (pathname === '/api/pets' && method === 'POST') {
      const Pets = engine.getTable('pets');
      const body = await parseJsonBody(req);
      const inserted = Pets.insert(body);
      return jsonResponse(res, 201, inserted);
    }

    // ------------------------------------------------------------------------
    // Encomendas (Deliveries) com Domínio DDD e PIN
    // ------------------------------------------------------------------------
    if (pathname === '/api/deliveries' && method === 'GET') {
      const Deliveries = engine.getTable('deliveries');
      const unitId = url.searchParams.get('unit_id');
      const filter = unitId ? { unit_id: Number(unitId) } : {};
      return jsonResponse(res, 200, Deliveries.findAll(filter, { orderBy: 'received_at DESC' }));
    }

    if (pathname === '/api/deliveries' && method === 'POST') {
      const Deliveries = engine.getTable('deliveries');
      const body = await parseJsonBody(req);

      // Instancia Agregado de Domínio Delivery para garantir invariantes
      const delivery = Delivery.create(body);
      const inserted = Deliveries.insert({
        unit_id: delivery.unitId,
        resident_id: delivery.residentId,
        courier: delivery.courier,
        tracking_code: delivery.trackingCode,
        description: delivery.description,
        status: delivery.status,
        pickup_code: delivery.pickupCode,
        received_at: delivery.receivedAt,
        notes: delivery.notes
      });
      return jsonResponse(res, 201, inserted);
    }

    // Retirada com verificação do PIN via Agregado DDD
    const pickupMatch = pathname.match(/^\/api\/deliveries\/(\d+)\/pickup$/);
    if (pickupMatch && method === 'POST') {
      const deliveryId = Number(pickupMatch[1]);
      const Deliveries = engine.getTable('deliveries');
      const row = Deliveries.findById(deliveryId);

      if (!row) return jsonResponse(res, 404, { error: 'Encomenda não encontrada' });

      const body = await parseJsonBody(req);
      const { picked_up_by, pickup_code } = body;

      const delivery = new Delivery(row.id, {
        unitId: row.unit_id,
        residentId: row.resident_id,
        courier: row.courier,
        trackingCode: row.tracking_code,
        description: row.description,
        status: row.status,
        pickupCode: row.pickup_code,
        receivedAt: row.received_at
      });

      // Validação do domínio DDD
      delivery.markAsPickedUp(picked_up_by, pickup_code);

      const updated = Deliveries.update(deliveryId, {
        status: delivery.status,
        picked_up_at: delivery.pickedUpAt,
        picked_up_by: delivery.pickedUpBy
      });

      return jsonResponse(res, 200, updated);
    }

    // ------------------------------------------------------------------------
    // Reservas de Espaços com ReservationConflictDetector DDD
    // ------------------------------------------------------------------------
    if (pathname === '/api/spaces' && method === 'GET') {
      const Spaces = engine.getTable('spaces');
      return jsonResponse(res, 200, Spaces.findAll());
    }

    if (pathname === '/api/reservations' && method === 'GET') {
      const Reservations = engine.getTable('reservations');
      return jsonResponse(res, 200, Reservations.findAll({}, { orderBy: 'reservation_date DESC' }));
    }

    if (pathname === '/api/reservations' && method === 'POST') {
      const Reservations = engine.getTable('reservations');
      const body = await parseJsonBody(req);

      // Validação de conflito pelo Domain Service
      const existing = Reservations.findAll({ space_id: body.space_id, reservation_date: body.reservation_date });
      const conflictCheck = ReservationConflictDetector.detectConflict(body, existing);

      if (conflictCheck.hasConflict) {
        return jsonResponse(res, 409, { error: conflictCheck.message });
      }

      // Criação via Agregado DDD
      const reservation = Reservation.create(body);
      const inserted = Reservations.insert({
        space_id: reservation.spaceId,
        resident_id: reservation.residentId,
        unit_id: reservation.unitId,
        reservation_date: reservation.reservationDate,
        start_time: reservation.startTime,
        end_time: reservation.endTime,
        status: reservation.status,
        notes: reservation.notes
      });

      return jsonResponse(res, 201, inserted);
    }

    // ------------------------------------------------------------------------
    // Ocorrências (Occurrences)
    // ------------------------------------------------------------------------
    if (pathname === '/api/occurrences' && method === 'GET') {
      const Occurrences = engine.getTable('occurrences');
      return jsonResponse(res, 200, Occurrences.findAll({}, { orderBy: 'created_at DESC' }));
    }

    if (pathname === '/api/occurrences' && method === 'POST') {
      const Occurrences = engine.getTable('occurrences');
      const body = await parseJsonBody(req);

      const occ = Occurrence.report(body);
      const inserted = Occurrences.insert({
        condominium_id: occ.condominiumId,
        unit_id: occ.unitId,
        title: occ.title,
        category: occ.category,
        priority: occ.priority,
        status: occ.status,
        description: occ.description
      });
      return jsonResponse(res, 201, inserted);
    }

    // ------------------------------------------------------------------------
    // Assembleias & Votações Virtuais (Polls & Quorum)
    // ------------------------------------------------------------------------
    if (pathname === '/api/polls' && method === 'GET') {
      const Polls = engine.getTable('polls');
      const PollVotes = engine.getTable('poll_votes');
      const Units = engine.getTable('units');

      const polls = Polls.findAll({}, { orderBy: 'created_at DESC' });
      const totalUnits = Units.count();

      const enriched = polls.map(p => {
        const votes = PollVotes.findAll({ poll_id: p.id });
        const quorumResult = QuorumCalculator.evaluateQuorum({
          quorumType: p.quorum_type,
          totalUnits,
          votes: votes.map(v => ({ selectedOption: v.selected_option }))
        });

        return {
          ...p,
          options: typeof p.options === 'string' ? JSON.parse(p.options) : p.options,
          total_votes: votes.length,
          quorum_result: quorumResult
        };
      });

      return jsonResponse(res, 200, enriched);
    }

    const voteMatch = pathname.match(/^\/api\/polls\/(\d+)\/vote$/);
    if (voteMatch && method === 'POST') {
      const pollId = Number(voteMatch[1]);
      const Polls = engine.getTable('polls');
      const PollVotes = engine.getTable('poll_votes');

      const pollRow = Polls.findById(pollId);
      if (!pollRow) return jsonResponse(res, 404, { error: 'Votação não encontrada' });

      const body = await parseJsonBody(req);
      const { unit_id, resident_id, selected_option } = body;

      // Unicidade de voto
      const existingVote = PollVotes.findOne({ poll_id: pollId, unit_id });
      if (existingVote) {
        return jsonResponse(res, 400, { error: `A unidade #${unit_id} já registrou seu voto nesta assembleia.` });
      }

      const insertedVote = PollVotes.insert({
        poll_id: pollId,
        unit_id,
        resident_id,
        selected_option,
        ip_address: req.socket.remoteAddress
      });

      return jsonResponse(res, 201, insertedVote);
    }

    // ------------------------------------------------------------------------
    // Financeiro & Balancete DRE
    // ------------------------------------------------------------------------
    if (pathname === '/api/financial' && method === 'GET') {
      const Financial = engine.getTable('financial_transactions');
      const Units = engine.getTable('units');

      const transactions = Financial.findAll({}, { orderBy: 'due_date DESC' });
      const totalUnits = Units.count() || 1;

      const summary = FinancialHealthService.calculateMonthlyBalance(transactions, totalUnits);

      return jsonResponse(res, 200, {
        transactions,
        summary
      });
    }

    // Rota não encontrada
    return jsonResponse(res, 404, { error: `Endpoint não encontrado: ${method} ${pathname}` });

  } catch (error) {
    console.error(`[Server Error] ${method} ${pathname}:`, error.message);
    return jsonResponse(res, 400, {
      error: error.message,
      name: error.name
    });
  }
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🚀 PratiCom ERP - Servidor de API SQLite + DDD Nativo Ativo`);
  console.log(`📡 URL Base: http://localhost:${PORT}`);
  console.log(`💾 Banco de Dados: ${dbPath}`);
  console.log(`================================================================`);
});
