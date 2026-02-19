"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
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
  ArrowLeft,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { formatPrice } from "@/lib/price-utils";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/ui/layout-skeleton";
import { ProgramReviewsSection } from "@/components/reviews/program-reviews-section";

interface DigitalProduct {
  id: string;
  slug?: string;
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
    slug?: string;
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
  ebook: "Workbook",
  manual: "Manual",
  course: "Curso",
  guide: "Guía",
  audio: "Audio",
  video: "Video",
  other: "Otro",
};

export default function ProgramDetailPage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const userId = useUserId();
  const slugParam = params.slug as string;
  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userPurchaseId, setUserPurchaseId] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [reviewsRefresh, setReviewsRefresh] = useState(0);
  const supabase = createClient();

  const POPULAR_THRESHOLD = 10;

  // Verificar si el usuario está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, [supabase]);

  useEffect(() => {
    fetchProduct();
  }, [slugParam]);

  const fetchProduct = async () => {
    try {
      setLoading(true);

      // Primero intentar buscar por slug
      let { data: productData, error: productError } = await supabase
        .from("digital_products")
        .select(`
          *,
          professional_applications!digital_products_professional_id_fkey(
            first_name,
            last_name,
            slug,
            profile_photo,
            is_verified,
            profession,
            specializations
          )
        `)
        .eq("slug", slugParam)
        .eq("is_active", true)
        .maybeSingle();

      // Si no se encuentra por slug, intentar por ID (backward compatibility)
      if (!productData) {
        const { data: productById, error: errorById } = await supabase
          .from("digital_products")
          .select(`
            *,
            professional_applications!digital_products_professional_id_fkey(
              first_name,
              last_name,
              slug,
              profile_photo,
              is_verified,
              profession,
              specializations
            )
          `)
          .eq("id", slugParam)
          .eq("is_active", true)
          .maybeSingle();
        
        productData = productById;
        productError = errorById;
      }

      if (productError) throw productError;

      let professionalData = null;
      
      // Intentar obtener datos del profesional desde la relación
      if (productData.professional_applications) {
        if (Array.isArray(productData.professional_applications) && productData.professional_applications.length > 0) {
          professionalData = productData.professional_applications[0];
        } else if (!Array.isArray(productData.professional_applications)) {
          professionalData = productData.professional_applications;
        }
      }

      // Si no se obtuvo el profesional desde la relación, intentar obtenerlo manualmente
      if (!professionalData && productData.professional_id) {
        console.log("⚠️ No se obtuvo profesional desde relación, buscando manualmente...");
        const { data: professionalManual, error: professionalError } = await supabase
          .from("professional_applications")
          .select("first_name, last_name, profile_photo, is_verified, profession, specializations")
          .eq("id", productData.professional_id)
          .single();
        
        if (!professionalError && professionalManual) {
          professionalData = professionalManual;
          console.log("✅ Profesional obtenido manualmente:", professionalData);
        } else {
          console.error("❌ Error obteniendo profesional manualmente:", professionalError);
        }
      }

      const transformedProduct = {
        ...productData,
        professional_applications: professionalData || undefined,
      };

      console.log("🔍 Final product:", transformedProduct);
      console.log("🔍 Professional applications:", transformedProduct.professional_applications);

      setProduct(transformedProduct);

      // Check if user has purchased this product
      const { data: { user } } = await supabase.auth.getUser();
      if (user && transformedProduct) {
        const { data: purchaseData } = await supabase
          .from("digital_product_purchases")
          .select("id")
          .eq("product_id", transformedProduct.id)
          .eq("buyer_id", user.id)
          .eq("payment_status", "succeeded")
          .eq("access_granted", true)
          .maybeSingle();

        setHasPurchased(!!purchaseData);
        setUserPurchaseId(purchaseData?.id ?? null);
      }

    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Error al cargar el programa");
      router.push(`/explore/programs`);
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

    if (!product) return;

    try {
      setIsPurchasing(true);
      toast.loading("Procesando compra...");

      const response = await fetch('/api/stripe/digital-product-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: product.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la compra');
      }

      // Handle free products ($0) - redirect to my-products
      if (data.free && data.redirect_url) {
        toast.success('¡Programa agregado exitosamente!');
        // Forzar recarga completa de la página para actualizar los datos
        setTimeout(() => {
          window.location.href = data.redirect_url;
        }, 1000);
        return;
      }

      // Redirect to Stripe Checkout for paid products
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
      p_product_id: product.id,
      p_user_id: user.id,
    });

    // Abrir el archivo en nueva pestaña
    window.open(product.file_url, "_blank");
    toast.success("Descargando programa...");
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copiada al portapapeles");
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error("Error al copiar la URL. Intenta copiar manualmente.");
    }
  };

  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Product Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-9 w-3/4" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </CardContent>
                </Card>
              </div>
              {/* Right Column - Purchase Card */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
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

  // Función para renderizar el contenido del programa
  const renderProgramContent = () => (
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
          <Card className="hover:shadow-md transition-shadow overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Link
                    href={`/explore/professional/${product.professional_applications.slug || product.professional_id}`}
                    className="flex-shrink-0"
                  >
                    {product.professional_applications.profile_photo ? (
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors">
                        <Image
                          src={product.professional_applications.profile_photo}
                          alt={`${product.professional_applications.first_name} ${product.professional_applications.last_name}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 hover:border-primary/40 transition-colors">
                        <User className="h-10 w-10 text-primary" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-2">Creado por</p>
                    <Link
                      href={`/explore/professional/${product.professional_applications.slug || product.professional_id}`}
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
                      <div className="flex flex-wrap gap-2 mt-3 max-w-full">
                        {product.professional_applications.specializations.slice(0, 3).map((spec, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs max-w-full whitespace-normal break-words text-left py-1 px-2"
                          >
                            {spec}
                          </Badge>
                        ))}
                        {product.professional_applications.specializations.length > 3 && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            +{product.professional_applications.specializations.length - 3} más
                          </Badge>
                        )}
                      </div>
                    )}
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
          <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
            {product.sales_count >= POPULAR_THRESHOLD && (
              <Badge className="bg-amber-500/90 text-white border-0 backdrop-blur-sm">
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

        {/* Reseñas */}
        <ProgramReviewsSection
          productId={product.id}
          productTitle={product.title}
          salesCount={product.sales_count}
          userPurchaseId={userPurchaseId}
          refreshTrigger={reviewsRefresh}
        />
      </div>

      {/* Right Column - Purchase Card */}
      <div className="lg:col-span-1 lg:self-start">
        <Card className="sticky top-6">
          <CardContent className="p-6 space-y-6">
            {/* Price */}
            <div>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(product.price, product.currency || "MXN")}
              </p>
              <p className="text-sm text-muted-foreground">{product.currency}</p>
            </div>

            {/* Share Button */}
            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Compartir
            </Button>

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
            ) : !isAuthenticated ? (
              <>
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push(`/signup?redirect=${encodeURIComponent(`/explore/program/${product?.slug || slugParam}`)}`)}
                    className="w-full"
                    size="lg"
                  >
                    Registrarse para participar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/explore/program/${product?.slug || slugParam}`)}`)}
                    className="w-full"
                    size="lg"
                  >
                    Ya tengo cuenta
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Regístrate para comprar este programa y acceder a todos nuestros recursos.
                </p>
              </>
            ) : (
              <>
                <Button onClick={handlePurchase} disabled={isPurchasing} className="w-full" size="lg">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  {isPurchasing ? 'Procesando...' : 'Comprar Ahora'}
                </Button>
                <p className="text-xs text-muted-foreground font-semibold text-center">
                  ⚠️ No hay reembolsos
                </p>
              </>
            )}

            {/* Professional Info */}
            {product.professional_applications && (
              <div className="pt-6 border-t space-y-3">
                <h4 className="font-semibold text-sm">Creado por</h4>
                <div className="flex items-center gap-3">
                  {product.professional_applications.profile_photo ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <Image
                        src={product.professional_applications.profile_photo}
                        alt=""
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
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
  );

  // Si aún estamos verificando autenticación, mostrar skeleton
  if (isAuthenticated === null) {
    return <PageSkeleton cards={3} />;
  }

  // El layout del explore se encarga del navbar/footer para usuarios no autenticados
  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          {renderProgramContent()}
        </div>
      </div>
    );
  }

  // Si está autenticado, mostrar con layout normal (navbar del dashboard)
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-5xl mx-auto">
          {renderProgramContent()}
        </div>
      </div>
    </div>
  );
}
