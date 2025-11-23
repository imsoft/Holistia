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
  LogIn,
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
    const publicUrl = `${window.location.origin}/restaurant/${restaurantId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${restaurant?.name} - Holistia`,
          text: `Conoce ${restaurant?.name} en Holistia`,
          url: publicUrl,
        });
      } else {
        await navigator.clipboard.writeText(publicUrl);
        toast.success("Enlace copiado al portapapeles");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      try {
        await navigator.clipboard.writeText(publicUrl);
        toast.success("Enlace copiado al portapapeles");
      } catch (clipboardError) {
        toast.error("No se pudo copiar el enlace");
      }
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
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-primary hover:underline">
              ← Volver
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Compartir</span>
              </Button>
              {!isAuthenticated && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar sesión
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Información del restaurante */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              {restaurant.logo_url && (
                <div className="w-32 h-32 relative rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={restaurant.logo_url}
                    alt={restaurant.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <UtensilsCrossed className="w-8 h-8" />
                  {restaurant.name}
                </h1>

                {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {restaurant.cuisine_types.map((cuisine, index) => (
                      <Badge key={index} variant="secondary">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                )}

                {restaurant.description && (
                  <p className="text-muted-foreground mb-4">{restaurant.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  {restaurant.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{restaurant.address}</span>
                    </div>
                  )}
                  {restaurant.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${restaurant.phone}`} className="hover:underline">
                        {restaurant.phone}
                      </a>
                    </div>
                  )}
                  {restaurant.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${restaurant.email}`} className="hover:underline">
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Horarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(restaurant.opening_hours).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex justify-between">
                    <span className="font-medium capitalize">{day}:</span>
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
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Menú</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {menuItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 flex gap-4">
                    {item.image_url && (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <span className="text-lg font-bold text-primary">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      {item.category && (
                        <Badge variant="outline" className="mb-2">
                          {item.category}
                        </Badge>
                      )}
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Galería (vista previa) */}
        {restaurant.gallery && restaurant.gallery.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Galería</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {restaurant.gallery.slice(0, 6).map((imageUrl, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden"
                  >
                    <Image
                      src={imageUrl}
                      alt={`Galería ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to action */}
        {!isAuthenticated && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <h3 className="text-xl font-semibold mb-2">
                ¿Quieres ver el menú completo y hacer una reservación?
              </h3>
              <p className="text-muted-foreground mb-4">
                Regístrate o inicia sesión para acceder a toda la información
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/signup">Registrarse</Link>
                </Button>
                <Button asChild variant="outline">
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
