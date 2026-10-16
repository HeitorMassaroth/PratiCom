import { BaseTable, DomainValidationError } from '../core/BaseTable.js';

export class PetsTable extends BaseTable {
  static tableName = 'pets';

  static columns = {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    condominium_id: { type: 'INTEGER', notNull: true, foreignKey: { table: 'condominiums', column: 'id', onDelete: 'CASCADE' } },
    unit_id: { type: 'INTEGER', notNull: true, foreignKey: { table: 'units', column: 'id', onDelete: 'CASCADE' } },
    name: { type: 'TEXT', notNull: true },
    species: { type: 'TEXT', notNull: true, defaultValue: 'Cão', check: "species IN ('Cão', 'Gato', 'Ave', 'Outro')" },
    breed: { type: 'TEXT' },
    size: { type: 'TEXT', notNull: true, defaultValue: 'Médio', check: "size IN ('Pequeno', 'Médio', 'Grande')" },
    vaccine_status: { type: 'TEXT', notNull: true, defaultValue: 'VACCINATED', check: "vaccine_status IN ('VACCINATED', 'PENDING')" },
    vaccine_date: { type: 'TEXT' },
    notes: { type: 'TEXT' },
    created_at: { type: 'DATETIME', notNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'DATETIME' }
  };

  static indexes = [
    { name: 'idx_pets_condo', columns: ['condominium_id'] },
    { name: 'idx_pets_unit', columns: ['unit_id'] },
    { name: 'idx_pets_vaccine', columns: ['vaccine_status'] }
  ];

  static validate(data, isUpdate = false) {
    super.validate(data, isUpdate);

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length < 2) {
        throw new DomainValidationError('name', 'Nome do pet deve conter no mínimo 2 caracteres', this.tableName);
      }
    }

    if (data.species !== undefined && !['Cão', 'Gato', 'Ave', 'Outro'].includes(data.species)) {
      throw new DomainValidationError('species', "Espécie deve ser 'Cão', 'Gato', 'Ave' ou 'Outro'", this.tableName);
    }

    if (data.size !== undefined && !['Pequeno', 'Médio', 'Grande'].includes(data.size)) {
      throw new DomainValidationError('size', "Porte deve ser 'Pequeno', 'Médio' ou 'Grande'", this.tableName);
    }

    if (data.vaccine_status !== undefined && !['VACCINATED', 'PENDING'].includes(data.vaccine_status)) {
      throw new DomainValidationError('vaccine_status', "Status da vacina deve ser 'VACCINATED' ou 'PENDING'", this.tableName);
    }

    return true;
  }

  static beforeInsert(data) {
    const clean = super.beforeInsert(data);
    if (clean.name) clean.name = clean.name.trim();
    if (clean.breed) clean.breed = clean.breed.trim();
    return clean;
  }
}
