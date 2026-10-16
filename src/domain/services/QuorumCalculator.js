// ============================================================================
// PratiCom ERP - Domain Service: QuorumCalculator
// Regras jurídicas e estatutárias de deliberação em condomínios (Código Civil)
// ============================================================================

export class QuorumCalculator {
  /**
   * Avalia o resultado legal de uma votação/assembleia
   * @param {Object} params - { quorumType, totalUnits, votes: [{ selectedOption }] }
   */
  static evaluateQuorum({ quorumType, totalUnits, votes = [] }) {
    const totalVotes = votes.length;
    const turnoutPct = totalUnits > 0 ? (totalVotes / totalUnits) * 100 : 0;

    // Contabiliza votos por opção
    const counts = {};
    for (const v of votes) {
      counts[v.selectedOption] = (counts[v.selectedOption] || 0) + 1;
    }

    let requiredVotes = 0;
    let quorumReached = false;
    let description = '';

    switch (quorumType) {
      case 'SIMPLE_MAJORITY': // Maioria simples dos presentes/votantes
        requiredVotes = 1;
        quorumReached = totalVotes >= 1;
        description = 'Maioria simples dos condôminos votantes (art. 1.353 CC).';
        break;

      case 'TWO_THIRDS': // 2/3 de todas as unidades do condomínio
        requiredVotes = Math.ceil((totalUnits * 2) / 3);
        quorumReached = totalUnits > 0 && totalVotes >= requiredVotes;
        description = `Quórum qualificado de 2/3 de todos os condôminos (${requiredVotes} de ${totalUnits} unidades) para obras ou convenção (art. 1.341/1.351 CC).`;
        break;

      case 'UNANIMITY': // 100% de todas as unidades
        requiredVotes = totalUnits;
        quorumReached = totalUnits > 0 && totalVotes === totalUnits;
        description = `Unanimidade absoluta (${totalUnits} unidades) para mudança de destinação ou fachada (art. 1.351 CC).`;
        break;

      default:
        requiredVotes = 1;
        quorumReached = totalVotes >= 1;
        description = 'Regra padrão de apuração.';
    }

    // Identifica opção vencedora (se houver votos)
    let leadingOption = null;
    let maxVotes = -1;
    let isTie = false;

    for (const [option, count] of Object.entries(counts)) {
      if (count > maxVotes) {
        maxVotes = count;
        leadingOption = option;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    }

    const isApproved = quorumReached && !isTie && leadingOption && !leadingOption.toLowerCase().includes('rejeitar') && !leadingOption.toLowerCase().includes('desfavorável');

    return {
      quorumType,
      totalUnits,
      totalVotes,
      requiredVotes,
      turnoutPercentage: Number(turnoutPct.toFixed(1)),
      quorumReached,
      leadingOption: isTie ? 'EMPATE' : leadingOption,
      isApproved,
      legalDescription: description,
      breakdown: counts
    };
  }
}
