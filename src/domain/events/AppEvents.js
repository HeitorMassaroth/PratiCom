import { DomainEvent } from './DomainEvent.js';

export class DeliveryReceivedEvent extends DomainEvent {
  constructor(deliveryId, unitId, courier, pickupCode) {
    super(deliveryId);
    this.unitId = unitId;
    this.courier = courier;
    this.pickupCode = pickupCode;
  }
}

export class DeliveryPickedUpEvent extends DomainEvent {
  constructor(deliveryId, unitId, pickedUpBy) {
    super(deliveryId);
    this.unitId = unitId;
    this.pickedUpBy = pickedUpBy;
  }
}

export class ReservationConfirmedEvent extends DomainEvent {
  constructor(reservationId, spaceId, unitId, reservationDate, timeRange) {
    super(reservationId);
    this.spaceId = spaceId;
    this.unitId = unitId;
    this.reservationDate = reservationDate;
    this.timeRange = timeRange;
  }
}

export class OccurrenceReportedEvent extends DomainEvent {
  constructor(occurrenceId, condoId, unitId, priority, category) {
    super(occurrenceId);
    this.condoId = condoId;
    this.unitId = unitId;
    this.priority = priority;
    this.category = category;
  }
}

export class PollVoteCastEvent extends DomainEvent {
  constructor(pollId, unitId, selectedOption) {
    super(pollId);
    this.unitId = unitId;
    this.selectedOption = selectedOption;
  }
}
