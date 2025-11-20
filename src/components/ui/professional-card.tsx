"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Monitor, Heart } from "lucide-react";
import Link from "next/link";
import { Professional } from "@/types";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { StableImage } from "@/components/ui/stable-image";
import { StarRating } from "@/components/reviews/star-rating";

interface ProfessionalCardProps {
  professional: Professional;
  userId?: string;
}

export const ProfessionalCard = ({ professional, userId }: ProfessionalCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const getServiceTypeIcon = () => {
    // Si ya está definido el serviceType, usarlo
    if (professional.serviceType) {
      switch (professional.serviceType) {
        case 'in-person':
          return <MapPin className="h-3 w-3" />;
        case 'online':
          return <Monitor className="h-3 w-3" />;
        case 'both':
          return (
            <div className="flex gap-0.5">
              <MapPin className="h-3 w-3" />
              <Monitor className="h-3 w-3" />
            </div>
          );
        default:
          return <MapPin className="h-3 w-3" />;
      }
    }

    // Si no está definido, calcular basándose en los servicios
    if (professional.services && professional.services.length > 0) {
      const hasPresencial = professional.services.some(service =>
        service.presencialCost && service.presencialCost !== "" && service.presencialCost !== "0" && Number(service.presencialCost) > 0
      );
      const hasOnline = professional.services.some(service =>
        service.onlineCost && service.onlineCost !== "" && service.onlineCost !== "0" && Number(service.onlineCost) > 0
      );

      if (hasPresencial && hasOnline) {
        return (
          <div className="flex gap-0.5">
            <MapPin className="h-3 w-3" />
            <Monitor className="h-3 w-3" />
          </div>
        );
      } else if (hasOnline) {
        return <Monitor className="h-3 w-3" />;
      } else if (hasPresencial) {
        return <MapPin className="h-3 w-3" />;
      }
    }

    // Fallback por defecto
    return <MapPin className="h-3 w-3" />;
  };

  const getServiceTypeText = () => {
    // Si ya está definido el serviceType, usarlo
    if (professional.serviceType) {
      switch (professional.serviceType) {
        case 'in-person':
          return 'Presencial';
        case 'online':
          return 'En línea';
        case 'both':
          return 'Presencial y en línea';
        default:
          return 'Presencial';
      }
    }

    // Si no está definido, calcular basándose en los servicios
    if (professional.services && professional.services.length > 0) {
      const hasPresencial = professional.services.some(service =>
        service.presencialCost && service.presencialCost !== "" && service.presencialCost !== "0" && Number(service.presencialCost) > 0
      );
      const hasOnline = professional.services.some(service =>
        service.onlineCost && service.onlineCost !== "" && service.onlineCost !== "0" && Number(service.onlineCost) > 0
      );

      if (hasPresencial && hasOnline) {
        return 'Presencial y en línea';
      } else if (hasOnline) {
        return 'En línea';
      } else if (hasPresencial) {
        return 'Presencial';
      }
    }

    // Fallback por defecto
    return 'Presencial';
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
        // Remove from favorites
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('professional_id', professional.id);
      } else {
        // Add to favorites
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

  // Construir la ruta correcta
  const professionalRoute = userId 
    ? `/patient/${userId}/explore/professional/${professional.id}` 
    : `/explore/professional/${professional.id}`;

  return (
    <Link href={professionalRoute}>
      <Card className="group overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-border cursor-pointer h-full flex flex-col">
      <div className="relative">
        <StableImage
          src={professional.profile_photo || professional.profilePhoto || professional.avatar || ""}
          alt={professional.name || `${professional.first_name || ''} ${professional.last_name || ''}`.trim()}
          width={400}
          height={300}
          className="w-full h-48"
          fallbackSrc="/logos/holistia-black.png"
          objectFit="cover"
          objectPosition={professional.imagePosition || "center center"}
        />
        {/* Favorite button */}
        <button 
          onClick={handleToggleFavorite}
          disabled={isLoading}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm group/favorite"
        >
          <Heart className={`h-4 w-4 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground hover:text-red-500 hover:fill-red-500'}`} />
        </button>
      </div>
      
      <CardContent className="p-4 flex flex-col flex-grow">
        <div className="space-y-2 flex flex-col flex-grow">
          {/* Header - Intercambiado: Especialidad arriba, Nombre abajo */}
          <div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {professional.profession}
            </h3>
            <p className="text-sm text-muted-foreground">
              {professional.name || `${professional.first_name || ''} ${professional.last_name || ''}`.trim()}
            </p>
            {/* Rating */}
            {professional.average_rating && professional.total_reviews && professional.total_reviews > 0 && (
              <div className="mt-0.5">
                <StarRating 
                  rating={professional.average_rating} 
                  size="sm" 
                  showNumber={false}
                />
                <span className="text-xs text-muted-foreground ml-1">
                  ({professional.total_reviews} {professional.total_reviews === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            )}
          </div>

          {/* Therapy Types */}
          {professional.therapyTypes && professional.therapyTypes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {professional.therapyTypes.slice(0, 2).map((therapy) => (
                <span key={therapy} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {therapy}
                </span>
              ))}
              {professional.therapyTypes.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{professional.therapyTypes.length - 2} más
                </span>
              )}
            </div>
          )}

          {/* Services */}
          {professional.services && professional.services.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Servicios:</p>
              <div className="flex flex-wrap gap-1">
                {professional.services.slice(0, 2).map((service) => (
                  <span key={service.name} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                    {service.name}
                  </span>
                ))}
                {professional.services.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{professional.services.length - 2} más
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Location and Service Type */}
          <div className="space-y-1 mt-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>
                {professional.location 
                  ? (typeof professional.location === 'string' 
                      ? professional.location 
                      : `${professional.location.city}, ${professional.location.state}`)
                  : `${professional.city || ''}, ${professional.state || ''}`.replace(/^,\s*|,\s*$/g, '')
                }
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getServiceTypeIcon()}
              <span>{getServiceTypeText()}</span>
            </div>
          </div>

          {/* Booking Button */}
          {professional.bookingOption && (
            <div className="flex justify-end items-center mt-2">
              <button className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors">
                Reservar
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};
