import { ResidentDAO } from './ResidentDAO.js';
import { DeliveryDAO } from './DeliveryDAO.js';
import { FinancialDAO } from './FinancialDAO.js';
import { AccessDAO, AnnouncementDAO } from './OperationsDAO.js';
import { ReservationDAO } from './ReservationDAO.js';
import { MarketDAO } from './MarketDAO.js';

/**
 * Padrão de Projeto: FACTORY METHOD (3/3)
 * DAOFactory encapsula a instanciação e criação das classes de Acesso a Dados (DAOs).
 */
export class DAOFactory {
  static getDAO(type) {
    switch (type.toLowerCase()) {
      case 'resident':
      case 'unit':
        return new ResidentDAO();
      case 'delivery':
        return new DeliveryDAO();
      case 'financial':
        return new FinancialDAO();
      case 'access':
        return new AccessDAO();
      case 'reservation':
        return new ReservationDAO();
      case 'market':
        return new MarketDAO();
      case 'announcement':
        return new AnnouncementDAO();
      default:
        throw new Error(`Tipo de DAO desconhecido: ${type}`);
    }
  }
}
