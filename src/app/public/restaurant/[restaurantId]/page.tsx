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

export default function PublicRestaurantPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { restaurantId } = params;

  useEffect(() => {
    async function loadRestaurant() {
      const supabase = createClient();

      // Verificar si el usuario está autenticado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);

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

      // Cargar solo algunos platos del menú (vista previa)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold">Restaurante no encontrado</p>
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
      {restaurant.gallery && restaurant.gallery.length > 0 && (
        <div className="relative h-64 md:h-96 w-full overflow-hidden">
          <Image
            src={restaurant.gallery[0]}
            alt={restaurant.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="container mx-auto">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground drop-shadow-lg">
                  {restaurant.name}
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
        {/* Información del restaurante */}
        <Card className="mb-8 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {restaurant.logo_url && (
                <div className="w-32 h-32 relative rounded-lg overflow-hidden flex-shrink-0 border-2 border-border">
                  <Image
                    src={restaurant.logo_url}
                    alt={restaurant.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex-1">
                {(!restaurant.gallery || restaurant.gallery.length === 0) && (
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">
                    {restaurant.name}
                  </h1>
                )}

                {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {restaurant.cuisine_types.map((cuisine, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                )}

                {restaurant.description && (
                  <div
                    className="text-muted-foreground mb-6 prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
                    dangerouslySetInnerHTML={{ __html: restaurant.description }}
                  />
                )}

                <div className="space-y-3 text-sm">
                  {restaurant.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
                      <span className="text-foreground">{restaurant.address}</span>
                    </div>
                  )}
                  {restaurant.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 flex-shrink-0 text-primary" />
                      <a href={`tel:${restaurant.phone}`} className="hover:underline text-foreground">
                        {restaurant.phone}
                      </a>
                    </div>
                  )}
                  {restaurant.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 flex-shrink-0 text-primary" />
                      <a href={`mailto:${restaurant.email}`} className="hover:underline text-foreground">
                        {restaurant.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horarios */}
        {restaurant.opening_hours && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="w-5 h-5 text-primary" />
                Horarios de Atención
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(restaurant.opening_hours).map(([day, hours]: [string, any]) => (
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

        {/* Menú (vista previa) */}
        {menuItems.length > 0 && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Menú Destacado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
                    {item.image_url && (
                      <div className="relative w-full h-40 rounded-lg overflow-hidden mb-3">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Galería (vista previa) */}
        {restaurant.gallery && restaurant.gallery.length > 1 && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Galería</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {restaurant.gallery.slice(1, 9).map((imageUrl, index) => (
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
                ¿Quieres ver el menú completo y hacer una reservación?
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
