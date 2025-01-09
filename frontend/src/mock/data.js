// src/services/api.js
import { 
    MOCK_ACTIVOS, 
    MOCK_MOVIMIENTOS, 
    MOCK_DEPRECIACION 
  } from '@/mock/data';
  
  // Función helper para simular delay de red
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Función para generar un ID único
  const generateId = (array) => Math.max(0, ...array.map(item => item.id)) + 1;
  
  export const ActivosService = {
    // Activos
    getAll: async () => {
      await delay(500);
      return MOCK_ACTIVOS;
    },
  
    getById: async (id) => {
      await delay(300);
      return MOCK_ACTIVOS.find(activo => activo.id === id);
    },
  
    create: async (data) => {
      await delay(800);
      const newId = generateId(MOCK_ACTIVOS);
      const newActivo = { ...data, id: newId, estado: 'ACTIVO' };
      MOCK_ACTIVOS.push(newActivo);
      return newActivo;
    },
  
    update: async (id, data) => {
      await delay(500);
      const index = MOCK_ACTIVOS.findIndex(activo => activo.id === id);
      if (index === -1) throw new Error('Activo no encontrado');
      MOCK_ACTIVOS[index] = { ...MOCK_ACTIVOS[index], ...data };
      return MOCK_ACTIVOS[index];
    },
  
    delete: async (id) => {
      await delay(500);
      const index = MOCK_ACTIVOS.findIndex(activo => activo.id === id);
      if (index === -1) throw new Error('Activo no encontrado');
      MOCK_ACTIVOS[index].estado = 'INACTIVO';
      return true;
    },
  
    // Movimientos
    getAllMovimientos: async () => {
      await delay(500);
      return MOCK_MOVIMIENTOS;
    },
  
    createMovimiento: async (data) => {
      await delay(800);
      const newId = generateId(MOCK_MOVIMIENTOS);
      const activo = MOCK_ACTIVOS.find(a => a.id === data.activo_id);
      if (!activo) throw new Error('Activo no encontrado');
  
      const newMovimiento = {
        ...data,
        id: newId,
        activo_codigo: activo.codigo,
        activo_descripcion: activo.descripcion,
        estado: 'PROCESADO'
      };
      MOCK_MOVIMIENTOS.push(newMovimiento);
      return newMovimiento;
    },
  
    // Depreciación
    calcularDepreciacion: async (data) => {
      await delay(1000);
      const activo = MOCK_ACTIVOS.find(a => a.id === data.activo_id);
      if (!activo) throw new Error('Activo no encontrado');
  
      const depMensual = activo.valor_adquisicion / (activo.vida_util * 12);
      const newDep = {
        activo_id: activo.id,
        codigo: activo.codigo,
        descripcion: activo.descripcion,
        valor_inicial: activo.valor_adquisicion,
        depreciacion_periodo: depMensual,
        depreciacion_acumulada: depMensual,
        valor_neto: activo.valor_adquisicion - depMensual
      };
  
      MOCK_DEPRECIACION.push(newDep);
      return newDep;
    },
  
    getReporteDepreciacion: async (periodo) => {
      await delay(500);
      return MOCK_DEPRECIACION;
    }
  };    