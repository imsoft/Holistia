"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MapPin, MessageCircle, Monitor, Users, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Professional } from "@/types";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

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
    switch (professional.serviceType) {
      case 'in-person':
        return <Users className="h-3 w-3" />;
      case 'online':
        return <Monitor className="h-3 w-3" />;
      case 'both':
        return <MessageCircle className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getServiceTypeText = () => {
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
      <Card className="group overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-border cursor-pointer">
      <div className="relative">
        <Image
          src={professional.profile_photo || professional.profilePhoto || professional.avatar || "/placeholder-avatar.jpg"}
          alt={professional.name || `${professional.first_name || ''} ${professional.last_name || ''}`.trim()}
          width={400}
          height={300}
          className="w-full h-48 object-cover"
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
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {professional.name || `${professional.first_name || ''} ${professional.last_name || ''}`.trim()}
            </h3>
            <p className="text-sm text-muted-foreground">{professional.profession}</p>
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

          {/* Wellness Areas */}
          {professional.wellnessAreas && professional.wellnessAreas.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Áreas de bienestar:</p>
              <div className="flex flex-wrap gap-1">
                {professional.wellnessAreas.slice(0, 2).map((area) => (
                  <span key={area} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
                    {area}
                  </span>
                ))}
                {professional.wellnessAreas.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{professional.wellnessAreas.length - 2} más
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Service Description */}
          {professional.serviceDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {professional.serviceDescription}
            </p>
          )}

          {/* Location and Service Type */}
          <div className="space-y-1">
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

          {/* Price */}
          {professional.costs && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {professional.serviceType === 'in-person' && (
                  <span>Desde {formatPrice(professional.costs.presencial)}</span>
                )}
                {professional.serviceType === 'online' && (
                  <span>Desde {formatPrice(professional.costs.online)}</span>
                )}
                {professional.serviceType === 'both' && (
                  <span>Desde {formatPrice(Math.min(professional.costs.presencial, professional.costs.online))}</span>
                )}
                {!professional.serviceType && (
                  <span>Desde {formatPrice(professional.costs.presencial)}</span>
                )}
              </div>
              {professional.bookingOption && (
                <button className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full hover:bg-primary/90 transition-colors">
                  Reservar
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};
