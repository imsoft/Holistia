"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Service } from "@/types/service";
import { createClient } from "@/utils/supabase/client";
import {
  Clock,
  DollarSign,
  Monitor,
  MapPin,
  Package,
  Calendar,
} from "lucide-react";

interface ProfessionalServicesDisplayProps {
  professionalId: string;
  onServiceSelect?: (service: Service) => void;
  showBookingButton?: boolean;
}

export function ProfessionalServicesDisplay({
  professionalId,
  onServiceSelect,
  showBookingButton = true,
}: ProfessionalServicesDisplayProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchServices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", professionalId)
        .eq("isActive", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  }, [professionalId, supabase]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case "presencial":
        return <MapPin className="w-4 h-4" />;
      case "online":
        return <Monitor className="w-4 h-4" />;
      case "both":
        return (
          <div className="flex gap-1">
            <MapPin className="w-4 h-4" />
            <Monitor className="w-4 h-4" />
          </div>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "program" ? (
      <Package className="w-4 h-4" />
    ) : (
      <Calendar className="w-4 h-4" />
    );
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-muted animate-pulse rounded" />
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Package className="w-8 h-8 text-muted-foreground mb-2" />
          <h3 className="text-lg font-semibold mb-1">Sin servicios disponibles</h3>
          <p className="text-muted-foreground text-center text-sm">
            Este profesional aún no ha configurado sus servicios
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">Servicios</h3>
      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(service.type)}
                  <span className="text-lg">{service.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {service.type === "session" ? "Sesión" : "Programa"}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {service.description && (
                <div 
                  className="text-muted-foreground text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: service.description }}
                />
              )}
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  {getModalityIcon(service.modality)}
                  <span className="capitalize">{service.modality}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(service.duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-sm">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-600">
                  ${typeof service.cost === 'number' ? service.cost : (service.cost?.presencial || service.cost?.online || 0)}
                </span>
              </div>

              {showBookingButton && onServiceSelect && (
                <Button
                  onClick={() => onServiceSelect(service)}
                  className="w-full mt-3"
                >
                  Reservar {service.type === "session" ? "Sesión" : "Programa"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
