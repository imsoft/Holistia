"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  params: { shopId: string };
}) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { shopId } = params;

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
        {/* Layout de dos columnas: Horarios a la izquierda, Información a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Columna izquierda: Horarios */}
          {shop.opening_hours && shop.opening_hours !== null && typeof shop.opening_hours === 'object' && Object.keys(shop.opening_hours).length > 0 && (
            <Card className="lg:col-span-1 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="w-5 h-5 text-primary" />
                  Horarios de Atención
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {Object.entries(shop.opening_hours).map(([day, hours]: [string, any]) => {
                    let hoursText = 'Cerrado';
                    
                    if (hours && typeof hours === 'object' && hours !== null) {
                      if ('open' in hours && 'close' in hours && hours.open && hours.close) {
                        hoursText = `${hours.open} - ${hours.close}`;
                      } else if ('closed' in hours && hours.closed === true) {
                        hoursText = 'Cerrado';
                      }
                    } else if (typeof hours === 'string' && hours.trim() !== '') {
                      hoursText = hours;
                    }
                    
                    return (
                      <li key={day} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                        <span className="font-medium capitalize text-foreground">{day}</span>
                        <span className="text-muted-foreground">{hoursText}</span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Columna derecha: Información del comercio */}
          <Card className={shop.opening_hours && Object.keys(shop.opening_hours).length > 0 ? "lg:col-span-2 shadow-lg py-4" : "lg:col-span-3 shadow-lg py-4"}>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                {shop.image_url && (
                  <div className="w-32 h-32 relative rounded-lg overflow-hidden flex-shrink-0 border-2 border-border">
                    <Image
                      src={shop.image_url}
                      alt={shop.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex-1">
                  {(!shop.gallery || shop.gallery.length === 0) && (
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                      {shop.name}
                    </h1>
                  )}

                  {shop.category && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary" className="text-sm">
                        {shop.category}
                      </Badge>
                    </div>
                  )}

                  {shop.description && (
                    <div
                      className="text-muted-foreground mb-6 prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
                      dangerouslySetInnerHTML={{ __html: shop.description }}
                    />
                  )}

                  <div className="space-y-3 text-sm">
                    {shop.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
                        <span className="text-foreground">{shop.address}</span>
                      </div>
                    )}
                    {shop.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 flex-shrink-0 text-primary" />
                        <a href={`tel:${shop.phone}`} className="hover:underline text-foreground">
                          {shop.phone}
                        </a>
                      </div>
                    )}
                    {shop.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 flex-shrink-0 text-primary" />
                        <a href={`mailto:${shop.email}`} className="hover:underline text-foreground">
                          {shop.email}
                        </a>
                      </div>
                    )}
                    {shop.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 flex-shrink-0 text-primary" />
                        <a href={shop.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-foreground">
                          {shop.website}
                        </a>
                      </div>
                    )}
                    {shop.instagram && (
                      <div className="flex items-center gap-3">
                        <Instagram className="w-5 h-5 flex-shrink-0 text-primary" />
                        <a href={shop.instagram} target="_blank" rel="noopener noreferrer" className="hover:underline text-foreground">
                          {shop.instagram}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Productos (vista previa) */}
        {products.length > 0 && (
          <Card className="mb-8 shadow-lg py-4">
            <CardHeader>
              <CardTitle className="text-xl">Productos Destacados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <Card className="mb-8 shadow-lg py-4">
            <CardHeader>
              <CardTitle className="text-xl">Galería</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shop.gallery.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer hover:scale-105 transition-transform"
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

        {/* Call to action */}
        {!isAuthenticated && (
          <Card className="bg-primary/5 border-primary/20 shadow-lg">
            <CardContent className="pt-8 pb-8 text-center">
              <h3 className="text-2xl font-semibold mb-3 text-foreground">
                ¿Quieres ver todos los productos y contactar al comercio?
              </h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Regístrate o inicia sesión para acceder a toda la información
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-base">
                  <Link href="/signup">Registrarse</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base">
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
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
