import { ResidentDAO } from './ResidentDAO.js';
import { DeliveryDAO } from './DeliveryDAO.js';
import { FinancialDAO } from './FinancialDAO.js';
import { AccessDAO, AnnouncementDAO } from './OperationsDAO.js';
import { ReservationDAO } from './ReservationDAO.js';
import { MarketDAO } from './MarketDAO.js';
import { CondominiumDAO } from './CondominiumDAO.js';

/**
 * Padrão de Projeto: FACTORY METHOD (GoF Canônico)
 * 1. Creator Abstrato de Acesso a Dados:
 */
export class DAOCreator {
  /**
   * Factory Method abstrato que deve ser sobrescrito pelas subclasses criadoras.
   */
  createDAO() {
    throw new Error('O Factory Method createDAO() deve ser implementado pela subclasse.');
  }
}

/**
 * 2. Criadores Concretos (Concrete Creators):
 */
export class ResidentDAOCreator extends DAOCreator {
  createDAO() { return new ResidentDAO(); }
}

export class DeliveryDAOCreator extends DAOCreator {
  createDAO() { return new DeliveryDAO(); }
}

export class FinancialDAOCreator extends DAOCreator {
  createDAO() { return new FinancialDAO(); }
}

export class AccessDAOCreator extends DAOCreator {
  createDAO() { return new AccessDAO(); }
}

export class ReservationDAOCreator extends DAOCreator {
  createDAO() { return new ReservationDAO(); }
}

export class MarketDAOCreator extends DAOCreator {
  createDAO() { return new MarketDAO(); }
}

export class AnnouncementDAOCreator extends DAOCreator {
  createDAO() { return new AnnouncementDAO(); }
}

export class CondominiumDAOCreator extends DAOCreator {
  createDAO() { return new CondominiumDAO(); }
}

/**
 * 3. Ponto Central de Seleção de DAOs
 */
export class DAOFactory {
  static getCreator(type) {
    switch (type.toLowerCase()) {
      case 'resident':
      case 'unit':
        return new ResidentDAOCreator();
      case 'delivery':
        return new DeliveryDAOCreator();
      case 'financial':
        return new FinancialDAOCreator();
      case 'access':
        return new AccessDAOCreator();
      case 'reservation':
        return new ReservationDAOCreator();
      case 'market':
        return new MarketDAOCreator();
      case 'announcement':
        return new AnnouncementDAOCreator();
      case 'condominium':
      case 'block':
        return new CondominiumDAOCreator();
      default:
        throw new Error(`Tipo de DAO desconhecido: ${type}`);
    }
  }

  static getDAO(type) {
    return DAOFactory.getCreator(type).createDAO();
  }
}
