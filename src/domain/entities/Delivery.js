// ============================================================================
// PratiCom ERP - DDD Aggregate Root: Delivery (Encomenda na Portaria)
// Controla ciclo de vida seguro com verificação de PIN de 4 dígitos
// ============================================================================

import { Entity } from '../common/Entity.js';
import { PickupPIN } from '../value-objects/PickupPIN.js';
import { DeliveryReceivedEvent, DeliveryPickedUpEvent } from '../events/AppEvents.js';

export class Delivery extends Entity {
  constructor(id, props) {
    super(id, props);

    this._unitId = props.unitId;
    this._residentId = props.residentId || null;
    this._courier = props.courier;
    this._trackingCode = props.trackingCode || null;
    this._description = props.description;
    this._status = props.status || 'PENDING';
    this._pin = props.pin instanceof PickupPIN ? props.pin : new PickupPIN(props.pickupCode || props.pin || '1234');
    this._receivedAt = props.receivedAt || new Date().toISOString();
    this._pickedUpAt = props.pickedUpAt || null;
    this._pickedUpBy = props.pickedUpBy || null;
    this._notes = props.notes || null;
  }

  get unitId() { return this._unitId; }
  get residentId() { return this._residentId; }
  get courier() { return this._courier; }
  get trackingCode() { return this._trackingCode; }
  get description() { return this._description; }
  get status() { return this._status; }
  get pin() { return this._pin; }
  get pickupCode() { return this._pin.value; }
  get receivedAt() { return this._receivedAt; }
  get pickedUpAt() { return this._pickedUpAt; }
  get pickedUpBy() { return this._pickedUpBy; }
  get notes() { return this._notes; }

  static create(props) {
    if (!props.unitId) throw new Error('A encomenda deve estar vinculada a uma unidade residencial.');
    if (!props.courier) throw new Error('A transportadora/entregador é obrigatório.');
    if (!props.description) throw new Error('A descrição do pacote é obrigatória.');

    const pin = props.pickupCode ? new PickupPIN(props.pickupCode) : PickupPIN.generate();

    const delivery = new Delivery(props.id || null, {
      ...props,
      pin,
      status: 'PENDING',
      receivedAt: props.receivedAt || new Date().toISOString()
    });

    delivery.addDomainEvent(new DeliveryReceivedEvent(
      delivery.id,
      delivery.unitId,
      delivery.courier,
      delivery.pickupCode
    ));

    return delivery;
  }

  /**
   * Baixa da encomenda com validação do PIN de segurança
   */
  markAsPickedUp(pickerName, enteredPin, options = { requirePin: true }) {
    if (this._status !== 'PENDING') {
      throw new Error(`Esta encomenda não pode ser retirada pois seu status é '${this._status}'.`);
    }

    if (!pickerName || typeof pickerName !== 'string' || pickerName.trim().length === 0) {
      throw new Error('O nome do retirante é obrigatório para auditoria na portaria.');
    }

    if (options.requirePin) {
      if (!this._pin.matches(enteredPin)) {
        throw new Error(`PIN incorreto: '${enteredPin}'. A retirada da encomenda foi bloqueada por segurança.`);
      }
    }

    this._status = 'PICKED_UP';
    this._pickedUpAt = new Date().toISOString();
    this._pickedUpBy = pickerName.trim();
    this.markModified();

    this.addDomainEvent(new DeliveryPickedUpEvent(
      this.id,
      this._unitId,
      this._pickedUpBy
    ));

    return this;
  }

  cancel(reason) {
    if (this._status === 'PICKED_UP') {
      throw new Error('Não é possível cancelar uma encomenda que já foi retirada.');
    }
    this._status = 'CANCELLED';
    this._notes = (this._notes ? `${this._notes} | ` : '') + `Cancelado: ${reason}`;
    this.markModified();
    return this;
  }
}
