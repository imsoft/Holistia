"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  ArrowLeft,
  ExternalLink,
  FileText,
  Tag,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StableImage } from "@/components/ui/stable-image";
import { Separator } from "@/components/ui/separator";

interface Shop {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  image_url?: string;
  category?: string;
  catalog_pdf_url?: string;
  gallery?: string[];
  is_active: boolean;
  created_at: string;
}

interface ShopProduct {
  id: string;
  shop_id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  discount_price?: number | null;
  stock: number;
  sku?: string | null;
  category?: string | null;
  is_featured: boolean;
  is_active: boolean;
  images?: ProductImage[];
}

interface ProductImage {
  id: string;
  image_url: string;
  image_order: number;
}

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const shopId = params.shopId as string;
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/patient/${userId}/explore/shop/${shopId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("No se pudo copiar el enlace");
    }
  };

  useEffect(() => {
    const getShopData = async () => {
      try {
        setLoading(true);

        // Obtener datos del comercio
        const { data: shopData, error: shopError } = await supabase
          .from("shops")
          .select("*")
          .eq("id", shopId)
          .eq("is_active", true)
          .single();

        if (shopError) {
          console.error("Error fetching shop:", shopError);
        } else {
          // Parsear gallery si viene como string JSON
          if (shopData.gallery && typeof shopData.gallery === 'string') {
            try {
              shopData.gallery = JSON.parse(shopData.gallery);
            } catch (e) {
              console.error('Error parsing gallery:', e);
              shopData.gallery = [];
            }
          }
          
          // Asegurar que gallery sea un array
          if (!Array.isArray(shopData.gallery)) {
            shopData.gallery = [];
          }
          
          
          setShop(shopData);
        }

        // Obtener productos del comercio
        const { data: productsData, error: productsError } = await supabase
          .from("shop_products")
          .select("*")
          .eq("shop_id", shopId)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (productsError) {
          console.error("Error fetching products:", productsError);
        } else {
          // Obtener imágenes de cada producto
          const productsWithImages = await Promise.all(
            (productsData || []).map(async (product) => {
              const { data: images } = await supabase
                .from("shop_product_images")
                .select("*")
                .eq("product_id", product.id)
                .order("image_order", { ascending: true });

              return {
                ...product,
                images: images || [],
              };
            })
          );
          setProducts(productsWithImages);
        }
      } catch (error) {
        console.error("Error fetching shop data:", error);
      } finally {
        setLoading(false);
      }
    };

    getShopData();
  }, [shopId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Comercio no encontrado
          </h2>
          <p className="text-muted-foreground mb-6">
            El comercio que buscas no existe o no está disponible
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Botón de regresar */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        {/* Imagen principal y título */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Imagen */}
          <div className="relative w-full h-96 rounded-lg overflow-hidden bg-muted">
            {shop.image_url ? (
              <StableImage
                src={shop.image_url}
                alt={shop.name}
                fill
                className="object-cover"
                fallbackSrc="/logos/holistia-black.png"
              />
            ) : shop.gallery && Array.isArray(shop.gallery) && shop.gallery.length > 0 ? (
              <StableImage
                src={shop.gallery[0]}
                alt={shop.name}
                fill
                className="object-cover"
                fallbackSrc="/logos/holistia-black.png"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Store className="h-32 w-32 text-primary/40" />
              </div>
            )}
          </div>

          {/* Información principal */}
          <div>
            <div className="mb-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex-1">
                  {shop.name}
                </h1>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Compartir</span>
                </Button>
              </div>
              {shop.category && (
                <Badge variant="secondary" className="w-fit">
                  {shop.category}
                </Badge>
              )}
            </div>

            {shop.description && (
              <div
                className="text-muted-foreground mb-6"
                dangerouslySetInnerHTML={{ __html: shop.description }}
              />
            )}

            <Separator className="my-6" />

            {/* Información de contacto */}
            <div className="space-y-3">
              {(shop.address || shop.city) && (
                <div className="flex items-start gap-3 text-foreground">
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>
                    {shop.address && shop.city ? `${shop.address}, ${shop.city}` : shop.address || shop.city}
                  </span>
                </div>
              )}

              {shop.phone && (
                <div className="flex items-center gap-3 text-foreground">
                  <Phone className="h-5 w-5 flex-shrink-0" />
                  <a href={`tel:${shop.phone}`} className="hover:text-primary transition-colors">
                    {shop.phone}
                  </a>
                </div>
              )}

              {shop.email && (
                <div className="flex items-center gap-3 text-foreground">
                  <Mail className="h-5 w-5 flex-shrink-0" />
                  <a href={`mailto:${shop.email}`} className="hover:text-primary transition-colors">
                    {shop.email}
                  </a>
                </div>
              )}

              {shop.website && (
                <div className="flex items-center gap-3 text-foreground">
                  <Globe className="h-5 w-5 flex-shrink-0" />
                  <a
                    href={shop.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    Visitar sitio web
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              {shop.instagram && (
                <div className="flex items-center gap-3 text-foreground">
                  <Instagram className="h-5 w-5 flex-shrink-0" />
                  <a
                    href={`https://instagram.com/${shop.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {shop.instagram}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Galería de imágenes */}
        {shop.gallery && Array.isArray(shop.gallery) && shop.gallery.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Galería</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shop.gallery.filter(url => url && url.trim() !== '').map((imageUrl, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <StableImage
                    src={imageUrl}
                    alt={`Imagen ${index + 1} de ${shop.name}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                    fallbackSrc="/logos/holistia-black.png"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Catálogo en PDF */}
        {shop.catalog_pdf_url && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Catálogo Completo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <a
                  href={shop.catalog_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Ver Catálogo en PDF
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Productos */}
        {products.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Tag className="h-6 w-6" />
              Nuestros Productos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  {product.images && product.images.length > 0 && (
                    <div className="relative w-full h-48">
                      <StableImage
                        src={product.images[0].image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                      {product.is_featured && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                          Destacado
                        </Badge>
                      )}
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    {product.category && (
                      <Badge variant="outline" className="w-fit">
                        {product.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      {product.discount_price ? (
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-primary">
                            ${product.discount_price.toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            ${product.price?.toFixed(2)}
                          </span>
                        </div>
                      ) : product.price ? (
                        <span className="text-lg font-bold text-primary">
                          ${product.price.toFixed(2)}
                        </span>
                      ) : null}
                      {product.stock > 0 && (
                        <Badge variant="secondary">
                          Stock: {product.stock}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
