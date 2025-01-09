import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS
app.use(cors());
app.use(express.json());

// Asegurarse de que existe el directorio de datos
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)){
  fs.mkdirSync(dataDir, { recursive: true });
}

// Configuración de base de datos
let db;
const initializeDb = async () => {
  try {
    db = await open({
      filename: path.join(dataDir, 'activos_fijos.db'),
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS movimientos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activo_id INTEGER NOT NULL,
        tipo_movimiento TEXT NOT NULL,
        fecha DATE NOT NULL,
        valor DECIMAL(12,2) NOT NULL,
        motivo TEXT,
        documento_referencia TEXT,
        observaciones TEXT,
        estado TEXT DEFAULT 'PROCESADO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT,
        FOREIGN KEY (activo_id) REFERENCES activos_fijos(id)
      );
    `);

    // Crear tablas si no existen
    await db.exec(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        cuenta_contable TEXT NOT NULL,
        vida_util INTEGER NOT NULL,
        tasa_depreciacion REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS activos_fijos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        descripcion TEXT NOT NULL,
        categoria_id INTEGER,
        marca TEXT,
        modelo TEXT,
        numero_serie TEXT,
        fecha_adquisicion DATE NOT NULL,
        valor_adquisicion DECIMAL(12,2) NOT NULL,
        vida_util INTEGER NOT NULL,
        valor_residual DECIMAL(12,2) DEFAULT 0,
        estado TEXT DEFAULT 'ACTIVO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
      );
    `);

    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    throw error;
  }
};

