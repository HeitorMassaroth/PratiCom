// ============================================================================
// PratiCom ERP - Domain Service: ReservationConflictDetector
// Garante o princípio de invariante de negócio: duas unidades não podem reservar
// a mesma área comum no mesmo intervalo de horário
// ============================================================================

import { TimeRange } from '../value-objects/TimeRange.js';

export class ReservationConflictDetector {
  /**
   * Verifica se a nova reserva proposta colide com alguma reserva existente
   * @param {Object} candidate - { spaceId, reservationDate, startTime, endTime }
   * @param {Array} existingReservations - lista de reservas existentes
   * @returns {Object} { hasConflict: boolean, conflictingReservation: Object | null }
   */
  static detectConflict(candidate, existingReservations = []) {
    const candidateRange = candidate.timeRange instanceof TimeRange 
      ? candidate.timeRange 
      : new TimeRange(candidate.startTime, candidate.endTime);

    for (const existing of existingReservations) {
      // Ignora canceladas ou rejeitadas
      if (existing.status === 'CANCELLED' || existing.status === 'REJECTED') {
        continue;
      }

      // Se for a mesma reserva (durante um update), ignora
      if (candidate.id && existing.id && Number(candidate.id) === Number(existing.id)) {
        continue;
      }

      // Deve ser o mesmo espaço e a mesma data
      if (
        Number(existing.spaceId || existing.space_id) === Number(candidate.spaceId || candidate.space_id) &&
        (existing.reservationDate || existing.reservation_date) === (candidate.reservationDate || candidate.reservation_date)
      ) {
        const existingRange = existing.timeRange instanceof TimeRange 
          ? existing.timeRange 
          : new TimeRange(existing.startTime || existing.start_time, existing.endTime || existing.end_time);

        if (candidateRange.overlaps(existingRange)) {
          return {
            hasConflict: true,
            conflictingReservation: existing,
            message: `Conflito de horário detectado: O espaço já está reservado das ${existingRange.startTime} às ${existingRange.endTime}.`
          };
        }
      }
    }

    return {
      hasConflict: false,
      conflictingReservation: null,
      message: 'Nenhum conflito encontrado. Horário disponível.'
    };
  }
}
