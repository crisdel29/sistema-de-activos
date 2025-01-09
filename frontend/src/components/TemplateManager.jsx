import React, { useState, useEffect } from 'react';
import { Upload, FileUp, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ActivosService } from '@/services/api';

const TemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // Cargar plantillas guardadas al iniciar
  useEffect(() => {
    const loadSavedTemplates = () => {
      const savedTemplates = localStorage.getItem('excelTemplates');
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      }
    };

    loadSavedTemplates();
  }, []);

  const analyzeTemplate = (data) => {
    try {
      const workbook = XLSX.read(data, {
        type: 'array',
        cellStyles: true,
        cellDates: true,
        cellNF: true,
        cellFormulas: true
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Analizar estructura
      const structure = {
        headers: [],
        cells: {},
        formulas: [],
        styles: []
      };

      // Recopilar información de las celdas
      for (let key in sheet) {
        if (key[0] === '!') continue;
        const cell = sheet[key];
        if (cell.f) {
          structure.formulas.push({
            cell: key,
            formula: cell.f
          });
        }
        if (cell.s) {
          structure.styles.push({
            cell: key,
            style: cell.s
          });
        }
      }

      // Recopilar headers y datos importantes
      rows.slice(0, 10).forEach((row, idx) => {
        if (row.some(cell => cell)) {
          structure.headers.push({
            row: idx + 1,
            content: row
          });
        }
      });

      return structure;
    } catch (error) {
      console.error('Error analyzing template:', error);
      return null;
    }
  };

  const handleTemplateUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage('Procesando plantilla...');
    setError(null);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const base64Data = btoa(String.fromCharCode.apply(null, data));
          
          // Analizar la estructura de la plantilla
          const structure = analyzeTemplate(data);
          
          const templateType = file.name.toLowerCase().includes('7.1') ? 'formato71' :
                             file.name.toLowerCase().includes('7.2') ? 'formato72' :
                             file.name.toLowerCase().includes('7.3') ? 'formato73' :
                             file.name.toLowerCase().includes('7.4') ? 'formato74' : 'unknown';

          if (templateType === 'unknown') {
            throw new Error('Formato de plantilla no reconocido');
          }

          const newTemplate = {
            id: templateType,
            name: file.name,
            type: templateType,
            data: base64Data,
            structure: structure,
            uploadDate: new Date().toISOString()
          };

          setTemplates(prev => {
            const updated = prev.filter(t => t.id !== templateType);
            return [...updated, newTemplate];
          });

          setMessage('Plantilla cargada correctamente');
        } catch (error) {
          console.error('Error procesando la plantilla:', error);
          setError('Error al procesar la plantilla');
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

  const handlePreviewTemplate = (template) => {
    if (selectedTemplate?.id === template.id) {
      setSelectedTemplate(null);
      setPreviewData(null);
    } else {
      setSelectedTemplate(template);
      try {
        const data = Uint8Array.from(atob(template.data), c => c.charCodeAt(0));
        const workbook = XLSX.read(data, {
          type: 'array',
          cellStyles: true,
          cellDates: true,
          cellNF: true,
          cellFormulas: true
        });
        
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const preview = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        setPreviewData(preview);
      } catch (error) {
        console.error('Error previewing template:', error);
        setError('Error al previsualizar la plantilla');
      }
    }
  };

  const handleSaveTemplates = () => {
    try {
      localStorage.setItem('excelTemplates', JSON.stringify(templates));
      setMessage('Plantillas guardadas correctamente');
    } catch (error) {
      console.error('Error guardando plantillas:', error);
      setError('Error al guardar las plantillas');
    }
  };

  const handleDeleteTemplate = (templateId) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
      setPreviewData(null);
    }
    setMessage('Plantilla eliminada correctamente');
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Gestor de Plantillas Excel
        </h1>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
          <div className="flex flex-col items-center space-y-4">
            <Upload className="h-12 w-12 text-gray-400" />
            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2">
              <FileUp className="h-5 w-5" />
              <span>Cargar Plantilla</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleTemplateUpload}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500">
              Selecciona archivos de plantilla (Formato 7.1, 7.2, 7.3 o 7.4)
            </p>
          </div>
        </div>

        {/* Lista de plantillas */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Plantillas Guardadas</h2>
            <button
              onClick={handleSaveTemplates}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
          
          <div className="border rounded-lg divide-y">
            {templates.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay plantillas guardadas
              </div>
            ) : (
              templates.map(template => (
                <div key={template.id}>
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-gray-500">
                        Subido el {new Date(template.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePreviewTemplate(template)}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        {selectedTemplate?.id === template.id ? 
                          <EyeOff className="h-5 w-5" /> : 
                          <Eye className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  {selectedTemplate?.id === template.id && previewData && (
                    <div className="p-4 bg-gray-50 overflow-x-auto">
                      <div className="min-w-max" style={{fontWeight: 700}}>
                        {/* Título del formato */}
                        <div className="text-center mb-4" style={{fontWeight: 700}}>
                          FORMATO 7.1: "REGISTRO DE ACTIVOS FIJOS - DETALLE DE LOS ACTIVOS FIJOS"
                        </div>

                        {/* Encabezados superiores */}
                        <div className="mb-4" style={{fontWeight: 700}}>
                          <div>PERÍODO: {previewData[2]?.[1] || ''}</div>
                          <div>RUC: {previewData[3]?.[1] || ''}</div>
                          <div>APELLIDOS Y NOMBRES, DENOMINACIÓN O RAZÓN SOCIAL: {previewData[4]?.[4] || ''}</div>
                        </div>

                        {/* Tabla principal */}
                        <div className="border border-gray-300">
                          <table className="w-full text-xs" style={{fontWeight: 700}}>
                            <thead>
                              <tr className="border-b border-gray-300">
                                <th colSpan="3" className="border-r border-gray-300 p-1 text-center" style={{fontWeight: 700}}>DETALLE DEL ACTIVO FIJO</th>
                                <th colSpan="6" className="border-r border-gray-300 p-1 text-center" style={{fontWeight: 700}}>VALOR</th>
                                <th colSpan="2" className="border-r border-gray-300 p-1 text-center" style={{fontWeight: 700}}>FECHA DE INICIO</th>
                                <th colSpan="12" className="p-1 text-center" style={{fontWeight: 700}}>DEPRECIACIÓN</th>
                              </tr>
                              <tr className="border-b border-gray-300">
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>CÓDIGO</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>CUENTA CONTABLE</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>DESCRIPCIÓN</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>MARCA</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>MODELO</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>N° SERIE</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>SALDO INICIAL</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>ADQUISICIONES</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>MEJORAS</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>RETIROS Y/O BAJAS</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>OTROS AJUSTES</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>VALOR HISTÓRICO</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>AJUSTE POR INFLACIÓN</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>VALOR AJUSTADO</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>FECHA DE ADQUISICIÓN</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>FECHA DE USO</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>MÉTODO</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>N° DE DOCUMENTO</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>PORCENTAJE</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>DEP. DEL EJERCICIO</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>DEP. RETIROS</th>
                                <th className="border-r border-gray-300 p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>DEP. OTROS AJUSTES</th>
                                <th className="p-1 text-center whitespace-nowrap" style={{fontWeight: 700}}>DEP. ACUMULADA</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.slice(10).map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b border-gray-300">
                                  {row.map((cell, cellIndex) => (
                                    <td 
                                      key={cellIndex} 
                                      className="border-r border-gray-300 p-1" 
                                      style={{
                                        fontWeight: 700,
                                        textAlign: typeof cell === 'number' ? 'right' : 'left'
                                      }}
                                    >
                                      {cell !== null && cell !== undefined ? 
                                        typeof cell === 'number' ? 
                                          cell.toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2}) 
                                          : cell 
                                        : ''}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan="5" className="border-r border-gray-300 p-1" style={{fontWeight: 700}}></td>
                                <td className="border-r border-gray-300 p-1 text-center" style={{fontWeight: 700}}>TOTALES</td>
                                {Array(17).fill(null).map((_, idx) => (
                                  <td key={idx} className="border-r border-gray-300 p-1 text-right" style={{fontWeight: 700}}>
                                    {previewData.slice(10).reduce((sum, row) => {
                                      const value = parseFloat(row[idx + 6]) || 0;
                                      return sum + value;
                                    }, 0).toLocaleString('es-PE', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                  </td>
                                ))}
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mensajes de estado */}
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
      </div>
    </div>
  );
};

export default TemplateManager;