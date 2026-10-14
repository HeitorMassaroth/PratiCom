import { BaseRepository } from './BaseRepository.js';
import { ResidentRepository } from './ResidentRepository.js';
import { DeliveryRepository } from './DeliveryRepository.js';
import { FinancialRepository } from './FinancialRepository.js';

/**
 * Padrão de Projeto: FACTORY METHOD (Fábrica de Repositórios)
 * RepositoryFactory centraliza a instanciação desacoplada dos repositórios do sistema.
 */
export class RepositoryFactory {
  static getRepository(entityName) {
    switch (entityName.toLowerCase()) {
      case 'resident':
      case 'residents':
        return new ResidentRepository();
      case 'delivery':
      case 'deliveries':
        return new DeliveryRepository();
      case 'financial':
      case 'financial_transactions':
        return new FinancialRepository();
      case 'condominium':
      case 'condominiums':
        return new BaseRepository('condominiums', { primaryKey: 'id', isTenantDirect: false });
      case 'block':
      case 'blocks':
        return new BaseRepository('blocks', { primaryKey: 'id', tenantColumn: 'condominium_id', isTenantDirect: true });
      case 'unit':
      case 'units':
        return new BaseRepository('units', { primaryKey: 'id', isTenantDirect: false });
      case 'vehicle':
      case 'vehicles':
        return new BaseRepository('vehicles', { primaryKey: 'id', isTenantDirect: false });
      case 'space':
      case 'spaces':
        return new BaseRepository('spaces', { primaryKey: 'id', tenantColumn: 'condominium_id', isTenantDirect: true });
      case 'reservation':
      case 'reservations':
        return new BaseRepository('reservations', { primaryKey: 'id', isTenantDirect: false });
      case 'announcement':
      case 'announcements':
        return new BaseRepository('announcements', { primaryKey: 'id', tenantColumn: 'condominium_id', isTenantDirect: true });
      case 'market_product':
      case 'market_products':
        return new BaseRepository('market_products', { primaryKey: 'id', tenantColumn: 'condominium_id', isTenantDirect: true });
      case 'access_log':
      case 'access_logs':
        return new BaseRepository('access_logs', { primaryKey: 'id', tenantColumn: 'condominium_id', isTenantDirect: true });
      default:
        return new BaseRepository(entityName);
    }
  }
}

export {
  BaseRepository,
  ResidentRepository,
  DeliveryRepository,
  FinancialRepository
};
