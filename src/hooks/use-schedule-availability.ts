'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

interface TimeSlot {
  time: string;
  display: string;
  fullDateTime: string;
  status: 'available' | 'occupied' | 'blocked' | 'not_offered';
}

interface DayData {
  date: string;
  dayName: string;
  display: string;
  timeSlots: TimeSlot[];
}

interface ProfessionalWorkingHours {
  working_start_time: string;
  working_end_time: string;
  working_days: number[];
}

export function useScheduleAvailability(professionalId: string) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // Obtener horarios de trabajo del profesional
  const getProfessionalWorkingHours = useCallback(async (): Promise<ProfessionalWorkingHours | null> => {
    try {
      const { data, error } = await supabase
        .from('professional_applications')
        .select('working_start_time, working_end_time, working_days')
        .eq('id', professionalId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching professional working hours:', error);
      return null;
    }
  }, [professionalId, supabase]);

  // Obtener citas existentes para un rango de fechas
  const getExistingAppointments = useCallback(async (startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time, status')
        .eq('professional_id', professionalId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .in('status', ['pending', 'confirmed']);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching existing appointments:', error);
      return [];
    }
  }, [professionalId, supabase]);

  // Obtener bloqueos de disponibilidad para un rango de fechas
  const getAvailabilityBlocks = useCallback(async (startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professionalId)
        .or(`and(start_date.gte.${startDate},start_date.lte.${endDate}),and(end_date.gte.${startDate},end_date.lte.${endDate}),and(start_date.lte.${startDate},end_date.gte.${endDate})`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching availability blocks:', error);
      return [];
    }
  }, [professionalId, supabase]);

  // Generar horarios para una fecha específica
  const generateTimeSlots = useCallback((
    date: string,
    workingHours: ProfessionalWorkingHours,
    existingAppointments: Array<{appointment_date: string; appointment_time: string; status: string}>,
    availabilityBlocks: Array<{block_type: string; start_date: string; end_date?: string; start_time?: string; end_time?: string}>
  ): TimeSlot[] => {
    const timeSlots: TimeSlot[] = [];
    const [startHour] = workingHours.working_start_time.split(':').map(Number);
    const [endHour] = workingHours.working_end_time.split(':').map(Number);
    
    // Verificar si es un día de trabajo
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
    
    if (!workingHours.working_days.includes(dayOfWeek)) {
      return timeSlots; // No hay horarios si no es día de trabajo
    }

    // Obtener citas para esta fecha
    const dayAppointments = existingAppointments.filter(apt => apt.appointment_date === date);
    const appointmentTimes = new Set(dayAppointments.map(apt => apt.appointment_time));

    // Obtener bloqueos para esta fecha
    const dayBlocks = availabilityBlocks.filter(block => {
      if (block.block_type === 'full_day') {
        return block.start_date <= date && (!block.end_date || block.end_date >= date);
      } else if (block.block_type === 'time_range') {
        return block.start_date <= date && (!block.end_date || block.end_date >= date);
      }
      return false;
    });

    // Verificar si hay bloqueo de día completo
    const hasFullDayBlock = dayBlocks.some(block => block.block_type === 'full_day');

    if (hasFullDayBlock) {
      return timeSlots; // No hay horarios si el día está completamente bloqueado
    }

    // Generar horarios de hora en hora
    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const display = `${hour.toString().padStart(2, '0')}:00`;
      const fullDateTime = `${date}T${timeString}`;
      
      let status: TimeSlot['status'] = 'available';

      // Verificar si está ocupado por una cita
      if (appointmentTimes.has(timeString)) {
        status = 'occupied';
      }
      // Verificar si está bloqueado
      else if (dayBlocks.some(block => {
        if (block.block_type === 'time_range' && block.start_time && block.end_time) {
          const blockStart = block.start_time;
          const blockEnd = block.end_time;
          return timeString >= blockStart && timeString < blockEnd;
        }
        return false;
      })) {
        status = 'blocked';
      }

      timeSlots.push({
        time: timeString,
        display,
        fullDateTime,
        status
      });
    }

    return timeSlots;
  }, []);

  // Cargar datos de disponibilidad para una semana
  const loadWeekAvailability = useCallback(async (startDate: Date): Promise<DayData[]> => {
    setLoading(true);
    try {
      // Generar fechas de la semana
      const dates: DayData[] = [];
      const today = new Date();
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        // Solo mostrar días futuros (incluyendo hoy)
        if (date >= today) {
          const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          const monthNames = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
          ];
          
          const dayName = dayNames[date.getDay()];
          const display = `${dayName} ${date.getDate()} ${monthNames[date.getMonth()]}`;
          
          dates.push({
            date: date.toISOString().split('T')[0],
            dayName,
            display,
            timeSlots: []
          });
        }
      }

      if (dates.length === 0) return [];

      // Obtener datos necesarios
      const [workingHours, existingAppointments, availabilityBlocks] = await Promise.all([
        getProfessionalWorkingHours(),
        getExistingAppointments(dates[0].date, dates[dates.length - 1].date),
        getAvailabilityBlocks(dates[0].date, dates[dates.length - 1].date)
      ]);

      if (!workingHours) {
        console.error('No se pudieron obtener los horarios de trabajo del profesional');
        return dates;
      }

      // Generar horarios para cada día
      const weekData = dates.map(day => ({
        ...day,
        timeSlots: generateTimeSlots(day.date, workingHours, existingAppointments, availabilityBlocks)
      }));

      return weekData;
    } catch (error) {
      console.error('Error loading week availability:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getProfessionalWorkingHours, getExistingAppointments, getAvailabilityBlocks, generateTimeSlots]);

  return {
    loading,
    loadWeekAvailability
  };
}
