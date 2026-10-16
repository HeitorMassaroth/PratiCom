import { BaseService } from './BaseService.js';
import { BaseRepository } from '../database/BaseRepository.js';
import {
  Condominium,
  Block,
  Unit,
  Resident,
  Vehicle,
  Space,
  Announcement,
  Delivery,
  AccessLog,
  Reservation,
  FinancialTransaction,
  MarketProduct,
  DomainValidationError
} from '../models/index.js';
import db from '../config/database.js';

// ----------------------------------------------------
// 1. Serviço de Condomínios
// ----------------------------------------------------
export class CondominiumService extends BaseService {
  constructor() {
    super(new BaseRepository('condominiums', { hasDirectTenant: false }), Condominium);
  }

  getBlocks(condominiumId) {
    return db.prepare('SELECT * FROM blocks WHERE condominium_id = ? ORDER BY name ASC').all(condominiumId);
  }

  createBlock(condominiumId, blockData) {
    const block = new Block({ ...blockData, condominium_id: Number(condominiumId) });
    block.validate();
    const repo = new BaseRepository('blocks');
    return repo.create(block.toJSON());
  }
}

// ----------------------------------------------------
// 2. Serviço de Blocos / Torres
// ----------------------------------------------------
export class BlockService extends BaseService {
  constructor() {
    super(new BaseRepository('blocks'), Block);
  }

  getUnits(blockId) {
    return db.prepare('SELECT * FROM units WHERE block_id = ? ORDER BY number ASC').all(blockId);
  }
}

// ----------------------------------------------------
// 3. Serviço de Unidades Habitacionais
// ----------------------------------------------------
export class UnitService extends BaseService {
  constructor() {
    super(new BaseRepository('units', { hasDirectTenant: false }), Unit);
  }

  getAllForCondo(condominiumId) {
    return db.prepare(`
      SELECT u.*, b.name as block_name
      FROM units u
      JOIN blocks b ON u.block_id = b.id
      WHERE b.condominium_id = ?
      ORDER BY u.number ASC
    `).all(condominiumId);
  }
}

// ----------------------------------------------------
// 4. Serviço de Moradores
// ----------------------------------------------------
export class ResidentService extends BaseService {
  constructor() {
    super(new BaseRepository('residents', { hasDirectTenant: false }), Resident);
  }

  search(condominiumId, { unit_id, search } = {}) {
    let sql = `
      SELECT r.*, u.number as unit_number, b.name as block_name
      FROM residents r
      JOIN units u ON r.unit_id = u.id
      JOIN blocks b ON u.block_id = b.id
      WHERE b.condominium_id = ?
    `;
    const params = [condominiumId];

    if (unit_id) {
      sql += ' AND r.unit_id = ?';
      params.push(unit_id);
    }
    if (search) {
      sql += ' AND (r.name LIKE ? OR r.email LIKE ? OR r.cpf LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    sql += ' ORDER BY r.name ASC';
    return db.prepare(sql).all(...params);
  }
}

// ----------------------------------------------------
// 5. Serviço de Veículos
// ----------------------------------------------------
export class VehicleService extends BaseService {
  constructor() {
    super(new BaseRepository('vehicles', { hasDirectTenant: false }), Vehicle);
  }

  getAllForCondo(condominiumId) {
    return db.prepare(`
      SELECT v.*, u.number as unit_number, r.name as resident_name, b.name as block_name
      FROM vehicles v
      JOIN units u ON v.unit_id = u.id
      JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents r ON v.resident_id = r.id
      WHERE b.condominium_id = ?
      ORDER BY v.id DESC
    `).all(condominiumId);
  }
}

// ----------------------------------------------------
// 6. Serviço de Espaços Comuns
// ----------------------------------------------------
export class SpaceService extends BaseService {
  constructor() {
    super(new BaseRepository('spaces'), Space);
  }
}

// ----------------------------------------------------
// 7. Serviço de Mural de Comunicados
// ----------------------------------------------------
export class AnnouncementService extends BaseService {
  constructor() {
    super(new BaseRepository('announcements'), Announcement);
  }

  getRecentAndPinned(condominiumId) {
    return db.prepare(`
      SELECT * FROM announcements
      WHERE condominium_id = ?
      ORDER BY is_pinned DESC, id DESC
    `).all(condominiumId);
  }
}

// ----------------------------------------------------
// 8. Serviço Especializado de Encomendas
// ----------------------------------------------------
export class DeliveryService extends BaseService {
  constructor() {
    super(new BaseRepository('deliveries', { hasDirectTenant: false }), Delivery);
  }

