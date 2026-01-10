"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  ArrowLeft,
  ExternalLink,
  Share2,
  Clock,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StableImage } from "@/components/ui/stable-image";
import { Separator } from "@/components/ui/separator";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { Skeleton } from "@/components/ui/skeleton";

interface HolisticCenter {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  image_url?: string;
  opening_hours?: any;
  is_active: boolean;
  created_at: string;
}

export default function HolisticCenterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const centerId = params.centerId as string;
  const [center, setCenter] = useState<HolisticCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const handleShare = async () => {
    const publicUrl = `${window.location.origin}/public/holistic-center/${centerId}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("No se pudo copiar el enlace");
    }
  };

  const formatOpeningHours = (hours: any) => {
    if (!hours || typeof hours !== 'object') return null;
    
    try {
      const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const formatted: string[] = [];
      
      if (Array.isArray(hours)) {
        // Si viene como array
        hours.forEach((dayHours: any, index: number) => {
          if (dayHours && dayHours.open) {
            formatted.push(`${days[index]}: ${dayHours.open} - ${dayHours.close || 'Cerrado'}`);
          }
        });
      } else {
        // Si viene como objeto
        Object.keys(hours).forEach((day, index) => {
          const dayHours = hours[day];
          if (dayHours && dayHours.open) {
            formatted.push(`${day}: ${dayHours.open} - ${dayHours.close || 'Cerrado'}`);
          }
        });
      }
      
      return formatted.length > 0 ? formatted : null;
    } catch (error) {
      console.error('Error formatting opening hours:', error);
      return null;
    }
  };

  useEffect(() => {
    const getCenterData = async () => {
      try {
        setLoading(true);

        const { data: centerData, error: centerError } = await supabase
          .from("holistic_centers")
          .select("*")
          .eq("id", centerId)
          .eq("is_active", true)
          .single();

        if (centerError) {
          console.error("Error fetching holistic center:", centerError);
          if (centerError.code === 'PGRST116') {
            // No encontrado
            setCenter(null);
          }
        } else {
          setCenter(centerData);
        }
      } catch (error) {
        console.error("Error fetching holistic center data:", error);
      } finally {
        setLoading(false);
      }
    };

    getCenterData();
  }, [centerId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Centro holístico no encontrado
          </h2>
          <p className="text-muted-foreground mb-6">
            El centro holístico que buscas no existe o no está disponible
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const formattedHours = center.opening_hours ? formatOpeningHours(center.opening_hours) : null;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Botón de regresar */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        {/* Imagen principal y título */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Imagen */}
          <div className="relative w-full h-96 rounded-lg overflow-hidden bg-muted">
            {center.image_url ? (
              <StableImage
                src={center.image_url}
                alt={center.name}
                fill
                className="object-cover"
                fallbackSrc="/logos/holistia-black.png"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Building2 className="h-32 w-32 text-primary/40" />
              </div>
            )}
            <div 
              className="absolute top-3 right-3 pointer-events-auto" 
              style={{ zIndex: 9999 }}
            >
              <FavoriteButton
                itemId={center.id}
                favoriteType="holistic_center"
                variant="floating"
              />
            </div>
          </div>

          {/* Información principal */}
          <div>
            <div className="mb-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex-1">
                  {center.name}
                </h1>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Compartir</span>
                </Button>
              </div>
              {center.city && (
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{center.city}</span>
                </div>
              )}
            </div>

            {center.description && (
              <div
                className="text-muted-foreground mb-6 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: center.description }}
              />
            )}

            <Separator className="my-6" />

            {/* Información de contacto */}
            <div className="space-y-3">
              {center.address && (
                <div className="flex items-start gap-3 text-foreground">
                  <MapPin className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{center.address}</span>
                </div>
              )}

              {center.phone && (
                <div className="flex items-center gap-3 text-foreground">
                  <Phone className="h-5 w-5 shrink-0" />
                  <a href={`tel:${center.phone}`} className="hover:text-primary transition-colors">
                    {center.phone}
                  </a>
                </div>
              )}

              {center.email && (
                <div className="flex items-center gap-3 text-foreground">
                  <Mail className="h-5 w-5 shrink-0" />
                  <a href={`mailto:${center.email}`} className="hover:text-primary transition-colors">
                    {center.email}
                  </a>
                </div>
              )}

              {center.website && (
                <div className="flex items-center gap-3 text-foreground">
                  <Globe className="h-5 w-5 shrink-0" />
                  <a
                    href={center.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    Visitar sitio web
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              {center.instagram && (
                <div className="flex items-center gap-3 text-foreground">
                  <Instagram className="h-5 w-5 shrink-0" />
                  <a
                    href={`https://instagram.com/${center.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {center.instagram}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Horario de apertura */}
            {formattedHours && formattedHours.length > 0 && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Horario de Atención
                  </h3>
                  <div className="space-y-1">
                    {formattedHours.map((hour, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        {hour}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Información adicional */}
        {center.description && center.description.length > 500 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Acerca de</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: center.description }}
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}