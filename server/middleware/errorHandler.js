/**
 * Middleware centralizado de tratamento de erros da API Praticom.
 * Unifica a resolução de status HTTP (400, 401, 403, 404, 409, 500)
 * preservando o contrato { error: message } esperado por todos os clientes e testes.
 */
export function resolveErrorStatus(err, req = null) {
  if (err.status && typeof err.status === 'number') return err.status;
  if (err.statusCode && typeof err.statusCode === 'number') return err.statusCode;

  const msg = err.message || '';

  // Regras contextuais de POST onde entidade referenciada não pertence ao condomínio (Bad Request)
  if (req && req.method === 'POST') {
    if (/unidade informada|não pertence|destinatário|referenciad/i.test(msg)) {
      return 400;
    }
  }

  // 404 - Não Encontrado
  if (/não encontrad|not found|inexistente/i.test(msg)) {
    return 404;
  }

  // 403 - Acesso Negado / Módulo Desativado / Feature Flag
  if (/acesso negado|desativado|proibido|forbidden|permissão/i.test(msg)) {
    return 403;
  }

  // 409 - Conflito de Unicidade, Agenda ou Dependência Relacional
  if (
    /UNIQUE constraint|já existe|conflito|duplicad|sobreposição|colisão|possui.*vinculad|possui.*encomendas|possui.*registrad|possui.*histórico|não é possível excluir|não podem ser editados|não podem ser excluídos|já retirada/i.test(msg)
  ) {
    return 409;
  }

  // 400 - Requisição Inválida / Regra de Validação de Negócio
  if (
    /obrigatório|inválid|incorret|deve ter|deve conter|deve ser|dados de entrada|não pertence|não é permitido|carrinho|unidade informada|valor do lançamento|tipo de lançamento|preencha|excluir/i.test(msg)
  ) {
    return 400;
  }

  return 500;
}

export function formatErrorMessage(err) {
  let message = err.message || 'Erro interno no servidor.';
  if (/UNIQUE constraint failed: blocks/i.test(message)) {
    message = 'Já existe um bloco com este nome neste condomínio.';
  } else if (/UNIQUE constraint failed: units/i.test(message)) {
    message = 'Já existe uma unidade com este número neste bloco.';
  }
  return message;
}

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = resolveErrorStatus(err, req);
  const message = formatErrorMessage(err);

  if (status >= 500) {
    console.error(`❌ [HTTP ${status}] Erro não tratado em ${req.method} ${req.originalUrl}:`, err);
  }

  return res.status(status).json({ error: message });
};

/**
 * Wrapper assíncrono para eliminar blocos try/catch repetitivos em rotas Express.
 * Captura exceções síncronas e rejeições de Promise e as encaminha para errorHandler via next(err).
 */
export const asyncHandler = (fn) => (req, res, next) => {
  try {
    const result = fn(req, res, next);
    if (result && typeof result.then === 'function') {
      result.catch(next);
    }
  } catch (err) {
    next(err);
  }
};
