'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import type { AvailabilityBlock, AvailabilityBlockFormData } from '@/types/availability';

interface BlockCreatorTabsProps {
  professionalId: string;
  userId: string;
  onBlockCreated?: () => void;
  onBlockUpdated?: () => void;
  editingBlock?: AvailabilityBlock | null;
  onCancel?: () => void;
}

export function BlockCreatorTabs({ 
  professionalId, 
  userId, 
  onBlockCreated, 
  onBlockUpdated,
  editingBlock,
  onCancel 
}: BlockCreatorTabsProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState('weekly_day');
  const [formData, setFormData] = useState<AvailabilityBlockFormData>({
    title: '',
    description: '',
    block_type: 'weekly_day',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    day_of_week: 1,
    is_recurring: true,
  });
  const [loading, setLoading] = useState(false);

  // Días de la semana
  const weekDays = [
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' },
    { value: 7, label: 'Domingo' },
  ];

  // Cargar datos del bloqueo si se está editando
  useEffect(() => {
    if (editingBlock) {
      setFormData({
        title: editingBlock.title,
        description: editingBlock.description || '',
        block_type: editingBlock.block_type,
        start_date: editingBlock.start_date,
        end_date: editingBlock.end_date || '',
        start_time: editingBlock.start_time || '',
        end_time: editingBlock.end_time || '',
        day_of_week: editingBlock.day_of_week || 1,
        is_recurring: editingBlock.is_recurring,
      });
      setActiveTab(editingBlock.block_type === 'weekly_day' ? 'weekly_day' : 'weekly_range');
    }
  }, [editingBlock]);

  const handleInputChange = (field: keyof AvailabilityBlockFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setFormData(prev => ({
      ...prev,
      block_type: value === 'weekly_day' ? 'weekly_day' : 'weekly_range'
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('El título es obligatorio');
      return false;
    }

    if (activeTab === 'weekly_day') {
      if (!formData.day_of_week) {
        toast.error('Selecciona un día de la semana');
        return false;
      }
    } else {
      if (!formData.start_date || !formData.end_date) {
        toast.error('Las fechas de inicio y fin son obligatorias');
        return false;
      }
      if (!formData.start_time || !formData.end_time) {
        toast.error('Los horarios de inicio y fin son obligatorios');
        return false;
      }
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        toast.error('La fecha de inicio debe ser anterior a la fecha de fin');
        return false;
      }
      if (formData.start_time >= formData.end_time) {
        toast.error('El horario de inicio debe ser anterior al horario de fin');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const blockData: Record<string, unknown> = {
        professional_id: professionalId,
        user_id: userId,
        title: formData.title,
        description: formData.description || null,
        block_type: formData.block_type,
        is_recurring: formData.is_recurring,
      };

      // Solo agregar campos de fecha si no son "weekly_day"
      if (formData.block_type === 'weekly_day') {
        blockData.day_of_week = formData.day_of_week;
        // Para bloqueos semanales de día completo, usamos una fecha de inicio (hoy)
        blockData.start_date = new Date().toISOString().split('T')[0];
      } else if (formData.block_type === 'weekly_range') {
        blockData.start_date = formData.start_date;
        blockData.end_date = formData.end_date;
        blockData.start_time = formData.start_time;
        blockData.end_time = formData.end_time;
      }

      if (editingBlock) {
        const { error } = await supabase
          .from('availability_blocks')
          .update(blockData)
          .eq('id', editingBlock.id);

        if (error) throw error;
        toast.success('Bloqueo actualizado correctamente');
        onBlockUpdated?.();
      } else {
        const { error } = await supabase
          .from('availability_blocks')
          .insert(blockData);

        if (error) throw error;
        toast.success('Bloqueo creado correctamente');
        onBlockCreated?.();
      }
    } catch (error) {
      console.error('Error saving block:', error);
      toast.error('Error al guardar el bloqueo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {editingBlock ? 'Editar Bloqueo' : 'Crear Nuevo Bloqueo'}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weekly_day">Día Completo</TabsTrigger>
              <TabsTrigger value="weekly_range">Rango de Horas</TabsTrigger>
            </TabsList>

            {/* Tab: Día Completo */}
            <TabsContent value="weekly_day" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título del bloqueo *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ej: Día de descanso"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe el motivo del bloqueo..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="day_of_week">Día de la semana *</Label>
                  <Select
                    value={formData.day_of_week?.toString()}
                    onValueChange={(value) => handleInputChange('day_of_week', parseInt(value))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona un día" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDays.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_recurring_day"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
                  />
                  <Label htmlFor="is_recurring_day">
                    Aplicar este bloqueo todas las semanas
                  </Label>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Rango de Horas */}
            <TabsContent value="weekly_range" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title_range">Título del bloqueo *</Label>
                  <Input
                    id="title_range"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ej: Horario de almuerzo"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description_range">Descripción (opcional)</Label>
                  <Textarea
                    id="description_range"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe el motivo del bloqueo..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Fecha de inicio *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Fecha de fin *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleInputChange('end_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Hora de inicio *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">Hora de fin *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_recurring_range"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => handleInputChange('is_recurring', checked)}
                  />
                  <Label htmlFor="is_recurring_range">
                    Aplicar este rango todas las semanas
                  </Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="min-w-[120px]"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Guardando...
            </div>
          ) : editingBlock ? (
            'Actualizar'
          ) : (
            'Crear Bloqueo'
          )}
        </Button>
      </div>
    </div>
  );
}
