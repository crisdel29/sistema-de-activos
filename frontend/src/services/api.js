// src/services/api.js
import { API_BASE_URL } from '@/config/constants';

async function handleRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // First check if the response is ok
    if (!response.ok) {
      // Try to get error details from response
      const errorData = await response.json().catch(() => ({
        message: `Error ${response.status}: ${response.statusText}`
      }));
      throw new Error(errorData.message || 'Error en la solicitud');
    }

    // Parse successful response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

export const ActivosService = {
  // Categorías
  getAllCategorias: () => handleRequest('/categorias'),

  createCategoria: (data) => handleRequest('/categorias', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateCategoria: (id, data) => handleRequest(`/categorias/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteCategoria: (id) => handleRequest(`/categorias/${id}`, {
    method: 'DELETE',
  }),

  // Activos
  getAll: () => handleRequest('/activos'),

  getById: (id) => handleRequest(`/activos/${id}`),

  create: (data) => handleRequest('/activos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, data) => handleRequest(`/activos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id) => handleRequest(`/activos/${id}`, {
    method: 'DELETE',
  }),

  // Dashboard
  getDashboardData: () => handleRequest('/activos/dashboard'),

  // Movimientos
  getAllMovimientos: () => handleRequest('/movimientos'),

  createMovimiento: (data) => handleRequest('/movimientos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Depreciación
  getReporteDepreciacion: (periodo) => 
    handleRequest(`/depreciacion/reporte/${periodo}`),

  calcularDepreciacion: (data) => handleRequest('/depreciacion/calcular', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};