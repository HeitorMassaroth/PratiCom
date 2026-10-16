// ============================================================================
// PratiCom ERP - DDD ValueObject (Objeto de Valor Base)
// Imutável, comparado por valor estrutural e não por identidade de referência
// ============================================================================

export class ValueObject {
  constructor(props) {
    this.props = Object.freeze({ ...props });
  }

  equals(vo) {
    if (vo === null || vo === undefined) return false;
    if (vo.constructor !== this.constructor) return false;
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
}
