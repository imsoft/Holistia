"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserId } from "@/stores/user-store";
import {
  useFavoritesStore,
  useIsFavorite,
  useLoadFavorites,
  useRefreshFavorites,
  useAddToCache,
  useRemoveFromCache,
} from "@/stores/favorites-store";

type FavoriteType = "professional" | "challenge" | "event" | "restaurant" | "shop" | "digital_product" | "holistic_center";

interface FavoriteButtonProps {
  itemId: string;
  favoriteType: FavoriteType;
  variant?: "default" | "floating" | "icon";
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({
  itemId,
  favoriteType,
  variant = "default",
  className,
  size = "icon",
  onToggle,
}: FavoriteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const userId = useUserId();
  const supabase = createClient();
  
  // Zustand store hooks
  const isFavorite = useIsFavorite(itemId, favoriteType);
  const loadFavorites = useLoadFavorites();
  const refreshFavorites = useRefreshFavorites();
  const addToCache = useAddToCache();
  const removeFromCache = useRemoveFromCache();

  // Cargar favoritos cuando el userId esté disponible
  useEffect(() => {
    if (userId) {
      loadFavorites(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
        removeFromCache(itemId, favoriteType);
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
        addToCache(itemId, favoriteType);
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