// Inicializar base de datos
initializeDb().then(() => {
  // Rutas para Movimientos
app.get('/api/movimientos', async (req, res) => {
  try {
    const movimientos = await db.all(`
      SELECT 
        m.*,
        af.codigo as activo_codigo,
        af.descripcion as activo_descripcion
      FROM movimientos m
      JOIN activos_fijos af ON m.activo_id = af.id
      ORDER BY m.fecha DESC, m.id DESC
    `);
    res.json(movimientos);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/movimientos', async (req, res) => {
  try {
    const { activo_id, tipo_movimiento, fecha, valor, motivo, documento_referencia, observaciones, created_by } = req.body;

    // Verificar activo
    const activo = await db.get('SELECT * FROM activos_fijos WHERE id = ?', activo_id);
    if (!activo) {
      console.error(`Activo con ID ${activo_id} no encontrado`);
      return res.status(404).json({ error: 'Activo no encontrado' });
    }

    // Insertar movimiento
    const result = await db.run(
      `INSERT INTO movimientos (
        activo_id, tipo_movimiento, fecha, valor, motivo, 
        documento_referencia, observaciones, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [activo_id, tipo_movimiento, fecha, valor, motivo, documento_referencia, observaciones, created_by]
    );

    console.log('Movimiento insertado con ID:', result.lastID);

    // Actualizar activo si es BAJA
    if (tipo_movimiento === 'BAJA') {
      await db.run('UPDATE activos_fijos SET estado = ? WHERE id = ?', ['INACTIVO', activo_id]);
      console.log(`Activo ${activo_id} marcado como INACTIVO`);
    }

    // Obtener el movimiento recién creado
    const nuevoMovimiento = await db.get(`
      SELECT m.*, af.codigo as activo_codigo, af.descripcion as activo_descripcion
      FROM movimientos m
      JOIN activos_fijos af ON m.activo_id = af.id
      WHERE m.id = ?`,
      result.lastID
    );

    res.json({
      success: true,
      message: 'Movimiento registrado exitosamente',
      movimiento: nuevoMovimiento
    });
  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.status(500).json({ error: 'Error al crear el movimiento', details: error.message });
  }
});


// Ruta para obtener movimientos de un activo específico
app.get('/api/movimientos/activo/:id', async (req, res) => {
  try {
    const movimientos = await db.all(`
      SELECT 
        m.*,
        af.codigo as activo_codigo,
        af.descripcion as activo_descripcion
      FROM movimientos m
      JOIN activos_fijos af ON m.activo_id = af.id
      WHERE m.activo_id = ?
      ORDER BY m.fecha DESC, m.id DESC
    `, req.params.id);
    res.json(movimientos);
  } catch (error) {
    console.error('Error al obtener movimientos del activo:', error);
    res.status(500).json({ error: error.message });
  }
});

  // Ruta del Dashboard
app.get('/api/activos/dashboard', async (req, res) => {
  try {
    // Obtener estadísticas generales
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_activos,
        COUNT(CASE WHEN estado = 'ACTIVO' THEN 1 END) as activos_activos,
        COUNT(CASE WHEN estado = 'INACTIVO' THEN 1 END) as activos_inactivos,
        COALESCE(SUM(valor_adquisicion), 0) as valor_total
      FROM activos_fijos
    `);

    // Obtener distribución por categorías
    const distribucionCategorias = await db.all(`
      SELECT 
        c.nombre as name,
        COUNT(af.id) as value
      FROM categorias c
      LEFT JOIN activos_fijos af ON c.id = af.categoria_id
      GROUP BY c.id, c.nombre
      ORDER BY value DESC
    `);

    // Obtener movimientos recientes
    const movimientosRecientes = await db.all(`
      SELECT 
        strftime('%Y-%m-%d', fecha_adquisicion) as fecha,
        SUM(valor_adquisicion) as valor
      FROM activos_fijos
      GROUP BY fecha
      ORDER BY fecha DESC
      LIMIT 10
    `);

    // Calcular depreciación del mes
    const depreciacionMes = await db.get(`
      SELECT 
        COALESCE(SUM(af.valor_adquisicion * c.tasa_depreciacion / 100 / 12), 0) as depreciacion_mes
      FROM activos_fijos af
      JOIN categorias c ON af.categoria_id = c.id
      WHERE af.estado = 'ACTIVO'
    `);

    res.json({
      stats: {
        ...stats,
        depreciacion_mes: depreciacionMes.depreciacion_mes
      },
      distribucionCategorias,
      movimientosRecientes
    });

  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({ 
      error: 'Error al obtener datos del dashboard',
      details: error.message 
    });
  }
});
  
  // Ruta para obtener todas las categorías (GET)
app.get('/api/categorias', async (req, res) => {
  try {
      const categorias = await db.all('SELECT * FROM categorias');
      res.json(categorias);
  } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Ruta para crear una nueva categoría (POST)
app.post('/api/categorias', async (req, res) => {
  try {
      const { codigo, nombre, cuenta_contable, vida_util, tasa_depreciacion } = req.body;

      // Verificar si ya existe una categoría con el mismo código
      const existente = await db.get(
          'SELECT * FROM categorias WHERE LOWER(codigo) = LOWER(?)',
          [codigo]
      );

      if (existente) {
          return res.status(400).json({
              error: 'Ya existe una categoría con este código'
          });
      }

      console.log('Datos recibidos para insertar categoría:', { codigo, nombre, cuenta_contable, vida_util, tasa_depreciacion });
      const result = await db.run(`
        INSERT INTO categorias (
            codigo,
            nombre,
            cuenta_contable,
            vida_util,
            tasa_depreciacion
        ) VALUES (?, ?, ?, ?, ?)
      `, [codigo, nombre, cuenta_contable, vida_util, tasa_depreciacion]);

      console.log('Resultado del INSERT:', result);


      const nuevaCategoria = await db.get(
          'SELECT * FROM categorias WHERE id = ?',
          result.lastID
      );

      res.json({
          success: true,
          message: 'Categoría creada exitosamente',
          categoria: nuevaCategoria
      });
  } catch (error) {
      console.error('Error al crear categoría:', error);
      res.status(500).json({
          error: 'Error al crear la categoría',
          details: error.message
      });
  }
});
// Rutas para Activos
app.get('/api/activos', async (req, res) => {
  try {
    const activos = await db.all(`
      SELECT af.*, c.nombre as categoria_nombre 
      FROM activos_fijos af 
      LEFT JOIN categorias c ON af.categoria_id = c.id
      ORDER BY af.codigo
    `);
    res.json(activos);
  } catch (error) {
    console.error('Error al obtener activos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/activos', async (req, res) => {
  try {
    const {
      codigo,
      descripcion,
      categoria_id,
      marca,
      modelo,
      numero_serie,
      fecha_adquisicion,
      valor_adquisicion,
      vida_util,
      valor_residual
    } = req.body;

    const result = await db.run(`
      INSERT INTO activos_fijos (
        codigo, descripcion, categoria_id, marca, modelo,
        numero_serie, fecha_adquisicion, valor_adquisicion,
        vida_util, valor_residual, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO')
    `, [
      codigo, descripcion, categoria_id, marca, modelo,
      numero_serie, fecha_adquisicion, valor_adquisicion,
      vida_util, valor_residual || 0
    ]);

    const newActivo = await db.get('SELECT * FROM activos_fijos WHERE id = ?', result.lastID);
    res.json(newActivo);
  } catch (error) {
    console.error('Error al crear activo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener lista de depreciación
app.get('/api/depreciacion/reporte/:periodo', async (req, res) => {
  try {
    const { periodo } = req.params;

    const reporte = await db.all(`
      SELECT 
        af.codigo,
        af.descripcion,
        af.valor_adquisicion as valor_inicial,
        ROUND(af.valor_adquisicion * c.tasa_depreciacion / 100 / 12, 2) as depreciacion_periodo,
        ROUND((af.valor_adquisicion * c.tasa_depreciacion / 100 / 12) * strftime('%m', 'now'), 2) as depreciacion_acumulada,
        ROUND(af.valor_adquisicion - ((af.valor_adquisicion * c.tasa_depreciacion / 100 / 12) * strftime('%m', 'now')), 2) as valor_neto
      FROM activos_fijos af
      JOIN categorias c ON af.categoria_id = c.id
      WHERE af.estado = 'ACTIVO'
    `);

    res.json(reporte);
  } catch (error) {
    console.error('Error al generar reporte de depreciación:', error);
    res.status(500).json({ error: 'Error al generar reporte de depreciación', details: error.message });
  }
});

// Ruta para calcular depreciación
app.post('/api/depreciacion/calcular', async (req, res) => {
  try {
    const { periodo } = req.body;

    if (!periodo) {
      return res.status(400).json({ error: 'El periodo es requerido.' });
    }

    console.log(`Calculando depreciación para el periodo: ${periodo}`);

    // Aquí puedes agregar lógica real para el cálculo
    res.json({ message: `Depreciación calculada exitosamente para el periodo ${periodo}.` });
  } catch (error) {
    console.error('Error al calcular depreciación:', error);
    res.status(500).json({ error: 'Error al calcular depreciación.' });
  }
});

// Ruta para exportar en Excel el  calculo de la depreciación
app.get('/api/depreciacion/exportar/:periodo', async (req, res) => {
  try {
    const { periodo } = req.params;

    // Obtener los datos de depreciación
    const datos = await db.all(`
      SELECT 
        af.codigo,
        af.descripcion,
        af.valor_adquisicion as valor_inicial,
        ROUND(af.valor_adquisicion * c.tasa_depreciacion / 100 / 12, 2) as depreciacion_periodo,
        ROUND((af.valor_adquisicion * c.tasa_depreciacion / 100 / 12) * strftime('%m', 'now'), 2) as depreciacion_acumulada,
        ROUND(af.valor_adquisicion - ((af.valor_adquisicion * c.tasa_depreciacion / 100 / 12) * strftime('%m', 'now')), 2) as valor_neto
      FROM activos_fijos af
      JOIN categorias c ON af.categoria_id = c.id
      WHERE af.estado = 'ACTIVO'
    `);

    if (!datos || datos.length === 0) {
      return res.status(404).json({ error: 'No hay datos de depreciación para exportar.' });
    }

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Depreciación');

    // Agregar encabezados
    worksheet.columns = [
      { header: 'Código', key: 'codigo', width: 15 },
      { header: 'Descripción', key: 'descripcion', width: 30 },
      { header: 'Valor Inicial', key: 'valor_inicial', width: 15 },
      { header: 'Dep. Periodo', key: 'depreciacion_periodo', width: 15 },
      { header: 'Dep. Acumulada', key: 'depreciacion_acumulada', width: 15 },
      { header: 'Valor Neto', key: 'valor_neto', width: 15 },
    ];

    // Agregar datos
    datos.forEach((dato) => {
      worksheet.addRow(dato);
    });

    // Establecer el tipo de respuesta y enviar el archivo Excel
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=depreciacion_${periodo}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al exportar datos de depreciación:', error);
    res.status(500).json({ error: 'Error al exportar datos de depreciación.', details: error.message });
  }
});

// Rutas para generar Reporte en Excel de Sunat
app.get('/api/reportes/:formato/:periodo', async (req, res) => {
  try {
    const { formato, periodo } = req.params;

    // Validar formato
    const formatosValidos = ['7.1', '7.2', '7.3', '7.4'];
    if (!formatosValidos.includes(formato)) {
      return res.status(400).json({ error: 'Formato no válido' });
    }

    // Obtener los datos según el formato
    let query = '';
    switch (formato) {
      case '7.1': // Registro de Activos
        query = `
          SELECT 
            af.codigo, af.descripcion, af.marca, af.modelo, af.numero_serie,
            af.valor_adquisicion as saldo_inicial, 
            0 as adquisiciones, 
            0 as mejoras, 
            0 as retiros, 
            0 as otros, 
            af.valor_adquisicion as valor_historico, 
            0 as dep_acumulada, 
            0 as dep_ejercicio
          FROM activos_fijos af
        `;
        break;
      case '7.2': // Activos Revaluados
        query = `
          SELECT 
            af.codigo, af.descripcion, 
            af.valor_adquisicion as valor_original, 
            0 as revaluacion, 
            af.valor_adquisicion as valor_revaluado, 
            '2024-01-01' as fecha_revaluacion
          FROM activos_fijos af
        `;
        break;
      case '7.3': // Diferencia de Cambio
        query = `
          SELECT 
            af.codigo, af.descripcion, 
            'PEN' as moneda, 
            3.5 as tc_inicial, 
            3.8 as tc_final, 
            0.3 as diferencia
          FROM activos_fijos af
        `;
        break;
      case '7.4': // Arrendamientos
        query = `
          SELECT 
            af.codigo, af.descripcion, 
            'Contrato XYZ' as contrato, 
            '2023-01-01' as fecha_inicio, 
            '12 meses' as plazo, 
            af.valor_adquisicion as valor
          FROM activos_fijos af
        `;
        break;
    }

    const datos = await db.all(query);
    res.json(datos);
  } catch (error) {
    console.error('Error al generar el reporte:', error);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});
// Ruta para Exportar el reporte generado para Sunat
app.post('/api/reportes/:formato/:periodo/excel', async (req, res) => {
  try {
    const { formato, periodo } = req.params;

    // Validar formato
    const formatosValidos = ['7.1', '7.2', '7.3', '7.4'];
    if (!formatosValidos.includes(formato)) {
      return res.status(400).json({ error: 'Formato no válido' });
    }

    // Obtener los datos según el formato
    let query = '';
    switch (formato) {
      case '7.1':
        query = `
          SELECT 
            af.codigo, af.descripcion, af.marca, af.modelo, af.numero_serie,
            af.valor_adquisicion as saldo_inicial, 
            0 as adquisiciones, 
            0 as mejoras, 
            0 as retiros, 
            0 as otros, 
            af.valor_adquisicion as valor_historico, 
            0 as dep_acumulada, 
            0 as dep_ejercicio
          FROM activos_fijos af
        `;
        break;
      case '7.2':
        query = `
          SELECT 
            af.codigo, af.descripcion, 
            af.valor_adquisicion as valor_original, 
            0 as revaluacion, 
            af.valor_adquisicion as valor_revaluado, 
            '2024-01-01' as fecha_revaluacion
          FROM activos_fijos af
        `;
        break;
      case '7.3':
        query = `
          SELECT 
            af.codigo, af.descripcion, 
            'PEN' as moneda, 
            3.5 as tc_inicial, 
            3.8 as tc_final, 
            0.3 as diferencia
          FROM activos_fijos af
        `;
        break;
      case '7.4':
        query = `
          SELECT 
            af.codigo, af.descripcion, 
            'Contrato XYZ' as contrato, 
            '2023-01-01' as fecha_inicio, 
            '12 meses' as plazo, 
            af.valor_adquisicion as valor
          FROM activos_fijos af
        `;
        break;
    }

    const datos = await db.all(query);

    // Crear un libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    // Añadir encabezados
    worksheet.columns = [
      ...Object.keys(datos[0] || {}).map((col) => ({ header: col, key: col })),
    ];

    // Añadir filas
    datos.forEach((fila) => worksheet.addRow(fila));

    // Generar archivo Excel y enviarlo como respuesta
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${formato}_${periodo}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error exportando el archivo:', error);
    res.status(500).json({ error: 'Error exportando el archivo', details: error.message });
  }
});


  // Iniciar servidor
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
    console.log('Base de datos ubicada en:', path.join(dataDir, 'activos_fijos.db'));
  });
}).catch(error => {
  console.error('Error fatal al iniciar la aplicación:', error);
  process.exit(1);
});