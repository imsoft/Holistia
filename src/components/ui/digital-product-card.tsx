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

interface DigitalProductCardProps {
  product: {
    id: string;
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
  };
  showProfessional?: boolean;
  onPurchaseComplete?: () => void;
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
  ebook: "eBook",
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
  const userId = params.id as string;

  const CategoryIcon = CATEGORY_ICONS[product.category] || Tag;

  const handleClick = () => {
    router.push(`/patient/${userId}/explore/program/${product.id}`);
  };

  return (
    <Card className="hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden group cursor-pointer h-[480px] flex flex-col" onClick={handleClick}>
        <div className="relative h-64 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden shrink-0">
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
          <div className="absolute top-3 left-3 flex justify-between items-start">
            <Badge variant="default" className="bg-primary/90 backdrop-blur-sm">
              <CategoryIcon className="h-3 w-3 mr-1" />
              {CATEGORY_LABELS[product.category] || product.category}
            </Badge>
            {product.sales_count > 0 && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                {product.sales_count} ventas
              </Badge>
            )}
          </div>
        </div>

        <CardHeader className="px-6 pt-6 pb-3">
          <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-6 pb-6 space-y-4 flex-1 flex flex-col min-h-0">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
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
          <div className="flex items-center justify-between pt-3 border-t mt-auto">
            <div>
              <p className="text-2xl font-bold text-primary">
                ${product.price.toLocaleString('es-MX')}
              </p>
              <p className="text-xs text-muted-foreground">{product.currency}</p>
            </div>
            <Button size="sm" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Ver Detalles
            </Button>
          </div>
        </CardContent>
      </Card>
  );
}
