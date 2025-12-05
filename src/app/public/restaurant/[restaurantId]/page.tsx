"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  opening_hours: any;
  logo_url: string | null;
  gallery: string[];
  cuisine_types: string[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  image_url: string | null;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function PublicRestaurantPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'menu' | 'hours'>('about');
  const { restaurantId } = params;

  useEffect(() => {
    async function loadRestaurant() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setUserId(user?.id || null);

      const { data: restaurantData, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();

      if (error) {
        console.error("Error loading restaurant:", error);
        toast.error("No se pudo cargar la información del restaurante");
        setLoading(false);
        return;
      }

      setRestaurant(restaurantData);

      const { data: menuData } = await supabase
        .from("restaurant_menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .limit(6);

      if (menuData) {
        setMenuItems(menuData);
      }

      setLoading(false);
    }

    loadRestaurant();
  }, [restaurantId]);

  const handleShare = async () => {
    const publicUrl = `${window.location.origin}/public/restaurant/${restaurantId}`;

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

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl font-semibold text-foreground">Restaurante no encontrado</p>
          <Link href="/" className="text-primary hover:text-primary mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const highlights = [
    restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && `Cocina: ${restaurant.cuisine_types.join(", ")}`,
    restaurant.address && `Ubicación: ${restaurant.address}`,
    menuItems.length > 0 && `${menuItems.length} platillos disponibles`,
  ].filter(Boolean) as string[];

  return (
    <div className="bg-background">
      <main className="mx-auto px-4 pt-14 pb-24 sm:px-6 sm:pt-16 sm:pb-32 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-7 lg:grid-rows-1 lg:gap-x-8 lg:gap-y-10 xl:gap-x-16">
          {/* Restaurant image */}
          <div className="lg:col-span-4 lg:row-end-1">
            {restaurant.gallery && restaurant.gallery.length > 0 ? (
              <div className="aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  alt={restaurant.name}
                  src={restaurant.gallery[0]}
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
                    <UtensilsCrossed className="w-16 h-16 text-primary" />
                  </div>
                  <p className="text-xl font-semibold text-primary-foreground">{restaurant.name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Restaurant details */}
          <div className="mx-auto mt-14 max-w-2xl sm:mt-16 lg:col-span-3 lg:row-span-2 lg:row-end-2 lg:mt-0 lg:max-w-none">
            <div className="flex flex-col-reverse">
              <div className="mt-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {restaurant.name}
                </h1>

                <h2 id="information-heading" className="sr-only">
                  Información del restaurante
                </h2>
                {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {restaurant.cuisine_types.map((cuisine, index) => (
                      <Badge
                        key={index}
                        className="bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
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
                      <UtensilsCrossed className="w-5 h-5 mr-2" />
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
                    <Link href={`/patient/${userId}/explore/restaurant/${restaurantId}`}>
                      <UtensilsCrossed className="w-5 h-5 mr-2" />
                      Ver menú completo
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
                {restaurant.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                  </div>
                )}
                {restaurant.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <a href={`tel:${restaurant.phone}`} className="text-sm text-muted-foreground hover:text-primary">
                      {restaurant.phone}
                    </a>
                  </div>
                )}
                {restaurant.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <a href={`mailto:${restaurant.email}`} className="text-sm text-muted-foreground hover:text-primary">
                      {restaurant.email}
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
                  Acerca del restaurante
                </button>
                {menuItems.length > 0 && (
                  <button
                    onClick={() => setActiveTab('menu')}
                    className={classNames(
                      activeTab === 'menu'
                        ? "border-primary text-primary"
                        : "border-transparent text-foreground hover:border-border hover:text-foreground",
                      "whitespace-nowrap border-b-2 py-6 text-sm font-medium"
                    )}
                  >
                    Menú
                  </button>
                )}
                {restaurant.opening_hours && (
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
              {activeTab === 'about' && restaurant.description && (
                <div className="text-sm text-muted-foreground">
                  <div
                    className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
                    dangerouslySetInnerHTML={{ __html: restaurant.description }}
                  />
                </div>
              )}

              {activeTab === 'menu' && menuItems.length > 0 && (
                <div>
                  <h3 className="sr-only">Menú</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {menuItems.map((item) => (
                      <div
                        key={item.id}
                        className="group relative border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {item.image_url && (
                          <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-sm font-medium text-foreground">{item.name}</h4>
                          <span className="text-lg font-bold text-primary ml-2">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                        {item.category && (
                          <Badge variant="outline" className="mb-2 text-xs">
                            {item.category}
                          </Badge>
                        )}
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'hours' && restaurant.opening_hours && (
                <div className="space-y-3">
                  {Object.entries(restaurant.opening_hours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex items-start gap-4">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground capitalize">{day}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {hours.open} - {hours.close}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery section */}
        {restaurant.gallery && restaurant.gallery.length > 1 && (
          <div className="mx-auto mt-24 max-w-2xl sm:mt-32 lg:max-w-none">
            <div className="flex items-center justify-between space-x-4">
              <h2 className="text-lg font-medium text-foreground">Galería</h2>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4">
              {restaurant.gallery.slice(1).map((image, index) => (
                <div key={index} className="group relative">
                  <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
                    <Image
                      alt={`${restaurant.name} - Imagen ${index + 2}`}
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
