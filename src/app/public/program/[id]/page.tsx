"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
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
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { FavoriteButton } from "@/components/ui/favorite-button";

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

export default function PublicProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: programId } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchProduct();
  }, [programId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);

      // Verificar autenticación
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setUserId(user?.id || null);

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

      if (productError) {
        console.error("Error loading product:", productError);
        toast.error("No se pudo cargar la información del programa");
        setLoading(false);
        return;
      }

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
        const { data: professionalManual, error: professionalError } = await supabase
          .from("professional_applications")
          .select("first_name, last_name, profile_photo, is_verified, profession, specializations")
          .eq("id", productData.professional_id)
          .single();
        
        if (!professionalError && professionalManual) {
          professionalData = professionalManual;
        }
      }

      const transformedProduct = {
        ...productData,
        professional_applications: professionalData || undefined,
      };

      setProduct(transformedProduct);

      // Check if user has purchased this product (solo si está autenticado)
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
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error("Debes iniciar sesión para comprar");
      router.push("/signup");
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
    if (!isAuthenticated) {
      toast.error("Debes iniciar sesión para descargar");
      router.push("/signup");
      return;
    }

    if (!product?.file_url) {
      toast.error("No hay archivo disponible para descargar");
      return;
    }

    // Incrementar contador de descargas
    if (userId) {
      await supabase.rpc("increment_download_count", {
        p_product_id: programId,
        p_user_id: userId,
      });
    }

    // Abrir el archivo en nueva pestaña
    window.open(product.file_url, "_blank");
    toast.success("Descargando programa...");
  };

  const handleShare = async () => {
    const publicUrl = `${window.location.origin}/public/program/${programId}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("No se pudo copiar el enlace");
    }
  };

  if (loading) {
    return (
      <div className="bg-background">
        <main className="mx-auto px-4 pt-14 pb-24 sm:px-6 sm:pt-16 sm:pb-32 lg:max-w-7xl lg:px-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando programa...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-background">
        <main className="mx-auto px-4 pt-14 pb-24 sm:px-6 sm:pt-16 sm:pb-32 lg:max-w-7xl lg:px-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <p className="text-lg font-medium text-foreground mb-2">
                Programa no encontrado
              </p>
              <p className="text-sm text-muted-foreground">
                El programa que buscas no está disponible o ha sido eliminado
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/">Volver al inicio</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[product.category] || Tag;

  return (
    <div className="bg-background">
      <main className="mx-auto px-4 pt-14 pb-24 sm:px-6 sm:pt-16 sm:pb-32 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-7 lg:grid-rows-1 lg:gap-x-8 lg:gap-y-10 xl:gap-x-16">
          {/* Product image */}
          <div className="lg:col-span-4 lg:row-end-1">
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
              {product.cover_image_url ? (
                <Image
                  alt={product.title}
                  src={product.cover_image_url}
                  width={800}
                  height={600}
                  className="h-full w-full object-cover object-center"
                  priority
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-background/50 mx-auto mb-4 flex items-center justify-center">
                      <CategoryIcon className="w-16 h-16 text-primary" />
                    </div>
                    <p className="text-xl font-semibold text-primary-foreground">{product.title}</p>
                  </div>
                </div>
              )}
              {/* Favorite button */}
              <FavoriteButton
                itemId={product.id}
                favoriteType="digital_product"
                variant="floating"
              />
            </div>
          </div>

          {/* Product details */}
          <div className="mx-auto mt-14 max-w-2xl sm:mt-16 lg:col-span-3 lg:row-span-2 lg:row-end-2 lg:mt-0 lg:max-w-none">
            <div className="flex flex-col-reverse">
              <div className="mt-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {product.title}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {CATEGORY_LABELS[product.category] || product.category}
                  </Badge>
                  {product.sales_count > 0 && (
                    <Badge variant="secondary">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      {product.sales_count} ventas
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Price and Purchase */}
            <div className="mt-6">
              <Card className="border-primary/20">
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
                    <Button 
                      onClick={handlePurchase} 
                      disabled={isPurchasing} 
                      className="w-full" 
                      size="lg"
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      {isPurchasing ? 'Procesando...' : isAuthenticated ? 'Comprar Ahora' : 'Iniciar sesión para comprar'}
                    </Button>
                  )}

                  {/* Share Button */}
                  <Button variant="outline" onClick={handleShare} className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Professional Info */}
            {product.professional_applications && (
              <div className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Creado por</h3>
                    <div className="flex items-start gap-4">
                      <Link
                        href={`/public/professional/${product.professional_applications.first_name.toLowerCase()}-${product.professional_applications.last_name.toLowerCase()}-${product.professional_id}`}
                        className="shrink-0"
                      >
                        {product.professional_applications.profile_photo ? (
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 hover:border-primary/40 transition-colors">
                            <Image
                              src={product.professional_applications.profile_photo}
                              alt={`${product.professional_applications.first_name} ${product.professional_applications.last_name}`}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 hover:border-primary/40 transition-colors">
                            <User className="h-8 w-8 text-primary" />
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/public/professional/${product.professional_applications.first_name.toLowerCase()}-${product.professional_applications.last_name.toLowerCase()}-${product.professional_id}`}
                          className="group"
                        >
                          <h4 className="font-semibold text-lg text-foreground hover:text-primary transition-colors flex items-center gap-2 mb-1">
                            {product.professional_applications.first_name}{' '}
                            {product.professional_applications.last_name}
                            {product.professional_applications.is_verified && (
                              <VerifiedBadge size={18} />
                            )}
                          </h4>
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Details */}
            <div className="mt-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Detalles del Programa</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {product.duration_minutes && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Clock className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Duración</p>
                          <p className="text-sm text-muted-foreground">{product.duration_minutes} minutos</p>
                        </div>
                      </div>
                    )}
                    {product.pages_count && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Páginas</p>
                          <p className="text-sm text-muted-foreground">{product.pages_count} páginas</p>
                        </div>
                      </div>
                    )}
                    {product.sales_count > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Download className="h-5 w-5 text-primary shrink-0" />
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
          </div>
        </div>

        {/* Description */}
        <div className="mt-10">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Descripción</h3>
              <div 
                className="text-muted-foreground whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </CardContent>
          </Card>
        </div>

        {/* CTA para registrarse si no está autenticado */}
        {!isAuthenticated && (
          <div className="mt-10">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <h3 className="text-xl font-bold mb-2">
                  ¿Quieres comprar este programa?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Regístrate gratis para acceder a todos nuestros programas y servicios
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button size="lg" asChild>
                    <Link href="/signup">Registrarse gratis</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Iniciar sesión</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
