"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Globe,
  Instagram,
  Store,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
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
  const [activeTab, setActiveTab] = useState<'about' | 'products' | 'hours'>('about');

  useEffect(() => {
    async function loadShop() {
      const supabase = createClient();

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

      if (shopData.opening_hours && typeof shopData.opening_hours === 'string') {
        try {
          shopData.opening_hours = JSON.parse(shopData.opening_hours);
        } catch (e) {
          console.error('Error parsing opening_hours:', e);
        }
      }

      setShop(shopData);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground">Comercio no encontrado</p>
          <Link href="/" className="text-primary hover:text-primary mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const highlights = [
    shop.category && `Categoría: ${shop.category}`,
    shop.address && `Ubicación: ${shop.city || 'México'}`,
    products.length > 0 && `${products.length} productos disponibles`,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-background">
      <main className="mx-auto px-4 pt-14 pb-24 sm:px-6 sm:pt-16 sm:pb-32 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-7 lg:grid-rows-1 lg:gap-x-8 lg:gap-y-10 xl:gap-x-16">
          {/* Shop image */}
          <div className="lg:col-span-4 lg:row-end-1">
            {shop.gallery && shop.gallery.length > 0 ? (
              <div className="aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  alt={shop.name}
                  src={shop.gallery[0]}
                  width={800}
                  height={600}
                  className="h-full w-full object-cover object-center"
                  priority
                />
              </div>
            ) : (
              <div className="aspect-4/3 w-full rounded-lg bg-linear-to-br from-primary/10 to-blue-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-background/50 mx-auto mb-4 flex items-center justify-center">
                    <Store className="w-16 h-16 text-primary" />
                  </div>
                  <p className="text-xl font-semibold text-primary-foreground">{shop.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Shop details */}
          <div className="mx-auto mt-14 max-w-2xl sm:mt-16 lg:col-span-3 lg:row-span-2 lg:row-end-2 lg:mt-0 lg:max-w-none">
            <div className="flex flex-col-reverse">
              <div className="mt-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {shop.name}
                </h1>

                <h2 id="information-heading" className="sr-only">
                  Información del comercio
                </h2>
                {shop.category && (
                  <p className="mt-2 text-lg text-muted-foreground">
                    {shop.category}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {!isAuthenticated ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-primary hover:bg-primary text-white"
                  >
                    <Link href="/signup">
                      <Store className="w-5 h-5 mr-2" />
                      Registrarse
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="w-full border-primary text-primary hover:bg-primary/5"
                  >
                    <Link href="/login">Iniciar sesión</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-primary hover:bg-primary text-white sm:col-span-2"
                  >
                    <Link href={`/patient/${shopId}/explore/shop/${shopId}`}>
                      <Store className="w-5 h-5 mr-2" />
                      Ver todos los productos
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="mt-10 border-t border-gray-200 pt-10">
                <h3 className="text-sm font-medium text-foreground">Destacados</h3>
                <div className="mt-4">
                  <ul role="list" className="list-disc space-y-2 pl-5 text-sm text-muted-foreground marker:text-primary/30">
                    {highlights.map((highlight, index) => (
                      <li key={index} className="pl-2">
                        <span className="text-foreground">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Información de contacto */}
            <div className="mt-10 border-t border-gray-200 pt-10">
              <h3 className="text-sm font-medium text-foreground">Información de contacto</h3>
              <div className="mt-4 space-y-3">
                {shop.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{shop.address}</p>
                  </div>
                )}
                {shop.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <a href={`tel:${shop.phone}`} className="text-sm text-muted-foreground hover:text-primary">
                      {shop.phone}
                    </a>
                  </div>
                )}
                {shop.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <a href={`mailto:${shop.email}`} className="text-sm text-muted-foreground hover:text-primary">
                      {shop.email}
                    </a>
                  </div>
                )}
                {shop.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <a href={shop.website} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary">
                      Visitar sitio web
                    </a>
                  </div>
                )}
                {shop.instagram && (
                  <div className="flex items-start gap-3">
                    <Instagram className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <a href={shop.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary">
                      Seguir en Instagram
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Share */}
            <div className="mt-10 border-t border-gray-200 pt-10">
              <h3 className="text-sm font-medium text-foreground">Compartir</h3>
              <div className="mt-4">
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Copiar enlace
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs section */}
          <div className="mx-auto mt-16 w-full max-w-2xl lg:col-span-4 lg:mt-0 lg:max-w-none">
            <div className="border-b border-gray-200">
              <div className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('about')}
                  className={classNames(
                    activeTab === 'about'
                      ? "border-primary text-primary"
                      : "border-transparent text-foreground hover:border-border hover:text-foreground",
                    "whitespace-nowrap border-b-2 py-6 text-sm font-medium"
                  )}
                >
                  Acerca del comercio
                </button>
                {products.length > 0 && (
                  <button
                    onClick={() => setActiveTab('products')}
                    className={classNames(
                      activeTab === 'products'
                        ? "border-primary text-primary"
                        : "border-transparent text-foreground hover:border-border hover:text-foreground",
                      "whitespace-nowrap border-b-2 py-6 text-sm font-medium"
                    )}
                  >
                    Productos
                  </button>
                )}
                {shop.opening_hours && typeof shop.opening_hours === 'object' && Object.keys(shop.opening_hours).length > 0 && (
                  <button
                    onClick={() => setActiveTab('hours')}
                    className={classNames(
                      activeTab === 'hours'
                        ? "border-primary text-primary"
                        : "border-transparent text-foreground hover:border-border hover:text-foreground",
                      "whitespace-nowrap border-b-2 py-6 text-sm font-medium"
                    )}
                  >
                    Horarios
                  </button>
                )}
              </div>
            </div>

            {/* Tab panels */}
            <div className="mt-10">
              {activeTab === 'about' && shop.description && (
                <div className="text-sm text-muted-foreground">
                  <div
                    className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
                    dangerouslySetInnerHTML={{ __html: shop.description }}
                  />
                </div>
              )}

              {activeTab === 'products' && products.length > 0 && (
                <div>
                  <h3 className="sr-only">Productos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="group relative border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {product.image_url && (
                          <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <h4 className="text-sm font-medium text-foreground mb-2">{product.name}</h4>
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
                </div>
              )}

              {activeTab === 'hours' && shop.opening_hours && typeof shop.opening_hours === 'object' && (
                <div className="space-y-3">
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

                    if (!hoursText) return null;

                    return (
                      <div key={day} className="flex items-start gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-foreground capitalize">{day}</h4>
                          <p className="mt-1 text-sm text-muted-foreground">{hoursText}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery section */}
        {shop.gallery && shop.gallery.length > 1 && (
          <div className="mx-auto mt-24 max-w-2xl sm:mt-32 lg:max-w-none">
            <div className="flex items-center justify-between space-x-4">
              <h2 className="text-lg font-medium text-foreground">Galería</h2>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4">
              {shop.gallery.slice(1).map((image, index) => (
                <div key={index} className="group relative">
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
                    <Image
                      alt={`${shop.name} - Imagen ${index + 2}`}
                      src={image}
                      fill
                      className="object-cover object-center group-hover:opacity-75 transition-opacity"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
