import DatabaseSingleton from '../../config/DatabaseSingleton.js';
import { ReservationConflictValidator } from './BusinessValidatorTemplate.js';
import { DeliveryNotificationDispatcher } from './NotificationTemplate.js';

/**
 * Padrão de Projeto: TEMPLATE METHOD (Ciclo de Execução de Operações de Domínio)
 * AbstractEntityOperation padroniza o ciclo de vida completo de uma operação de mutação:
 * validate -> assertTenantScope -> executePersist -> triggerSideEffects -> return.
 */
export class AbstractEntityOperation {
  constructor() {
    this.db = DatabaseSingleton.getDb();
  }

  execute(input, context = {}) {
    this.validate(input, context);
    this.assertTenantScope(input, context);
    const result = this.executePersist(input, context);
    this.triggerSideEffects(result, input, context);
    return result;
  }

  validate(input, context) {
    if (!input || typeof input !== 'object') {
      throw new Error('Dados de entrada são obrigatórios.');
    }
  }

  assertTenantScope(input, context) {
    // Hook de segurança multi-tenant implementado quando aplicável
  }

  executePersist(input, context) {
    throw new Error('O método executePersist() deve ser implementado pela subclasse concreta.');
  }

  triggerSideEffects(result, input, context) {
    // Hook opcional para emissão de eventos/notificações
  }
}

/**
 * Subclasse concreta: Operação de Criação de Morador
 */
export class CreateResidentOperation extends AbstractEntityOperation {
  validate(input) {
    super.validate(input);
    if (!input.unit_id) throw new Error('Unidade é obrigatória.');
    if (!input.name?.trim()) throw new Error('Nome é obrigatório.');
  }

  executePersist(input) {
    const stmt = this.db.prepare(`
      INSERT INTO residents (unit_id, name, email, phone, cpf, role, emergency_contact)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      parseInt(input.unit_id, 10),
      input.name.trim(),
      input.email || null,
      input.phone || null,
      input.cpf || null,
      input.role || 'Proprietário',
      input.emergency_contact || null
    );

    const resident = this.db.prepare('SELECT * FROM residents WHERE id = ?').get(info.lastInsertRowid);
    const unit = this.db.prepare('SELECT block, number FROM units WHERE id = ?').get(resident.unit_id) || {};
    return { ...resident, block: unit.block || '', unit_number: unit.number || '' };
  }
}

/**
 * Subclasse concreta: Operação de Criação de Reserva de Área Comum
 */
export class CreateReservationOperation extends AbstractEntityOperation {
  constructor() {
    super();
    this.validator = new ReservationConflictValidator(this.db);
  }

  validate(input, context) {
    super.validate(input, context);
    this.validator.validate(input, context);
  }

  executePersist(input) {
    const space = this.db.prepare('SELECT * FROM spaces WHERE id = ?').get(parseInt(input.space_id, 10));
    if (!space) throw new Error('Espaço não encontrado.');

    const startHour = parseInt(input.start_time.split(':')[0], 10);
    const endHour = parseInt(input.end_time.split(':')[0], 10);
    const hours = Math.max(1, endHour - startHour);
    const totalPrice = (space.price_per_hour || 0) * hours;

    const stmt = this.db.prepare(`
      INSERT INTO reservations (space_id, unit_id, resident_id, reservation_date, start_time, end_time, guests_count, notes, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')
    `);

    const info = stmt.run(
      parseInt(input.space_id, 10),
      parseInt(input.unit_id, 10),
      parseInt(input.resident_id, 10),
      input.reservation_date,
      input.start_time,
      input.end_time,
      parseInt(input.guests_count, 10) || 0,
      input.notes?.trim() || null,
      totalPrice
    );

    return this.db.prepare(`
      SELECT r.*, s.name as space_name, u.block, u.number as unit_number, res.name as resident_name
      FROM reservations r
      LEFT JOIN spaces s ON r.space_id = s.id
      LEFT JOIN units u ON r.unit_id = u.id
      LEFT JOIN residents res ON r.resident_id = res.id
      WHERE r.id = ?
    `).get(info.lastInsertRowid);
  }
}

/**
 * Subclasse concreta: Operação de Criação e Despacho de Encomenda na Portaria
 */
export class CreateDeliveryOperation extends AbstractEntityOperation {
  constructor() {
    super();
    this.notifier = new DeliveryNotificationDispatcher();
  }

  validate(input, context = {}) {
    super.validate(input, context);
    const unitId = parseInt(input.unit_id, 10);
    if (!unitId) throw new Error('Unidade é obrigatória.');
    if (!input.courier?.trim()) throw new Error('Transportadora/Entregador é obrigatório.');

    const residentId = input.resident_id ? parseInt(input.resident_id, 10) : null;
    const condoId = context.condominiumId ? parseInt(context.condominiumId, 10) : null;

    let scopeSql = '';
    const scopeParams = [];
    if (condoId) {
      if (condoId === 1) {
        scopeSql = ' AND (b.condominium_id = 1 OR u.block_id IS NULL)';
      } else {
        scopeSql = ' AND b.condominium_id = ?';
        scopeParams.push(condoId);
      }
    }

    const unit = this.db.prepare(`
      SELECT u.id FROM units u
      LEFT JOIN blocks b ON u.block_id = b.id
      WHERE u.id = ?${scopeSql}
    `).get(unitId, ...scopeParams);
    if (!unit) {
      throw new Error('Unidade não encontrada neste condomínio.');
    }

    if (residentId) {
      const resident = this.db.prepare('SELECT id FROM residents WHERE id = ? AND unit_id = ?').get(residentId, unitId);
      if (!resident) {
        throw new Error('O morador informado não pertence à unidade selecionada.');
      }
    }
  }

  executePersist(input) {
    const unitId = parseInt(input.unit_id, 10);
    const residentId = input.resident_id ? parseInt(input.resident_id, 10) : null;
    const pickupCode = input.pickup_code || String(Math.floor(1000 + Math.random() * 9000));
    const stmt = this.db.prepare(`
      INSERT INTO deliveries (unit_id, resident_id, courier, tracking_code, description, status, pickup_code, notes, received_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)
    `);

    const info = stmt.run(
      unitId,
      residentId,
      input.courier.trim(),
      input.tracking_code || null,
      input.description || '',
      pickupCode,
      input.notes || ''
    );

    const delivery = this.db.prepare(`
      SELECT d.*, u.block, u.number as unit_number, r.name as resident_name, r.phone as resident_phone, r.email as resident_email
      FROM deliveries d
      LEFT JOIN units u ON d.unit_id = u.id
      LEFT JOIN residents r ON d.resident_id = r.id
      WHERE d.id = ?
    `).get(info.lastInsertRowid);

    return delivery;
  }

  triggerSideEffects(delivery) {
    if (delivery.resident_id) {
      this.notifier.sendNotification({
        name: delivery.resident_name || 'Morador',
        phone: delivery.resident_phone,
        email: delivery.resident_email
      }, delivery);
    }
  }
}
