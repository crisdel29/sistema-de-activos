import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, RefreshCw } from 'lucide-react';

const ReportesSunat = () => {
  const [formato, setFormato] = useState('7.1');
  const [periodo, setPeriodo] = useState('');
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    cargarPeriodos();
  }, []);

  const cargarPeriodos = () => {
    const fecha = new Date();
    const periodos = [];
    for (let i = 0; i < 12; i++) {
      const year = fecha.getFullYear();
      const month = fecha.getMonth() + 1;
      periodos.push({
        value: `${year}${month.toString().padStart(2, '0')}`,
        label: `${month.toString().padStart(2, '0')}/${year}`
      });
      fecha.setMonth(fecha.getMonth() - 1);
    }
    setPeriodos(periodos);
    setPeriodo(periodos[0]?.value || '');
  };

  const generarReporte = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch(`/api/reportes/${formato}/${periodo}`);
      if (!response.ok) {
        throw new Error('Error al generar el reporte');
      }

      const result = await response.json();
      setData(result);
      setMessage({
        type: 'success',
        text: 'Reporte generado exitosamente'
      });
    } catch (error) {
      console.error('Error generando reporte:', error);
      setMessage({
        type: 'error',
        text: 'Error generando el reporte'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch(`/api/reportes/${formato}/${periodo}/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        throw new Error('Error al exportar el archivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `formato_${formato}_${periodo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      setMessage({
        type: 'success',
        text: 'Archivo exportado exitosamente'
      });
    } catch (error) {
      console.error('Error exportando archivo:', error);
      setMessage({
        type: 'error',
        text: 'Error exportando el archivo'
      });
    } finally {
      setLoading(false);
    }
  };

  const getColumnas = () => {
    switch (formato) {
      case '7.1':
        return [
          'Código', 'Cuenta', 'Descripción', 'Marca', 'Modelo', 'Serie',
          'Saldo Inicial', 'Adquisiciones', 'Mejoras', 'Retiros', 'Otros',
          'Valor Histórico', 'Dep. Acumulada', 'Dep. del Ejercicio'
        ];
      case '7.2':
        return [
          'Código', 'Descripción', 'Valor Original', 'Revaluación', 'Valor Revaluado', 'Fecha Revaluación'
        ];
      case '7.3':
        return [
          'Código', 'Descripción', 'Moneda', 'T.C. Inicial', 'T.C. Final', 'Diferencia'
        ];
      case '7.4':
        return [
          'Código', 'Descripción', 'Contrato', 'Fecha Inicio', 'Plazo', 'Valor'
        ];
      default:
        return [];
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Reportes SUNAT</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={formato} onValueChange={setFormato}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Seleccione formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7.1">Formato 7.1 - Registro de Activos</SelectItem>
                  <SelectItem value="7.2">Formato 7.2 - Activos Revaluados</SelectItem>
                  <SelectItem value="7.3">Formato 7.3 - Diferencia de Cambio</SelectItem>
                  <SelectItem value="7.4">Formato 7.4 - Arrendamientos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Seleccione periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={generarReporte}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Generar Reporte
              </Button>

              <Button
                variant="outline"
                onClick={exportarExcel}
                disabled={loading || data.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert className={`mb-4 ${message.type === 'error' ? 'bg-red-50' : 'bg-green-50'}`}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {getColumnas().map((col, index) => (
                    <TableHead key={index}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {getColumnas().map((col, colIndex) => (
                      <TableCell key={colIndex}>{row[col]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportesSunat;