  getAllWithUnits(condominiumId, status = null) {
    let sql = `
      SELECT d.*, u.number as unit_number, b.name as block_name, r.name as resident_name
      FROM deliveries d
      JOIN units u ON d.unit_id = u.id
      JOIN blocks b ON u.block_id = b.id
      LEFT JOIN residents r ON d.resident_id = r.id
      WHERE b.condominium_id = ?
    `;
    const params = [condominiumId];
    if (status) {
      sql += ' AND d.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY d.id DESC';
    return db.prepare(sql).all(...params);
  }

  pickup(id, pin, pickedUpBy) {
    const raw = this.getById(id);
    if (!raw) throw new DomainValidationError('Encomenda não encontrada.', 'id');

    const delivery = new Delivery(raw);
    delivery.confirmPickup(pin, pickedUpBy);

    return this.repo.update(id, {
      status: delivery.status,
      picked_up_at: delivery.picked_up_at,
      picked_up_by: delivery.picked_up_by
    });
  }

  cancel(id, reason) {
    const raw = this.getById(id);
    if (!raw) throw new DomainValidationError('Encomenda não encontrada.', 'id');

    const delivery = new Delivery(raw);
    delivery.cancel(reason);

    return this.repo.update(id, {
      status: delivery.status,
      cancelled_at: delivery.cancelled_at,
      cancellation_reason: delivery.cancellation_reason
    });
  }
}

// ----------------------------------------------------
// 9. Serviço Especializado de Portaria / Controle de Acesso
// ----------------------------------------------------
export class AccessService extends BaseService {
  constructor() {
    super(new BaseRepository('access_logs', { hasDirectTenant: false }), AccessLog);
  }

  getAllWithUnits(condominiumId, status = null, search = null) {
    let sql = `
      SELECT a.*, u.number as destination_unit, b.name as destination_block
      FROM access_logs a
      JOIN units u ON a.destination_unit_id = u.id
      JOIN blocks b ON u.block_id = b.id
      WHERE b.condominium_id = ?
    `;
    const params = [condominiumId];

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (a.visitor_name LIKE ? OR a.document LIKE ? OR a.vehicle_plate LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    sql += ' ORDER BY a.id DESC';
    return db.prepare(sql).all(...params);
  }

  registerExit(id) {
    const raw = this.getById(id);
    if (!raw) throw new DomainValidationError('Registro de acesso não encontrado.', 'id');

    const log = new AccessLog(raw);
    log.registerExit();

    return this.repo.update(id, {
      status: log.status,
      exited_at: log.exited_at
    });
  }
}

// ----------------------------------------------------
// 10. Serviço de Reservas com Bloqueio de Conflitos
// ----------------------------------------------------
export class ReservationService extends BaseService {
  constructor() {
    super(new BaseRepository('reservations', { hasDirectTenant: false }), Reservation);
  }

  getAllWithDetails(condominiumId, date = null, spaceId = null) {
    let sql = `
      SELECT r.*, s.name as space_name, res.name as resident_name, u.number as unit_number
      FROM reservations r
      JOIN spaces s ON r.space_id = s.id
      JOIN residents res ON r.resident_id = res.id
      JOIN units u ON r.unit_id = u.id
      WHERE s.condominium_id = ?
    `;
    const params = [condominiumId];

    if (date) {
      sql += ' AND r.reservation_date = ?';
      params.push(date);
    }
    if (spaceId) {
      sql += ' AND r.space_id = ?';
      params.push(spaceId);
    }
    sql += ' ORDER BY r.reservation_date DESC, r.start_time ASC';
    return db.prepare(sql).all(...params);
  }

  createWithConflictCheck(data) {
    const reservation = new Reservation(data);
    reservation.validate();

    // Verificação inegociável de sobreposição de horário no mesmo espaço
    const conflict = db.prepare(`
      SELECT id FROM reservations
      WHERE space_id = ?
        AND reservation_date = ?
        AND status = 'CONFIRMED'
        AND NOT (end_time <= ? OR start_time >= ?)
    `).get(reservation.space_id, reservation.reservation_date, reservation.start_time, reservation.end_time);

    if (conflict) {
      throw new DomainValidationError('Já existe uma reserva confirmada para este espaço no horário selecionado.');
    }

    return this.repo.create(data);
  }
}

// ----------------------------------------------------
// 11. Serviço Financeiro & Balancetes
// ----------------------------------------------------
export class FinancialService extends BaseService {
  constructor() {
    super(new BaseRepository('financial_transactions'), FinancialTransaction);
  }

  getSummary(condominiumId) {
    const txs = this.getAll({ condominium_id: condominiumId });

    let incomePaid = 0;
    let incomePending = 0;
    let expensePaid = 0;
    let expensePending = 0;

    for (const t of txs) {
      const val = Number(t.amount || 0);
      if (t.type === 'income') {
        if (t.status === 'PAID') incomePaid += val;
        else incomePending += val;
      } else if (t.type === 'expense') {
        if (t.status === 'PAID') expensePaid += val;
        else expensePending += val;
      }
    }

    const currentBalance = incomePaid - expensePaid;
    const totalIncome = incomePaid + incomePending;
    const defaultRate = totalIncome > 0 ? ((incomePending / totalIncome) * 100).toFixed(1) : 0;

    return {
      currentBalance,
      incomePaid,
      incomePending,
      expensePaid,
      expensePending,
      totalIncome,
      totalExpense: expensePaid + expensePending,
      defaultRate: Number(defaultRate)
    };
  }

