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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusCircle, Pencil } from 'lucide-react';

const RegistroActivos = () => {
  const [activos, setActivos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    categoria_id: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    fecha_adquisicion: '',
    valor_adquisicion: '',
    vida_util: '',
    valor_residual: '0'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  // Función helper para manejar respuestas API
const fetchApi = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Error en la petición a ${url}: ${error.message}`);
  }
};

// Uso en cargarDatos
const cargarDatos = async () => {
  try {
    setIsLoading(true);
    const [activosData, categoriasData] = await Promise.all([
      fetchApi('/api/activos'),
      fetchApi('/api/categorias')
    ]);
    
    setActivos(activosData);
    setCategorias(categoriasData);
  } catch (error) {
    console.error('Error al cargar datos:', error.message);
    setMessage({
      type: 'error',
      text: 'No se pudieron cargar los datos. Por favor, intente nuevamente.'
    });
  } finally {
    setIsLoading(false);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/activos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error al crear el activo');
      }

      await cargarDatos();
      setMessage({
        type: 'success',
        text: 'Activo creado exitosamente'
      });
      setOpenDialog(false);
      limpiarFormulario();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      codigo: '',
      descripcion: '',
      categoria_id: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      fecha_adquisicion: '',
      valor_adquisicion: '',
      vida_util: '',
      valor_residual: '0'
    });
  };

  // Función de validación para el formulario de activos
  const validateFormData = (data) => {
  const errors = {};
  
  // Validación del código
  if (!data.codigo || data.codigo.trim() === '') {
    errors.codigo = 'El código es obligatorio';
  } else if (data.codigo.length > 20) {
    errors.codigo = 'El código no debe exceder los 20 caracteres';
  }
  
  // Validación de la descripción
  if (!data.descripcion || data.descripcion.trim() === '') {
    errors.descripcion = 'La descripción es obligatoria';
  }
  
  // Validación de categoría
  if (!data.categoria_id) {
    errors.categoria_id = 'Debe seleccionar una categoría';
  }
  
  // Validación de fecha de adquisición
  if (!data.fecha_adquisicion) {
    errors.fecha_adquisicion = 'La fecha de adquisición es obligatoria';
  }
  
  // Validación del valor de adquisición
  if (!data.valor_adquisicion || isNaN(data.valor_adquisicion)) {
    errors.valor_adquisicion = 'El valor de adquisición debe ser un número válido';
  } else if (parseFloat(data.valor_adquisicion) <= 0) {
    errors.valor_adquisicion = 'El valor de adquisición debe ser mayor a 0';
  }
  
  // Validación de vida útil
  if (!data.vida_util || isNaN(data.vida_util)) {
    errors.vida_util = 'La vida útil debe ser un número válido';
  } else if (parseInt(data.vida_util) <= 0) {
    errors.vida_util = 'La vida útil debe ser mayor a 0';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Registro de Activos Fijos</CardTitle>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  limpiarFormulario();
                  setOpenDialog(true);
                }}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Nuevo Activo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Activo</DialogTitle>
                  <DialogDescription>
                    Complete los datos del activo. Los campos marcados con * son obligatorios.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="codigo">Código *</Label>
                      <Input
                        id="codigo"
                        value={formData.codigo}
                        onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoría *</Label>
                      <Select
                        value={formData.categoria_id}
                        onValueChange={(value) => setFormData({...formData, categoria_id: value})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="descripcion">Descripción *</Label>
                      <Input
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marca">Marca</Label>
                      <Input
                        id="marca"
                        value={formData.marca}
                        onChange={(e) => setFormData({...formData, marca: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modelo">Modelo</Label>
                      <Input
                        id="modelo"
                        value={formData.modelo}
                        onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numero_serie">Número de Serie</Label>
                      <Input
                        id="numero_serie"
                        value={formData.numero_serie}
                        onChange={(e) => setFormData({...formData, numero_serie: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fecha_adquisicion">Fecha de Adquisición *</Label>
                      <Input
                        id="fecha_adquisicion"
                        type="date"
                        value={formData.fecha_adquisicion}
                        onChange={(e) => setFormData({...formData, fecha_adquisicion: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valor_adquisicion">Valor de Adquisición *</Label>
                      <Input
                        id="valor_adquisicion"
                        type="number"
                        step="0.01"
                        value={formData.valor_adquisicion}
                        onChange={(e) => setFormData({...formData, valor_adquisicion: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vida_util">Vida Útil (años) *</Label>
                      <Input
                        id="vida_util"
                        type="number"
                        value={formData.vida_util}
                        onChange={(e) => setFormData({...formData, vida_util: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-4">
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activos.map((activo) => (
                  <TableRow key={activo.id}>
                    <TableCell>{activo.codigo}</TableCell>
                    <TableCell>{activo.descripcion}</TableCell>
                    <TableCell>{activo.categoria_nombre}</TableCell>
                    <TableCell>{activo.marca}</TableCell>
                    <TableCell>
                      S/. {parseFloat(activo.valor_adquisicion).toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </TableCell>
                    <TableCell>{activo.estado}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
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

export default RegistroActivos;