// ============================================================================
// PratiCom ERP - Infrastructure Adapter: SqliteFinancialRepository
// Persistência de transações financeiras com precisão em Money VO
// ============================================================================

import { FinancialTransaction } from '../../domain/entities/FinancialTransaction.js';
import { Money } from '../../domain/value-objects/Money.js';

export class SqliteFinancialRepository {
  constructor(databaseEngine) {
    this.table = databaseEngine.getTable('financial_transactions');
  }

  _toDomain(row) {
    if (!row) return null;
    return new FinancialTransaction(row.id, {
      condominiumId: row.condominium_id,
      unitId: row.unit_id,
      type: row.type,
      category: row.category,
      description: row.description,
      amount: Money.fromReais(Number(row.amount || 0)),
      dueDate: row.due_date,
      paymentDate: row.payment_date,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  findById(id) {
    const row = this.table.findById(id);
    return this._toDomain(row);
  }

  findAllByCondominium(condominiumId) {
    const rows = this.table.findAll({ condominium_id: condominiumId }, { orderBy: 'due_date DESC' });
    return rows.map(r => this._toDomain(r));
  }

  save(tx) {
    const data = {
      condominium_id: tx.condominiumId,
      unit_id: tx.unitId,
      type: tx.type,
      category: tx.category,
      description: tx.description,
      amount: tx.amountValue,
      due_date: tx.dueDate,
      payment_date: tx.paymentDate,
      status: tx.status
    };

    let savedRow;
    if (tx.id) {
      savedRow = this.table.update(tx.id, data);
    } else {
      savedRow = this.table.insert(data);
    }

    return this._toDomain(savedRow);
  }
}