  pay(id) {
    const raw = this.getById(id);
    if (!raw) throw new DomainValidationError('Lançamento não encontrado.', 'id');

    const tx = new FinancialTransaction(raw);
    tx.markAsPaid();

    return this.repo.update(id, {
      status: tx.status,
      payment_date: tx.payment_date
    });
  }
}

// ----------------------------------------------------
// 12. Serviço do Mercadinho Autônomo (PDV com Transações ACID)
// ----------------------------------------------------
export class MarketService extends BaseService {
  constructor() {
    super(new BaseRepository('market_products'), MarketProduct);
  }

  checkout(condominiumId, { unit_id, resident_id, payment_method, items }) {
    if (!items || items.length === 0) {
      throw new DomainValidationError('O carrinho de compras não pode estar vazio.');
    }

    const checkoutTx = db.transaction(() => {
      let total = 0;
      const verifiedItems = [];

      for (const item of items) {
        const prod = this.getById(item.product_id);
        if (!prod || prod.condominium_id !== Number(condominiumId)) {
          throw new DomainValidationError(`Produto #${item.product_id} não encontrado no condomínio.`);
        }
        if (prod.stock_quantity < item.quantity) {
          throw new DomainValidationError(`Estoque insuficiente para '${prod.name}'. Disponível: ${prod.stock_quantity}.`);
        }

        const subtotal = Number(prod.price) * Number(item.quantity);
        total += subtotal;
        verifiedItems.push({
          product_id: prod.id,
          quantity: item.quantity,
          unit_price: prod.price,
          subtotal
        });

        // Decrementa estoque
        db.prepare('UPDATE market_products SET stock_quantity = stock_quantity - ? WHERE id = ?')
          .run(item.quantity, prod.id);
      }

      // Cria venda
      const saleResult = db.prepare(`
        INSERT INTO market_sales (condominium_id, unit_id, resident_id, total_amount, payment_method)
        VALUES (?, ?, ?, ?, ?)
      `).run(condominiumId, unit_id || null, resident_id || null, total, payment_method || 'PIX');

      const saleId = saleResult.lastInsertRowid;

      // Cria itens da venda
      const insertItem = db.prepare(`
        INSERT INTO market_sale_items (sale_id, product_id, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const vi of verifiedItems) {
        insertItem.run(saleId, vi.product_id, vi.quantity, vi.unit_price, vi.subtotal);
      }

      return {
        sale_id: saleId,
        total_amount: total,
        payment_method: payment_method || 'PIX',
        items_count: verifiedItems.length,
        status: 'PAID'
      };
    });

    return checkoutTx();
  }
}

// ----------------------------------------------------
// 13. Serviço de Dashboard Consolidado
// ----------------------------------------------------
export class DashboardService {
  static getMetrics(condominiumId) {
    const pendingDeliveries = db.prepare(`
      SELECT COUNT(*) as count FROM deliveries d
      JOIN units u ON d.unit_id = u.id
      JOIN blocks b ON u.block_id = b.id
      WHERE b.condominium_id = ? AND d.status = 'PENDING'
    `).get(condominiumId)?.count || 0;

    const activeVisitors = db.prepare(`
      SELECT COUNT(*) as count FROM access_logs a
      JOIN units u ON a.destination_unit_id = u.id
      JOIN blocks b ON u.block_id = b.id
      WHERE b.condominium_id = ? AND a.status = 'IN_PROPERTY'
    `).get(condominiumId)?.count || 0;

    const today = new Date().toISOString().split('T')[0];
    const todayReservations = db.prepare(`
      SELECT COUNT(*) as count FROM reservations r
      JOIN spaces s ON r.space_id = s.id
      WHERE s.condominium_id = ? AND r.reservation_date = ? AND r.status = 'CONFIRMED'
    `).get(condominiumId, today)?.count || 0;

    const lowStock = db.prepare(`
      SELECT COUNT(*) as count FROM market_products
      WHERE condominium_id = ? AND stock_quantity <= min_stock
    `).get(condominiumId)?.count || 0;

    const fin = new FinancialService().getSummary(condominiumId);

    const urgentAnnouncements = db.prepare(`
      SELECT * FROM announcements
      WHERE condominium_id = ? AND (priority IN ('alta', 'urgente') OR is_pinned = 1)
      ORDER BY is_pinned DESC, id DESC
      LIMIT 5
    `).all(condominiumId);

    return {
      metrics: {
        pendingDeliveries,
        activeAccess: activeVisitors,
        activeVisitors,
        balance: fin.currentBalance,
        overdueAmount: fin.incomePending,
        defaultRate: fin.defaultRate,
        todayReservations,
        lowStockItems: lowStock
      },
      urgentAnnouncements
    };
  }
}
