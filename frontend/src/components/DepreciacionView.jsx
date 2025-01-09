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
import { Download, Calculator } from 'lucide-react';
import { ActivosService } from '@/services/api';

const DepreciacionView = () => {
  const [periodo, setPeriodo] = useState('');
  const [periodos, setPeriodos] = useState([]);
  const [depreciaciones, setDepreciaciones] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const procesarDepreciacion = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const data = await ActivosService.calcularDepreciacion({ periodo });

      setMessage({ type: 'success', text: data.message });
      cargarDepreciaciones();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const cargarDepreciaciones = async () => {
    try {
      setLoading(true);
      const data = await ActivosService.getReporteDepreciacion(periodo);
      setDepreciaciones(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (periodo) {
      cargarDepreciaciones();
    }
  }, [periodo]);

  const exportarReporte = async () => {
    try {
      const response = await fetch(`/api/depreciacion/exportar/${periodo}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al exportar reporte.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `depreciacion_${periodo}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Depreciación de Activos</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-[180px]">
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

              <Button onClick={procesarDepreciacion} disabled={loading}>
                <Calculator className="w-4 h-4 mr-2" />
                Procesar Depreciación
              </Button>

              <Button variant="outline" onClick={exportarReporte} disabled={loading || depreciaciones.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
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
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Valor Inicial</TableHead>
                  <TableHead>Dep. Periodo</TableHead>
                  <TableHead>Dep. Acumulada</TableHead>
                  <TableHead>Valor Neto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depreciaciones.map((dep, index) => (
                  <TableRow key={index}>
                    <TableCell>{dep.codigo}</TableCell>
                    <TableCell>{dep.descripcion}</TableCell>
                    <TableCell>S/. {dep.valor_inicial.toFixed(2)}</TableCell>
                    <TableCell>S/. {dep.depreciacion_periodo.toFixed(2)}</TableCell>
                    <TableCell>S/. {dep.depreciacion_acumulada.toFixed(2)}</TableCell>
                    <TableCell>S/. {dep.valor_neto.toFixed(2)}</TableCell>
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

export default DepreciacionView;
