"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Building2 } from "lucide-react";
import { stripHtml } from "@/lib/text-utils";
import { FavoriteButton } from "@/components/ui/favorite-button";

/** Datos normalizados para la card de centro holístico (mismo diseño en homepage, explore y holistic-centers). */
export interface HolisticCenterCardCenter {
  id: string;
  slug?: string;
  name: string;
  image_url: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
}

export interface HolisticCenterCardProps {
  center: HolisticCenterCardCenter;
  /** URL del detalle. Por defecto: /explore/holistic-center/{slug || id} */
  href?: string;
  /** Mostrar botón de favoritos. Por defecto true. */
  showFavoriteButton?: boolean;
  /** Clase del Link (ej. shrink-0 w-[280px] sm:w-[320px] para carrusel, w-full block para grid). */
  className?: string;
}

export function HolisticCenterCard({
  center,
  href,
  showFavoriteButton = true,
  className,
}: HolisticCenterCardProps) {
  const detailHref = href ?? `/explore/holistic-center/${center.slug || center.id}`;
  const imageUrl = center.image_url || null;
  const cleanDescription = center.description ? stripHtml(center.description) : null;

  const linkClass = className ?? "shrink-0 w-[280px] sm:w-[320px] block";

  return (
    <Link href={detailHref} className={linkClass}>
      <Card className="group relative flex flex-col pt-0 pb-4 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden gap-0">
        <div className="relative w-full h-48 bg-gray-100 shrink-0 rounded-t-xl overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            {imageUrl && imageUrl.trim() !== "" ? (
              <Image
                src={imageUrl}
                alt={center.name}
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/logos/holistia-black.png";
                }}
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Building2 className="h-16 w-16 text-primary/40" />
              </div>
            )}
          </div>
          {showFavoriteButton && (
            <div
              className="absolute top-3 right-3 pointer-events-auto z-[1]"
              style={{ position: "absolute", top: "12px", right: "12px" }}
              onClick={(e) => e.preventDefault()}
            >
              <FavoriteButton
                itemId={center.id}
                favoriteType="holistic_center"
                variant="floating"
              />
            </div>
          )}
        </div>
        <CardHeader className="pb-1.5 px-4 pt-4">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors leading-snug pb-0.5">
            {center.name}
          </CardTitle>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {center.city && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span>{center.city}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-3">
          {cleanDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {cleanDescription}
            </p>
          )}
          {center.address && (
            <div className="flex items-start gap-1 text-xs text-muted-foreground mb-0">
              <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
              <span className="line-clamp-1">{center.address}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

/** Mapea un centro holístico del API al formato de la card. */
export function mapApiCenterToCardCenter(api: {
  id: string;
  slug?: string;
  name: string;
  image_url?: string | null;
  city?: string | null;
  address?: string | null;
  description?: string | null;
}): HolisticCenterCardCenter {
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    image_url: api.image_url ?? null,
    city: api.city ?? null,
    address: api.address ?? null,
    description: api.description ?? null,
  };
}
