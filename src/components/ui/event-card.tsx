"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { formatPrice } from "@/lib/price-utils";
import { FavoriteButton } from "@/components/ui/favorite-button";

const CATEGORY_LABELS: Record<string, string> = {
  espiritualidad: "Espiritualidad",
  salud_mental: "Salud Mental",
  salud_fisica: "Salud Física",
  alimentacion: "Alimentación",
  social: "Social",
};

function getCategoryLabel(category: string | null): string {
  if (!category) return "";
  return CATEGORY_LABELS[category] || category;
}

function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const PARTICIPANT_LEVEL_LABELS: Record<string, string> = {
  todos: "Todos",
  principiante: "Principiante",
  medio: "Intermedio",
  avanzado: "Avanzado",
};

/** Datos normalizados para mostrar en la EventCard (mismo diseño en homepage, explore y eventos). */
export interface EventCardEvent {
  id: string;
  slug?: string;
  name: string;
  image_url: string | null;
  category: string | null;
  event_date: string;
  price: number | null;
  is_free?: boolean;
  location: string | null;
  image_position?: string;
  participant_level?: "todos" | "principiante" | "medio" | "avanzado";
}

export interface EventCardProps {
  event: EventCardEvent;
  /** URL del detalle. Por defecto: /explore/event/{slug || id} */
  href?: string;
  /** Mostrar botón de favoritos. Por defecto true. */
  showFavoriteButton?: boolean;
  /** Ancho fijo en carrusel (ej. w-[280px] sm:w-[320px]). En grid no suele usarse. */
  className?: string;
}

export function EventCard({
  event,
  href,
  showFavoriteButton = true,
  className,
}: EventCardProps) {
  const detailHref = href ?? `/explore/event/${event.slug || event.id}`;
  const imageUrl =
    event.image_url || "/logos/holistia-black.png";
  const linkClass = className ?? "shrink-0 w-[280px] sm:w-[320px] block";

  return (
    <Link
      href={detailHref}
      className={linkClass}
    >
      <Card className="group relative min-h-[400px] flex flex-col pt-0 pb-4 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden">
        <div className="relative w-full h-48 bg-gray-100 shrink-0 rounded-t-xl overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={imageUrl}
              alt={event.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 280px, 320px"
              style={{
                objectPosition: event.image_position || "center center",
              }}
            />
          </div>
          {event.participant_level && (
            <Badge variant="secondary" className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm text-xs z-[1]">
              {PARTICIPANT_LEVEL_LABELS[event.participant_level] ?? event.participant_level}
            </Badge>
          )}
          {showFavoriteButton && (
            <div
              className="absolute top-3 right-3 pointer-events-auto z-[1]"
              style={{ position: "absolute", top: "12px", right: "12px" }}
              onClick={(e) => e.preventDefault()}
            >
              <FavoriteButton
                itemId={event.id}
                favoriteType="event"
                variant="floating"
              />
            </div>
          )}
        </div>
        <CardHeader className="pb-1.5 px-4 pt-2">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {event.name}
          </CardTitle>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {event.category && (
              <Badge variant="secondary" className="text-xs">
                {getCategoryLabel(event.category)}
              </Badge>
            )}
            {event.price !== null && (
              <Badge variant="outline" className="text-xs">
                {event.is_free || event.price === 0
                  ? "Gratis"
                  : formatPrice(event.price, "MXN")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-4 flex flex-col">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="line-clamp-1">
              {formatEventDate(event.event_date)}
            </span>
          </div>
          {event.location && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{event.location}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

/** Mapea un evento del API (events_workshops / EventWorkshop) al formato de la card. */
export function mapApiEventToCardEvent(api: {
  id?: string;
  slug?: string;
  name: string;
  gallery_images?: string[] | null;
  image_url?: string | null;
  image_position?: string;
  category: string | null;
  event_date: string;
  price: number | null;
  is_free?: boolean;
  location?: string | null;
  participant_level?: "todos" | "principiante" | "medio" | "avanzado";
}): EventCardEvent {
  const image_url =
    (api.gallery_images && api.gallery_images[0]) || api.image_url || null;
  return {
    id: api.id ?? "",
    slug: api.slug,
    name: api.name,
    image_url,
    category: api.category ?? null,
    event_date: api.event_date,
    price: api.price,
    is_free: api.is_free,
    location: api.location ?? null,
    image_position: api.image_position,
    participant_level: api.participant_level,
  };
}
