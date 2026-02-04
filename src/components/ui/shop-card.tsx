"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Store } from "lucide-react";
import { stripHtml } from "@/lib/text-utils";
import { FavoriteButton } from "@/components/ui/favorite-button";

/** Datos normalizados para la ShopCard (mismo diseño en homepage, explore y shops). */
export interface ShopCardShop {
  id: string;
  slug?: string;
  name: string;
  image_url: string | null;
  category: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
}

export interface ShopCardProps {
  shop: ShopCardShop;
  /** URL del detalle. Por defecto: /explore/shop/{slug || id} */
  href?: string;
  /** Mostrar botón de favoritos. Por defecto true. */
  showFavoriteButton?: boolean;
  /** Clase del Link (ej. shrink-0 w-[280px] sm:w-[320px] para carrusel, w-full block para grid). */
  className?: string;
}

export function ShopCard({
  shop,
  href,
  showFavoriteButton = true,
  className,
}: ShopCardProps) {
  const detailHref = href ?? `/explore/shop/${shop.slug || shop.id}`;
  const imageUrl = shop.image_url || null;
  const cleanDescription = shop.description ? stripHtml(shop.description) : null;

  const linkClass = className ?? "shrink-0 w-[280px] sm:w-[320px] block";

  return (
    <Link href={detailHref} className={linkClass}>
      <Card className="group hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-[480px] flex flex-col gap-0 pt-0 pb-0">
        <div className="relative w-full h-48 bg-muted shrink-0 overflow-hidden rounded-t-xl">
          {imageUrl && imageUrl.trim() !== "" ? (
            <Image
              src={imageUrl}
              alt={shop.name}
              fill
              className="object-cover object-center"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/logos/holistia-black.png";
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="h-16 w-16 text-primary/40" />
            </div>
          )}
          {showFavoriteButton && (
            <div
              className="absolute top-3 right-3 pointer-events-auto z-[1]"
              style={{ position: "absolute", top: "12px", right: "12px" }}
              onClick={(e) => e.preventDefault()}
            >
              <FavoriteButton
                itemId={shop.id}
                favoriteType="shop"
                variant="floating"
              />
            </div>
          )}
        </div>
        <CardHeader className="shrink-0 px-4 pt-2 pb-1">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors leading-snug pb-0.5">
            {shop.name}
          </CardTitle>
          {shop.category && (
            <Badge variant="secondary" className="w-fit mt-1.5 text-xs">
              {shop.category}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="flex-1 px-4 pt-0 pb-2 min-h-0 flex flex-col overflow-hidden">
          {cleanDescription && (
            <div className="overflow-hidden max-h-[4.2em] text-sm text-muted-foreground leading-tight my-2">
              <p className="line-clamp-3 break-words">
                {cleanDescription}
              </p>
            </div>
          )}
          {(shop.address || shop.city) && (
            <div className="flex items-start gap-2 mt-1.5 text-sm text-muted-foreground flex-shrink-0">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">
                {shop.address && shop.city
                  ? `${shop.address}, ${shop.city}`
                  : shop.address || shop.city}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

/** Mapea un comercio del API (shops) al formato de la card. */
export function mapApiShopToCardShop(api: {
  id: string;
  slug?: string;
  name: string;
  image_url?: string | null;
  gallery?: string[] | string | null;
  category?: string | null;
  city?: string | null;
  address?: string | null;
  description?: string | null;
}): ShopCardShop {
  let image_url = api.image_url ?? null;
  if (!image_url && api.gallery) {
    const arr = Array.isArray(api.gallery)
      ? api.gallery
      : typeof api.gallery === "string"
        ? (() => {
            try {
              return JSON.parse(api.gallery) as string[];
            } catch {
              return [api.gallery];
            }
          })()
        : [];
    image_url = arr.length > 0 ? arr[0] : null;
  }
  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    image_url,
    category: api.category ?? null,
    city: api.city ?? null,
    address: api.address ?? null,
    description: api.description ?? null,
  };
}
