// ============================================================================
// PratiCom ERP - DDD Repository Port: IDeliveryRepository
// Define os contratos de persistência sem dependência de tecnologia de banco
// ============================================================================

export class IDeliveryRepository {
  async findById(id) { throw new Error('Método não implementado'); }
  async findAllByUnit(unitId) { throw new Error('Método não implementado'); }
  async findPendingDeliveries() { throw new Error('Método não implementado'); }
  async save(deliveryEntity) { throw new Error('Método não implementado'); }
  async delete(id) { throw new Error('Método não implementado'); }
}
