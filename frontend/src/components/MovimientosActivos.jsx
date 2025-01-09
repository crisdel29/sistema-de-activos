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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActivosService } from '@/services/api';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, FileText, Search } from 'lucide-react'; // Asegúrate de incluir Plus aquí
import { Textarea } from '@/components/ui/textarea';

const MovimientosActivos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [activos, setActivos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    tipo_movimiento: '',
    activo_id: '',
    fecha: new Date().toISOString().split('T')[0],
    valor: '',
    motivo: '',
    documento_referencia: '',
    observaciones: ''
  });

  useEffect(() => {
    cargarActivos();
    cargarMovimientos();
  }, []);

  const cargarActivos = async () => {
    try {
      const response = await fetch('/api/activos');
      if (response.ok) {
        const data = await response.json();
        setActivos(data);
      }
    } catch (error) {
      console.error('Error cargando activos:', error);
      setMessage({
        type: 'error',
        text: 'Error cargando activos'
      });
    }
  };

  const cargarMovimientos = async () => {
    try {
      const response = await fetch('/api/movimientos');
      if (response.ok) {
        const data = await response.json();
        setMovimientos(data);
      }
    } catch (error) {
      console.error('Error cargando movimientos:', error);
      setMessage({
        type: 'error',
        text: 'Error cargando movimientos'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/movimientos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        setOpenDialog(false);
        cargarMovimientos();
        limpiarFormulario();
        setMessage({
          type: 'success',
          text: 'Movimiento registrado exitosamente'
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({
        type: 'error',
        text: 'Error al registrar el movimiento'
      });
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      tipo_movimiento: '',
      activo_id: '',
      fecha: new Date().toISOString().split('T')[0],
      valor: '',
      motivo: '',
      documento_referencia: '',
      observaciones: ''
    });
    setActivoSeleccionado(null);
  };

  const handleActivoChange = (id) => {
    const activo = activos.find(a => a.id === parseInt(id));
    setActivoSeleccionado(activo);
    setFormData(prev => ({
      ...prev,
      activo_id: id,
      valor: activo ? activo.valor_adquisicion : ''
    }));
  };

  const tiposMovimiento = [
    { value: 'ALTA', label: 'Alta de Activo' },
    { value: 'BAJA', label: 'Baja de Activo' },
    { value: 'MEJORA', label: 'Mejora' },
    { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
    { value: 'REVALUACION', label: 'Revaluación' },
    { value: 'TRANSFERENCIA', label: 'Transferencia' }
  ];

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Movimientos de Activos</CardTitle>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={limpiarFormulario}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Movimiento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Nuevo Movimiento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Movimiento</Label>
                      <Select 
                        value={formData.tipo_movimiento}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          tipo_movimiento: value
                        })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposMovimiento.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Activo</Label>
                      <Select
                        value={formData.activo_id}
                        onValueChange={handleActivoChange}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione activo" />
                        </SelectTrigger>
                        <SelectContent>
                          {activos.map((activo) => (
                            <SelectItem key={activo.id} value={activo.id.toString()}>
                              {activo.codigo} - {activo.descripcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({
                          ...formData,
                          fecha: e.target.value
                        })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor}
                        onChange={(e) => setFormData({
                          ...formData,
                          valor: e.target.value
                        })}
                        required
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Motivo</Label>
                      <Input
                        value={formData.motivo}
                        onChange={(e) => setFormData({
                          ...formData,
                          motivo: e.target.value
                        })}
                        required
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Documento de Referencia</Label>
                      <Input
                        value={formData.documento_referencia}
                        onChange={(e) => setFormData({
                          ...formData,
                          documento_referencia: e.target.value
                        })}
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Observaciones</Label>
                      <Textarea
                        value={formData.observaciones}
                        onChange={(e) => setFormData({
                          ...formData,
                          observaciones: e.target.value
                        })}
                        rows={3}
                      />
                    </div>
                  </div>

                  {activoSeleccionado && (
                    <div className="bg-gray-50 p-4 rounded-lg mt-4">
                      <h4 className="font-medium mb-2">Datos del Activo</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Código:</span> {activoSeleccionado.codigo}
                        </div>
                        <div>
                          <span className="font-medium">Descripción:</span> {activoSeleccionado.descripcion}
                        </div>
                        <div>
                          <span className="font-medium">Valor Actual:</span> S/. {
                            parseFloat(activoSeleccionado.valor_adquisicion).toLocaleString('es-PE', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })
                          }
                        </div>
                        <div>
                          <span className="font-medium">Estado:</span> {activoSeleccionado.estado}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setOpenDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Guardar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert 
              className={`mb-4 ${message.type === 'error' ? 'bg-red-50' : 'bg-green-50'}`}
            >
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>{new Date(mov.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>{mov.tipo_movimiento}</TableCell>
                    <TableCell>{mov.activo_codigo}</TableCell>
                    <TableCell>{mov.activo_descripcion}</TableCell>
                    <TableCell>{mov.documento_referencia}</TableCell>
                    <TableCell>
                      S/. {parseFloat(mov.valor).toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell>{mov.estado}</TableCell>
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

export default MovimientosActivos;
