'use client';

import { useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { parseLocalDate } from '@/lib/date-utils';

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
  const normalizeDayOfWeek = useCallback((jsDay: number) => (jsDay === 0 ? 7 : jsDay), []);

  // Rango de días de la semana (1=Lun ... 7=Dom). Soporta wrap-around (p.ej. 6-2).
  const isDayOfWeekInRange = useCallback((day: number, start: number, end: number) => {
    if (start <= end) return day >= start && day <= end;
    return day >= start || day <= end;
  }, []);
  
  // Caché global para datos del profesional
  const professionalCache = useRef<{
    workingHours: ProfessionalWorkingHours | null;
    lastFetch: number;
  }>({ workingHours: null, lastFetch: 0 });
  
  // TTL del caché (5 minutos)
  const CACHE_TTL = 5 * 60 * 1000;

  // Obtener horarios de trabajo del profesional con caché
  const getProfessionalWorkingHours = useCallback(async (): Promise<ProfessionalWorkingHours | null> => {
    const now = Date.now();
    
    // Verificar caché primero
    if (professionalCache.current.workingHours && 
        (now - professionalCache.current.lastFetch) < CACHE_TTL) {
      console.log('🚀 Usando datos del profesional desde caché');
      return professionalCache.current.workingHours;
    }
    
    try {
      const { data, error } = await supabase
        .from('professional_applications')
        .select('working_start_time, working_end_time, working_days')
        .eq('id', professionalId)
        .single();

      if (error) throw error;
      
      console.log('🔍 Datos del profesional obtenidos:', {
        professionalId,
        working_days: data?.working_days,
        working_start_time: data?.working_start_time,
        working_end_time: data?.working_end_time
      });
      
      // Guardar en caché
      professionalCache.current = {
        workingHours: data,
        lastFetch: now
      };
      
      return data;
    } catch (error) {
      console.error('Error fetching professional working hours:', error);
      return null;
    }
  }, [professionalId, supabase, CACHE_TTL]);

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
  const blocksCache = useRef<Map<string, Array<{id?: string; title?: string; block_type: string; start_date: string; end_date?: string; start_time?: string; end_time?: string; day_of_week?: number; is_recurring?: boolean}>>>(new Map());
  
  const getAvailabilityBlocks = useCallback(async (startDate: string, endDate: string) => {
    const cacheKey = `${startDate}-${endDate}`;
    
    // TEMPORAL: Deshabilitar caché de bloqueos para asegurar datos frescos
    // TODO: Implementar invalidación de caché cuando se actualiza un bloqueo
    const USE_CACHE = false;

    // Verificar caché
    if (USE_CACHE && blocksCache.current.has(cacheKey)) {
      const cached = blocksCache.current.get(cacheKey)!;
      return cached;
    }

    try {
      // Consulta para obtener TODOS los bloqueos del profesional
      // NO filtramos por fechas en SQL porque los bloqueos recurrentes deben incluirse siempre
      // El filtrado por fechas se hace en JavaScript después
      // Incluimos bloqueos externos de Google Calendar (is_external_event = true)
      const { data, error } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professionalId);

      if (error) {
        console.error('❌ Error en consulta de bloqueos:', error);
        throw error;
      }
      
      const blocks = data || [];
      
      // Filtrar bloqueos que se superponen con el rango de fechas
      const filteredBlocks = blocks.filter(block => {
        const blockStart = parseLocalDate(block.start_date);
        const blockEnd = block.end_date ? parseLocalDate(block.end_date) : blockStart;
        const rangeStart = parseLocalDate(startDate);
        const rangeEnd = parseLocalDate(endDate);

        // Normalizar fechas para comparación
        blockStart.setHours(0, 0, 0, 0);
        blockEnd.setHours(0, 0, 0, 0);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd.setHours(0, 0, 0, 0);

        // Para bloqueos recurrentes, SIEMPRE incluirlos ya que se aplican por patrón semanal.
        // Nota: También incluimos legacy `full_day`/`time_range` con `is_recurring=true` porque
        // hay UI que crea bloqueos recurrentes sin cambiar el block_type.
        if (
          block.is_recurring &&
          (block.block_type === 'weekly_day' ||
            block.block_type === 'weekly_range' ||
            block.block_type === 'full_day' ||
            block.block_type === 'time_range')
        ) {
          return true; // Siempre incluir bloqueos recurrentes
        }

        // Para bloqueos no recurrentes (incluye Google Calendar), verificar superposición normal
        // IMPORTANTE: Los bloqueos de Google Calendar son siempre no recurrentes
        const overlaps = blockStart <= rangeEnd && blockEnd >= rangeStart;
        return overlaps;
      });
      
      // Guardar en caché
      blocksCache.current.set(cacheKey, filteredBlocks);
      
      return filteredBlocks;
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
    availabilityBlocks: Array<{id?: string; title?: string; block_type: string; start_date: string; end_date?: string; start_time?: string; end_time?: string; day_of_week?: number; is_recurring?: boolean}>
  ): Promise<TimeSlot[]> => {
    const timeSlots: TimeSlot[] = [];
    
    // Verificar si es un día de trabajo
    // Parsear la fecha manualmente para evitar problemas de zona horaria
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
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
    const dayBlocks = availabilityBlocks.filter(block => {
      // Convertir fechas a objetos Date para comparación correcta
      // Usar hora local para evitar problemas de zona horaria
      const blockStartDate = parseLocalDate(block.start_date);
      const blockEndDate = block.end_date ? parseLocalDate(block.end_date) : blockStartDate;
      const currentDate = parseLocalDate(date);
      
      // Normalizar fechas para comparación (solo fecha, sin hora)
      blockStartDate.setHours(0, 0, 0, 0);
      blockEndDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      // Verificar si la fecha actual está dentro del rango del bloqueo
      const isInDateRange = currentDate >= blockStartDate && currentDate <= blockEndDate;
      const dayOfWeekCurrent = normalizeDayOfWeek(currentDate.getDay());
      const dayOfWeekStart = normalizeDayOfWeek(blockStartDate.getDay());
      const dayOfWeekEnd = normalizeDayOfWeek(blockEndDate.getDay());
      
      // Manejar diferentes tipos de bloqueos
      if (block.block_type === 'weekly_day') {
        // Bloqueo de día completo (puede ser recurrente o de una sola vez)
        // JavaScript getDay(): 0=Domingo, 1=Lunes, 2=Martes, etc.
        // Nuestro sistema: 1=Lunes, 2=Martes, 3=Miércoles, ..., 7=Domingo
        const jsDay = currentDate.getDay();
        const dayOfWeekCurrent = normalizeDayOfWeek(jsDay); // Convertir domingo de 0 a 7
        const matchesDayOfWeek = block.day_of_week === dayOfWeekCurrent;

        if (block.is_recurring) {
          // Recurrente: Aplica a TODAS las ocurrencias del día de la semana, sin importar la fecha
          return matchesDayOfWeek;
        } else {
          // No recurrente: Solo aplica a la fecha específica en start_date
          const dateString = date; // Ya es string YYYY-MM-DD
          return matchesDayOfWeek && block.start_date === dateString;
        }
      } else if (block.block_type === 'weekly_range') {
        // Bloqueo de rango de horas (puede ser recurrente o de una sola vez)
        // Verificar si el día actual está en el rango de días de la semana (con soporte wrap-around)
        const isInWeekRange = isDayOfWeekInRange(dayOfWeekCurrent, dayOfWeekStart, dayOfWeekEnd);

        if (block.is_recurring) {
          // Recurrente: Aplica a TODAS las ocurrencias dentro del rango de días, sin importar la fecha
          return isInWeekRange;
        } else {
          // No recurrente: Solo aplica dentro del rango de fechas específicas
          return isInWeekRange && isInDateRange;
        }
      } else if (block.block_type === 'full_day') {
        // Bloqueo de día completo (legacy)
        if (block.is_recurring) {
          // Legacy recurrente: interpretar como patrón semanal basado en start_date/end_date
          return isDayOfWeekInRange(dayOfWeekCurrent, dayOfWeekStart, dayOfWeekEnd);
        }
        return isInDateRange;
      } else if (block.block_type === 'time_range') {
        // Bloqueo de rango de tiempo (legacy o de Google Calendar)
        // IMPORTANTE: Los bloqueos de Google Calendar son siempre no recurrentes
        // porque cada instancia de un evento recurrente se trata como un evento separado
        if (block.is_recurring) {
          // Legacy recurrente: interpretar como patrón semanal dentro del rango de días de la semana
          return isDayOfWeekInRange(dayOfWeekCurrent, dayOfWeekStart, dayOfWeekEnd);
        }
        // No recurrente (incluye Google Calendar): Solo aplica dentro del rango de fechas específicas
        return isInDateRange;
      }
      
      return false;
    });

    // Verificar si hay bloqueo de día completo
    const hasFullDayBlock = dayBlocks.some(block =>
      block.block_type === 'full_day' || block.block_type === 'weekly_day'
    );

    // Generar horarios de hora en hora
    for (let hour = startHour; hour < endHour; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const display = `${hour.toString().padStart(2, '0')}:00`;
      const fullDateTime = `${date}T${timeString}`;

      let status: TimeSlot['status'] = 'available';

      // Si el día completo está bloqueado, marcar todos los slots como bloqueados
      if (hasFullDayBlock) {
        status = 'blocked';
      }
      // Verificar si está ocupado por una cita (solo si no está bloqueado el día completo)
      else if (appointmentTimes.has(timeString)) {
        status = 'occupied';
      }
      // Verificar si está bloqueado por rango de horas (incluyendo eventos de Google Calendar)
      else if (dayBlocks.some(block => {
        if (block.block_type === 'time_range' && block.start_time && block.end_time) {
          const blockStart = block.start_time;
          const blockEnd = block.end_time;
          // Verificar si el horario está dentro del rango bloqueado
          // El bloqueo aplica si timeString >= start_time Y timeString < end_time
          return timeString >= blockStart && timeString < blockEnd;
        } else if (block.block_type === 'weekly_range' && block.start_time && block.end_time) {
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
      today.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación
      
      // Asegurar que startDate esté normalizado
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);
      
      console.log('📅 loadWeekAvailability - Fechas:', {
        startDate: startDate.toISOString(),
        normalizedStartDate: normalizedStartDate.toISOString(),
        today: today.toISOString(),
        todayFormatted: today.toLocaleDateString('es-ES')
      });
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(normalizedStartDate);
        date.setDate(normalizedStartDate.getDate() + i);
        date.setHours(0, 0, 0, 0); // Normalizar a medianoche
        
        // Solo mostrar días futuros (incluyendo hoy)
        const isFutureOrToday = date >= today;
        console.log('📅 Evaluando fecha:', {
          date: date.toISOString(),
          dateFormatted: date.toLocaleDateString('es-ES'),
          today: today.toISOString(),
          todayFormatted: today.toLocaleDateString('es-ES'),
          isFutureOrToday,
          comparison: date.getTime() >= today.getTime()
        });
        
        if (isFutureOrToday) {
          const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          const monthNames = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
          ];
          
          const dayName = dayNames[date.getDay()];
          const monthName = monthNames[date.getMonth()];
          const dayNumber = date.getDate();
          const dateString = date.toISOString().split('T')[0];
          const display = `${dayName} ${dayNumber} ${monthName}`;
          
          console.log('✅ Agregando fecha:', {
            dateString,
            dayName,
            display,
            monthName,
            dayNumber
          });
          
          dates.push({
            date: dateString,
            dayName,
            display,
            timeSlots: []
          });
        } else {
          console.log('❌ Fecha pasada, omitiendo:', date.toLocaleDateString('es-ES'));
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

      // Validar que el profesional tenga días de trabajo configurados
      if (!workingHours.working_days || workingHours.working_days.length === 0) {
        console.warn('⚠️ El profesional no tiene días de trabajo configurados, usando valores por defecto');
        workingHours.working_days = [1, 2, 3, 4, 5]; // Lunes a Viernes por defecto
        workingHours.working_start_time = workingHours.working_start_time || '09:00';
        workingHours.working_end_time = workingHours.working_end_time || '18:00';
      }

      console.log('🔧 Horarios de trabajo finales:', {
        working_days: workingHours.working_days,
        working_start_time: workingHours.working_start_time,
        working_end_time: workingHours.working_end_time
      });

      // Generar horarios para cada día en paralelo
      const weekData = await Promise.all(dates.map(async day => {
        // Verificar si es un día de trabajo antes de generar horarios
        const [year, month, dayNum] = day.date.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, dayNum);
        const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
        
        if (!workingHours.working_days.includes(dayOfWeek)) {
          return { ...day, timeSlots: [] };
        }
        
        return {
          ...day,
          timeSlots: await generateTimeSlots(day.date, workingHours, existingAppointments, availabilityBlocks)
        };
      }));

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
