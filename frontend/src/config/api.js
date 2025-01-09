// src/services/api.js

const API_BASE_URL = 'http://localhost:3000/api';

// Función auxiliar para manejar las respuestas HTTP
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

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Error en la solicitud'
      }));
      throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en la petición:', error);
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

  // Depreciación
  getReporteDepreciacion: (periodo) => handleRequest(`/depreciacion/reporte/${periodo}`),
  
  calcularDepreciacion: (data) => handleRequest('/depreciacion/calcular', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Movimientos
  getAllMovimientos: () => handleRequest('/movimientos'),
  
  createMovimiento: (data) => handleRequest('/movimientos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
};