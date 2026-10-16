// ============================================================================
// PratiCom ERP - Domain Service: AccessControlService
// Valida permissão de entrada na portaria, destinação e duração de permanência
// ============================================================================

import { AccessLog } from '../entities/AccessLog.js';

export class AccessControlService {
  /**
   * Autoriza e registra o ingresso de um visitante/prestador na portaria
   */
  static authorizeEntry({ destinationUnit, visitorName, document, type = 'Visitante', company = null }) {
    if (!destinationUnit) {
      throw new Error('Unidade de destino inválida ou inexistente.');
    }

    if (!visitorName || visitorName.trim().length < 3) {
      throw new Error('Nome do visitante/prestador deve conter no mínimo 3 caracteres.');
    }

    const unitId = (destinationUnit && destinationUnit.id !== undefined && destinationUnit.id !== null)
      ? destinationUnit.id 
      : (destinationUnit?.destinationUnitId || destinationUnit?.number || 1);

    return AccessLog.recordEntry({
      destinationUnitId: unitId,
      visitorName: visitorName.trim(),
      document: document ? document.trim() : null,
      type,
      company: company ? company.trim() : null
    });
  }

  /**
   * Audita a lista de visitantes e identifica aqueles com tempo de permanência excessivo
   * @param {Array<AccessLog>} activeLogs - logs no status IN_PROPERTY
   * @param {number} maxStayMinutes - tolerância máxima (ex: 240 minutos = 4 horas)
   */
  static detectExcessiveStay(activeLogs = [], maxStayMinutes = 240) {
    const alerts = [];
    for (const log of activeLogs) {
      if (log.isInProperty) {
        const stayDuration = log.getStayDurationMinutes();
        if (stayDuration > maxStayMinutes) {
          alerts.push({
            logId: log.id,
            visitorName: log.visitorName,
            destinationUnitId: log.destinationUnitId,
            stayMinutes: stayDuration,
            warning: `Tempo de permanência excedido: ${stayDuration} minutos no condomínio (Limite: ${maxStayMinutes} min).`
          });
        }
      }
    }
    return alerts;
  }
}
