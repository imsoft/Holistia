"use client";

import { useState, useEffect, useContext, createContext } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserId } from "@/stores/user-store";

type FavoriteType = "professional" | "challenge" | "event" | "restaurant" | "shop" | "digital_product" | "holistic_center";

interface FavoriteButtonProps {
  itemId: string;
  favoriteType: FavoriteType;
  variant?: "default" | "floating" | "icon";
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  onToggle?: (isFavorite: boolean) => void;
  favoritesCache?: Set<string>; // Cache opcional de favoritos para evitar queries
}

// Contexto para cachear favoritos globalmente
const FavoritesContext = createContext<{
  favoritesCache: { [key: string]: Set<string> };
  refreshFavorites: () => void;
} | null>(null);

export function FavoritesProvider({ children, userId }: { children: React.ReactNode; userId: string | null }) {
  const [favoritesCache, setFavoritesCache] = useState<{ [key: string]: Set<string> }>({});
  const supabase = createClient();

  const refreshFavorites = async () => {
    if (!userId) {
      setFavoritesCache({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;

      const cache: { [key: string]: Set<string> } = {};
      (data || []).forEach((fav: any) => {
        if (fav.professional_id) {
          if (!cache.professional) cache.professional = new Set();
          cache.professional.add(fav.professional_id);
        }
        if (fav.challenge_id) {
          if (!cache.challenge) cache.challenge = new Set();
          cache.challenge.add(fav.challenge_id);
        }
        if (fav.event_id) {
          if (!cache.event) cache.event = new Set();
          cache.event.add(fav.event_id);
        }
        if (fav.restaurant_id) {
          if (!cache.restaurant) cache.restaurant = new Set();
          cache.restaurant.add(fav.restaurant_id);
        }
        if (fav.shop_id) {
          if (!cache.shop) cache.shop = new Set();
          cache.shop.add(fav.shop_id);
        }
        if (fav.digital_product_id) {
          if (!cache.digital_product) cache.digital_product = new Set();
          cache.digital_product.add(fav.digital_product_id);
        }
        if (fav.holistic_center_id) {
          if (!cache.holistic_center) cache.holistic_center = new Set();
          cache.holistic_center.add(fav.holistic_center_id);
        }
      });

      setFavoritesCache(cache);
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  useEffect(() => {
    refreshFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <FavoritesContext.Provider value={{ favoritesCache, refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function FavoriteButton({
  itemId,
  favoriteType,
  variant = "default",
  className,
  size = "icon",
  onToggle,
  favoritesCache: propCache, // Cache pasado como prop (para backwards compatibility)
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const userId = useUserId();
  const supabase = createClient();
  const context = useContext(FavoritesContext);

  // Usar cache del contexto o prop, priorizando prop si existe
  const favoritesCache = propCache || context?.favoritesCache[favoriteType];

  useEffect(() => {
    // Verificar favorito desde cache (no hace query)
    if (favoritesCache) {
      setIsFavorite(favoritesCache.has(itemId));
    } else if (userId) {
      // Fallback: verificar individualmente solo si no hay cache
      checkIfFavorite();
    } else {
      setIsFavorite(false);
    }
  }, [itemId, favoriteType, favoritesCache, userId]);

  const checkIfFavorite = async () => {
    if (!userId) return;
    
    try {
      const columnName = `${favoriteType}_id`;
      const { data, error } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", userId)
        .eq(columnName, itemId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error checking favorite:", error);
        return;
      }

      setIsFavorite(!!data);
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Si no hay usuario, redirigir a login
    if (!userId) {
      window.location.href = '/login';
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const columnName = `${favoriteType}_id`;

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", userId)
          .eq(columnName, itemId);

        if (error) throw error;
        
        // Optimistic update: remover del cache
        setIsFavorite(false);
        context?.refreshFavorites(); // Refrescar cache global
        onToggle?.(false);
      } else {
        // Add to favorites
        const favoriteData: any = {
          user_id: userId,
          favorite_type: favoriteType,
        };
        favoriteData[columnName] = itemId;

        const { error } = await supabase
          .from("user_favorites")
          .insert(favoriteData);

        if (error) throw error;
        
        // Optimistic update: agregar al cache
        setIsFavorite(true);
        context?.refreshFavorites(); // Refrescar cache global
        onToggle?.(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar el botón siempre, pero deshabilitado mientras verifica
  // El botón redirigirá a login si no hay usuario

  if (variant === "floating") {
    // SIEMPRE renderizar el botón, incluso durante la carga
    // El botón debe ser visible siempre, sin condiciones
    return (
      <button
        type="button"
        onClick={handleToggleFavorite}
        disabled={isLoading}
        className={cn(
          "p-2.5 bg-white rounded-full hover:bg-gray-50 active:bg-gray-100 transition-all shadow-xl border-2 border-gray-400 group/favorite",
          "w-[40px] h-[40px] flex items-center justify-center",
          "relative",
          isLoading && "opacity-90 cursor-wait",
          !isLoading && "opacity-100 cursor-pointer hover:scale-110",
          className
        )}
        title={!userId ? "Inicia sesión para agregar a favoritos" : isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
        style={{ 
          zIndex: 9999,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
        aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-all",
            isFavorite
              ? "text-red-600 fill-red-600"
              : "text-gray-700 group-hover/favorite:text-red-600 group-hover/favorite:fill-red-600"
          )}
          style={{ 
            width: '20px', 
            height: '20px',
            display: 'block'
          }}
        />
      </button>
    );
  }

  if (variant === "icon") {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleToggleFavorite}
        disabled={isLoading}
        className={cn(
          isFavorite && "text-red-500 border-red-500 bg-red-50",
          className
        )}
      >
        <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={cn(
        isFavorite && "text-red-500 border-red-500 bg-red-50",
        className
      )}
    >
      <Heart className={cn("h-4 w-4 mr-2", isFavorite && "fill-current")} />
      {isFavorite ? "Guardado" : "Guardar"}
    </Button>
  );
}
