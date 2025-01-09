import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileUp, Download } from 'lucide-react';
import { ActivosService } from '@/services/api';

const Formato71Exporter = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [templateWorkbook, setTemplateWorkbook] = useState(null);

  // Cargar la plantilla guardada desde localStorage
  useEffect(() => {
    const loadSavedTemplate = () => {
      try {
        const savedTemplates = localStorage.getItem('excelTemplates');
        if (savedTemplates) {
          const templates = JSON.parse(savedTemplates);
          const formato71Template = templates.find(t => t.id === 'formato71');
          
          if (formato71Template) {
            // Convertir la data guardada en un Workbook
            const data = Uint8Array.from(atob(formato71Template.data), c => c.charCodeAt(0));
            const workbook = XLSX.read(data, {
              type: 'array',
              cellStyles: true,
              cellDates: true,
              cellNF: true,
              cellFormulas: true
            });
            setTemplateWorkbook(workbook);
            setMessage('Plantilla base cargada correctamente');
          } else {
            setError('No se encontró la plantilla del Formato 7.1. Por favor, cárgala primero en el Gestor de Plantillas.');
          }
        } else {
          setError('No hay plantillas guardadas. Por favor, carga la plantilla del Formato 7.1 en el Gestor de Plantillas.');
        }
      } catch (error) {
        console.error('Error cargando plantilla:', error);
        setError('Error al cargar la plantilla base');
      }
    };

    loadSavedTemplate();
  }, []);

  const calculateTotals = (rows) => {
    const totals = {
      saldoInicial: 0,
      adquisiciones: 0,
      mejoras: 0,
      retiros: 0,
      otros: 0,
      historico: 0,
      ajuste: 0,
      ajustado: 0,
      depAcumulada: 0,
      depEjercicio: 0,
      depRetiros: 0,
      depAjustes: 0,
      depHistorica: 0,
      ajusteInflacion: 0
    };

    rows.forEach(row => {
      const valor = parseFloat(row[12]) || 0;
      const tasa = (parseFloat(row[30]) || 0) / 100;

      totals.saldoInicial += valor;
      totals.historico += valor;
      totals.ajustado += valor;
      totals.depEjercicio += valor * tasa;
    });

    return totals;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage('Procesando archivo de datos...');
    setError(null);

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            cellNF: true,
            cellText: false,
            raw: false
          });

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            dateNF: 'dd/mm/yyyy',
            defval: ''
          });

          if (jsonData && jsonData.length > 0) {
            setData(jsonData);
            setMessage('Archivo de datos procesado correctamente');
          } else {
            throw new Error('No se encontraron datos en el archivo');
          }
        } catch (error) {
          console.error('Error procesando el archivo:', error);
          setError('Error al procesar el contenido del archivo Excel');
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error general:', error);
      setError('Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!data) {
      setError('No hay datos para exportar');
      return;
    }

    if (!templateWorkbook) {
      setError('La plantilla base no está cargada');
      return;
    }

    try {
      setLoading(true);
      setMessage('Generando archivo de salida...');

      const workbook = XLSX.utils.book_new();
      const templateSheet = templateWorkbook.Sheets[templateWorkbook.SheetNames[0]];

      // Clonar la hoja de la plantilla
      const newSheet = JSON.parse(JSON.stringify(templateSheet));

      // Actualizar encabezados con negrita
      const headerStyle = {
        font: { name: 'Calibri', sz: 11, bold: true },
        alignment: { horizontal: 'left', vertical: 'center' }
      };

      // Aplicar estilo a los encabezados
      newSheet['B3'] = { v: '2024', t: 's', s: headerStyle };
      newSheet['B4'] = { v: data[1]?.[19] || '', t: 's', s: headerStyle }; // RUC
      newSheet['D5'] = { v: data[1]?.[20] || '', t: 's', s: headerStyle }; // RAZÓN SOCIAL

      // Asegurarse de que los encabezados de columnas estén en negrita
      for (let col = 'A'.charCodeAt(0); col <= 'Y'.charCodeAt(0); col++) {
        const colLetter = String.fromCharCode(col);
        for (let row = 1; row <= 10; row++) {
          const cellRef = `${colLetter}${row}`;
          if (newSheet[cellRef]) {
            newSheet[cellRef].s = {
              ...newSheet[cellRef].s,
              font: { ...newSheet[cellRef].s?.font, bold: true }
            };
          }
        }
      }

      // Procesar datos y agregar filas
      let currentRow = 11;
      let allRows = [];

      // Recopilar todas las filas válidas primero
      data.slice(1).forEach(row => {
        if (row[0]) { // Solo incluir filas con código
          allRows.push(row);
        }
      });

      // Calcular totales una sola vez para todas las filas
      const totals = calculateTotals(allRows);

      // Agregar las filas de datos
      allRows.forEach(dataRow => {
        const rowData = {
          'A': dataRow[0] || '', // CÓDIGO
          'B': dataRow[16] || '', // CUENTA CONTABLE
          'C': dataRow[5] || '', // DESCRIPCIÓN
          'D': dataRow[6] || '', // MARCA
          'E': dataRow[7] || '', // MODELO
          'F': dataRow[8] || '', // NÚMERO SERIE
          'G': parseFloat(dataRow[12]) || 0, // SALDO INICIAL
          'H': 0, // ADQUISICIONES
          'I': 0, // MEJORAS
          'J': 0, // RETIROS/BAJAS
          'K': 0, // OTROS AJUSTES
          'L': parseFloat(dataRow[12]) || 0, // VALOR HISTÓRICO
          'M': 0, // AJUSTE POR INFLACIÓN
          'N': parseFloat(dataRow[12]) || 0, // VALOR AJUSTADO
          'O': dataRow[29] || '', // FECHA ADQUISICIÓN
          'P': dataRow[28] || '', // FECHA INICIO
          'Q': 'LINEA RECTA', // MÉTODO
          'R': dataRow[21] || '', // N° DOCUMENTO
          'S': parseFloat(dataRow[30]) || 0, // PORCENTAJE
          'T': 0, // DEP ACUMULADA ANTERIOR
          'U': (parseFloat(dataRow[12]) || 0) * ((parseFloat(dataRow[30]) || 0) / 100), // DEP EJERCICIO
          'V': 0, // DEP RETIROS
          'W': 0, // DEP OTROS AJUSTES
          'X': (parseFloat(dataRow[12]) || 0) * ((parseFloat(dataRow[30]) || 0) / 100), // DEP HISTÓRICA
          'Y': 0 // AJUSTE INFLACIÓN
        };

        // Agregar cada celda con estilo sin negrita para los datos
        Object.entries(rowData).forEach(([col, value]) => {
          newSheet[`${col}${currentRow}`] = {
            v: value,
            t: typeof value === 'number' ? 'n' : 's',
            z: typeof value === 'number' ? '#,##0.00' : '@',
            s: {
              font: { name: 'Calibri', sz: 11, bold: false },
              alignment: {
                horizontal: typeof value === 'number' ? 'right' : 'left',
                vertical: 'center'
              }
            }
          };
        });

        currentRow++;
      });

      // Agregar fila de totales una sola vez al final
      const totalesRow = {
        'F': 'TOTALES',
        'G': totals.saldoInicial,
        'H': totals.adquisiciones,
        'I': totals.mejoras,
        'J': totals.retiros,
        'K': totals.otros,
        'L': totals.historico,
        'M': totals.ajuste,
        'N': totals.ajustado,
        'T': totals.depAcumulada,
        'U': totals.depEjercicio,
        'V': totals.depRetiros,
        'W': totals.depAjustes,
        'X': totals.depHistorica,
        'Y': totals.ajusteInflacion
      };

      Object.entries(totalesRow).forEach(([col, value]) => {
        newSheet[`${col}${currentRow}`] = {
          v: value,
          t: typeof value === 'number' ? 'n' : 's',
          z: typeof value === 'number' ? '#,##0.00' : '@',
          s: {
            font: { name: 'Calibri', sz: 11, bold: true },
            alignment: {
              horizontal: typeof value === 'number' ? 'right' : 'center',
              vertical: 'center'
            }
          }
        };
      });

      // Actualizar el rango de la hoja
      const range = XLSX.utils.decode_range(newSheet['!ref']);
      range.e.r = currentRow; // Actualizar última fila
      newSheet['!ref'] = XLSX.utils.encode_range(range);

      // Copiar los estilos y configuraciones de la plantilla
      newSheet['!cols'] = templateSheet['!cols'];
      newSheet['!rows'] = templateSheet['!rows'];
      newSheet['!merges'] = templateSheet['!merges'];

      // Agregar la hoja al nuevo libro
      XLSX.utils.book_append_sheet(workbook, newSheet, 'Formato 7.1');

      // Guardar el archivo
      XLSX.writeFile(workbook, 'formato_7.1_generado.xlsx');
      setMessage('Archivo generado correctamente');

    } catch (error) {
      console.error('Error en la exportación:', error);
      setError('Error al generar el archivo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCellValue = (value) => {
    if (value instanceof Date) {
      return value.toLocaleDateString('es-ES');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {!templateWorkbook ? (
          <div className="text-center text-red-600 mb-4">
            Por favor, primero carga la plantilla del Formato 7.1 en el Gestor de Plantillas
          </div>
        ) : null}

        <h1 className="text-2xl font-bold mb-6 text-center">
          Exportador Formato 7.1 - Activos Fijos
        </h1>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Upload className="h-12 w-12 text-gray-400" />
            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2">
              <FileUp className="h-5 w-5" />
              <span>Seleccionar Archivo</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500">
              Selecciona el archivo ACTIVOSonline.xlsx
            </p>
          </div>
        </div>

        {loading && (
          <div className="mt-4 p-4 rounded bg-blue-100 text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded bg-red-100 text-red-700 text-center">
            {error}
          </div>
        )}

        {!loading && message && !error && (
          <div className="mt-4 p-4 rounded bg-green-100 text-center">
            {message}
          </div>
        )}

        {data && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleExport}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded flex items-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Generar Formato 7.1</span>
            </button>
          </div>
        )}

        {data && data.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Vista Previa de Datos</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {data[0].map((header, index) => (
                      <th
                        key={index}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {formatCellValue(header) || `Columna ${index + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.slice(1, 6).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {formatCellValue(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Formato71Exporter;