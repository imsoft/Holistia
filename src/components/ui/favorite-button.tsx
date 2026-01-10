"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FavoriteType = "professional" | "challenge" | "event" | "restaurant" | "shop" | "digital_product";

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
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true); // Estado para saber si estamos verificando
  const supabase = createClient();

  useEffect(() => {
    checkIfFavorite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, favoriteType]);

  const checkIfFavorite = async () => {
    try {
      setIsChecking(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserId(null);
        setIsFavorite(false);
        setIsChecking(false);
        return;
      }

      setUserId(user.id);

      // Construir la query según el tipo
      const columnName = `${favoriteType}_id`;
      const { data, error } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq(columnName, itemId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error checking favorite:", error);
        setIsChecking(false);
        return;
      }

      setIsFavorite(!!data);
      setIsChecking(false);
    } catch (error) {
      console.error("Error checking favorite:", error);
      setIsChecking(false);
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
        setIsFavorite(false);
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
        setIsFavorite(true);
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
    return (
      <button
        onClick={handleToggleFavorite}
        disabled={isLoading || isChecking}
        className={cn(
          "absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm group/favorite",
          (isLoading || isChecking) && "opacity-50 cursor-not-allowed",
          className
        )}
        title={!userId ? "Inicia sesión para agregar a favoritos" : isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            isFavorite
              ? "text-red-500 fill-red-500"
              : "text-muted-foreground group-hover/favorite:text-red-500 group-hover/favorite:fill-red-500"
          )}
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
