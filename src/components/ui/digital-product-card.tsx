"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingBag,
  Clock,
  FileText,
  Tag,
  Star,
  Sparkles,
  BookOpen,
  Headphones,
  Video,
  FileCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { formatPrice } from "@/lib/price-utils";

/** Forma canónica del producto para la card; exportada para reutilizar en listas */
export interface DigitalProductCardProduct {
  id: string;
  slug?: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  cover_image_url?: string;
  duration_minutes?: number;
  pages_count?: number;
  sales_count: number;
  professional_first_name?: string;
  professional_last_name?: string;
  professional_photo?: string;
  professional_is_verified?: boolean;
}

interface DigitalProductCardProps {
  product: DigitalProductCardProduct;
  showProfessional?: boolean;
  onPurchaseComplete?: () => void;
}

/**
 * Normaliza un producto que viene del API (Supabase/digital_products) a la forma de la card.
 * professional_applications puede ser objeto o array según el select.
 */
export function mapApiProductToCardProduct(apiProduct: {
  id: string;
  slug?: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  cover_image_url?: string | null;
  duration_minutes?: number;
  pages_count?: number;
  sales_count?: number;
  professional_applications?: {
    first_name?: string;
    last_name?: string;
    profile_photo?: string;
    is_verified?: boolean;
  } | Array<{ first_name?: string; last_name?: string; profile_photo?: string; is_verified?: boolean }>;
}): DigitalProductCardProduct {
  const pa = Array.isArray(apiProduct.professional_applications)
    ? apiProduct.professional_applications[0]
    : apiProduct.professional_applications;
  return {
    id: apiProduct.id,
    slug: apiProduct.slug,
    title: apiProduct.title,
    description: apiProduct.description,
    category: apiProduct.category,
    price: apiProduct.price,
    currency: apiProduct.currency,
    cover_image_url: apiProduct.cover_image_url ?? undefined,
    duration_minutes: apiProduct.duration_minutes,
    pages_count: apiProduct.pages_count,
    sales_count: apiProduct.sales_count ?? 0,
    professional_first_name: pa?.first_name,
    professional_last_name: pa?.last_name,
    professional_photo: pa?.profile_photo,
    professional_is_verified: pa?.is_verified,
  };
}

const CATEGORY_ICONS: Record<string, any> = {
  meditation: Sparkles,
  ebook: BookOpen,
  manual: FileText,
  course: Video,
  guide: FileCheck,
  audio: Headphones,
  video: Video,
  other: Tag,
};

const CATEGORY_LABELS: Record<string, string> = {
  meditation: "Meditación",
  ebook: "Workbook",
  manual: "Manual",
  course: "Curso",
  guide: "Guía",
  audio: "Audio",
  video: "Video",
  other: "Otro",
};

export function DigitalProductCard({
  product,
  showProfessional = false,
}: DigitalProductCardProps) {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string | undefined;

  const CategoryIcon = CATEGORY_ICONS[product.category] || Tag;

  const handleClick = () => {
    router.push(`/explore/program/${product.slug || product.id}`);
  };

  return (
    <Card className="hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden group cursor-pointer h-full flex flex-col" onClick={handleClick}>
        <div className="relative h-48 sm:h-56 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden shrink-0">
          <div className="absolute inset-0 overflow-hidden">
            {product.cover_image_url ? (
              <Image
                src={product.cover_image_url}
                alt={product.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized={product.cover_image_url.includes('supabase.co') || product.cover_image_url.includes('supabase.in')}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/logos/holistia-black.png";
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <CategoryIcon className="h-20 w-20 text-primary/40" />
              </div>
            )}
          </div>
          <div 
            className="absolute top-3 right-3 pointer-events-auto" 
            style={{ zIndex: 9999, position: 'absolute', top: '12px', right: '12px' }}
          >
            <FavoriteButton
              itemId={product.id}
              favoriteType="digital_product"
              variant="floating"
            />
          </div>
          <Badge variant="default" className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm">
            <CategoryIcon className="h-3 w-3 mr-1" />
            {CATEGORY_LABELS[product.category] || product.category}
          </Badge>
          {/* Leyenda de ventas en esquina inferior izquierda de la imagen */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
            {product.sales_count >= 10 && (
              <Badge className="bg-amber-500/90 text-white border-0 backdrop-blur-sm text-xs">
                Más vendido
              </Badge>
            )}
            {product.sales_count > 0 && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                {product.sales_count} ventas
              </Badge>
            )}
          </div>
        </div>

        <CardHeader className="px-4 sm:px-6 pt-2 sm:pt-3 pb-2 sm:pb-3 shrink-0">
          <CardTitle className="text-lg sm:text-xl line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4 flex-1 flex flex-col min-h-0">
          <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
            {product.description ? product.description.replace(/<[^>]*>/g, '').substring(0, 150) : 'Sin descripción'}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {product.duration_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {product.duration_minutes} min
              </div>
            )}
            {product.pages_count && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {product.pages_count} páginas
              </div>
            )}
          </div>


          {/* Professional Info */}
          {showProfessional && product.professional_first_name && (
            <div className="flex items-center gap-2 pt-2 border-t">
              {product.professional_photo ? (
                <Image
                  src={product.professional_photo}
                  alt=""
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {product.professional_first_name[0]}
                  </span>
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {product.professional_first_name} {product.professional_last_name}
              </span>
              {product.professional_is_verified && (
                <Badge variant="outline" className="text-xs">Verificado</Badge>
              )}
            </div>
          )}

          {/* Price and CTA */}
          <div className="flex items-center justify-between pt-3 border-t mt-auto shrink-0">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-primary">
                {formatPrice(product.price, product.currency || "MXN")}
              </p>
              <p className="text-xs text-muted-foreground">{product.currency}</p>
            </div>
            <Button size="sm" className="gap-2 shrink-0">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Ver Detalles</span>
              <span className="sm:hidden">Ver</span>
            </Button>
          </div>
        </CardContent>
      </Card>
  );
}
