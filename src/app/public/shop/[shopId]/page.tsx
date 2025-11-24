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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

interface Shop {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  opening_hours: any;
  logo_url: string | null;
  gallery: string[];
  categories: string[];
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
        .single();

      if (error) {
        console.error("Error loading shop:", error);
        toast.error("No se pudo cargar la información del comercio");
        setLoading(false);
        return;
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
        {/* Información del comercio */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {shop.logo_url && (
                <div className="w-32 h-32 relative rounded-lg overflow-hidden flex-shrink-0 border-2 border-border">
                  <Image
                    src={shop.logo_url}
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

                {shop.categories && shop.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {shop.categories.map((category, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {category}
                      </Badge>
                    ))}
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
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horarios */}
        {shop.opening_hours && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="w-5 h-5 text-primary" />
                Horarios de Atención
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(shop.opening_hours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex justify-between items-center p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <span className="font-medium capitalize text-foreground">{day}:</span>
                    <span className="text-muted-foreground">
                      {hours.open} - {hours.close}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Productos (vista previa) */}
        {products.length > 0 && (
          <Card className="mb-8 shadow-lg">
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

        {/* Galería (vista previa) */}
        {shop.gallery && shop.gallery.length > 1 && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Galería</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shop.gallery.slice(1, 9).map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer hover:scale-105 transition-transform"
                  >
                    <Image
                      src={imageUrl}
                      alt={`Galería ${index + 1}`}
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
    </div>
  );
}
