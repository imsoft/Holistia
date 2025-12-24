"use client";

import { Card } from "@/components/ui/card";
import { Heart, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Professional } from "@/types";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { VerifiedBadge } from "@/components/ui/verified-badge";

interface ProfessionalCardProps {
  professional: Professional;
  userId?: string;
}

export const ProfessionalCard = ({ professional, userId }: ProfessionalCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Check if professional is favorite on mount
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('user_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('professional_id', professional.id)
          .maybeSingle();

        setIsFavorite(!!data);
      } catch (error) {
        console.error('Error checking favorite:', error);
      }
    };

    checkFavorite();
  }, [professional.id, supabase]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getMinPrice = () => {
    if (professional.costs) {
      const presencial = professional.costs.presencial || 0;
      const online = professional.costs.online || 0;
      const prices = [presencial, online].filter(p => p > 0);
      return prices.length > 0 ? Math.min(...prices) : 0;
    }
    
    if (professional.services && professional.services.length > 0) {
      const prices: number[] = [];
      professional.services.forEach(service => {
        if (service.presencialCost) {
          const price = typeof service.presencialCost === 'string' 
            ? parseInt(service.presencialCost) || 0
            : service.presencialCost;
          if (price > 0) prices.push(price);
        }
        if (service.onlineCost) {
          const price = typeof service.onlineCost === 'string'
            ? parseInt(service.onlineCost) || 0
            : service.onlineCost;
          if (price > 0) prices.push(price);
        }
      });
      return prices.length > 0 ? Math.min(...prices) : 0;
    }
    
    return 0;
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFavorite) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('professional_id', professional.id);
      } else {
        await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            professional_id: professional.id
          });
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const professionalRoute = userId 
    ? `/patient/${userId}/explore/professional/${professional.id}` 
    : `/explore/professional/${professional.id}`;

  const professionalName = professional.name || `${professional.first_name || ''} ${professional.last_name || ''}`.trim() || 'Profesional';
  const professionalImage = professional.profile_photo || professional.profilePhoto || professional.avatar || "/logos/holistia-black.png";
  const minPrice = getMinPrice();
  const rating = professional.average_rating || 0;
  const totalReviews = professional.total_reviews || 0;

  return (
    <Link href={professionalRoute} className="block">
      <Card className="group overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border cursor-pointer h-full flex flex-col rounded-2xl">
        {/* Image Section - 2/3 of card height */}
        <div className="relative w-full aspect-[3/2] overflow-hidden bg-gray-100 rounded-t-2xl">
          <Image
            src={professionalImage}
            alt={professionalName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ objectPosition: professional.imagePosition || "center center" }}
            unoptimized
          />
          {/* Heart Icon - Top Right */}
          <button
            onClick={handleToggleFavorite}
            disabled={isLoading}
            className="absolute top-3 right-3 p-2 bg-white/95 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-md z-10"
            aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Heart 
              className={`h-5 w-5 transition-all ${
                isFavorite 
                  ? 'text-red-500 fill-red-500' 
                  : 'text-gray-600 hover:text-red-500'
              }`} 
            />
          </button>
        </div>

        {/* Text Section - 1/3 of card height */}
        <div className="px-4 pt-4 pb-5 flex flex-col flex-1 bg-white rounded-b-2xl">
          {/* Main Title - Professional Name */}
          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1.5 leading-tight">
            {professionalName}
          </h3>

          {/* Secondary Details - Price */}
          {minPrice > 0 && (
            <p className="text-sm text-muted-foreground mb-2">
              Desde {formatPrice(minPrice)} MXN
            </p>
          )}

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-1 mt-auto">
              <Star className="h-4 w-4 fill-black text-black" />
              <span className="text-sm font-semibold text-foreground">
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};
