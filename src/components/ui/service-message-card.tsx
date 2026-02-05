"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Package, MapPin, Monitor, ExternalLink, CreditCard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Service } from "@/types/service";
import { formatPrice } from "@/lib/price-utils";
import { cn } from "@/lib/utils";
import { QuotePaymentDialog } from "@/components/ui/quote-payment-dialog";

interface ServiceMessageCardProps {
  service: Service;
  userId: string;
  professionalId: string;
  className?: string;
  conversationId?: string;
  isProfessional?: boolean;
  professionalSlug?: string; // Slug completo del profesional (first_name-last_name-id)
  /** Si se proporciona, al generar un enlace de pago se envía ese enlace como mensaje en el chat para el paciente */
  onSendPaymentLinkToChat?: (url: string) => Promise<void>;
}

export function ServiceMessageCard({
  service,
  userId,
  professionalId,
  className,
  conversationId,
  isProfessional = false,
  professionalSlug,
  onSendPaymentLinkToChat,
}: ServiceMessageCardProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
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
      return formatPrice(cost, "MXN");
    }
    if (cost && typeof cost === "object") {
      if (cost.presencial && cost.online) {
        return `Presencial: ${formatPrice(cost.presencial, "MXN")} | En línea: ${formatPrice(cost.online, "MXN")}`;
      }
      if (cost.presencial) {
        return `${formatPrice(cost.presencial, "MXN")} (Presencial)`;
      }
      if (cost.online) {
        return `${formatPrice(cost.online, "MXN")} (En línea)`;
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
  // Usar el slug si está disponible, sino usar el ID directamente (la página puede manejarlo)
  const serviceUrl = professionalSlug 
    ? `/patient/${userId}/explore/professional/${professionalSlug}`
    : `/patient/${userId}/explore/professional/${professionalId}`;

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
      <CardContent className="space-y-3 py-4">
        {service.description && (
          <div 
            className="text-sm text-muted-foreground line-clamp-2 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: service.description }}
          />
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
        <div className="flex flex-col gap-2">
          {isProfessional && service.pricing_type === 'quote' && conversationId && (
            <Button
              onClick={() => setIsPaymentDialogOpen(true)}
              className="w-full"
              variant="outline"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Generar Enlace de Pago
            </Button>
          )}
          <Link href={serviceUrl} className="block">
            <Button className="w-full" variant="default">
              Ver servicio
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>

      {isProfessional && service.pricing_type === 'quote' && conversationId && (
        <QuotePaymentDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          service={service}
          conversationId={conversationId}
          patientId={userId}
          professionalId={professionalId}
          onPaymentLinkCreated={async (url) => {
            if (onSendPaymentLinkToChat) {
              try {
                await onSendPaymentLinkToChat(url);
              } catch (e) {
                console.error("Error sending payment link to chat:", e);
              }
            }
          }}
        />
      )}
    </Card>
  );
}
