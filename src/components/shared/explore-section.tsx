"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StableImage } from "@/components/ui/stable-image";
import Link from "next/link";
import {
  User,
  Store,
  UtensilsCrossed,
  MapPin,
  Star,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { stripHtml } from "@/lib/text-utils";

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  specializations: string[];
  years_of_experience: string | null;
  average_rating: number;
  total_reviews: number;
  user_id: string;
  profession: string;
  city: string | null;
  admin_rating: number | null;
}

interface Shop {
  id: string;
  name: string;
  image_url: string | null;
  gallery: string[] | null;
  category: string | null;
  city: string | null;
  description: string | null;
  address: string | null;
}

interface Restaurant {
  id: string;
  name: string;
  image_url: string | null;
  cuisine_type: string | null;
  price_range: string | null;
  address: string | null;
}

interface Event {
  id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  event_date: string;
  event_time: string | null;
  price: number | null;
  location: string | null;
}

interface ExploreSectionProps {
  hideHeader?: boolean;
}

export function ExploreSection({ hideHeader = false }: ExploreSectionProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const professionalsRef = useRef<HTMLDivElement>(null);
  const shopsRef = useRef<HTMLDivElement>(null);
  const restaurantsRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      try {
        // Cargar profesionales (6 para el carousel)
        // Solo profesionales con foto de perfil, aprobados, activos y con calificación de admin > 4.5
        const { data: professionalsData } = await supabase
          .from("professional_applications")
          .select("id, first_name, last_name, profile_photo, specializations, experience, user_id, profession, city")
          .eq("status", "approved")
          .eq("is_active", true)
          .not("profile_photo", "is", null)
          .order("created_at", { ascending: false });

        if (professionalsData) {
          // Para cada profesional, obtener calificaciones de admin y de pacientes
          const professionalsWithRatings = await Promise.all(
            professionalsData.map(async (prof) => {
              // Obtener calificación de administrador
              const { data: adminRatingStats } = await supabase
                .from("professional_admin_rating_stats")
                .select("average_admin_rating")
                .eq("professional_id", prof.id)
                .maybeSingle();

              // Obtener calificaciones de pacientes
              const { data: reviewStats } = await supabase
                .from("review_stats")
                .select("average_rating, total_reviews")
                .eq("professional_id", prof.id)
                .maybeSingle();

              return {
                id: prof.id,
                first_name: prof.first_name,
                last_name: prof.last_name,
                avatar_url: prof.profile_photo,
                specializations: prof.specializations || [],
                years_of_experience: prof.experience,
                average_rating: reviewStats?.average_rating || 0,
                total_reviews: reviewStats?.total_reviews || 0,
                user_id: prof.user_id,
                profession: prof.profession,
                city: prof.city,
                admin_rating: adminRatingStats?.average_admin_rating || null,
              };
            })
          );

          // Filtrar solo profesionales con calificación de admin > 4.5
          const filteredProfessionals = professionalsWithRatings.filter(
            (prof) => prof.admin_rating !== null && prof.admin_rating > 4.5
          );

          // Limitar a 6 y ordenar por calificación de admin descendente
          const sortedProfessionals = filteredProfessionals
            .sort((a, b) => (b.admin_rating || 0) - (a.admin_rating || 0))
            .slice(0, 6);

          setProfessionals(sortedProfessionals);
        }

        // Cargar comercios (6 para el carousel)
        const { data: shopsData, error: shopsError } = await supabase
          .from("shops")
          .select("id, name, image_url, gallery, category, city, description, address")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(6);

        if (shopsError) {
          console.error("❌ Error loading shops:", shopsError);
        }

        if (shopsData && shopsData.length > 0) {
          console.log("✅ Shops loaded:", shopsData.length, shopsData);
          setShops(shopsData);
        } else {
          console.log("⚠️ No shops found or shops array is empty");
          setShops([]);
        }

        // Cargar restaurantes (6 para el carousel)
        const { data: restaurantsData } = await supabase
          .from("restaurants")
          .select("id, name, image_url, cuisine_type, price_range, address")
          .eq("is_active", true)
          .limit(6);

        if (restaurantsData) {
          setRestaurants(restaurantsData);
        }

        // Cargar eventos (6 para el carousel)
        const { data: eventsData } = await supabase
          .from("events_workshops")
          .select("id, name, gallery_images, category, event_date, event_time, price, location")
          .eq("is_active", true)
          .gte("event_date", new Date().toISOString().split('T')[0])
          .order("event_date", { ascending: true })
          .limit(6);

        if (eventsData) {
          // Mapear gallery_images[0] a image_url
          const mappedEvents = eventsData.map(event => ({
            id: event.id,
            name: event.name,
            image_url: event.gallery_images?.[0] || null,
            category: event.category,
            event_date: event.event_date,
            event_time: event.event_time,
            price: event.price,
            location: event.location,
          }));
          setEvents(mappedEvents);
        }
      } catch (error) {
        console.error("Error loading explore data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 400;
      const newScrollPosition = direction === 'left'
        ? ref.current.scrollLeft - scrollAmount
        : ref.current.scrollLeft + scrollAmount;

      ref.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      espiritualidad: "Espiritualidad",
      salud_mental: "Salud Mental",
      salud_fisica: "Salud Física",
      alimentacion: "Alimentación",
      social: "Social"
    };
    return categories[category] || category;
  };

  const generateEventSlug = (eventName: string, eventId: string) => {
    const slug = eventName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    return `${slug}--${eventId}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        {!hideHeader && (
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Explora Nuestros Servicios
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Descubre profesionales certificados, comercios holísticos, restaurantes saludables y eventos
            </p>
          </div>
        )}

        {/* Profesionales */}
        {professionals.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                Profesionales
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scroll(professionalsRef, 'left')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scroll(professionalsRef, 'right')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" asChild className="ml-2">
                  <Link href="/signup">
                    Ver más <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
            <div
              ref={professionalsRef}
              className="flex gap-6 overflow-x-auto pb-4"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {professionals.map((prof) => {
                const slug = `${prof.first_name.toLowerCase()}-${prof.last_name.toLowerCase()}-${prof.id}`;
                return (
                  <Card key={prof.id} className="flex-shrink-0 w-[280px] sm:w-[320px] h-[520px] flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative w-full h-48 flex-shrink-0">
                      {prof.avatar_url ? (
                        <StableImage
                          src={prof.avatar_url}
                          alt={`${prof.first_name} ${prof.last_name}`}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <User className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-3">
                      {prof.profession && (
                        <CardTitle className="text-xl font-bold line-clamp-1">
                          {prof.profession}
                        </CardTitle>
                      )}
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <p className="text-sm text-muted-foreground truncate">
                          {prof.first_name} {prof.last_name}
                        </p>
                        {prof.average_rating > 0 && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {prof.average_rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({prof.total_reviews})
                            </span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end pt-0 pb-4">
                      <div className="flex-1 flex flex-col gap-3 mb-4 min-h-0">
                        {prof.specializations && prof.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {prof.specializations.slice(0, 2).map((spec, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                            {prof.specializations.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{prof.specializations.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                        {prof.city && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span>{prof.city}</span>
                          </div>
                        )}
                      </div>
                      <Button variant="default" size="sm" className="w-full mt-auto" asChild>
                        <Link href={`/public/professional/${slug}`}>
                          Ver perfil
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Comercios */}
        {shops.length > 0 && (
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Store className="w-6 h-6 text-primary" />
                  Comercios Holísticos
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scroll(shopsRef, 'left')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scroll(shopsRef, 'right')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" asChild className="ml-2">
                  <Link href="/signup">
                    Ver más <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
            <div
              ref={shopsRef}
              className="flex gap-6 overflow-x-auto pb-4"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {shops.map((shop) => {
                // Obtener la imagen principal: primero image_url, luego gallery[0], luego null
                // Verificar si gallery es un array o string
                let galleryArray: string[] = [];
                if (Array.isArray(shop.gallery)) {
                  galleryArray = shop.gallery;
                } else if (typeof shop.gallery === 'string') {
                  try {
                    galleryArray = JSON.parse(shop.gallery);
                  } catch (e) {
                    // Si no es JSON válido, tratar como string único
                    galleryArray = shop.gallery ? [shop.gallery] : [];
                  }
                }
                
                const mainImage = shop.image_url || (galleryArray && galleryArray.length > 0 ? galleryArray[0] : null);
                
                // Limpiar HTML de la descripción
                const cleanDescription = shop.description ? stripHtml(shop.description) : null;
                
                return (
                  <Card key={shop.id} className="flex-shrink-0 w-[280px] sm:w-[320px] h-[520px] flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative w-full h-48 flex-shrink-0">
                      {mainImage ? (
                        <StableImage
                          src={mainImage}
                          alt={shop.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <Store className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-2">{shop.name}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {shop.category && (
                          <Badge variant="secondary" className="text-xs">{shop.category}</Badge>
                        )}
                        {shop.city && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span>{shop.city}</span>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end pt-0 pb-4">
                      <div className="flex-1 flex flex-col gap-2 mb-4 min-h-0">
                        {cleanDescription && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {cleanDescription}
                          </p>
                        )}
                        {shop.address && (
                          <div className="flex items-start gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{shop.address}</span>
                          </div>
                        )}
                      </div>
                      <Button variant="default" size="sm" className="w-full mt-auto" asChild>
                        <Link href={`/public/shop/${shop.id}`}>
                          Ver comercio
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Restaurantes */}
        {restaurants.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-primary" />
                Restaurantes Saludables
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scroll(restaurantsRef, 'left')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scroll(restaurantsRef, 'right')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" asChild className="ml-2">
                  <Link href="/signup">
                    Ver más <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
            <div
              ref={restaurantsRef}
              className="flex gap-6 overflow-x-auto pb-4"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="flex-shrink-0 w-[280px] sm:w-[320px] h-[520px] flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative w-full h-48 flex-shrink-0">
                    {restaurant.image_url ? (
                      <StableImage
                        src={restaurant.image_url}
                        alt={restaurant.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <UtensilsCrossed className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg line-clamp-2">{restaurant.name}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {restaurant.cuisine_type && (
                        <Badge variant="secondary" className="text-xs">{restaurant.cuisine_type}</Badge>
                      )}
                      {restaurant.price_range && (
                        <Badge variant="outline" className="text-xs">{restaurant.price_range}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end pt-0 pb-4">
                    <div className="flex-1 mb-4">
                      {restaurant.address && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {restaurant.address}
                        </p>
                      )}
                    </div>
                    <Button variant="default" size="sm" className="w-full" asChild>
                      <Link href={`/public/restaurant/${restaurant.id}`}>
                        Ver restaurante
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Eventos */}
        {events.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                Eventos y Talleres
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scroll(eventsRef, 'left')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scroll(eventsRef, 'right')}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" asChild className="ml-2">
                  <Link href="/signup">
                    Ver más <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
            <div
              ref={eventsRef}
              className="flex gap-6 overflow-x-auto pb-4"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {events.map((event) => {
                return (
                  <Card key={event.id} className="flex-shrink-0 w-[280px] sm:w-[320px] h-[520px] flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative w-full h-48 flex-shrink-0">
                      {event.image_url ? (
                        <StableImage
                          src={event.image_url}
                          alt={event.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <Calendar className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg line-clamp-2">{event.name}</CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {event.category && (
                          <Badge variant="secondary" className="text-xs">{getCategoryLabel(event.category)}</Badge>
                        )}
                        {event.price !== null && (
                          <Badge variant="outline" className="text-xs">
                            {event.price === 0 ? 'Gratis' : `$${event.price}`}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end pt-0 pb-4">
                      <div className="flex-1 space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="line-clamp-1">{formatDate(event.event_date)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{event.location}</span>
                          </div>
                        )}
                      </div>
                      <Button variant="default" size="sm" className="w-full" asChild>
                        <Link href={`/public/event/${event.id}`}>
                          Ver evento
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Call to action */}
        <div className="mt-12 text-center">
          <Card className="bg-primary/5 border-primary/20 max-w-2xl mx-auto py-4">
            <CardContent className="pt-6">
              <h3 className="text-2xl font-bold mb-2">
                ¿Quieres ver más?
              </h3>
              <p className="text-muted-foreground mb-6">
                Regístrate para acceder a toda la información, agendar citas y mucho más
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
      </div>
    </section>
  );
}
