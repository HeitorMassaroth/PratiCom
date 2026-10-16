export class DomainValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'DomainValidationError';
    this.field = field;
    this.status = 400;
  }
}

export class BaseEntity {
  constructor(data = {}) {
    this.id = data.id !== undefined && data.id !== null ? Number(data.id) : undefined;
    this.created_at = data.created_at || new Date().toISOString();
  }

  /**
   * Validação estrita de invariantes de negócio DDD.
   * Deve ser sobrescrita pelas entidades filhas.
   */
  validate() {
    return true;
  }

  toJSON() {
    return { ...this };
  }

  static fromRow(row) {
    if (!row) return null;
    return new this(row);
  }
}
