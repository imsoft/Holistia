'use client';

import { useCallback, useRef } from 'react';
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

  // Obtener horarios de trabajo del profesional
  const getProfessionalWorkingHours = useCallback(async (): Promise<ProfessionalWorkingHours | null> => {
    try {
      const { data, error } = await supabase
        .from('professional_applications')
        .select('working_start_time, working_end_time, working_days')
        .eq('id', professionalId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching professional working hours:', error);
      return null;
    }
  }, [professionalId, supabase]);

  // Obtener horarios personalizados por día (si existen)
  const getCustomDaySchedules = useCallback(async (): Promise<Map<number, {startTime: string, endTime: string}>> => {
    try {
      // Por ahora, usamos los horarios generales
      // En el futuro, esto podría ser una tabla separada para horarios por día
      const workingHours = await getProfessionalWorkingHours();
      if (!workingHours) return new Map();

      const schedules = new Map<number, {startTime: string, endTime: string}>();
      
      // Aplicar el mismo horario a todos los días laborales
      workingHours.working_days.forEach(day => {
        schedules.set(day, {
          startTime: workingHours.working_start_time,
          endTime: workingHours.working_end_time
        });
      });

      return schedules;
    } catch (error) {
      console.error('Error fetching custom day schedules:', error);
      return new Map();
    }
  }, [getProfessionalWorkingHours]);

  // Obtener citas existentes para un rango de fechas (con caché)
  const appointmentCache = useRef<Map<string, Array<{appointment_date: string; appointment_time: string; status: string}>>>(new Map());
  
  const getExistingAppointments = useCallback(async (startDate: string, endDate: string) => {
    const cacheKey = `${startDate}-${endDate}`;
    
    // Verificar caché
    if (appointmentCache.current.has(cacheKey)) {
      return appointmentCache.current.get(cacheKey)!;
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time, status')
        .eq('professional_id', professionalId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .in('status', ['pending', 'confirmed']);

      if (error) throw error;
      
      const appointments = data || [];
      // Guardar en caché
      appointmentCache.current.set(cacheKey, appointments);
      
      return appointments;
    } catch (error) {
      console.error('Error fetching existing appointments:', error);
      return [];
    }
  }, [professionalId, supabase]);

  // Obtener bloqueos de disponibilidad para un rango de fechas (con caché)
  const blocksCache = useRef<Map<string, Array<{id?: string; block_type: string; start_date: string; end_date?: string; start_time?: string; end_time?: string}>>>(new Map());
  
  const getAvailabilityBlocks = useCallback(async (startDate: string, endDate: string) => {
    const cacheKey = `${startDate}-${endDate}`;
    
    // Verificar caché
    if (blocksCache.current.has(cacheKey)) {
      return blocksCache.current.get(cacheKey)!;
    }

    try {
      console.log('🔍 Buscando bloqueos para rango:', { startDate, endDate, professionalId });
      
      // Consulta simplificada para obtener todos los bloqueos del profesional
      const { data, error } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professionalId);

      if (error) {
        console.error('❌ Error en consulta de bloqueos:', error);
        throw error;
      }
      
      const blocks = data || [];
      console.log('📋 Bloqueos encontrados:', blocks);
      
      // Guardar en caché
      blocksCache.current.set(cacheKey, blocks);
      
      return blocks;
    } catch (error) {
      console.error('Error fetching availability blocks:', error);
      return [];
    }
  }, [professionalId, supabase]);

  // Generar horarios para una fecha específica
  const generateTimeSlots = useCallback(async (
    date: string,
    workingHours: ProfessionalWorkingHours,
    existingAppointments: Array<{appointment_date: string; appointment_time: string; status: string}>,
    availabilityBlocks: Array<{id?: string; block_type: string; start_date: string; end_date?: string; start_time?: string; end_time?: string}>
  ): Promise<TimeSlot[]> => {
    const timeSlots: TimeSlot[] = [];
    
    // Verificar si es un día de trabajo
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
    
    if (!workingHours.working_days.includes(dayOfWeek)) {
      return timeSlots; // No hay horarios si no es día de trabajo
    }

    // Obtener horarios personalizados para este día
    const customSchedules = await getCustomDaySchedules();
    const daySchedule = customSchedules.get(dayOfWeek);
    
    // Usar horarios personalizados si existen, sino usar los generales
    const startTime = daySchedule?.startTime || workingHours.working_start_time;
    const endTime = daySchedule?.endTime || workingHours.working_end_time;
    
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);

    // Obtener citas para esta fecha
    const dayAppointments = existingAppointments.filter(apt => apt.appointment_date === date);
    const appointmentTimes = new Set(dayAppointments.map(apt => apt.appointment_time));

    // Obtener bloqueos para esta fecha
    console.log('🔍 Procesando bloqueos para fecha:', date);
    console.log('📋 Todos los bloqueos disponibles:', availabilityBlocks);
    
    const dayBlocks = availabilityBlocks.filter(block => {
      console.log('🔍 Evaluando bloqueo:', {
        id: block.id || 'sin-id',
        block_type: block.block_type,
        start_date: block.start_date,
        end_date: block.end_date,
        fecha_actual: date
      });
      
      // Convertir fechas a objetos Date para comparación correcta
      const blockStartDate = new Date(block.start_date);
      const blockEndDate = block.end_date ? new Date(block.end_date) : null;
      const currentDate = new Date(date);
      
      // Normalizar fechas para comparación (solo fecha, sin hora)
      blockStartDate.setHours(0, 0, 0, 0);
      if (blockEndDate) blockEndDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      console.log('📅 Fechas normalizadas:', {
        blockStart: blockStartDate.toISOString().split('T')[0],
        blockEnd: blockEndDate?.toISOString().split('T')[0] || 'null',
        current: currentDate.toISOString().split('T')[0]
      });
      
      if (block.block_type === 'full_day') {
        const applies = currentDate >= blockStartDate && (!blockEndDate || currentDate <= blockEndDate);
        console.log('📅 Bloqueo de día completo aplica:', applies);
        return applies;
      } else if (block.block_type === 'time_range') {
        const applies = currentDate >= blockStartDate && (!blockEndDate || currentDate <= blockEndDate);
        console.log('⏰ Bloqueo de rango de tiempo aplica:', applies);
        return applies;
      }
      return false;
    });

    console.log('📋 Bloqueos aplicables para la fecha:', dayBlocks);

    // Verificar si hay bloqueo de día completo
    const hasFullDayBlock = dayBlocks.some(block => block.block_type === 'full_day');
    console.log('🚫 ¿Día completamente bloqueado?', hasFullDayBlock);

    if (hasFullDayBlock) {
      console.log('🚫 Día completamente bloqueado, no generando horarios');
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
  }, [getCustomDaySchedules]);

  // Cargar datos de disponibilidad para una semana
  const loadWeekAvailability = useCallback(async (startDate: Date): Promise<DayData[]> => {
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
      const weekData = await Promise.all(dates.map(async day => ({
        ...day,
        timeSlots: await generateTimeSlots(day.date, workingHours, existingAppointments, availabilityBlocks)
      })));

      return weekData;
    } catch (error) {
      console.error('Error loading week availability:', error);
      return [];
    }
  }, [getProfessionalWorkingHours, getExistingAppointments, getAvailabilityBlocks, generateTimeSlots]);

  return {
    loadWeekAvailability
  };
}
