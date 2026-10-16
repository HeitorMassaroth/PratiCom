import { BaseEntity, DomainValidationError } from './BaseEntity.js';

// 1. Condomínio (Tenant Raiz)
export class Condominium extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.name = String(data.name || '').trim();
    this.cnpj = data.cnpj ? String(data.cnpj).trim() : null;
    this.address = data.address ? String(data.address).trim() : null;
    this.city = data.city ? String(data.city).trim() : null;
    this.state = data.state ? String(data.state).trim().toUpperCase() : null;
    this.phone = data.phone ? String(data.phone).trim() : null;
    this.status = data.status || 'ACTIVE';
  }

  validate() {
    if (!this.name || this.name.length < 3) {
      throw new DomainValidationError('Nome do condomínio deve ter no mínimo 3 caracteres.', 'name');
    }
    if (!['ACTIVE', 'INACTIVE'].includes(this.status)) {
      throw new DomainValidationError("Status do condomínio deve ser 'ACTIVE' ou 'INACTIVE'.", 'status');
    }
    return true;
  }
}

// 2. Bloco / Torre
export class Block extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.condominium_id = data.condominium_id ? Number(data.condominium_id) : null;
    this.name = String(data.name || '').trim();
    this.description = data.description ? String(data.description).trim() : null;
    this.status = data.status || 'ACTIVE';
  }

  validate() {
    if (!this.condominium_id || this.condominium_id <= 0) {
      throw new DomainValidationError('O condomínio vinculado ao bloco é obrigatório.', 'condominium_id');
    }
    if (!this.name || this.name.length < 1) {
      throw new DomainValidationError('O nome do bloco/torre é obrigatório.', 'name');
    }
    return true;
  }
}

// 3. Unidade (Apartamento/Casa)
export class Unit extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.block_id = data.block_id ? Number(data.block_id) : null;
    this.number = String(data.number || '').trim();
    this.floor = data.floor !== undefined && data.floor !== null ? Number(data.floor) : null;
    this.type = data.type || 'Residencial';
  }

  validate() {
    if (!this.block_id || this.block_id <= 0) {
      throw new DomainValidationError('O bloco é obrigatório para cadastrar uma unidade.', 'block_id');
    }
    if (!this.number) {
      throw new DomainValidationError('O número da unidade é obrigatório.', 'number');
    }
    return true;
  }
}

// 4. Morador / Pessoa
export class Resident extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.unit_id = data.unit_id ? Number(data.unit_id) : null;
    this.name = String(data.name || '').trim();
    this.email = data.email ? String(data.email).trim().toLowerCase() : null;
    this.phone = data.phone ? String(data.phone).trim() : null;
    this.cpf = data.cpf ? String(data.cpf).replace(/\D/g, '') : null;
    this.role = data.role || 'Proprietário';
    this.emergency_contact = data.emergency_contact ? String(data.emergency_contact).trim() : null;
  }

  validate() {
    if (!this.unit_id || this.unit_id <= 0) {
      throw new DomainValidationError('Unidade habitacional é obrigatória.', 'unit_id');
    }
    if (!this.name || this.name.length < 3) {
      throw new DomainValidationError('Nome do morador deve ter pelo menos 3 caracteres.', 'name');
    }
    if (!['Proprietário', 'Inquilino', 'Dependente'].includes(this.role)) {
      throw new DomainValidationError('Vínculo inválido (deve ser Proprietário, Inquilino ou Dependente).', 'role');
    }
    return true;
  }
}

// 5. Veículo
export class Vehicle extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.unit_id = data.unit_id ? Number(data.unit_id) : null;
    this.resident_id = data.resident_id ? Number(data.resident_id) : null;
    this.plate = String(data.plate || '').trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    this.model = String(data.model || '').trim();
    this.color = data.color ? String(data.color).trim() : null;
    this.type = data.type || 'Carro';
    this.parking_spot = data.parking_spot ? String(data.parking_spot).trim() : null;
  }

  validate() {
    if (!this.unit_id || this.unit_id <= 0) {
      throw new DomainValidationError('A unidade vinculada ao veículo é obrigatória.', 'unit_id');
    }
    if (!this.plate || this.plate.length !== 7) {
      throw new DomainValidationError('A placa do veículo deve conter exatamente 7 caracteres alfanuméricos.', 'plate');
    }
    if (!this.model) {
      throw new DomainValidationError('O modelo do veículo é obrigatório.', 'model');
    }
    return true;
  }
}

