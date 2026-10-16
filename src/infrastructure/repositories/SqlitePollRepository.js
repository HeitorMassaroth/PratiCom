// ============================================================================
// PratiCom ERP - Infrastructure Adapter: SqlitePollRepository
// Persistência do Agregado Poll e seus votos filhos no SQLite
// ============================================================================

import { Poll } from '../../domain/entities/Poll.js';
import { DomainEvents } from '../../domain/events/DomainEvents.js';

export class SqlitePollRepository {
  constructor(databaseEngine) {
    this.engine = databaseEngine;
    this.pollsTable = databaseEngine.getTable('polls');
    this.votesTable = databaseEngine.getTable('poll_votes');
  }

  _toDomain(pollRow, voteRows = []) {
    if (!pollRow) return null;
    const votes = voteRows.map(v => ({
      id: v.id,
      pollId: v.poll_id,
      unitId: v.unit_id,
      residentId: v.resident_id,
      selectedOption: v.selected_option,
      votedAt: v.voted_at,
      ipAddress: v.ip_address,
      signatureHash: v.signature_hash
    }));

    return new Poll(pollRow.id, {
      condominiumId: pollRow.condominium_id,
      title: pollRow.title,
      description: pollRow.description,
      category: pollRow.category,
      quorumType: pollRow.quorum_type,
      status: pollRow.status,
      options: pollRow.options,
      startDate: pollRow.start_date,
      endDate: pollRow.end_date,
      votes,
      createdAt: pollRow.created_at,
      updatedAt: pollRow.updated_at
    });
  }

  findById(id) {
    const pollRow = this.pollsTable.findById(id);
    if (!pollRow) return null;
    const voteRows = this.votesTable.findAll({ poll_id: id });
    return this._toDomain(pollRow, voteRows);
  }

  findAllByCondominium(condominiumId) {
    const pollRows = this.pollsTable.findAll({ condominium_id: condominiumId }, { orderBy: 'created_at DESC' });
    return pollRows.map(pr => {
      const voteRows = this.votesTable.findAll({ poll_id: pr.id });
      return this._toDomain(pr, voteRows);
    });
  }

  save(poll) {
    return this.engine.transaction(() => {
      let savedPollRow;
      const pollData = {
        condominium_id: poll.condominiumId,
        title: poll.title,
        description: poll.description,
        category: poll.category,
        quorum_type: poll.quorumType,
        status: poll.status,
        options: JSON.stringify(poll.options),
        start_date: poll.startDate,
        end_date: poll.endDate
      };

      if (poll.id) {
        savedPollRow = this.pollsTable.update(poll.id, pollData);
      } else {
        savedPollRow = this.pollsTable.insert(pollData);
      }

      // Persiste votos novos que ainda não foram salvos
      for (const vote of poll.votes) {
        const existingVote = this.votesTable.findOne({
          poll_id: savedPollRow.id,
          unit_id: vote.unitId
        });

        if (!existingVote) {
          this.votesTable.insert({
            poll_id: savedPollRow.id,
            unit_id: vote.unitId,
            resident_id: vote.residentId,
            selected_option: vote.selectedOption,
            ip_address: vote.ipAddress,
            signature_hash: vote.signatureHash
          });
        }
      }

      const voteRows = this.votesTable.findAll({ poll_id: savedPollRow.id });
      const savedEntity = this._toDomain(savedPollRow, voteRows);

      DomainEvents.dispatchEventsForAggregate(poll);

      return savedEntity;
    });
  }
}
