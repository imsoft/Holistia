"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed } from "lucide-react";
import { FavoriteButton } from "@/components/ui/favorite-button";

/** Datos normalizados para la card de restaurante (mismo diseño en homepage, explore y restaurants). */
export interface RestaurantCardRestaurant {
  id: string;
  slug?: string;
  name: string;
  image_url: string | null;
  cuisine_type: string | null;
  price_range: string | null;
  address: string | null;
}

export interface RestaurantCardProps {
  restaurant: RestaurantCardRestaurant;
  /** URL del detalle. Por defecto: /explore/restaurant/{slug || id} */
  href?: string;
  /** Mostrar botón de favoritos. Por defecto true. */
  showFavoriteButton?: boolean;
  /** Clase del Link (ej. shrink-0 w-[280px] sm:w-[320px] para carrusel, w-full block para grid). */
  className?: string;
}

export function RestaurantCard({
  restaurant,
  href,
  showFavoriteButton = true,
  className,
}: RestaurantCardProps) {
  const detailHref = href ?? `/explore/restaurant/${restaurant.slug || restaurant.id}`;
  const imageUrl = restaurant.image_url || null;

  const linkClass = className ?? "shrink-0 w-[280px] sm:w-[320px] block";

  return (
    <Link href={detailHref} className={linkClass}>
      <Card className="group relative flex flex-col pt-0 pb-4 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer overflow-hidden gap-0">
        <div className="relative w-full h-48 bg-gray-100 shrink-0 rounded-t-xl overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            {imageUrl && imageUrl.trim() !== "" ? (
              <Image
                src={imageUrl}
                alt={restaurant.name}
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
                <UtensilsCrossed className="h-16 w-16 text-primary/40" />
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
                itemId={restaurant.id}
                favoriteType="restaurant"
                variant="floating"
              />
            </div>
          )}
        </div>
        <CardHeader className="pb-1.5 px-4 pt-3">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors leading-snug pb-0.5">
            {restaurant.name}
          </CardTitle>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {restaurant.cuisine_type && (
              <Badge variant="secondary" className="text-xs">
                {restaurant.cuisine_type}
              </Badge>
            )}
            {restaurant.price_range && (
              <Badge variant="outline" className="text-xs">
                {restaurant.price_range}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-4 pt-0 pb-4 flex flex-col">
          {restaurant.address && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {restaurant.address}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

/** Mapea un restaurante del API al formato de la card. */
export function mapApiRestaurantToCardRestaurant(api: {
  id: string;
  slug?: string;
  name: string;
  image_url?: string | null;
  cuisine_type?: string | null;
  price_range?: string | null;
  address?: string | null;
}): RestaurantCardRestaurant {
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    image_url: api.image_url ?? null,
    cuisine_type: api.cuisine_type ?? null,
    price_range: api.price_range ?? null,
    address: api.address ?? null,
  };
}