// 6. Encomenda (Portaria)
export class Delivery extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.unit_id = data.unit_id ? Number(data.unit_id) : null;
    this.resident_id = data.resident_id ? Number(data.resident_id) : null;
    this.courier = String(data.courier || '').trim();
    this.tracking_code = data.tracking_code ? String(data.tracking_code).trim() : null;
    this.description = data.description ? String(data.description).trim() : null;
    this.status = data.status || 'PENDING';
    this.pickup_code = data.pickup_code ? String(data.pickup_code).trim() : this.#generatePin();
    this.notes = data.notes ? String(data.notes).trim() : null;
    this.received_at = data.received_at || new Date().toISOString();
    this.picked_up_at = data.picked_up_at || null;
    this.picked_up_by = data.picked_up_by || null;
    this.cancelled_at = data.cancelled_at || null;
    this.cancellation_reason = data.cancellation_reason || null;
  }

  #generatePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  validate() {
    if (!this.unit_id || this.unit_id <= 0) {
      throw new DomainValidationError('Unidade de destino é obrigatória para registrar encomenda.', 'unit_id');
    }
    if (!this.courier) {
      throw new DomainValidationError('Transportadora/entregador é obrigatório.', 'courier');
    }
    if (!['PENDING', 'PICKED_UP', 'CANCELLED'].includes(this.status)) {
      throw new DomainValidationError('Status de encomenda inválido.', 'status');
    }
    return true;
  }

  confirmPickup(code, pickedUpBy) {
    if (this.status !== 'PENDING') {
      throw new DomainValidationError('Somente encomendas pendentes podem ser retiradas.');
    }
    if (code && String(code).trim() !== String(this.pickup_code).trim()) {
      throw new DomainValidationError('Código PIN de retirada incorreto.', 'pickup_code');
    }
    this.status = 'PICKED_UP';
    this.picked_up_at = new Date().toISOString();
    this.picked_up_by = pickedUpBy || 'Morador/Destinatário';
  }

  cancel(reason) {
    if (this.status !== 'PENDING') {
      throw new DomainValidationError('Somente encomendas pendentes podem ser canceladas.');
    }
    this.status = 'CANCELLED';
    this.cancelled_at = new Date().toISOString();
    this.cancellation_reason = reason || 'Cancelado pela portaria';
  }
}

// 7. Controle de Acesso / Portaria
export class AccessLog extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.destination_unit_id = data.destination_unit_id || data.unit_id ? Number(data.destination_unit_id || data.unit_id) : null;
    this.visitor_name = String(data.visitor_name || '').trim();
    this.document = String(data.document || '').trim();
    this.type = data.type || 'Visitante';
    this.status = data.status || 'IN_PROPERTY';
    this.company = data.company ? String(data.company).trim() : null;
    this.vehicle_plate = data.vehicle_plate ? String(data.vehicle_plate).trim().toUpperCase() : null;
    this.entered_at = data.entered_at || new Date().toISOString();
    this.exited_at = data.exited_at || null;
  }

  validate() {
    if (!this.visitor_name || this.visitor_name.length < 2) {
      throw new DomainValidationError('Nome do visitante/prestador é obrigatório.', 'visitor_name');
    }
    if (!this.document) {
      throw new DomainValidationError('Documento de identificação (RG/CPF) é obrigatório.', 'document');
    }
    if (!this.destination_unit_id || this.destination_unit_id <= 0) {
      throw new DomainValidationError('Unidade de destino é obrigatória.', 'destination_unit_id');
    }
    return true;
  }

  registerExit() {
    this.status = 'EXITED';
    this.exited_at = new Date().toISOString();
  }
}

// 8. Espaço Comum
export class Space extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.condominium_id = data.condominium_id ? Number(data.condominium_id) : null;
    this.name = String(data.name || '').trim();
    this.capacity = data.capacity ? Number(data.capacity) : 30;
    this.description = data.description ? String(data.description).trim() : null;
  }

  validate() {
    if (!this.condominium_id || this.condominium_id <= 0) {
      throw new DomainValidationError('Condomínio vinculado ao espaço é obrigatório.', 'condominium_id');
    }
    if (!this.name) {
      throw new DomainValidationError('Nome do espaço comum é obrigatório.', 'name');
    }
    return true;
  }
}

