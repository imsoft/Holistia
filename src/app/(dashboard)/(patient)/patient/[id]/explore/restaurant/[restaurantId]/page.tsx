"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Clock,
  ArrowLeft,
  ExternalLink,
  FileText
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StableImage } from "@/components/ui/stable-image";
import { Separator } from "@/components/ui/separator";
import { DaySchedule, parseScheduleFromString, formatScheduleForDisplay } from "@/components/ui/schedule-editor";

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  image_url?: string;
  cuisine_type?: string;
  price_range?: string;
  opening_hours?: DaySchedule[] | string;
  menu_pdf_url?: string;
  is_active: boolean;
  created_at: string;
}

interface RestaurantMenu {
  id: string;
  restaurant_id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  images: string[];
  display_order: number;
  is_active: boolean;
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restaurantId as string;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<RestaurantMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getRestaurantData = async () => {
      try {
        setLoading(true);

        // Obtener datos del restaurante
        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("id", restaurantId)
          .eq("is_active", true)
          .single();

        if (restaurantError) {
          console.error("Error fetching restaurant:", restaurantError);
        } else {
          setRestaurant(restaurantData);
        }

        // Obtener menús del restaurante
        const { data: menusData, error: menusError } = await supabase
          .from("restaurant_menus")
          .select("*")
          .eq("restaurant_id", restaurantId)
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (menusError) {
          console.error("Error fetching menus:", menusError);
        } else {
          const menusWithImages = (menusData || []).map((menu) => ({
            ...menu,
            images: Array.isArray(menu.images) ? menu.images : [],
          }));
          setMenus(menusWithImages);
        }
      } catch (error) {
        console.error("Error fetching restaurant data:", error);
      } finally {
        setLoading(false);
      }
    };

    getRestaurantData();
  }, [restaurantId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <UtensilsCrossed className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Restaurante no encontrado
          </h2>
          <p className="text-muted-foreground mb-6">
            El restaurante que buscas no existe o no está disponible
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
          <div className="relative w-full h-96 rounded-lg overflow-hidden">
            {restaurant.image_url ? (
              <StableImage
                src={restaurant.image_url}
                alt={restaurant.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <UtensilsCrossed className="h-32 w-32 text-primary/40" />
              </div>
            )}
          </div>

          {/* Información principal */}
          <div>
            <div className="flex items-start gap-3 mb-4">
              <UtensilsCrossed className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  {restaurant.name}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {restaurant.cuisine_type && (
                    <Badge variant="secondary">{restaurant.cuisine_type}</Badge>
                  )}
                  {restaurant.price_range && (
                    <Badge variant="outline">{restaurant.price_range}</Badge>
                  )}
                </div>
              </div>
            </div>

            {restaurant.description && (
              <div
                className="text-muted-foreground mb-6"
                dangerouslySetInnerHTML={{ __html: restaurant.description }}
              />
            )}

            <Separator className="my-6" />

            {/* Información de contacto */}
            <div className="space-y-3">
              {restaurant.address && (
                <div className="flex items-start gap-3 text-foreground">
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{restaurant.address}</span>
                </div>
              )}

              {restaurant.phone && (
                <div className="flex items-center gap-3 text-foreground">
                  <Phone className="h-5 w-5 flex-shrink-0" />
                  <a href={`tel:${restaurant.phone}`} className="hover:text-primary transition-colors">
                    {restaurant.phone}
                  </a>
                </div>
              )}

              {restaurant.email && (
                <div className="flex items-center gap-3 text-foreground">
                  <Mail className="h-5 w-5 flex-shrink-0" />
                  <a href={`mailto:${restaurant.email}`} className="hover:text-primary transition-colors">
                    {restaurant.email}
                  </a>
                </div>
              )}

              {restaurant.website && (
                <div className="flex items-center gap-3 text-foreground">
                  <Globe className="h-5 w-5 flex-shrink-0" />
                  <a
                    href={restaurant.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    Visitar sitio web
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}

              {restaurant.instagram && (
                <div className="flex items-center gap-3 text-foreground">
                  <Instagram className="h-5 w-5 flex-shrink-0" />
                  <a
                    href={`https://instagram.com/${restaurant.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {restaurant.instagram}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Horarios de atención */}
        {restaurant.opening_hours && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios de Atención
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line">
                {formatScheduleForDisplay(parseScheduleFromString(restaurant.opening_hours))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menú en PDF */}
        {restaurant.menu_pdf_url && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Menú Completo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <a
                  href={restaurant.menu_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Ver Menú en PDF
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Menú individual (platillos) */}
        {menus.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6" />
              Nuestro Menú
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menus.map((menu) => (
                <Card key={menu.id} className="overflow-hidden">
                  {menu.images && menu.images.length > 0 && (
                    <div className="relative w-full h-48">
                      <StableImage
                        src={menu.images[0]}
                        alt={menu.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{menu.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {menu.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {menu.description}
                      </p>
                    )}
                    {menu.price && (
                      <p className="text-lg font-bold text-primary">
                        ${menu.price.toFixed(2)}
                      </p>
                    )}
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
