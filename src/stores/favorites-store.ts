import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/utils/supabase/client';

interface FavoritesState {
  // Cache de favoritos por tipo: { favoriteType -> Set of itemIds }
  // Puede ser Set o array después de persistencia
  favoritesCache: { [key: string]: Set<string> | string[] };
  favoritesTimestamp: number | null;
  isLoading: boolean;
  
  // Actions
  loadFavorites: (userId: string | null) => Promise<void>;
  isFavorite: (itemId: string, favoriteType: string) => boolean;
  addToCache: (itemId: string, favoriteType: string) => void;
  removeFromCache: (itemId: string, favoriteType: string) => void;
  refreshFavorites: (userId: string | null) => Promise<void>;
  clearFavorites: () => void;
  
  // Helper para verificar si el caché es válido (menos de 5 minutos)
  isCacheValid: () => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoritesCache: {},
      favoritesTimestamp: null,
      isLoading: false,

      loadFavorites: async (userId) => {
        if (!userId) {
          set({
            favoritesCache: {},
            favoritesTimestamp: null,
            isLoading: false,
          });
          return;
        }

        // Verificar si ya hay una carga en progreso (evitar race condition)
        const state = get();
        if (state.isLoading) {
          return; // Ya hay una carga en progreso
        }

        // Verificar si el cache es válido
        if (state.isCacheValid() && Object.keys(state.favoritesCache).length > 0) {
          return; // Usar cache existente
        }

        // Marcar como cargando ANTES de cualquier operación async
        set({ isLoading: true });

        try {
          const supabase = createClient();

          const { data, error } = await supabase
            .from("user_favorites")
            .select("*")
            .eq("user_id", userId);

          if (error) throw error;

          // Organizar favoritos por tipo en un cache
          const cache: { [key: string]: Set<string> } = {};

          (data || []).forEach((favorite: any) => {
            if (favorite.professional_id) {
              if (!cache.professional) cache.professional = new Set();
              cache.professional.add(favorite.professional_id);
            }
            if (favorite.challenge_id) {
              if (!cache.challenge) cache.challenge = new Set();
              cache.challenge.add(favorite.challenge_id);
            }
            if (favorite.event_id) {
              if (!cache.event) cache.event = new Set();
              cache.event.add(favorite.event_id);
            }
            if (favorite.restaurant_id) {
              if (!cache.restaurant) cache.restaurant = new Set();
              cache.restaurant.add(favorite.restaurant_id);
            }
            if (favorite.shop_id) {
              if (!cache.shop) cache.shop = new Set();
              cache.shop.add(favorite.shop_id);
            }
            if (favorite.digital_product_id) {
              if (!cache.digital_product) cache.digital_product = new Set();
              cache.digital_product.add(favorite.digital_product_id);
            }
            if (favorite.holistic_center_id) {
              if (!cache.holistic_center) cache.holistic_center = new Set();
              cache.holistic_center.add(favorite.holistic_center_id);
            }
          });

          set({
            favoritesCache: cache,
            favoritesTimestamp: Date.now(),
            isLoading: false,
          });
        } catch (error) {
          console.error("Error loading favorites:", error);
          set({ isLoading: false });
        }
      },

      isFavorite: (itemId, favoriteType) => {
        const state = get();
        const cache = state.favoritesCache;
        const typeSet = cache[favoriteType];
        
        if (!typeSet) {
          return false;
        }
        
        // Si es un Set, usarlo directamente
        if (typeSet instanceof Set) {
          return typeSet.has(itemId);
        }
        
        // Si es un array (después de persistencia), convertir a Set y verificar
        if (Array.isArray(typeSet)) {
          return (typeSet as string[]).includes(itemId);
        }
        
        return false;
      },

      addToCache: (itemId, favoriteType) => {
        const state = get();
        const newCache = { ...state.favoritesCache };
        const existing = newCache[favoriteType];
        
        // Convertir a Set si es necesario
        let favoriteSet: Set<string>;
        if (existing instanceof Set) {
          favoriteSet = existing;
        } else if (Array.isArray(existing)) {
          favoriteSet = new Set(existing);
        } else {
          favoriteSet = new Set();
        }
        
        favoriteSet.add(itemId);
        newCache[favoriteType] = favoriteSet;
        set({ favoritesCache: newCache });
      },

      removeFromCache: (itemId, favoriteType) => {
        const state = get();
        const newCache = { ...state.favoritesCache };
        const existing = newCache[favoriteType];
        
        if (existing) {
          // Convertir a Set si es necesario
          let favoriteSet: Set<string>;
          if (existing instanceof Set) {
            favoriteSet = existing;
          } else if (Array.isArray(existing)) {
            favoriteSet = new Set(existing);
          } else {
            return; // No hay nada que eliminar
          }
          
          favoriteSet.delete(itemId);
          newCache[favoriteType] = favoriteSet;
          set({ favoritesCache: newCache });
        }
      },

      refreshFavorites: async (userId) => {
        // Limpiar cache y recargar
        set({ favoritesTimestamp: null });
        await get().loadFavorites(userId);
      },

      clearFavorites: () => {
        set({
          favoritesCache: {},
          favoritesTimestamp: null,
        });
      },

      isCacheValid: () => {
        const state = get();
        if (!state.favoritesTimestamp) {
          return false;
        }
        // Cache válido por 5 minutos (300000 ms)
        const CACHE_DURATION = 5 * 60 * 1000;
        return Date.now() - state.favoritesTimestamp < CACHE_DURATION;
      },
    }),
    {
      name: 'holistia-favorites-store',
      partialize: (state) => ({
        // Convertir Sets a arrays para persistencia (Zustand no puede persistir Sets directamente)
        favoritesCache: Object.keys(state.favoritesCache).reduce((acc, key) => {
          const value = state.favoritesCache[key];
          acc[key] = Array.isArray(value) ? value : (value instanceof Set ? Array.from(value) : []);
          return acc;
        }, {} as { [key: string]: string[] }),
        favoritesTimestamp: state.favoritesTimestamp,
      }),
      // Rehidratar Sets al cargar desde persistencia
      onRehydrateStorage: () => (state) => {
        if (state && state.favoritesCache) {
          // Convertir arrays de vuelta a Sets
          const cache: { [key: string]: Set<string> } = {};
          Object.keys(state.favoritesCache).forEach((key) => {
            const value = state.favoritesCache[key];
            cache[key] = Array.isArray(value) ? new Set(value) : (value instanceof Set ? value : new Set());
          });
          state.favoritesCache = cache as any; // Type assertion necesario para la conversión
        }
      },
    }
  )
);

// Helper hooks para facilitar el uso
export const useFavoritesCache = () => useFavoritesStore((state) => state.favoritesCache);
export const useIsFavorite = (itemId: string, favoriteType: string) => 
  useFavoritesStore((state) => state.isFavorite(itemId, favoriteType));
export const useLoadFavorites = () => useFavoritesStore((state) => state.loadFavorites);
export const useRefreshFavorites = () => useFavoritesStore((state) => state.refreshFavorites);
export const useAddToCache = () => useFavoritesStore((state) => state.addToCache);
export const useRemoveFromCache = () => useFavoritesStore((state) => state.removeFromCache);
