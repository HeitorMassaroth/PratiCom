export class BaseService {
  constructor(repository, ModelClass) {
    this.repo = repository;
    this.ModelClass = ModelClass;
  }

  getAll(filters = {}) {
    return this.repo.findAll(filters);
  }

  getById(id) {
    return this.repo.findById(id);
  }

  create(data, context = {}) {
    // 1. Injeta contexto multi-tenant se aplicável
    const payload = { ...data };
    if (context.condominiumId && !payload.condominium_id && this.repo.hasDirectTenant) {
      payload.condominium_id = Number(context.condominiumId);
    }

    // 2. Classificação e Validação Obrigatória DDD
    if (this.ModelClass) {
      const entity = new this.ModelClass(payload);
      entity.validate(); // Lança DomainValidationError caso viole regras
    }

    // 3. Persistência
    return this.repo.create(payload);
  }

  update(id, data, context = {}) {
    const existing = this.repo.findById(id);
    if (!existing) return null;

    const merged = { ...existing, ...data };

    // Validação Obrigatória DDD antes de persistir
    if (this.ModelClass) {
      const entity = new this.ModelClass(merged);
      entity.validate();
    }

    return this.repo.update(id, data);
  }

  delete(id) {
    return this.repo.delete(id);
  }
}
