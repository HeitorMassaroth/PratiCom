// ============================================================================
// PratiCom ERP - Infrastructure Adapter: SqliteUnitRepository
// Persistência da entidade de domínio Unit e hidratação de seus moradores e veículos
// ============================================================================

import { Unit } from '../../domain/entities/Unit.js';
import { Resident } from '../../domain/entities/Resident.js';
import { Vehicle } from '../../domain/entities/Vehicle.js';
import { Pet } from '../../domain/entities/Pet.js';

export class SqliteUnitRepository {
  constructor(databaseEngine) {
    this.engine = databaseEngine;
    this.unitsTable = databaseEngine.getTable('units');
    this.residentsTable = databaseEngine.getTable('residents');
    this.vehiclesTable = databaseEngine.getTable('vehicles');
    this.petsTable = databaseEngine.getTable('pets');
  }

  _toDomain(unitRow, populateChildren = true) {
    if (!unitRow) return null;

    let residents = [];
    let vehicles = [];
    let pets = [];

    if (populateChildren) {
      const resRows = this.residentsTable.findAll({ unit_id: unitRow.id });
      residents = resRows.map(r => new Resident(r.id, {
        unitId: r.unit_id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        cpf: r.cpf,
        role: r.role,
        emergencyContact: r.emergency_contact
      }));

      const vehRows = this.vehiclesTable.findAll({ unit_id: unitRow.id });
      vehicles = vehRows.map(v => new Vehicle(v.id, {
        unitId: v.unit_id,
        residentId: v.resident_id,
        plate: v.plate,
        model: v.model,
        color: v.color,
        type: v.type,
        parkingSpot: v.parking_spot
      }));

      const petRows = this.petsTable.findAll({ unit_id: unitRow.id });
      pets = petRows.map(p => new Pet(p.id, {
        condominiumId: p.condominium_id,
        unitId: p.unit_id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        size: p.size,
        vaccineStatus: p.vaccine_status,
        vaccineDate: p.vaccine_date,
        notes: p.notes
      }));
    }

    return new Unit(unitRow.id, {
      blockId: unitRow.block_id,
      number: unitRow.number,
      floor: unitRow.floor,
      type: unitRow.type,
      residents,
      vehicles,
      pets,
      createdAt: unitRow.created_at,
      updatedAt: unitRow.updated_at
    });
  }

  findById(id) {
    const row = this.unitsTable.findById(id);
    return this._toDomain(row, true);
  }

  findAllByBlock(blockId) {
    const rows = this.unitsTable.findAll({ block_id: blockId }, { orderBy: 'number ASC' });
    return rows.map(r => this._toDomain(r, true));
  }

  save(unit) {
    const data = {
      block_id: unit.blockId,
      number: unit.number,
      floor: unit.floor,
      type: unit.type
    };

    let savedRow;
    if (unit.id) {
      savedRow = this.unitsTable.update(unit.id, data);
    } else {
      savedRow = this.unitsTable.insert(data);
    }

    return this._toDomain(savedRow, false);
  }
}
