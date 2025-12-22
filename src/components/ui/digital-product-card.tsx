"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ShoppingBag,
  Download,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface DigitalProductCardProps {
  product: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    currency: string;
    cover_image_url?: string;
    preview_url?: string;
    duration_minutes?: number;
    pages_count?: number;
    file_format?: string;
    tags?: string[];
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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const supabase = createClient();

  const CategoryIcon = CATEGORY_ICONS[product.category] || Tag;

  const checkIfPurchased = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("digital_product_purchases")
      .select("id")
      .eq("product_id", product.id)
      .eq("buyer_id", user.id)
      .eq("payment_status", "succeeded")
      .maybeSingle();

    return !!data;
  };

  const handleOpenDetails = async () => {
    setIsDetailsOpen(true);
    const purchased = await checkIfPurchased();
    setHasPurchased(purchased);
  };

  const handlePurchase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Debes iniciar sesión para comprar");
      return;
    }

    toast.info("Característica de compra en desarrollo. Próximamente disponible.");
  };

  const handleDownload = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Debes iniciar sesión");
      return;
    }

    // Obtener la URL del archivo del producto
    const { data: productData } = await supabase
      .from("digital_products")
      .select("file_url")
      .eq("id", product.id)
      .single();

    if (!productData?.file_url) {
      toast.error("No hay archivo disponible para descargar");
      return;
    }

    // Incrementar contador de descargas
    await supabase.rpc("increment_download_count", {
      p_product_id: product.id,
      p_user_id: user.id,
    });

    // Abrir el archivo en nueva pestaña
    window.open(productData.file_url, "_blank");
    toast.success("Descargando producto...");
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer" onClick={handleOpenDetails}>
        <div className="relative h-56 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
          {product.cover_image_url ? (
            <Image
              src={product.cover_image_url}
              alt={product.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <CategoryIcon className="h-20 w-20 text-primary/40" />
            </div>
          )}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
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

        <CardContent className="px-6 pb-6 space-y-4">
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
            {product.file_format && (
              <Badge variant="outline" className="text-xs">
                {product.file_format}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {product.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{product.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

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
          <div className="flex items-center justify-between pt-3 border-t">
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

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{product.title}</DialogTitle>
            <DialogDescription>
              <Badge variant="outline" className="mt-2">
                <CategoryIcon className="h-3 w-3 mr-1" />
                {CATEGORY_LABELS[product.category] || product.category}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Cover Image */}
            {product.cover_image_url && (
              <div className="relative h-64 rounded-lg overflow-hidden">
                <Image
                  src={product.cover_image_url}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2">Descripción</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              {product.duration_minutes && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Duración: {product.duration_minutes} minutos</span>
                </div>
              )}
              {product.pages_count && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Páginas: {product.pages_count}</span>
                </div>
              )}
              {product.file_format && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Formato: {product.file_format}</span>
                </div>
              )}
              {product.sales_count > 0 && (
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{product.sales_count} personas lo compraron</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Etiquetas</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Link */}
            {product.preview_url && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Vista Previa Disponible</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={product.preview_url} target="_blank" rel="noopener noreferrer">
                    Ver Muestra Gratuita
                  </a>
                </Button>
              </div>
            )}

            {/* Professional Info */}
            {showProfessional && product.professional_first_name && (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                {product.professional_photo ? (
                  <Image
                    src={product.professional_photo}
                    alt=""
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {product.professional_first_name[0]}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {product.professional_first_name} {product.professional_last_name}
                  </p>
                  {product.professional_is_verified && (
                    <Badge variant="outline" className="text-xs mt-1">Profesional Verificado</Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <p className="text-3xl font-bold text-primary">
                ${product.price.toLocaleString('es-MX')}
              </p>
              <p className="text-sm text-muted-foreground">{product.currency}</p>
            </div>

            {hasPurchased ? (
              <div className="flex gap-2">
                <Badge variant="default" className="text-sm py-2 px-4">
                  Ya compraste este producto
                </Badge>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            ) : (
              <Button size="lg" onClick={handlePurchase} className="gap-2">
                <ShoppingBag className="h-5 w-5" />
                Comprar Ahora
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
