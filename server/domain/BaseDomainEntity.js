/**
 * Classe base para todas as 10 Entidades de Domínio do ERP Praticom.
 * Implementa rotinas de validação, cópia defensiva e serialização compatível com DTOs e Express JSON.
 */
export class BaseDomainEntity {
  constructor(attributes = {}) {
    this._id = attributes.id !== undefined && attributes.id !== null ? Number(attributes.id) : null;
    this._createdAt = attributes.created_at || attributes.createdAt || new Date().toISOString();
  }

  get id() {
    return this._id;
  }

  set id(value) {
    this._id = value !== undefined && value !== null ? Number(value) : null;
  }

  get createdAt() {
    return this._createdAt;
  }

  /**
   * Método abstrato/hook de validação de invariantes de domínio.
   * Deve ser sobrescrito pelas subclasses concretas.
   */
  validate() {
    // Validação base
  }

  /**
   * Garante serialização fiel para compatibilidade total com express res.json() e DAOs.
   */
  toJSON() {
    const serialized = {};
    for (const key of Object.keys(this)) {
      const publicName = key.startsWith('_') ? key.substring(1) : key;
      // Converte camelCase interno para snake_case se for o padrão do banco
      const snakeName = publicName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      serialized[snakeName] = this[key];
    }
    return serialized;
  }

  /**
   * Retorna um plain object correspondente para consumo por DAOs.
   */
  toDTO() {
    return this.toJSON();
  }
}
