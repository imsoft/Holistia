"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

interface FavoriteCache {
  [key: string]: Set<string>; // favoriteType -> Set of itemIds
}

/**
 * Hook para cachear y gestionar favoritos del usuario
 * Evita queries N+1 haciendo una sola query para obtener todos los favoritos
 */
export function useFavorites(userId: string | null) {
  const [favoritesCache, setFavoritesCache] = useState<FavoriteCache>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  // Cargar todos los favoritos del usuario una sola vez
  const loadFavorites = useCallback(async () => {
    if (!userId) {
      setFavoritesCache({});
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Obtener todos los favoritos del usuario en una sola query
      const { data, error: fetchError } = await supabase
        .from("user_favorites")
        .select("*")
        .eq("user_id", userId);

      if (fetchError) throw fetchError;

      // Organizar favoritos por tipo en un cache
      const cache: FavoriteCache = {};

      (data || []).forEach((favorite: any) => {
        // Determinar el tipo y el ID basado en qué columna tiene valor
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

      setFavoritesCache(cache);
    } catch (err) {
      console.error("Error loading favorites:", err);
      setError(err instanceof Error ? err : new Error("Error al cargar favoritos"));
    } finally {
      setIsLoading(false);
    }
  }, [userId, supabase]);

  // Cargar favoritos cuando cambia el userId
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Verificar si un item es favorito
  const isFavorite = useCallback(
    (itemId: string, favoriteType: string): boolean => {
      const typeSet = favoritesCache[favoriteType];
      return typeSet ? typeSet.has(itemId) : false;
    },
    [favoritesCache]
  );

  // Agregar favorito al cache (optimistic update)
  const addToCache = useCallback((itemId: string, favoriteType: string) => {
    setFavoritesCache((prev) => {
      const newCache = { ...prev };
      if (!newCache[favoriteType]) {
        newCache[favoriteType] = new Set();
      }
      newCache[favoriteType].add(itemId);
      return newCache;
    });
  }, []);

  // Remover favorito del cache (optimistic update)
  const removeFromCache = useCallback((itemId: string, favoriteType: string) => {
    setFavoritesCache((prev) => {
      const newCache = { ...prev };
      if (newCache[favoriteType]) {
        newCache[favoriteType].delete(itemId);
      }
      return newCache;
    });
  }, []);

  // Refrescar favoritos (útil después de agregar/eliminar)
  const refresh = useCallback(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    isFavorite,
    addToCache,
    removeFromCache,
    refresh,
    isLoading,
    error,
  };
}
