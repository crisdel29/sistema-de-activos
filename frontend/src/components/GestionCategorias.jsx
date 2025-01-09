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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';

const GestionCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    cuenta_contable: '',
    vida_util: '',
    tasa_depreciacion: ''
  });

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categorias');
      if (!response.ok) {
        throw new Error('Error al cargar categorías');
      }
      const data = await response.json();
      setCategorias(data);
      setMessage({
        type: 'success',
        text: 'Categorías cargadas correctamente'
      });
    } catch (error) {
      console.error('Error cargando categorías:', error);
      setCategorias([]);
      setMessage({
        type: 'error',
        text: 'Error cargando las categorías'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/categorias', {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Error al guardar la categoría');
      }

      await cargarCategorias();
      setOpenDialog(false);
      setMessage({
        type: 'success',
        text: editingId ? 'Categoría actualizada' : 'Categoría creada'
      });
      limpiarFormulario();
    } catch (error) {
      console.error('Error guardando categoría:', error);
      setMessage({
        type: 'error',
        text: 'Error guardando la categoría'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (categoria) => {
    setFormData({
      codigo: categoria.codigo,
      nombre: categoria.nombre,
      cuenta_contable: categoria.cuenta_contable,
      vida_util: categoria.vida_util.toString(),
      tasa_depreciacion: categoria.tasa_depreciacion.toString()
    });
    setEditingId(categoria.id);
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta categoría?')) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/categorias/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la categoría');
      }

      await cargarCategorias();
      setMessage({
        type: 'success',
        text: 'Categoría eliminada'
      });
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      setMessage({
        type: 'error',
        text: 'Error al eliminar la categoría'
      });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      codigo: '',
      nombre: '',
      cuenta_contable: '',
      vida_util: '',
      tasa_depreciacion: ''
    });
    setEditingId(null);
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Gestión de Categorías</CardTitle>
            <Dialog open={openDialog} onOpenChange={(open) => {
              if (!open) limpiarFormulario();
              setOpenDialog(open);
            }}>
              <Button onClick={() => setOpenDialog(true)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Nueva Categoría
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
                  </DialogTitle>
                  <DialogDescription>
                    Complete los datos de la categoría. Todos los campos son obligatorios.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({
                        ...formData,
                        codigo: e.target.value
                      })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({
                        ...formData,
                        nombre: e.target.value
                      })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cuenta">Cuenta Contable</Label>
                    <Input
                      id="cuenta"
                      value={formData.cuenta_contable}
                      onChange={(e) => setFormData({
                        ...formData,
                        cuenta_contable: e.target.value
                      })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vida_util">Vida Útil (años)</Label>
                      <Input
                        id="vida_util"
                        type="number"
                        min="1"
                        value={formData.vida_util}
                        onChange={(e) => setFormData({
                          ...formData,
                          vida_util: e.target.value
                        })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tasa">Tasa Depreciación (%)</Label>
                      <Input
                        id="tasa"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.tasa_depreciacion}
                        onChange={(e) => setFormData({
                          ...formData,
                          tasa_depreciacion: e.target.value
                        })}
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpenDialog(false)}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {message && (
            <Alert
              className={`mb-4 ${message.type === 'error' ? 'bg-red-50' : 
                message.type === 'success' ? 'bg-green-50' : 'bg-blue-50'}`}
            >
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-4">Cargando categorías...</div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cuenta Contable</TableHead>
                    <TableHead>Vida Útil</TableHead>
                    <TableHead>Tasa Dep.</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorias.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell>{categoria.codigo}</TableCell>
                      <TableCell>{categoria.nombre}</TableCell>
                      <TableCell>{categoria.cuenta_contable}</TableCell>
                      <TableCell>{categoria.vida_util} años</TableCell>
                      <TableCell>{categoria.tasa_depreciacion}%</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(categoria)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(categoria.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GestionCategorias;
