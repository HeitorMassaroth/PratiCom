/**
 * Utilitários consolidados de validação defensiva para o backend Praticom.
 * FASE REF01-F: Consolidação de validações sem dependências externas adicionais.
 */

export function isEmpty(val) {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string' && val.trim().length === 0) return true;
  return false;
}

export function validateRequired(payload, fieldNames) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Corpo da requisição inválido ou ausente.');
  }
  for (const field of fieldNames) {
    if (isEmpty(payload[field])) {
      throw new Error(`O campo '${field}' é obrigatório.`);
    }
  }
}

export function validatePositiveNumber(value, fieldName = 'Valor') {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error(`${fieldName} deve ser um número positivo válido.`);
  }
  return num;
}

export function validateIsoDate(dateStr, fieldName = 'Data') {
  if (isEmpty(dateStr) || !/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr).trim())) {
    throw new Error(`${fieldName} deve estar no formato AAAA-MM-DD.`);
  }
  return String(dateStr).trim();
}
