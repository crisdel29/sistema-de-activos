// src/hooks/useActivos.js
import { useState, useEffect } from 'react';
import { ActivosService } from '@/services/api';

export const useActivos = () => {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    const fetchActivos = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ActivosService.getAll();
        setActivos(data);
      } catch (err) {
        setError(err.message || 'Error al cargar los activos');
        console.error('Error cargando activos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivos();
  }, [refreshKey]);

  const createActivo = async (formData) => {
    try {
      setLoading(true);
      await ActivosService.create(formData);
      refreshData();
      return { success: true };
    } catch (err) {
      setError(err.message || 'Error al crear el activo');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateActivo = async (id, formData) => {
    try {
      setLoading(true);
      await ActivosService.update(id, formData);
      refreshData();
      return { success: true };
    } catch (err) {
      setError(err.message || 'Error al actualizar el activo');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteActivo = async (id) => {
    try {
      setLoading(true);
      await ActivosService.delete(id);
      refreshData();
      return { success: true };
    } catch (err) {
      setError(err.message || 'Error al eliminar el activo');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    activos,
    loading,
    error,
    refreshData,
    createActivo,
    updateActivo,
    deleteActivo
  };
};