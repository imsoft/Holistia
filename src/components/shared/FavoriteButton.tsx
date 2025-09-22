"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  professionalId: number;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  showText?: boolean;
  className?: string;
}

const FavoriteButton = ({ 
  professionalId, 
  size = "sm", 
  variant = "ghost",
  showText = false,
  className = ""
}: FavoriteButtonProps) => {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  // Cargar estado inicial de favoritos
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteProfessionals') || '[]');
    setIsFavorite(favorites.includes(professionalId));
  }, [professionalId]);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const favorites = JSON.parse(localStorage.getItem('favoriteProfessionals') || '[]');
    
    if (isFavorite) {
      // Remover de favoritos
      const newFavorites = favorites.filter((id: number) => id !== professionalId);
      localStorage.setItem('favoriteProfessionals', JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      // Agregar a favoritos
      const newFavorites = [...favorites, professionalId];
      localStorage.setItem('favoriteProfessionals', JSON.stringify(newFavorites));
      setIsFavorite(true);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      className={`${className} ${isFavorite ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'}`}
    >
      <Heart 
        className={`h-4 w-4 ${isFavorite ? 'fill-red-500' : ''}`} 
      />
      {showText && (
        <span className="ml-2">
          {isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        </span>
      )}
    </Button>
  );
};

export default FavoriteButton;
