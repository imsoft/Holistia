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
import { createBlockInGoogleCalendar } from '@/actions/google-calendar';

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
  const [activeTab, setActiveTab] = useState('full_day');
  const [formData, setFormData] = useState<AvailabilityBlockFormData>({
    title: '',
    description: '',
    block_type: 'full_day',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    day_of_week: 1,
    is_recurring: false,
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

  // Horas disponibles (de 0:00 a 23:00)
  const availableHours = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { value: `${hour}:00`, label: `${hour}:00` };
  });

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
      let tab = 'full_day';
      if (editingBlock.block_type === 'weekly_range') tab = 'weekly_range';
      else if (editingBlock.block_type === 'full_day' || editingBlock.block_type === 'weekly_day') tab = 'full_day';
      setActiveTab(tab);
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
    let blockType: 'weekly_range' | 'full_day' = 'full_day';
    if (value === 'weekly_range') blockType = 'weekly_range';

    setFormData(prev => ({
      ...prev,
      block_type: blockType
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('El título es obligatorio');
      return false;
    }

    if (activeTab === 'full_day') {
      if (!formData.start_date || !formData.end_date) {
        toast.error('Las fechas de inicio y fin son obligatorias');
        return false;
      }
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        toast.error('La fecha de inicio debe ser anterior a la fecha de fin');
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

      // Agregar campos específicos según el tipo de bloqueo
      if (formData.block_type === 'full_day') {
        // Rango de fechas completo (bloquea todos los días del rango, todo el día)
        blockData.start_date = formData.start_date;
        blockData.end_date = formData.end_date;
        // No lleva day_of_week, start_time ni end_time
      } else if (formData.block_type === 'weekly_range') {
        // Rango de horas dentro de días específicos
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

        // Emitir evento para recargar el calendario
        window.dispatchEvent(new Event('reload-calendar'));

        onBlockUpdated?.();
      } else {
        const { data: newBlock, error } = await supabase
          .from('availability_blocks')
          .insert(blockData)
          .select('id')
          .single();

        if (error) throw error;

        toast.success('Bloqueo creado correctamente');

        // Intentar sincronizar con Google Calendar (no bloqueante)
        if (newBlock?.id) {
          createBlockInGoogleCalendar(newBlock.id, userId)
            .then((result) => {
              if (result.success) {
                console.log('✅ Bloqueo sincronizado con Google Calendar');
              } else {
                const errorMsg = 'error' in result ? result.error : 'Error desconocido';
                console.warn('⚠️ No se pudo sincronizar con Google Calendar:', errorMsg);
              }
            })
            .catch((err) => {
              console.error('❌ Error al sincronizar con Google Calendar:', err);
            });
        }

        // Emitir evento para recargar el calendario
        window.dispatchEvent(new Event('reload-calendar'));

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
              <TabsTrigger value="full_day">Rango de Fechas</TabsTrigger>
              <TabsTrigger value="weekly_range">Rango de Horas</TabsTrigger>
            </TabsList>

            {/* Tab: Rango de Fechas Completo */}
            <TabsContent value="full_day" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title_fullday">Título del bloqueo *</Label>
                  <Input
                    id="title_fullday"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ej: Vacaciones"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description_fullday">Descripción (opcional)</Label>
                  <Textarea
                    id="description_fullday"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe el motivo del bloqueo..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date_fullday">Fecha de inicio *</Label>
                    <Input
                      id="start_date_fullday"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date_fullday">Fecha de fin *</Label>
                    <Input
                      id="end_date_fullday"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleInputChange('end_date', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Este tipo de bloqueo bloqueará <strong>todos los días</strong> desde la fecha de inicio hasta la fecha de fin, incluyendo todas las horas del día.
                  </p>
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
                    <Label htmlFor="day_of_week_start">Día de inicio *</Label>
                    <Select
                      value={formData.start_date ? new Date(formData.start_date + 'T00:00:00').getDay().toString() : '1'}
                      onValueChange={(value) => {
                        const dayOfWeek = parseInt(value);
                        const today = new Date();
                        const targetDay = dayOfWeek === 0 ? 0 : dayOfWeek;
                        const currentDay = today.getDay();
                        let daysToAdd = targetDay - currentDay;
                        if (daysToAdd < 0) daysToAdd += 7;
                        const targetDate = new Date(today);
                        targetDate.setDate(today.getDate() + daysToAdd);
                        handleInputChange('start_date', targetDate.toISOString().split('T')[0]);
                      }}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Selecciona día" />
                      </SelectTrigger>
                      <SelectContent>
                        {weekDays.map((day) => (
                          <SelectItem key={day.value} value={day.value === 7 ? '0' : day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="day_of_week_end">Día de fin *</Label>
                    <Select
                      value={formData.end_date ? new Date(formData.end_date + 'T00:00:00').getDay().toString() : '5'}
                      onValueChange={(value) => {
                        const dayOfWeek = parseInt(value);
                        const startDate = formData.start_date ? new Date(formData.start_date + 'T00:00:00') : new Date();
                        const targetDay = dayOfWeek === 0 ? 0 : dayOfWeek;
                        const startDay = startDate.getDay();
                        let daysToAdd = targetDay - startDay;
                        if (daysToAdd < 0) daysToAdd += 7;
                        const targetDate = new Date(startDate);
                        targetDate.setDate(startDate.getDate() + daysToAdd);
                        handleInputChange('end_date', targetDate.toISOString().split('T')[0]);
                      }}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Selecciona día" />
                      </SelectTrigger>
                      <SelectContent>
                        {weekDays.map((day) => (
                          <SelectItem key={day.value} value={day.value === 7 ? '0' : day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Hora de inicio *</Label>
                    <Select
                      value={formData.start_time}
                      onValueChange={(value) => handleInputChange('start_time', value)}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Selecciona hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableHours.map((hour) => (
                          <SelectItem key={hour.value} value={hour.value}>
                            {hour.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="end_time">Hora de fin *</Label>
                    <Select
                      value={formData.end_time}
                      onValueChange={(value) => handleInputChange('end_time', value)}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Selecciona hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableHours.map((hour) => (
                          <SelectItem key={hour.value} value={hour.value}>
                            {hour.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Este tipo de bloqueo bloqueará las horas seleccionadas dentro del rango de días de la semana. Por ejemplo, de Lunes a Viernes de 12:00 a 14:00.
                    {formData.is_recurring && ' Si está marcado como recurrente, se aplicará todas las semanas.'}
                  </p>
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
