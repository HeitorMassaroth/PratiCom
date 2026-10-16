// ============================================================================
// PratiCom ERP - DDD Result Monad (Operações Funcionais e Tratamento Seguro)
// Permite que métodos de domínio retornem sucesso ou falha explícitos
// ============================================================================

export class Result {
  constructor(isSuccess, error, value) {
    if (isSuccess && error) {
      throw new Error('InvalidOperation: Um resultado não pode ser bem-sucedido e conter erro simultaneamente.');
    }
    if (!isSuccess && !error) {
      throw new Error('InvalidOperation: Um resultado que falhou deve fornecer uma mensagem de erro.');
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;
    Object.freeze(this);
  }

  getValue() {
    if (!this.isSuccess) {
      throw new Error(`Não é possível obter valor de um resultado com falha: ${this.error}`);
    }
    return this._value;
  }

  static ok(value) {
    return new Result(true, null, value);
  }

  static fail(error) {
    return new Result(false, error, null);
  }

  static combine(results = []) {
    for (const res of results) {
      if (res.isFailure) return res;
    }
    return Result.ok();
  }
}
