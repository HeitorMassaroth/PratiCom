import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook reutilizável para operações CRUD padronizadas no frontend.
 * Centraliza estados de carregamento, tratamento de erros, listagem e mutações (create/update/delete/refresh),
 * evitando duplicação em telas de gerenciamento.
 *
 * @param {Object} options
 * @param {Function} options.fetchFn - Função assíncrona para buscar os registros
 * @param {Function} [options.createFn] - Função assíncrona para criar novo registro
 * @param {Function} [options.updateFn] - Função assíncrona para atualizar registro (id, data)
 * @param {Function} [options.deleteFn] - Função assíncrona para excluir registro (id)
 * @param {boolean} [options.autoLoad=true] - Se deve carregar dados automaticamente na montagem
 * @param {Array} [options.deps=[]] - Dependências reativas que disparam recarga (ex: filtro, condomínio)
 * @param {Function} [options.onSuccess] - Callback opcional após mutação bem-sucedida
 * @param {Function} [options.onError] - Callback opcional de erro
 */
export function useCrud({
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  autoLoad = true,
  deps = [],
  onSuccess,
  onError
} = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (...args) => {
    if (!fetchFn) return [];
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFn(...args);
      if (isMountedRef.current) {
        setItems(Array.isArray(data) ? data : (data?.data || []));
      }
      return data;
    } catch (err) {
      if (isMountedRef.current) {
        const msg = err.message || 'Erro ao carregar registros.';
        setError(msg);
        if (onError) onError(err);
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFn, onError]);

  useEffect(() => {
    if (autoLoad && fetchFn) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, ...deps]);

  const create = useCallback(async (data) => {
    if (!createFn) throw new Error('createFn não definida.');
    setSubmitting(true);
    setError(null);
    try {
      const result = await createFn(data);
      await load();
      if (onSuccess) onSuccess('created', result);
      return result;
    } catch (err) {
      const msg = err.message || 'Erro ao criar registro.';
      setError(msg);
      if (onError) onError(err);
      throw err;
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  }, [createFn, load, onSuccess, onError]);

  const update = useCallback(async (id, data) => {
    if (!updateFn) throw new Error('updateFn não definida.');
    setSubmitting(true);
    setError(null);
    try {
      const result = await updateFn(id, data);
      await load();
      if (onSuccess) onSuccess('updated', result);
      return result;
    } catch (err) {
      const msg = err.message || 'Erro ao atualizar registro.';
      setError(msg);
      if (onError) onError(err);
      throw err;
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  }, [updateFn, load, onSuccess, onError]);

  const remove = useCallback(async (id) => {
    if (!deleteFn) throw new Error('deleteFn não definida.');
    setSubmitting(true);
    setError(null);
    try {
      const result = await deleteFn(id);
      await load();
      if (onSuccess) onSuccess('deleted', result);
      return result;
    } catch (err) {
      const msg = err.message || 'Erro ao excluir registro.';
      setError(msg);
      if (onError) onError(err);
      throw err;
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  }, [deleteFn, load, onSuccess, onError]);

  return {
    items,
    setItems,
    loading,
    submitting,
    error,
    setError,
    load,
    refresh: load,
    create,
    update,
    remove
  };
}

export default useCrud;
