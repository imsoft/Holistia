"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Package, MapPin, Monitor, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Service } from "@/types/service";
import { cn } from "@/lib/utils";

interface ServiceMessageCardProps {
  service: Service;
  userId: string;
  professionalId: string;
  className?: string;
}

export function ServiceMessageCard({
  service,
  userId,
  professionalId,
  className,
}: ServiceMessageCardProps) {
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

  const getModalityLabel = (modality: string) => {
    switch (modality) {
      case "presencial":
        return "Presencial";
      case "online":
        return "En línea";
      case "both":
        return "Presencial y en línea";
      default:
        return modality;
    }
  };

  const formatCost = (cost: number | { presencial?: number; online?: number } | null, pricingType?: string) => {
    if (pricingType === "quote") {
      return "Cotización";
    }
    if (typeof cost === "number") {
      return `$${cost.toFixed(2)}`;
    }
    if (cost && typeof cost === "object") {
      if (cost.presencial && cost.online) {
        return `Presencial: $${cost.presencial.toFixed(2)} | En línea: $${cost.online.toFixed(2)}`;
      }
      if (cost.presencial) {
        return `$${cost.presencial.toFixed(2)} (Presencial)`;
      }
      if (cost.online) {
        return `$${cost.online.toFixed(2)} (En línea)`;
      }
    }
    return "Precio no disponible";
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Construir la URL del servicio
  // Usar el professionalId directamente (ya es el ID del profesional)
  const serviceUrl = `/patient/${userId}/explore/professional/${professionalId}`;

  return (
    <Card className={cn("w-full max-w-sm border-2 border-primary/20 hover:border-primary/40 transition-colors", className)}>
      {service.image_url && (
        <div className="relative w-full h-32">
          <Image
            src={service.image_url}
            alt={service.name}
            fill
            className="object-cover rounded-t-lg"
            unoptimized={service.image_url.includes('supabase.co') || service.image_url.includes('supabase.in')}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/logos/holistia-black.png";
            }}
          />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2 flex-1">
            {service.type === "program" ? (
              <Package className="w-5 h-5 text-primary shrink-0" />
            ) : (
              <Calendar className="w-5 h-5 text-primary shrink-0" />
            )}
            <span className="line-clamp-2">{service.name}</span>
          </CardTitle>
          <Badge variant="outline" className="shrink-0">
            {service.type === "session" ? "Sesión" : "Programa"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="flex items-center gap-1">
            {getModalityIcon(service.modality)}
            {getModalityLabel(service.modality)}
          </Badge>
          <Badge variant="secondary">
            {service.type === "session" 
              ? formatDuration(service.duration)
              : service.program_duration
              ? `${service.program_duration.value} ${service.program_duration.unit}`
              : "Duración variable"}
          </Badge>
        </div>
        {service.cost !== null && (
          <div className="font-semibold text-primary">
            {formatCost(service.cost, service.pricing_type)}
          </div>
        )}
        <Link href={serviceUrl} className="block">
          <Button className="w-full" variant="default">
            Ver servicio
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