// 9. Reserva de Espaço
export class Reservation extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.space_id = data.space_id ? Number(data.space_id) : null;
    this.resident_id = data.resident_id ? Number(data.resident_id) : null;
    this.unit_id = data.unit_id ? Number(data.unit_id) : null;
    this.reservation_date = String(data.reservation_date || '').trim();
    this.start_time = String(data.start_time || '').trim();
    this.end_time = String(data.end_time || '').trim();
    this.status = data.status || 'CONFIRMED';
    this.notes = data.notes ? String(data.notes).trim() : null;
  }

  validate() {
    if (!this.space_id || !this.resident_id || !this.unit_id) {
      throw new DomainValidationError('Espaço, morador e unidade são obrigatórios para reservar.');
    }
    if (!this.reservation_date) {
      throw new DomainValidationError('Data da reserva é obrigatória.', 'reservation_date');
    }
    if (!this.start_time || !this.end_time) {
      throw new DomainValidationError('Horário inicial e final são obrigatórios.');
    }
    if (this.start_time >= this.end_time) {
      throw new DomainValidationError('O horário de início deve ser anterior ao horário de término.');
    }
    return true;
  }
}

// 10. Transação Financeira
export class FinancialTransaction extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.condominium_id = data.condominium_id ? Number(data.condominium_id) : null;
    this.unit_id = data.unit_id ? Number(data.unit_id) : null;
    this.type = String(data.type || '').toLowerCase().trim();
    this.category = String(data.category || '').trim();
    this.description = String(data.description || '').trim();
    this.amount = Number(data.amount);
    this.due_date = String(data.due_date || '').trim();
    this.status = data.status || 'PENDING';
    this.payment_date = data.payment_date || null;
  }

  validate() {
    if (!this.condominium_id || this.condominium_id <= 0) {
      throw new DomainValidationError('Condomínio vinculado é obrigatório.', 'condominium_id');
    }
    if (!['income', 'expense'].includes(this.type)) {
      throw new DomainValidationError("Tipo deve ser 'income' (receita) ou 'expense' (despesa).", 'type');
    }
    if (!this.description) {
      throw new DomainValidationError('Descrição do lançamento é obrigatória.', 'description');
    }
    if (!Number.isFinite(this.amount) || this.amount <= 0) {
      throw new DomainValidationError('O valor deve ser um número positivo maior que zero.', 'amount');
    }
    if (!this.due_date) {
      throw new DomainValidationError('Data de vencimento é obrigatória.', 'due_date');
    }
    return true;
  }

  markAsPaid() {
    this.status = 'PAID';
    this.payment_date = new Date().toISOString().split('T')[0];
  }
}

// 11. Mural de Comunicados
export class Announcement extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.condominium_id = data.condominium_id ? Number(data.condominium_id) : null;
    this.title = String(data.title || '').trim();
    this.content = String(data.content || '').trim();
    this.category = data.category || 'Geral';
    this.priority = String(data.priority || 'normal').toLowerCase();
    this.is_pinned = data.is_pinned ? 1 : 0;
  }

  validate() {
    if (!this.condominium_id || this.condominium_id <= 0) {
      throw new DomainValidationError('Condomínio vinculado ao comunicado é obrigatório.', 'condominium_id');
    }
    if (!this.title || this.title.length < 3) {
      throw new DomainValidationError('Título deve conter pelo menos 3 caracteres.', 'title');
    }
    if (!this.content) {
      throw new DomainValidationError('Conteúdo do comunicado é obrigatório.', 'content');
    }
    return true;
  }
}

// 12. Mercadinho Autônomo - Produto
export class MarketProduct extends BaseEntity {
  constructor(data = {}) {
    super(data);
    this.condominium_id = data.condominium_id ? Number(data.condominium_id) : null;
    this.name = String(data.name || '').trim();
    this.category = data.category || 'Geral';
    this.price = Number(data.price ?? data.sale_price ?? 0);
    this.stock_quantity = Number(data.stock_quantity ?? data.stock ?? 0);
    this.min_stock = Number(data.min_stock ?? 5);
    this.barcode = data.barcode ? String(data.barcode).trim() : null;
  }

  validate() {
    if (!this.condominium_id || this.condominium_id <= 0) {
      throw new DomainValidationError('Condomínio do produto é obrigatório.', 'condominium_id');
    }
    if (!this.name) {
      throw new DomainValidationError('Nome do produto é obrigatório.', 'name');
    }
    if (!Number.isFinite(this.price) || this.price < 0) {
      throw new DomainValidationError('Preço do produto deve ser positivo ou zero.', 'price');
    }
    if (this.stock_quantity < 0) {
      throw new DomainValidationError('Estoque do produto não pode ser negativo.', 'stock_quantity');
    }
    return true;
  }
}
