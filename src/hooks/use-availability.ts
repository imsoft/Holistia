'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { BlockedTimeSlot } from '@/types/availability';

export function useAvailability(professionalId: string) {
  const supabase = createClient();
  const [blockedSlots, setBlockedSlots] = useState<BlockedTimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBlockedSlots = useCallback(async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professionalId)
        .or(`and(start_date.gte.${startDate},start_date.lte.${endDate}),and(end_date.gte.${startDate},end_date.lte.${endDate}),and(start_date.lte.${startDate},end_date.gte.${endDate})`);

      if (error) throw error;

      const blockedSlots: BlockedTimeSlot[] = (data || []).map(block => ({
        date: block.start_date,
        start_time: block.start_time,
        end_time: block.end_time,
        title: block.title,
        description: block.description,
        is_full_day: block.block_type === 'full_day',
      }));

      setBlockedSlots(blockedSlots);
    } catch (error) {
      console.error('Error fetching blocked slots:', error);
      setBlockedSlots([]);
    } finally {
      setLoading(false);
    }
  }, [professionalId, supabase]);

  const isTimeSlotBlocked = useCallback((date: string, time?: string) => {
    const blockedSlot = blockedSlots.find(slot => slot.date === date);
    
    if (!blockedSlot) return false;
    
    // Si es bloqueo de día completo
    if (blockedSlot.is_full_day) return true;
    
    // Si no se especifica hora, no está bloqueado (solo bloqueo de rango)
    if (!time || !blockedSlot.start_time || !blockedSlot.end_time) return false;
    
    // Verificar si la hora está en el rango bloqueado
    return time >= blockedSlot.start_time && time <= blockedSlot.end_time;
  }, [blockedSlots]);

  const getBlockedSlotsForDate = useCallback((date: string) => {
    return blockedSlots.filter(slot => slot.date === date);
  }, [blockedSlots]);

  const isDateBlocked = useCallback((date: string) => {
    const blockedSlot = blockedSlots.find(slot => slot.date === date);
    return blockedSlot?.is_full_day || false;
  }, [blockedSlots]);

  return {
    blockedSlots,
    loading,
    fetchBlockedSlots,
    isTimeSlotBlocked,
    getBlockedSlotsForDate,
    isDateBlocked,
  };
}
