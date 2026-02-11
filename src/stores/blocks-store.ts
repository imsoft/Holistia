import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

/**
 * Store para manejar el cache de bloques de disponibilidad
 * con invalidación automática y validación de superposiciones
 */

export interface AvailabilityBlock {
  id: string;
  professional_id: string;
  user_id: string;
  title: string;
  description?: string | null;
  block_type: 'full_day' | 'time_range' | 'weekly_day' | 'weekly_range';
  start_date: string;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  day_of_week?: number | null;
  is_recurring: boolean;
  is_external_event?: boolean;
  external_event_source?: string | null;
  google_calendar_event_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface BlockValidationResult {
  isValid: boolean;
  errors: string[];
  overlappingBlocks: AvailabilityBlock[];
}

interface BlocksState {
  // Cache de bloques por profesional
  blocksCache: Map<string, AvailabilityBlock[]>;
  cacheTimestamp: Map<string, number>;
  // Promesas de carga en progreso por profesional (para deduplicación)
  loadingPromises: Map<string, Promise<AvailabilityBlock[]>>;

  // Actions
  loadBlocks: (professionalId: string, forceRefresh?: boolean) => Promise<AvailabilityBlock[]>;
  invalidateCache: (professionalId: string) => void;
  clearAllCache: () => void;

  // Validación
  validateBlock: (
    professionalId: string,
    newBlock: Partial<AvailabilityBlock>,
    excludeBlockId?: string
  ) => Promise<BlockValidationResult>;

