"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  Instagram,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface Shop {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  opening_hours: any;
  image_url: string | null;
  gallery: string[];
  category: string | null;
  catalog_pdf_url: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
}

export default function PublicShopPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = use(params);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    async function loadShop() {
      const supabase = createClient();

      // Verificar si el usuario está autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

      const { data: shopData, error } = await supabase
        .from("shops")
        .select("*")
        .eq("id", shopId)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("Error loading shop:", error);
        toast.error("No se pudo cargar la información del comercio");
        setLoading(false);
        return;
      }

      // Asegurarse de que opening_hours se parsea correctamente si viene como string
      if (shopData.opening_hours && typeof shopData.opening_hours === 'string') {
        try {
          shopData.opening_hours = JSON.parse(shopData.opening_hours);
        } catch (e) {
          console.error('Error parsing opening_hours:', e);
        }
      }

      // Debug: ver el formato de opening_hours
      if (shopData.opening_hours) {
        console.log('🔍 Opening hours format:', shopData.opening_hours);
        console.log('🔍 Opening hours type:', typeof shopData.opening_hours);
        if (typeof shopData.opening_hours === 'object') {
          console.log('🔍 Opening hours keys:', Object.keys(shopData.opening_hours));
          Object.entries(shopData.opening_hours).forEach(([day, hours]) => {
            console.log(`🔍 ${day}:`, hours, 'type:', typeof hours);
          });
        }
      }

      setShop(shopData);

      // Cargar solo algunos productos (vista previa)
      const { data: productsData } = await supabase
        .from("shop_products")
        .select("*")
        .eq("shop_id", shopId)
        .limit(6);

      if (productsData) {
        setProducts(productsData);
      }

      setLoading(false);
    }

    loadShop();
  }, [shopId]);

  const handleShare = async () => {
    const publicUrl = `${window.location.origin}/public/shop/${shopId}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("No se pudo copiar el enlace");
    }
  };

  const openGallery = (index: number) => {
    setCurrentImageIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  const nextImage = () => {
    if (shop?.gallery) {
      setCurrentImageIndex((prev) =>
        prev === shop.gallery.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (shop?.gallery) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? shop.gallery.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold">Comercio no encontrado</p>
          <Link href="/" className="text-primary hover:underline mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section con imagen de portada */}
      {shop.gallery && shop.gallery.length > 0 && (
        <div className="relative h-64 md:h-96 w-full overflow-hidden">
          <Image
            src={shop.gallery[0]}
            alt={shop.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="container mx-auto">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground drop-shadow-lg">
                  {shop.name}
                </h1>
                <Button variant="secondary" size="sm" onClick={handleShare} className="shadow-lg">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartir
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Información del comercio */}
            <Card className="shadow-lg py-4">
              <CardHeader>
                {(!shop.gallery || shop.gallery.length === 0) && (
                  <CardTitle className="text-3xl md:text-4xl font-bold mb-4">
                    {shop.name}
                  </CardTitle>
                )}
                {shop.category && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {shop.category}
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {shop.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Descripción</h3>
                    <div
                      className="text-muted-foreground leading-relaxed prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
                      dangerouslySetInnerHTML={{ __html: shop.description }}
                    />
                  </div>
                )}

                <Separator />

                {/* Información de contacto */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {shop.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
                      <div>
                        <p className="font-medium">{shop.address}</p>
                        <p className="text-sm text-muted-foreground">Dirección</p>
                      </div>
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 flex-shrink-0 text-primary" />
                      <div>
                        <a href={`tel:${shop.phone}`} className="font-medium hover:underline">
                          {shop.phone}
                        </a>
                        <p className="text-sm text-muted-foreground">Teléfono</p>
                      </div>
                    </div>
                  )}
                  {shop.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 flex-shrink-0 text-primary" />
                      <div>
                        <a href={`mailto:${shop.email}`} className="font-medium hover:underline">
                          {shop.email}
                        </a>
                        <p className="text-sm text-muted-foreground">Email</p>
                      </div>
                    </div>
                  )}
                  {shop.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 flex-shrink-0 text-primary" />
                      <div>
                        <a href={shop.website} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                          Sitio web
                        </a>
                        <p className="text-sm text-muted-foreground">Página web</p>
                      </div>
                    </div>
                  )}
                  {shop.instagram && (
                    <div className="flex items-center gap-3">
                      <Instagram className="w-5 h-5 flex-shrink-0 text-primary" />
                      <div>
                        <a href={shop.instagram} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                          Instagram
                        </a>
                        <p className="text-sm text-muted-foreground">Redes sociales</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Horarios */}
                {shop.opening_hours && shop.opening_hours !== null && typeof shop.opening_hours === 'object' && Object.keys(shop.opening_hours).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Horarios de Atención</h3>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(shop.opening_hours).map(([day, hours]: [string, any]) => {
                          let hoursText = null;

                          if (hours && typeof hours === 'object' && hours !== null && !Array.isArray(hours)) {
                            if ('open' in hours && 'close' in hours) {
                              const openTime = hours.open;
                              const closeTime = hours.close;
                              if (openTime && closeTime &&
                                  openTime !== 'null' && closeTime !== 'null' &&
                                  String(openTime).trim() !== '' && String(closeTime).trim() !== '') {
                                hoursText = `${String(openTime).trim()} - ${String(closeTime).trim()}`;
                              }
                            }
                            else if ('start' in hours && 'end' in hours) {
                              const startTime = hours.start;
                              const endTime = hours.end;
                              if (startTime && endTime &&
                                  String(startTime).trim() !== '' && String(endTime).trim() !== '') {
                                hoursText = `${String(startTime).trim()} - ${String(endTime).trim()}`;
                              }
                            }
                          }
                          else if (typeof hours === 'string' && hours.trim() !== '' && hours.trim() !== 'null') {
                            hoursText = hours.trim();
                          }
                          else if (typeof hours === 'number') {
                            hoursText = hours.toString();
                          }

                          if (!hoursText) return null;

                          return (
                            <div key={day} className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50 transition-colors">
                              <span className="font-medium capitalize text-foreground">{day}:</span>
                              <span className="text-muted-foreground">{hoursText}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Productos (vista previa) */}
            {products.length > 0 && (
              <Card className="shadow-lg py-4">
                <CardHeader>
                  <CardTitle className="text-xl">Productos Destacados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {products.slice(0, 6).map((product) => (
                      <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
                        {product.image_url && (
                          <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden">
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <h3 className="font-semibold mb-2 text-foreground">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <p className="text-lg font-bold text-primary">
                          ${product.price.toFixed(2)} MXN
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Galería */}
            {shop.gallery && shop.gallery.length > 0 && (
              <Card className="shadow-lg py-4">
                <CardHeader>
                  <CardTitle className="text-xl">Galería de imágenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {shop.gallery.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => openGallery(index)}
                      >
                        <Image
                          src={imageUrl}
                          alt={`${shop.name} - Imagen ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-6 lg:self-start space-y-8">
            {/* Información de acceso */}
            <Card className="shadow-lg py-4">
              <CardHeader>
                <CardTitle>Visitar comercio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isAuthenticated && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Para ver todos los productos y contactar al comercio, necesitas iniciar sesión o crear una cuenta
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button asChild size="lg" className="w-full">
                        <Link href="/signup">Registrarse</Link>
                      </Button>
                      <Button asChild variant="outline" size="lg" className="w-full">
                        <Link href="/login">Iniciar sesión</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {isAuthenticated && (
                  <div className="space-y-4">
                    <Button asChild size="lg" className="w-full">
                      <Link href={`/patient/${shopId}/explore/shop/${shopId}`}>
                        Ver detalles completos
                      </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Accede al comercio en tu panel de control para ver todos los productos
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Logo del comercio */}
            {shop.image_url && (
              <Card className="shadow-lg py-4">
                <CardContent className="pt-6">
                  <div className="relative w-full h-32 rounded-lg overflow-hidden">
                    <Image
                      src={shop.image_url}
                      alt={shop.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog del Carousel */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-7xl w-full p-0 bg-black/95">
          <div className="relative w-full h-[80vh]">
            {shop?.gallery && (
              <>
                <Image
                  src={shop.gallery[currentImageIndex]}
                  alt={`${shop.name} - Imagen ${currentImageIndex + 1}`}
                  fill
                  className="object-contain"
                  priority
                />

                {/* Botón cerrar */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
                  onClick={closeGallery}
                >
                  <X className="h-6 w-6" />
                </Button>

                {/* Botón anterior */}
                {shop.gallery.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                )}

                {/* Botón siguiente */}
                {shop.gallery.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                )}

              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
