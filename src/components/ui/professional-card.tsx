"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Monitor } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Professional } from "@/types";
import { StarRating } from "@/components/reviews/star-rating";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { FavoriteButton } from "@/components/ui/favorite-button";

interface ProfessionalCardProps {
  professional: Professional;
  userId?: string;
  showFavoriteButton?: boolean; // Controlar visibilidad del botón de favoritos
}

export const ProfessionalCard = ({ professional, userId, showFavoriteButton = true }: ProfessionalCardProps) => {
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

  // Construir la ruta correcta
  // Si hay userId, usar ruta del dashboard del paciente
  // Si no hay userId, usar ruta pública
  const slug = professional.slug || `${professional.first_name?.toLowerCase() || ''}-${professional.last_name?.toLowerCase() || ''}-${professional.id}`;
  const professionalRoute = userId
    ? `/patient/${userId}/explore/professional/${professional.id}`
    : `/public/professional/${slug}`;

  return (
    <Link href={professionalRoute}>
      <Card className="group overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-border cursor-pointer h-[480px] flex flex-col">
      <div className="relative w-full h-64 overflow-hidden bg-gray-100 shrink-0">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={professional.profile_photo || professional.profilePhoto || professional.avatar || "/logos/holistia-black.png"}
            alt={professional.name || `${professional.first_name || ''} ${professional.last_name || ''}`.trim()}
            fill
            className="object-cover"
            style={{ objectPosition: professional.imagePosition || "center 20%" }}
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/logos/holistia-black.png";
            }}
          />
        </div>
        {/* Favorite button */}
        {showFavoriteButton && (
          <div 
            className="absolute top-3 right-3 pointer-events-auto" 
            style={{ zIndex: 9999, position: 'absolute', top: '12px', right: '12px' }}
          >
            <FavoriteButton
              itemId={professional.id}
              favoriteType="professional"
              variant="floating"
            />
          </div>
        )}
      </div>

      <CardContent className="px-4 pt-3 pb-4 flex flex-col grow min-h-0">
        <div className="space-y-2 flex flex-col grow">
          {/* Header - Especialidad arriba, Nombre y Rating en la misma línea */}
          <div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {professional.profession}
            </h3>
            <div className="flex items-center justify-between gap-2 mt-1">
              <div className="flex items-center gap-1.5 truncate">
                <p className="text-sm text-muted-foreground truncate">
                  {professional.name || `${professional.first_name || ''} ${professional.last_name || ''}`.trim()}
                </p>
                {(professional.is_verified || professional.verified) && (
                  <VerifiedBadge size={14} />
                )}
              </div>
              {/* Rating */}
              {professional.average_rating && 
               professional.average_rating > 0 && 
               professional.total_reviews && 
               professional.total_reviews > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <StarRating
                    rating={professional.average_rating}
                    size="sm"
                    showNumber={true}
                  />
                  <span className="text-xs text-muted-foreground">
                    ({professional.total_reviews})
                  </span>
                </div>
              )}
            </div>
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
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};
