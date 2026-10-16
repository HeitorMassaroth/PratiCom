// ============================================================================
// PratiCom ERP - Domain-Driven Design (DDD) Root Index Completo
// Exporta todos os 23 Agregados/Entidades, 10 Value Objects e 6 Serviços de Domínio
// ============================================================================

// Base DDD
export { Entity } from './common/Entity.js';
export { ValueObject } from './common/ValueObject.js';
export { Result } from './common/Result.js';

// Value Objects (10 Objetos de Valor Imutáveis)
export { 
  CPF, 
  CNPJ, 
  LicensePlate, 
  Money, 
  PickupPIN, 
  TimeRange,
  Email,
  Phone,
  Barcode,
  PostalCode
} from './value-objects/index.js';

// Entities & Aggregate Roots (23 Entidades DDD)
export { 
  Condominium, 
  CondominiumModule,
  CondoSetting,
  Block,
  Unit,
  Resident, 
  User,
  Vehicle, 
  Pet, 
  Delivery, 
  AccessLog,
  Space,
  Reservation, 
  Occurrence, 
  Poll, 
  PollVote,
  FinancialTransaction,
  Announcement,
  MarketProduct,
  MarketSale,
  MarketSaleItem,
  AuditLog,
  SchemaMigration
} from './entities/index.js';

// Domain Events
export { DomainEvent } from './events/DomainEvent.js';
export { DomainEvents } from './events/DomainEvents.js';
export {
  DeliveryReceivedEvent,
  DeliveryPickedUpEvent,
  ReservationConfirmedEvent,
  OccurrenceReportedEvent,
  PollVoteCastEvent
} from './events/AppEvents.js';

// Domain Services (6 Serviços de Domínio)
export { 
  ReservationConflictDetector, 
  QuorumCalculator, 
  FinancialHealthService,
  MarketCheckoutService,
  AccessControlService,
  FinancialBillingService
} from './services/index.js';
