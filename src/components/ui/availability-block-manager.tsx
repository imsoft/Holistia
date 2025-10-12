'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Calendar, Clock, Trash2, Edit, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import type { AvailabilityBlock, AvailabilityBlockFormData } from '@/types/availability';

interface AvailabilityBlockManagerProps {
  professionalId: string;
  userId?: string;
}

export default function AvailabilityBlockManager({ professionalId, userId: propUserId }: AvailabilityBlockManagerProps) {
  const supabase = createClient();
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(propUserId || null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<AvailabilityBlock | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<AvailabilityBlockFormData>({
    title: '',
    description: '',
    block_type: 'full_day',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_recurring: false,
  });

  // Obtener userId si no se pasó como prop
  useEffect(() => {
    if (!propUserId) {
      const getUserId = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      };
      getUserId();
    }
  }, [propUserId, supabase]);

  const fetchBlocks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professionalId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching availability blocks:', error);
      toast.error('Error al cargar los bloqueos de disponibilidad');
    } finally {
      setLoading(false);
    }
  }, [professionalId, supabase]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    if (!formData.start_date) {
      toast.error('La fecha de inicio es obligatoria');
      return;
    }

    if (formData.block_type === 'time_range') {
      if (!formData.start_time || !formData.end_time) {
        toast.error('Las horas de inicio y fin son obligatorias para bloqueos de rango');
        return;
      }
      
      if (formData.start_time >= formData.end_time) {
        toast.error('La hora de inicio debe ser anterior a la hora de fin');
        return;
      }
    }

    if (!userId) {
      toast.error('Error: No se pudo obtener el ID del usuario');
      return;
    }

    try {
      const blockData = {
        professional_id: professionalId,
        user_id: userId,
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        block_type: formData.block_type,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        start_time: formData.block_type === 'time_range' ? formData.start_time : null,
        end_time: formData.block_type === 'time_range' ? formData.end_time : null,
        is_recurring: formData.is_recurring,
      };

      console.log('Datos a insertar:', blockData);

      if (editingBlock) {
        const { error } = await supabase
          .from('availability_blocks')
          .update(blockData)
          .eq('id', editingBlock.id);

        if (error) {
          console.error('Error completo:', error);
          throw error;
        }
        toast.success('Bloqueo actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('availability_blocks')
          .insert([blockData]);

        if (error) {
          console.error('Error completo:', error);
          throw error;
        }
        toast.success('Bloqueo creado correctamente');
      }

      resetForm();
      fetchBlocks();
      setIsDialogOpen(false);
    } catch (error: unknown) {
      console.error('Error saving availability block:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el bloqueo';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (block: AvailabilityBlock) => {
    setEditingBlock(block);
    setFormData({
      title: block.title,
      description: block.description || '',
      block_type: block.block_type,
      start_date: block.start_date,
      end_date: block.end_date || '',
      start_time: block.start_time || '',
      end_time: block.end_time || '',
      is_recurring: block.is_recurring,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (blockId: string) => {
    setBlockToDelete(blockId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!blockToDelete) return;

    try {
      const { error } = await supabase
        .from('availability_blocks')
        .delete()
        .eq('id', blockToDelete);

      if (error) throw error;
      toast.success('Bloqueo eliminado correctamente');
      fetchBlocks();
    } catch (error: unknown) {
      console.error('Error deleting availability block:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el bloqueo';
      toast.error(errorMessage);
    } finally {
      setBlockToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      block_type: 'full_day',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: '',
      is_recurring: false,
    });
    setEditingBlock(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBlockTypeIcon = (type: string) => {
    return type === 'full_day' ? <Calendar className="w-4 h-4" /> : <Clock className="w-4 h-4" />;
  };

  const getBlockTypeLabel = (type: string) => {
    return type === 'full_day' ? 'Día Completo' : 'Rango de Horas';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Cargando bloqueos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Bloqueos de Disponibilidad</h2>
          <p className="text-muted-foreground">
            Bloquea días u horarios específicos cuando no estés disponible
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Bloqueo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBlock ? 'Editar Bloqueo' : 'Agregar Bloqueo'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Vacaciones, Capacitación, Consulta externa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción adicional del bloqueo"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="block_type">Tipo de Bloqueo *</Label>
                <Select
                  value={formData.block_type}
                  onValueChange={(value: 'full_day' | 'time_range') => 
                    setFormData({ ...formData, block_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_day">Día Completo</SelectItem>
                    <SelectItem value="time_range">Rango de Horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Fecha de Inicio *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Fecha de Fin (opcional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date}
                  />
                </div>
              </div>

              {formData.block_type === 'time_range' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Hora de Inicio *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time">Hora de Fin *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, is_recurring: checked })
                  }
                />
                <Label htmlFor="is_recurring">Repetir semanalmente</Label>
              </div>

              {formData.is_recurring && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    Este bloqueo se repetirá cada semana en el mismo día y horario
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingBlock ? 'Actualizar' : 'Crear'} Bloqueo
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {blocks.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay bloqueos configurados</h3>
              <p className="text-muted-foreground mb-4">
                Agrega bloqueos para días u horarios cuando no estés disponible
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primer Bloqueo
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {blocks.map((block) => (
            <Card key={block.id}>
              <CardHeader className="pb-4 pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-3">
                      {getBlockTypeIcon(block.block_type)}
                      {block.title}
                      {block.is_recurring && (
                        <Badge variant="secondary">Recurrente</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <Badge variant="outline">
                        {getBlockTypeLabel(block.block_type)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(block)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(block.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-6">
                {block.description && (
                  <p className="text-muted-foreground mb-4">{block.description}</p>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Período:</span>
                    <span>
                      {formatDate(block.start_date)}
                      {block.end_date && block.end_date !== block.start_date && (
                        <> - {formatDate(block.end_date)}</>
                      )}
                    </span>
                  </div>

                  {block.block_type === 'time_range' && block.start_time && block.end_time && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Horario:</span>
                      <span>
                        {formatTime(block.start_time)} - {formatTime(block.end_time)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de confirmación para eliminar */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar Bloqueo"
        description="¿Estás seguro de que quieres eliminar este bloqueo de disponibilidad? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
