// ============================================================================
// PratiCom ERP - Infrastructure Adapter: SqliteDeliveryRepository
// Implementa persistência da entidade de domínio Delivery no SQLite via DeliveriesTable
// ============================================================================

import { IDeliveryRepository } from '../../domain/repositories/IDeliveryRepository.js';
import { Delivery } from '../../domain/entities/Delivery.js';
import { PickupPIN } from '../../domain/value-objects/PickupPIN.js';
import { DomainEvents } from '../../domain/events/DomainEvents.js';

export class SqliteDeliveryRepository extends IDeliveryRepository {
  constructor(databaseEngine) {
    super();
    this.table = databaseEngine.getTable('deliveries');
  }

  _toDomain(row) {
    if (!row) return null;
    return new Delivery(row.id, {
      unitId: row.unit_id,
      residentId: row.resident_id,
      courier: row.courier,
      trackingCode: row.tracking_code,
      description: row.description,
      status: row.status,
      pin: new PickupPIN(row.pickup_code),
      receivedAt: row.received_at,
      pickedUpAt: row.picked_up_at,
      pickedUpBy: row.picked_up_by,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  _toPersistence(delivery) {
    return {
      unit_id: delivery.unitId,
      resident_id: delivery.residentId,
      courier: delivery.courier,
      tracking_code: delivery.trackingCode,
      description: delivery.description,
      status: delivery.status,
      pickup_code: delivery.pickupCode,
      received_at: delivery.receivedAt,
      picked_up_at: delivery.pickedUpAt,
      picked_up_by: delivery.pickedUpBy,
      notes: delivery.notes
    };
  }

  findById(id) {
    const row = this.table.findById(id);
    return this._toDomain(row);
  }

  findAllByUnit(unitId) {
    const rows = this.table.findAll({ unit_id: unitId }, { orderBy: 'received_at DESC' });
    return rows.map(r => this._toDomain(r));
  }

  findPendingDeliveries() {
    const rows = this.table.findAll({ status: 'PENDING' }, { orderBy: 'received_at DESC' });
    return rows.map(r => this._toDomain(r));
  }

  save(delivery) {
    const data = this._toPersistence(delivery);

    let savedRow;
    if (delivery.id) {
      savedRow = this.table.update(delivery.id, data);
    } else {
      savedRow = this.table.insert(data);
    }

    const savedEntity = this._toDomain(savedRow);

    // Dispara eventos de domínio gerados pela entidade
    DomainEvents.dispatchEventsForAggregate(delivery);

    return savedEntity;
  }

  delete(id) {
    return this.table.delete(id);
  }
}
