'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import type { AvailabilityBlock, AvailabilityBlockFormData } from '@/types/availability';

interface BlockCreatorProps {
  professionalId: string;
  userId: string;
  onBlockCreated?: () => void;
  onBlockUpdated?: () => void;
  editingBlock?: AvailabilityBlock | null;
  onCancel?: () => void;
}

export function BlockCreator({ 
  professionalId, 
  userId, 
  onBlockCreated, 
  onBlockUpdated,
  editingBlock,
  onCancel 
}: BlockCreatorProps) {
  const supabase = createClient();
  const [currentStep, setCurrentStep] = useState(1);
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
  const [loading, setLoading] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<{start: string, end: string} | null>(null);

  // Inicializar formulario si se está editando
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
        is_recurring: editingBlock.is_recurring,
      });
      
      // Si es un bloqueo de día completo, agregar la fecha a selectedDates
      if (editingBlock.block_type === 'full_day') {
        setSelectedDates([editingBlock.start_date]);
      }
      
      // Si es un bloqueo de rango de tiempo, configurar el rango
      if (editingBlock.block_type === 'time_range' && editingBlock.start_time && editingBlock.end_time) {
        setSelectedTimeRange({
          start: editingBlock.start_time,
          end: editingBlock.end_time
        });
      }
    }
  }, [editingBlock]);

  // Generar fechas para el calendario (próximas 8 semanas)
  const generateCalendarDates = useCallback(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 56; i++) { // 8 semanas
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const monthNames = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
      ];
      
      const dayName = dayNames[date.getDay()];
      const monthName = monthNames[date.getMonth()];
      const dayNumber = date.getDate();
      const dateString = date.toISOString().split('T')[0];
      
      dates.push({
        date: dateString,
        dayName,
        monthName,
        dayNumber,
        isToday: i === 0,
        isPast: i < 0
      });
    }
    
    return dates;
  }, []);

  const calendarDates = generateCalendarDates();

  // Generar horarios disponibles
  const generateTimeSlots = useCallback(() => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(timeString);
    }
    return slots;
  }, []);

  const timeSlots = generateTimeSlots();

  const handleDateSelect = (date: string) => {
    if (formData.block_type === 'full_day') {
      // Para día completo, solo una fecha
      setSelectedDates([date]);
      setFormData(prev => ({ ...prev, start_date: date, end_date: date }));
    } else {
      // Para rango de días, permitir múltiples fechas
      if (selectedDates.includes(date)) {
        setSelectedDates(prev => prev.filter(d => d !== date));
      } else {
        setSelectedDates(prev => [...prev, date].sort());
      }
      
      if (selectedDates.length > 0) {
        const sortedDates = [...selectedDates, date].sort();
        setFormData(prev => ({ 
          ...prev, 
          start_date: sortedDates[0], 
          end_date: sortedDates[sortedDates.length - 1] 
        }));
      }
    }
  };

  const handleTimeSelect = (time: string, type: 'start' | 'end') => {
    if (type === 'start') {
      setSelectedTimeRange(prev => ({ 
        start: time, 
        end: prev?.end || time 
      }));
    } else {
      setSelectedTimeRange(prev => ({ 
        start: prev?.start || time, 
        end: time 
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    if (formData.block_type === 'full_day' && selectedDates.length === 0) {
      toast.error('Selecciona al menos una fecha');
      return;
    }

    if (formData.block_type === 'time_range') {
      if (!selectedTimeRange?.start || !selectedTimeRange?.end) {
        toast.error('Selecciona un rango de horarios');
        return;
      }
      if (selectedTimeRange.start >= selectedTimeRange.end) {
        toast.error('La hora de inicio debe ser anterior a la hora de fin');
        return;
      }
    }

    setLoading(true);
    try {
      const blockData = {
        professional_id: professionalId,
        user_id: userId,
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        block_type: formData.block_type,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        start_time: formData.block_type === 'time_range' ? selectedTimeRange?.start : null,
        end_time: formData.block_type === 'time_range' ? selectedTimeRange?.end : null,
        is_recurring: formData.is_recurring,
      };

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
          .insert([blockData]);

        if (error) throw error;
        toast.success('Bloqueo creado correctamente');
        onBlockCreated?.();
      }

      // Reset form
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
      setSelectedDates([]);
      setSelectedTimeRange(null);
      setCurrentStep(1);
      
    } catch (error: unknown) {
      console.error('Error saving block:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el bloqueo';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && formData.title.trim()) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (formData.block_type === 'full_day' && selectedDates.length > 0) {
        setCurrentStep(3);
      } else if (formData.block_type === 'time_range' && selectedTimeRange) {
        setCurrentStep(3);
      } else {
        toast.error('Completa la selección de fechas y horarios');
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {editingBlock ? 'Editar Bloqueo' : 'Crear Nuevo Bloqueo'}
          </h2>
          <p className="text-muted-foreground">
            Bloquea días u horarios cuando no estés disponible
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              currentStep >= step 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              {step}
            </div>
            {step < 3 && (
              <div className={cn(
                "w-16 h-0.5 mx-2",
                currentStep > step ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
        <div className="ml-4 text-sm text-muted-foreground">
          {currentStep === 1 && 'Información básica'}
          {currentStep === 2 && 'Seleccionar fechas'}
          {currentStep === 3 && 'Confirmar bloqueo'}
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Información del Bloqueo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Bloqueo *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Vacaciones, Capacitación, Consulta externa"
                className="text-base"
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
                onValueChange={(value: 'full_day' | 'time_range') => {
                  setFormData({ ...formData, block_type: value });
                  setSelectedDates([]);
                  setSelectedTimeRange(null);
                }}
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
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date and Time Selection */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Calendar */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Seleccionar Fechas
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <div className="grid grid-cols-7 gap-3">
                {calendarDates.map((dateInfo) => (
                  <button
                    key={dateInfo.date}
                    onClick={() => handleDateSelect(dateInfo.date)}
                    disabled={dateInfo.isPast}
                    className={cn(
                      "p-4 text-center rounded-lg border-2 transition-all hover:shadow-md",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      selectedDates.includes(dateInfo.date)
                        ? "border-primary bg-primary text-primary-foreground"
                        : dateInfo.isToday
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="text-sm font-medium">{dateInfo.dayName}</div>
                    <div className="text-xl font-bold">{dateInfo.dayNumber}</div>
                    <div className="text-xs text-muted-foreground">{dateInfo.monthName}</div>
                  </button>
                ))}
              </div>
              
              {formData.block_type === 'full_day' && selectedDates.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Día seleccionado: {selectedDates[0]}
                  </p>
                </div>
              )}
              
              {formData.block_type === 'time_range' && selectedDates.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    {selectedDates.length} día(s) seleccionado(s)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Range Selection (only for time_range) */}
          {formData.block_type === 'time_range' && (
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Seleccionar Horarios
                </CardTitle>
              </CardHeader>
              <CardContent className="py-4">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <Label className="text-base font-medium">Hora de Inicio</Label>
                    <div className="grid grid-cols-5 gap-3 mt-3">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time, 'start')}
                          className={cn(
                            "p-3 text-sm rounded-lg border-2 transition-all",
                            selectedTimeRange?.start === time
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-base font-medium">Hora de Fin</Label>
                    <div className="grid grid-cols-5 gap-3 mt-3">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time, 'end')}
                          className={cn(
                            "p-3 text-sm rounded-lg border-2 transition-all",
                            selectedTimeRange?.end === time
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {selectedTimeRange && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Rango seleccionado: {selectedTimeRange.start} - {selectedTimeRange.end}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === 3 && (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Confirmar Bloqueo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Título</Label>
                <p className="text-base font-medium">{formData.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Tipo</Label>
                <Badge variant="outline">
                  {formData.block_type === 'full_day' ? 'Día Completo' : 'Rango de Horas'}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Fechas</Label>
                <p className="text-base">
                  {formData.start_date}
                  {formData.end_date && formData.end_date !== formData.start_date && 
                    ` - ${formData.end_date}`}
                </p>
              </div>
              {formData.block_type === 'time_range' && selectedTimeRange && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Horarios</Label>
                  <p className="text-base">{selectedTimeRange.start} - {selectedTimeRange.end}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Repetición</Label>
                <p className="text-base">{formData.is_recurring ? 'Semanal' : 'Una sola vez'}</p>
              </div>
            </div>
            
            {formData.description && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
                <p className="text-base">{formData.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          Anterior
        </Button>
        
        {currentStep < 3 ? (
          <Button onClick={nextStep}>
            Siguiente
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Guardando...' : editingBlock ? 'Actualizar Bloqueo' : 'Crear Bloqueo'}
          </Button>
        )}
      </div>
    </div>
  );
}
