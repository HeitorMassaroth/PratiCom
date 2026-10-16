// ============================================================================
// PratiCom ERP - Value Object: TimeRange (Intervalo de Horário)
// Utilizado para agendamentos de áreas comuns e controle de sobreposição (Overlap)
// ============================================================================

import { ValueObject } from '../common/ValueObject.js';

export class TimeRange extends ValueObject {
  constructor(startTime, endTime) {
    if (!TimeRange.isValidTimeFormat(startTime) || !TimeRange.isValidTimeFormat(endTime)) {
      throw new Error(`Formato de hora inválido. Esperado 'HH:mm'. Recebido: start='${startTime}', end='${endTime}'`);
    }

    const startMinutes = TimeRange.toMinutes(startTime);
    const endMinutes = TimeRange.toMinutes(endTime);

    if (endMinutes <= startMinutes) {
      throw new Error(`Horário de término (${endTime}) deve ser posterior ao de início (${startTime}).`);
    }

    super({
      startTime,
      endTime,
      startMinutes,
      endMinutes,
      durationMinutes: endMinutes - startMinutes
    });
  }

  get startTime() {
    return this.props.startTime;
  }

  get endTime() {
    return this.props.endTime;
  }

  get startMinutes() {
    return this.props.startMinutes;
  }

  get endMinutes() {
    return this.props.endMinutes;
  }

  get durationMinutes() {
    return this.props.durationMinutes;
  }

  static isValidTimeFormat(time) {
    if (typeof time !== 'string') return false;
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time.trim());
  }

  static toMinutes(time) {
    const [h, m] = time.trim().split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Verifica se este intervalo colide/sobrepõe com outro intervalo de horário
   */
  overlaps(otherTimeRange) {
    if (!(otherTimeRange instanceof TimeRange)) {
      throw new Error('Parâmetro deve ser uma instância de TimeRange');
    }
    return (
      this.startMinutes < otherTimeRange.endMinutes &&
      this.endMinutes > otherTimeRange.startMinutes
    );
  }

  toString() {
    return `${this.startTime} às ${this.endTime} (${this.durationMinutes} min)`;
  }
}
