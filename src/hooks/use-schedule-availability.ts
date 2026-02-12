'use client';

import { useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { formatLocalDate } from '@/lib/date-utils';
import { useBlocksStore } from '@/stores/blocks-store';
import {
  filterBlocksForDateRange,
  doesBlockApplyToDate,
  doesBlockCoverTime,
  isFullDayBlocked,
  type BlockData,
} from '@/lib/availability';

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

export interface LoadAvailabilityOptions {
  excludeAppointmentId?: string;
}

interface ProfessionalWorkingHours {
  working_start_time: string;
  working_end_time: string;
  working_days: number[];
}

export function useScheduleAvailability(professionalId: string) {
  // Log de versión para verificar que se está usando el código actualizado
  console.log('🚀 HOOK VERSION: 2026-02-11-DEBUG-v2 - Hook inicializado para:', professionalId);

  // Estabilizar la referencia del cliente Supabase para evitar cascadas de recreación de callbacks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), []);
  
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
  // supabase es estable (useMemo), CACHE_TTL es constante
  }, [professionalId, supabase]);

  // Obtener citas existentes para un rango de fechas (con caché corto de 30 segundos).
  // excludeAppointmentId: al reprogramar, excluir esa cita para que su slot aparezca disponible.
  const appointmentCache = useRef<Map<string, { data: Array<{id?: string; appointment_date: string; appointment_time: string; status: string}>; timestamp: number }>>(new Map());
  const APPOINTMENT_CACHE_TTL = 30 * 1000; // 30 segundos - cache corto para datos críticos

  const getExistingAppointments = useCallback(async (
    startDate: string,
    endDate: string,
    excludeAppointmentId?: string
  ) => {
    const cacheKey = `${startDate}-${endDate}-${excludeAppointmentId ?? ''}`;
    const now = Date.now();

    // Verificar si hay cache válido
    const cached = appointmentCache.current.get(cacheKey);
    if (cached && (now - cached.timestamp) < APPOINTMENT_CACHE_TTL) {
      console.log('📦 Appointments - Usando caché válido:', {
        cacheKey,
        age: `${Math.floor((now - cached.timestamp) / 1000)}s`,
        count: cached.data.length
      });
      return cached.data;
    }

    console.log('🔍 Appointments - Cargando datos frescos:', { cacheKey });

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, status')
        .eq('professional_id', professionalId)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .in('status', ['pending', 'confirmed', 'paid']);

      if (error) throw error;

      let appointments = (data || []) as Array<{id?: string; appointment_date: string; appointment_time: string; status: string}>;
      if (excludeAppointmentId) {
        appointments = appointments.filter((a) => a.id !== excludeAppointmentId);
      }

      // Guardar en caché con timestamp
      appointmentCache.current.set(cacheKey, { data: appointments, timestamp: now });

      console.log('✅ Appointments - Cargados y cacheados:', {
        cacheKey,
        count: appointments.length,
        appointments: appointments.map(a => ({ date: a.appointment_date, time: a.appointment_time }))
      });

      return appointments;
    } catch (error) {
      console.error('Error fetching existing appointments:', error);
      return [];
    }
  }, [professionalId, supabase]);

  // Obtener bloqueos de disponibilidad usando el store centralizado (con cache y invalidación)
  // Usar getState() directamente para evitar que la referencia cambie entre renders
  const getAvailabilityBlocks = useCallback(async (startDate: string, endDate: string) => {
    try {
      // Usar el store centralizado que tiene cache con TTL e invalidación
      const blocks = await useBlocksStore.getState().loadBlocks(professionalId);

      console.log('📦 Total bloques cargados desde store:', blocks.length);
      console.log('📦 Bloques externos (Google):', blocks.filter(b => b.is_external_event).length);

      // Usar función compartida para filtrar bloques relevantes al rango de fechas
      const filteredBlocks = filterBlocksForDateRange(blocks, startDate, endDate);

      console.log('📦 Bloques filtrados para rango', startDate, '-', endDate, ':', filteredBlocks.length);

      return filteredBlocks;
    } catch (error) {
      console.error('Error fetching availability blocks:', error);
      return [];
    }
  }, [professionalId]);

  // Generar horarios para una fecha específica
  // Usa las funciones compartidas de lib/availability.ts para garantizar consistencia
  const generateTimeSlots = useCallback((
    date: string,
    workingHours: ProfessionalWorkingHours,
    existingAppointments: Array<{id?: string; appointment_date: string; appointment_time: string; status: string}>,
    availabilityBlocks: BlockData[]
  ): TimeSlot[] => {
    const timeSlots: TimeSlot[] = [];

    // Verificar si es un día de trabajo
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();

    if (!workingHours.working_days.includes(dayOfWeek)) {
      return timeSlots;
    }

    // Usar directamente los horarios del parámetro (fuente única de verdad)
    const startTime = workingHours.working_start_time;
    const endTime = workingHours.working_end_time;

    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);

    // Determinar si es hoy para filtrar horas pasadas
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = date === todayStr;
    const currentHour = now.getHours();

    // Citas del día, normalizadas a HH:MM
    const dayAppointments = existingAppointments.filter(apt => apt.appointment_date === date);
    const appointmentTimes = new Set(dayAppointments.map(apt => apt.appointment_time.substring(0, 5)));

    // Filtrar bloques que aplican a esta fecha (usando lógica compartida)
    const dayBlocks = availabilityBlocks.filter(block => doesBlockApplyToDate(date, block));

    // Debug: Log bloques para esta fecha
    if (dayBlocks.length > 0) {
      console.log('🔍 Bloques aplicables para', date, ':', dayBlocks.map(b => ({
        title: b.title,
        block_type: b.block_type,
        start_time: b.start_time,
        end_time: b.end_time,
        is_external_event: b.is_external_event
      })));
    }

    // Verificar si hay bloqueo de día completo
    const hasFullDayBlock = isFullDayBlocked(date, dayBlocks);

    // Generar horarios de hora en hora
    for (let hour = startHour; hour < endHour; hour++) {
      // Si es hoy, omitir horas que ya pasaron
      if (isToday && hour <= currentHour) continue;

      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const display = `${hour.toString().padStart(2, '0')}:00`;
      const fullDateTime = `${date}T${timeString}`;

      let status: TimeSlot['status'] = 'available';

      if (hasFullDayBlock) {
        status = 'blocked';
      } else if (appointmentTimes.has(timeString)) {
        status = 'occupied';
      } else if (dayBlocks.some(block => {
        const covers = doesBlockCoverTime(timeString, block, 60);
        // Debug: Log cuando un bloque cubre un slot
        if (covers) {
          console.log('🚫 Slot', timeString, 'bloqueado por:', {
            title: block.title,
            start_time: block.start_time,
            end_time: block.end_time
          });
        }
        return covers;
      })) {
        status = 'blocked';
      }

      timeSlots.push({ time: timeString, display, fullDateTime, status });
    }

    return timeSlots;
  }, []);

  // Cargar datos de disponibilidad para una semana (options.excludeAppointmentId para reprogramar)
  const loadWeekAvailability = useCallback(async (
    startDate: Date,
    options?: LoadAvailabilityOptions
  ): Promise<DayData[]> => {
    const excludeAppointmentId = options?.excludeAppointmentId;
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
          const dateString = formatLocalDate(date);
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
        getExistingAppointments(dates[0].date, dates[dates.length - 1].date, excludeAppointmentId),
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

      // Generar horarios para cada día
      const weekData = dates.map(day => ({
        ...day,
        timeSlots: generateTimeSlots(day.date, workingHours, existingAppointments, availabilityBlocks)
      }));

      return weekData;
    } catch (error) {
      console.error('Error loading week availability:', error);
      return [];
    }
  }, [getProfessionalWorkingHours, getExistingAppointments, getAvailabilityBlocks, generateTimeSlots]);

  // Slots para una sola fecha (útil para reprogramar: elegir día y ver solo horarios disponibles)
  const getTimeSlotsForDate = useCallback(async (
    date: string,
    options?: { excludeAppointmentId?: string }
  ): Promise<TimeSlot[]> => {
    const [workingHours, existingAppointments, availabilityBlocks] = await Promise.all([
      getProfessionalWorkingHours(),
      getExistingAppointments(date, date, options?.excludeAppointmentId),
      getAvailabilityBlocks(date, date)
    ]);
    if (!workingHours) return [];
    const hours = {
      ...workingHours,
      working_days: workingHours.working_days?.length ? workingHours.working_days : [1, 2, 3, 4, 5],
      working_start_time: workingHours.working_start_time || '09:00',
      working_end_time: workingHours.working_end_time || '18:00'
    };
    return generateTimeSlots(date, hours, existingAppointments, availabilityBlocks);
  }, [getProfessionalWorkingHours, getExistingAppointments, getAvailabilityBlocks, generateTimeSlots]);

  return {
    loadWeekAvailability,
    getTimeSlotsForDate
  };
}
