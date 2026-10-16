export function errorHandler(err, req, res, next) {
  // 1. Erro de Validação de Domínio DDD
  if (err.name === 'DomainValidationError' || err.status === 400) {
    return res.status(400).json({
      error: err.message,
      field: err.field || null,
      type: 'DomainValidationError'
    });
  }

  // 2. Erros de Integridade Relacional do SQLite
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || (err.message && err.message.includes('UNIQUE constraint failed'))) {
    return res.status(409).json({
      error: 'Já existe um registro cadastrado com estes mesmos dados identificadores.',
      details: err.message,
      type: 'UniqueConstraintViolation'
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || (err.message && err.message.includes('FOREIGN KEY constraint failed'))) {
    return res.status(400).json({
      error: 'Operação não permitida: registro vinculado ou chave estrangeira inexistente.',
      details: err.message,
      type: 'ForeignKeyViolation'
    });
  }

  console.error('💥 Erro interno no servidor:', err);
  res.status(500).json({
    error: 'Ocorreu um erro interno no processamento da solicitação.',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}