  // Helpers
  isCacheValid: (professionalId: string) => boolean;
}

// Cache válido por 30 segundos (reducido de 2 min para evitar mostrar bloques/citas desactualizadas)
const CACHE_TTL = 30 * 1000;

export const useBlocksStore = create<BlocksState>((set, get) => ({
  blocksCache: new Map(),
  cacheTimestamp: new Map(),
  loadingPromises: new Map(),

  loadBlocks: async (professionalId, forceRefresh = false) => {
    // Ignorar IDs vacíos
    if (!professionalId) return [];

    const state = get();

    // Si no es forzado y el cache es válido, retornar desde cache
    if (!forceRefresh && state.isCacheValid(professionalId)) {
      const cached = state.blocksCache.get(professionalId);
      console.log('📦 Blocks Store - Retornando desde caché válido:', {
        professionalId,
        totalBlocks: cached?.length || 0
      });
      return cached || [];
    }

    // Si ya hay una carga en progreso para este profesional, esperar esa misma promesa
    const existingPromise = state.loadingPromises.get(professionalId);
    if (existingPromise) {
      console.log('📦 Blocks Store - Esperando carga en progreso para:', professionalId);
      return existingPromise;
    }

    // Obtener datos del caché expirado (para usar como fallback si hay error)
    const staleCache = state.blocksCache.get(professionalId);

    // Crear nueva promesa de carga
    const loadPromise = (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('availability_blocks')
          .select('*')
          .eq('professional_id', professionalId)
          .order('start_date', { ascending: true });

        if (error) {
          console.error('Error loading blocks:', error);
          // Retornar caché expirado si hay error
          return staleCache || [];
        }

        const blocks = (data || []) as AvailabilityBlock[];

        console.log('📦 Blocks Store - Bloques cargados desde DB:', {
          professionalId,
          totalBlocks: blocks.length,
          blocks: blocks.map(b => ({
            id: b.id,
            title: b.title,
            block_type: b.block_type,
            start_date: b.start_date,
            end_date: b.end_date,
            start_time: b.start_time,
            end_time: b.end_time,
            day_of_week: b.day_of_week,
            is_recurring: b.is_recurring,
            is_external_event: b.is_external_event
          }))
        });

        // Actualizar cache
        const currentState = get();
        const newCache = new Map(currentState.blocksCache);
        const newTimestamp = new Map(currentState.cacheTimestamp);
        newCache.set(professionalId, blocks);
        newTimestamp.set(professionalId, Date.now());

        set({
          blocksCache: newCache,
          cacheTimestamp: newTimestamp,
        });

        return blocks;
      } catch (error) {
        console.error('Error loading blocks:', error);
        // Retornar caché expirado si hay error
        return staleCache || [];
      } finally {
        // Limpiar la promesa de carga
        const currentState = get();
        const newPromises = new Map(currentState.loadingPromises);
        newPromises.delete(professionalId);
        set({ loadingPromises: newPromises });
      }
    })();

    // Registrar la promesa de carga
    const newPromises = new Map(state.loadingPromises);
    newPromises.set(professionalId, loadPromise);
    set({ loadingPromises: newPromises });

    return loadPromise;
  },

  invalidateCache: (professionalId) => {
    const state = get();
    const newCache = new Map(state.blocksCache);
    const newTimestamp = new Map(state.cacheTimestamp);

    newCache.delete(professionalId);
    newTimestamp.delete(professionalId);

    set({
      blocksCache: newCache,
      cacheTimestamp: newTimestamp,
    });

    console.log('🗑️ Cache de bloques invalidado para:', professionalId);
  },

  clearAllCache: () => {
    set({
      blocksCache: new Map(),
      cacheTimestamp: new Map(),
    });
    console.log('🗑️ Cache de bloques completamente limpiado');
  },

  validateBlock: async (professionalId, newBlock, excludeBlockId) => {
    const errors: string[] = [];
    const overlappingBlocks: AvailabilityBlock[] = [];

    // Validación 1: Campos requeridos
    if (!newBlock.start_date) {
      errors.push('La fecha de inicio es requerida');
    }

    // Validación 2: Rango de fechas válido
    if (newBlock.start_date && newBlock.end_date) {
      if (newBlock.start_date > newBlock.end_date) {
        errors.push('La fecha de inicio debe ser anterior o igual a la fecha de fin');
      }
    }

    // Validación 3: Rango de horas válido (para time_range)
    if (newBlock.block_type === 'time_range' || newBlock.block_type === 'weekly_range') {
      if (!newBlock.start_time || !newBlock.end_time) {
        errors.push('Los bloques de rango de tiempo requieren hora de inicio y fin');
      } else if (newBlock.start_time >= newBlock.end_time) {
        errors.push('La hora de inicio debe ser anterior a la hora de fin');
      }
    }

    // Validación 4: day_of_week válido (para weekly_day)
    if (newBlock.block_type === 'weekly_day' && newBlock.day_of_week != null) {
      if (newBlock.day_of_week < 1 || newBlock.day_of_week > 7) {
        errors.push('El día de la semana debe estar entre 1 (Lunes) y 7 (Domingo)');
      }
    }

    // Si ya hay errores de validación básica, no verificar superposiciones
    if (errors.length > 0) {
      return { isValid: false, errors, overlappingBlocks };
    }

    // Validación 5: Superposiciones con bloques existentes
    const existingBlocks = await get().loadBlocks(professionalId);

    // Filtrar el bloque que estamos editando (si aplica)
    const blocksToCheck = excludeBlockId
      ? existingBlocks.filter(b => b.id !== excludeBlockId)
      : existingBlocks;

    // Solo verificar superposiciones para bloques no externos (manuales)
    // Los bloques de Google Calendar pueden superponerse (el profesional controla su calendario)
    if (!newBlock.is_external_event) {
      for (const existingBlock of blocksToCheck) {
        // Saltar bloques externos (Google Calendar)
        if (existingBlock.is_external_event) continue;

        const overlaps = checkBlockOverlap(newBlock, existingBlock);
        if (overlaps) {
          overlappingBlocks.push(existingBlock);
        }
      }

      if (overlappingBlocks.length > 0) {
        const blockTitles = overlappingBlocks.map(b => `"${b.title}"`).join(', ');
        errors.push(`Este bloque se superpone con: ${blockTitles}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      overlappingBlocks,
    };
  },

  isCacheValid: (professionalId) => {
    const state = get();
    const timestamp = state.cacheTimestamp.get(professionalId);
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_TTL;
  },
}));

/**
 * Verifica si dos bloques se superponen
 */
function checkBlockOverlap(
  blockA: Partial<AvailabilityBlock>,
  blockB: AvailabilityBlock
): boolean {
  // Caso 1: Ambos son bloques de día completo
  if (
    (blockA.block_type === 'full_day' || blockA.block_type === 'weekly_day') &&
    (blockB.block_type === 'full_day' || blockB.block_type === 'weekly_day')
  ) {
    return checkDateOverlap(blockA, blockB);
  }

  // Caso 2: Ambos son bloques de rango de tiempo
  if (
    (blockA.block_type === 'time_range' || blockA.block_type === 'weekly_range') &&
    (blockB.block_type === 'time_range' || blockB.block_type === 'weekly_range')
  ) {
    // Primero verificar si las fechas se superponen
    if (!checkDateOverlap(blockA, blockB)) return false;

    // Luego verificar si los horarios se superponen
    return checkTimeOverlap(blockA, blockB);
  }

  // Caso 3: Un bloque es de día completo y otro de rango de tiempo
  // Si las fechas se superponen, hay conflicto
  if (
    (blockA.block_type === 'full_day' || blockA.block_type === 'weekly_day') &&
    (blockB.block_type === 'time_range' || blockB.block_type === 'weekly_range')
  ) {
    return checkDateOverlap(blockA, blockB);
  }

  if (
    (blockA.block_type === 'time_range' || blockA.block_type === 'weekly_range') &&
    (blockB.block_type === 'full_day' || blockB.block_type === 'weekly_day')
  ) {
    return checkDateOverlap(blockA, blockB);
  }

  return false;
}

/**
 * Verifica si dos rangos de fechas se superponen
 */
function checkDateOverlap(
  blockA: Partial<AvailabilityBlock>,
  blockB: AvailabilityBlock
): boolean {
  // Para bloques recurrentes, verificar si coinciden los días de la semana
  if (blockA.is_recurring && blockB.is_recurring) {
    // Si ambos son weekly_day, comparar day_of_week
    if (blockA.block_type === 'weekly_day' && blockB.block_type === 'weekly_day') {
      return blockA.day_of_week === blockB.day_of_week;
    }

    // Para otros tipos recurrentes, derivar day_of_week de start_date
    const dayA = getDayOfWeekFromDate(blockA.start_date || '');
    const dayB = getDayOfWeekFromDate(blockB.start_date);
    return dayA === dayB;
  }

  // Para bloques no recurrentes, verificar superposición de fechas
  const startA = blockA.start_date || '';
  const endA = blockA.end_date || blockA.start_date || '';
  const startB = blockB.start_date;
  const endB = blockB.end_date || blockB.start_date;

  // Dos rangos se superponen si: startA <= endB AND endA >= startB
  return startA <= endB && endA >= startB;
}

/**
 * Verifica si dos rangos de tiempo se superponen
 */
function checkTimeOverlap(
  blockA: Partial<AvailabilityBlock>,
  blockB: AvailabilityBlock
): boolean {
  const startA = blockA.start_time || '00:00';
  const endA = blockA.end_time || '23:59';
  const startB = blockB.start_time || '00:00';
  const endB = blockB.end_time || '23:59';

  // Dos rangos de tiempo se superponen si: startA < endB AND endA > startB
  return startA < endB && endA > startB;
}

/**
 * Obtiene el día de la semana (1-7) de una fecha string YYYY-MM-DD
 */
function getDayOfWeekFromDate(dateString: string): number {
  if (!dateString) return 0;
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay; // Convertir domingo de 0 a 7
}

// Helper hooks
export const useLoadBlocks = () => useBlocksStore((state) => state.loadBlocks);
export const useInvalidateBlocksCache = () => useBlocksStore((state) => state.invalidateCache);
export const useValidateBlock = () => useBlocksStore((state) => state.validateBlock);
