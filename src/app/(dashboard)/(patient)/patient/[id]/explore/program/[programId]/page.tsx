"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShoppingBag,
  Download,
  Clock,
  FileText,
  Star,
  Sparkles,
  BookOpen,
  Headphones,
  Video,
  FileCheck,
  Tag,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { VerifiedBadge } from "@/components/ui/verified-badge";

interface DigitalProduct {
  id: string;
  professional_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  cover_image_url?: string;
  file_url?: string;
  duration_minutes?: number;
  pages_count?: number;
  is_active: boolean;
  sales_count: number;
  created_at: string;
  professional_applications?: {
    first_name: string;
    last_name: string;
    profile_photo?: string;
    is_verified?: boolean;
    profession?: string;
    specializations?: string[];
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
  ebook: "eBook",
  manual: "Manual",
  course: "Curso",
  guide: "Guía",
  audio: "Audio",
  video: "Video",
  other: "Otro",
};

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const programId = params.programId as string;
  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchProduct();
  }, [programId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);

      const { data: productData, error: productError } = await supabase
        .from("digital_products")
        .select(`
          *,
          professional_applications!digital_products_professional_id_fkey(
            first_name,
            last_name,
            profile_photo,
            is_verified,
            profession,
            specializations
          )
        `)
        .eq("id", programId)
        .eq("is_active", true)
        .single();

      if (productError) throw productError;

      const transformedProduct = {
        ...productData,
        professional_applications: Array.isArray(productData.professional_applications) && productData.professional_applications.length > 0
          ? productData.professional_applications[0]
          : undefined,
      };

      setProduct(transformedProduct);

      // Check if user has purchased this product
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: purchaseData } = await supabase
          .from("digital_product_purchases")
          .select("id")
          .eq("product_id", programId)
          .eq("buyer_id", user.id)
          .eq("payment_status", "succeeded")
          .maybeSingle();

        setHasPurchased(!!purchaseData);
      }

    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Error al cargar el programa");
      router.push(`/patient/${userId}/explore/programs`);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Debes iniciar sesión para comprar");
      return;
    }

    try {
      setIsPurchasing(true);
      toast.loading("Procesando compra...");

      const response = await fetch('/api/stripe/digital-product-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: programId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la compra');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió la URL de checkout');
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar la compra');
      setIsPurchasing(false);
    }
  };

  const handleDownload = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Debes iniciar sesión");
      return;
    }

    if (!product?.file_url) {
      toast.error("No hay archivo disponible para descargar");
      return;
    }

    // Incrementar contador de descargas
    await supabase.rpc("increment_download_count", {
      p_product_id: programId,
      p_user_id: user.id,
    });

    // Abrir el archivo en nueva pestaña
    window.open(product.file_url, "_blank");
    toast.success("Descargando programa...");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando programa...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Programa no encontrado</p>
        </div>
      </div>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[product.category] || Tag;

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Product Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">{product.title}</h1>
                <p className="text-sm text-muted-foreground">Programa Digital</p>
              </div>

              {/* Professional Info */}
              {product.professional_applications && (
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <Link
                          href={`/patient/${userId}/explore/professional/${product.professional_id}`}
                          className="flex-shrink-0"
                        >
                          {product.professional_applications.profile_photo ? (
                            <Image
                              src={product.professional_applications.profile_photo}
                              alt={`${product.professional_applications.first_name} ${product.professional_applications.last_name}`}
                              width={80}
                              height={80}
                              className="rounded-full object-cover border-2 border-primary/20 hover:border-primary/40 transition-colors"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 hover:border-primary/40 transition-colors">
                              <User className="h-10 w-10 text-primary" />
                            </div>
                          )}
                        </Link>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground mb-2">Creado por</p>
                          <Link
                            href={`/patient/${userId}/explore/professional/${product.professional_id}`}
                            className="group"
                          >
                            <h3 className="font-semibold text-lg text-foreground hover:text-primary transition-colors flex items-center gap-2 mb-1">
                              {product.professional_applications.first_name}{' '}
                              {product.professional_applications.last_name}
                              {product.professional_applications.is_verified && (
                                <VerifiedBadge size={18} />
                              )}
                            </h3>
                          </Link>
                          {product.professional_applications.profession && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {product.professional_applications.profession}
                            </p>
                          )}
                          {product.professional_applications.specializations && 
                           product.professional_applications.specializations.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {product.professional_applications.specializations.slice(0, 3).map((spec, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                              {product.professional_applications.specializations.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{product.professional_applications.specializations.length - 3} más
                                </Badge>
                              )}
                            </div>
                          )}
                          <Link
                            href={`/patient/${userId}/explore/professional/${product.professional_id}`}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium mt-3 group"
                          >
                            Ver perfil completo
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cover Image */}
              <div className="relative h-96 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden rounded-lg">
                {product.cover_image_url ? (
                  <Image
                    src={product.cover_image_url}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <CategoryIcon className="h-32 w-32 text-primary/40" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Badge variant="default" className="bg-primary/90 backdrop-blur-sm">
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {CATEGORY_LABELS[product.category] || product.category}
                  </Badge>
                </div>
                {product.sales_count > 0 && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {product.sales_count} ventas
                    </Badge>
                  </div>
                )}
              </div>

              {/* Description */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Descripción</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {product.description}
                  </p>
                </CardContent>
              </Card>

              {/* Details */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Detalles del Programa</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {product.duration_minutes && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Duración</p>
                          <p className="text-sm text-muted-foreground">{product.duration_minutes} minutos</p>
                        </div>
                      </div>
                    )}
                    {product.pages_count && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Páginas</p>
                          <p className="text-sm text-muted-foreground">{product.pages_count} páginas</p>
                        </div>
                      </div>
                    )}
                    {product.sales_count > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Download className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">Ventas</p>
                          <p className="text-sm text-muted-foreground">{product.sales_count} personas lo compraron</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Purchase Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardContent className="p-6 space-y-6">
                  {/* Price */}
                  <div>
                    <p className="text-3xl font-bold text-primary">
                      ${product.price.toLocaleString('es-MX')}
                    </p>
                    <p className="text-sm text-muted-foreground">{product.currency}</p>
                  </div>

                  {/* Purchase Button */}
                  {hasPurchased ? (
                    <div className="space-y-3">
                      <Badge variant="default" className="w-full justify-center py-2">
                        Ya compraste este programa
                      </Badge>
                      <Button onClick={handleDownload} className="w-full" size="lg">
                        <Download className="h-5 w-5 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handlePurchase} disabled={isPurchasing} className="w-full" size="lg">
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      {isPurchasing ? 'Procesando...' : 'Comprar Ahora'}
                    </Button>
                  )}

                  {/* Professional Info */}
                  {product.professional_applications && (
                    <div className="pt-6 border-t space-y-3">
                      <h4 className="font-semibold text-sm">Creado por</h4>
                      <div className="flex items-center gap-3">
                        {product.professional_applications.profile_photo ? (
                          <Image
                            src={product.professional_applications.profile_photo}
                            alt=""
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium flex items-center gap-1">
                            {product.professional_applications.first_name}{' '}
                            {product.professional_applications.last_name}
                            {product.professional_applications.is_verified && (
                              <VerifiedBadge size={14} />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">Profesional Verificado</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
