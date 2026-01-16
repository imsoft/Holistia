"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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
  Sparkles,
  Building2,
} from "lucide-react";
import { stripHtml } from "@/lib/text-utils";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { Skeleton } from "@/components/ui/skeleton";

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
  is_verified?: boolean;
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

interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  cover_image_url: string | null;
  professional_applications?: {
    first_name: string;
    last_name: string;
  };
}

interface HolisticCenter {
  id: string;
  name: string;
  image_url: string | null;
  city: string | null;
  description: string | null;
  address: string | null;
}

interface ExploreSectionProps {
  hideHeader?: boolean;
  userId?: string; // Para páginas públicas, no se pasa userId
  showFavorites?: boolean; // Mostrar botones de favoritos (default: false)
}

export function ExploreSection({ hideHeader = false, userId, showFavorites = false }: ExploreSectionProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([]);
  const [holisticCenters, setHolisticCenters] = useState<HolisticCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(userId);

  const professionalsRef = useRef<HTMLDivElement>(null);
  const shopsRef = useRef<HTMLDivElement>(null);
  const restaurantsRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);
  const digitalProductsRef = useRef<HTMLDivElement>(null);
  const holisticCentersRef = useRef<HTMLDivElement>(null);

  // Obtener userId del usuario autenticado si no se pasó como prop
  useEffect(() => {
    async function getUserId() {
      if (!userId) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }
      } else {
        setCurrentUserId(userId);
      }
    }
    getUserId();
  }, [userId]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      try {
        // Cargar profesionales (6 para el carousel)
        // Solo profesionales con foto de perfil, aprobados, activos y con calificación de admin > 4.5
        const { data: professionalsData } = await supabase
          .from("professional_applications")
          .select("id, first_name, last_name, profile_photo, specializations, experience, user_id, profession, city, is_verified")
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
                is_verified: prof.is_verified || false,
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

        // Cargar programas - 6 para el carousel
        const { data: digitalProductsData, error: digitalProductsError } = await supabase
          .from("digital_products")
          .select(`
            id,
            title,
            description,
            category,
            price,
            currency,
            cover_image_url,
            professional_applications(
              first_name,
              last_name
            )
          `)
          .eq('is_active', true)
          .order("created_at", { ascending: false })
          .limit(6);

        if (digitalProductsError) {
          console.error("❌ Error loading digital products:", digitalProductsError);
        }

        if (digitalProductsData && digitalProductsData.length > 0) {
          console.log("✅ Digital products loaded:", digitalProductsData.length);
          // Transformar datos para asegurar el formato correcto
          const transformedProducts = digitalProductsData.map((product: any) => ({
            id: product.id,
            title: product.title,
            description: product.description,
            category: product.category,
            price: product.price,
            currency: product.currency,
            cover_image_url: product.cover_image_url,
            professional_applications: product.professional_applications ? {
              first_name: product.professional_applications.first_name,
              last_name: product.professional_applications.last_name,
            } : undefined,
          }));
          setDigitalProducts(transformedProducts);
        } else {
          console.log("⚠️ No digital products found or array is empty");
          setDigitalProducts([]);
        }

        // Cargar centros holísticos (6 para el carousel)
        const { data: holisticCentersData, error: holisticCentersError } = await supabase
          .from("holistic_centers")
          .select("id, name, image_url, city, description, address")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(6);

        if (holisticCentersError) {
          console.error("❌ Error loading holistic centers:", holisticCentersError);
          setHolisticCenters([]);
        } else if (holisticCentersData && holisticCentersData.length > 0) {
          console.log("✅ Holistic centers loaded:", holisticCentersData.length, holisticCentersData);
          setHolisticCenters(holisticCentersData);
        } else {
          console.log("⚠️ No holistic centers found or array is empty. Data:", holisticCentersData);
          setHolisticCenters([]);
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

  // Componente de skeleton para cards genéricas
  const CardSkeleton = () => (
    <Card className="shrink-0 w-[280px] sm:w-[320px] h-[480px] flex flex-col">
      <Skeleton className="w-full h-48 shrink-0 rounded-t-lg" />
      <CardHeader className="pb-1.5 px-4 pt-3">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <div className="flex gap-1.5 mt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-3 flex flex-col grow">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-4" />
        <Skeleton className="h-9 w-full mt-auto" />
      </CardContent>
    </Card>
  );

  // Componente de skeleton para cards de profesionales
  const ProfessionalCardSkeleton = () => (
    <div className="shrink-0 w-[280px] sm:w-[320px]">
      <Card className="h-full flex flex-col">
        <Skeleton className="w-full h-64 shrink-0 rounded-t-lg" />
        <CardContent className="px-4 pt-3 pb-4 flex flex-col grow">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-3" />
          <div className="flex gap-1 mb-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-5/6 mb-4" />
          <Skeleton className="h-3 w-2/3 mt-auto" />
        </CardContent>
      </Card>
    </div>
  );

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
              Descubre expertos certificados, comercios holísticos, restaurantes saludables y eventos
            </p>
          </div>
        )}

        {/* 1. Programas */}
        {(!loading && digitalProducts.length > 0) || loading ? (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Programas
              </h3>
              {!loading && digitalProducts.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(digitalProductsRef, 'left')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(digitalProductsRef, 'right')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" asChild className="ml-2">
                    <Link href="/explore/programs">
                      Ver más <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            {loading ? (
              <div
                ref={digitalProductsRef}
                className="flex gap-6 overflow-x-auto pb-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={`program-skeleton-${i}`} />
                ))}
              </div>
            ) : digitalProducts.length > 0 ? (
              <div
                ref={digitalProductsRef}
                className="flex gap-6 overflow-x-auto pb-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {digitalProducts.map((product) => {
                  const cleanDescription = product.description ? stripHtml(product.description) : null;
                  return (
                    <Link
                      key={product.id}
                      href={`/explore/program/${product.id}`}
                      className="shrink-0 w-[280px] sm:w-[320px]"
                    >
                      <Card className="group relative h-[480px] flex flex-col hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                        <div className="relative w-full h-48 bg-gray-100 shrink-0">
                          <div className="absolute inset-0 overflow-hidden">
                            {product.cover_image_url ? (
                              <Image
                                src={product.cover_image_url}
                                alt={product.title}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <Sparkles className="h-16 w-16 text-primary/40" />
                              </div>
                            )}
                          </div>
                          {showFavorites && (
                            <div 
                              className="absolute top-3 right-3 pointer-events-auto" 
                              style={{ zIndex: 9999, position: 'absolute', top: '12px', right: '12px' }}
                            >
                              <FavoriteButton
                                itemId={product.id}
                                favoriteType="digital_product"
                                variant="floating"
                              />
                            </div>
                          )}
                        </div>
                        <CardHeader className="pb-1.5 px-4 pt-3">
                          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">{product.title}</CardTitle>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                            {product.professional_applications && (
                              <div className="text-xs text-muted-foreground">
                                Por {product.professional_applications.first_name} {product.professional_applications.last_name}
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 pb-3 flex flex-col grow">
                          <div className="grow">
                            {cleanDescription && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {cleanDescription}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold text-primary">
                              ${product.price.toFixed(2)} {product.currency}
                            </span>
                          </div>
                          <Button variant="default" size="sm" className="w-full">
                            Ver programa
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* 2. Eventos y Talleres */}
        {(!loading && events.length > 0) || loading ? (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                Eventos y Talleres
              </h3>
              {!loading && events.length > 0 && (
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
                    <Link href="/explore/events">
                      Ver más <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            {loading ? (
              <div
                ref={eventsRef}
                className="flex gap-6 overflow-x-auto pb-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={`event-skeleton-${i}`} />
                ))}
              </div>
            ) : events.length > 0 ? (
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
                    <Card key={event.id} className="relative shrink-0 w-[280px] sm:w-[320px] h-[480px] flex flex-col hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                      <div className="relative w-full h-48 bg-gray-100 shrink-0">
                        <div className="absolute inset-0 overflow-hidden">
                          {event.image_url ? (
                            <Image
                              src={event.image_url}
                              alt={event.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              <Calendar className="h-16 w-16 text-primary/40" />
                            </div>
                          )}
                        </div>
                        {showFavorites && (
                          <div 
                            className="absolute top-3 right-3 pointer-events-auto" 
                            style={{ zIndex: 9999, position: 'absolute', top: '12px', right: '12px' }}
                          >
                            <FavoriteButton
                              itemId={event.id}
                              favoriteType="event"
                              variant="floating"
                            />
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-1.5 px-4 pt-3">
                        <CardTitle className="text-lg line-clamp-2">{event.name}</CardTitle>
                        <div className="flex flex-wrap gap-1.5 mt-1">
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
                      <CardContent className="px-4 pt-0 pb-3 flex flex-col grow">
                        <div className="grow">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                            <Calendar className="w-4 h-4 shrink-0" />
                            <span className="line-clamp-1">{formatDate(event.event_date)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{event.location}</span>
                            </div>
                          )}
                        </div>
                        <Button variant="default" size="sm" className="w-full" asChild>
                          <Link href={`/explore/event/${generateEventSlug(event.name, event.id)}`}>
                            Ver evento
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* 3. Expertos */}
        {(!loading && professionals.length > 0) || loading ? (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                Expertos
              </h3>
              {!loading && professionals.length > 0 && (
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
                    <Link href="/explore/professionals">
                      Ver más <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            {loading ? (
              <div
                ref={professionalsRef}
                className="flex gap-6 overflow-x-auto pb-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProfessionalCardSkeleton key={`professional-skeleton-${i}`} />
                ))}
              </div>
            ) : professionals.length > 0 ? (
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
                  return (
                    <div key={prof.id} className="shrink-0 w-[280px] sm:w-[320px]">
                      <ProfessionalCard
                        userId={currentUserId}
                        showFavoriteButton={showFavorites}
                        professional={{
                          id: prof.id,
                          slug: `${prof.first_name.toLowerCase()}-${prof.last_name.toLowerCase()}-${prof.id}`,
                          name: `${prof.first_name} ${prof.last_name}`,
                          first_name: prof.first_name,
                          last_name: prof.last_name,
                          email: "",
                          profession: prof.profession,
                          profile_photo: prof.avatar_url || undefined,
                          avatar: prof.avatar_url || undefined,
                          therapyTypes: prof.specializations,
                          city: prof.city || undefined,
                          average_rating: prof.average_rating,
                          total_reviews: prof.total_reviews,
                          is_verified: prof.is_verified,
                          verified: prof.is_verified,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* 4. Comercios */}
        {(!loading && shops.length > 0) || loading ? (
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Store className="w-6 h-6 text-primary" />
                  Comercios
                </h3>
              </div>
              {!loading && shops.length > 0 && (
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
                    <Link href="/explore/shops">
                      Ver más <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            {loading ? (
              <div
                ref={shopsRef}
                className="flex gap-6 overflow-x-auto pb-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={`shop-skeleton-${i}`} />
                ))}
              </div>
            ) : shops.length > 0 ? (
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
                    <Card key={shop.id} className="relative shrink-0 w-[280px] sm:w-[320px] h-[480px] flex flex-col hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                      <div className="relative w-full h-48 bg-gray-100 shrink-0">
                        <div className="absolute inset-0 overflow-hidden">
                          {mainImage ? (
                            <Image
                              src={mainImage}
                              alt={shop.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              <Store className="h-16 w-16 text-primary/40" />
                            </div>
                          )}
                        </div>
                        {showFavorites && (
                          <div 
                            className="absolute top-3 right-3 pointer-events-auto" 
                            style={{ zIndex: 9999, position: 'absolute', top: '12px', right: '12px' }}
                          >
                            <FavoriteButton
                              itemId={shop.id}
                              favoriteType="shop"
                              variant="floating"
                            />
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-1.5 px-4 pt-3">
                        <CardTitle className="text-lg line-clamp-2">{shop.name}</CardTitle>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {shop.category && (
                            <Badge variant="secondary" className="text-xs">{shop.category}</Badge>
                          )}
                          {shop.city && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span>{shop.city}</span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pt-0 pb-3 flex flex-col grow">
                        <div className="grow">
                          {cleanDescription && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {cleanDescription}
                            </p>
                          )}
                          {shop.address && (
                            <div className="flex items-start gap-1 text-xs text-muted-foreground mb-2">
                              <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{shop.address}</span>
                            </div>
                          )}
                        </div>
                        <Button variant="default" size="sm" className="w-full" asChild>
                          <Link href={`/explore/shop/${shop.id}`}>
                            Ver comercio
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* 5. Centros Holísticos */}
        {(!loading && holisticCenters.length > 0) || loading ? (
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-primary" />
                  Centros Holísticos
                </h3>
              </div>
              {!loading && holisticCenters.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(holisticCentersRef, 'left')}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(holisticCentersRef, 'right')}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" asChild className="ml-2">
                    <Link href="/explore/holistic-centers">
                      Ver más <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            {loading ? (
              <div
                ref={holisticCentersRef}
                className="flex gap-6 overflow-x-auto pb-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={`holistic-center-skeleton-${i}`} />
                ))}
              </div>
            ) : holisticCenters.length > 0 ? (
              <div
                ref={holisticCentersRef}
                className="flex gap-6 overflow-x-auto pb-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {holisticCenters.map((center) => {
                  const cleanDescription = center.description ? stripHtml(center.description) : null;
                  
                  return (
                    <Card key={center.id} className="group relative shrink-0 w-[280px] sm:w-[320px] h-[480px] flex flex-col hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                      <div className="relative w-full h-48 bg-gray-100 shrink-0">
                        <div className="absolute inset-0 overflow-hidden">
                          {center.image_url ? (
                            <Image
                              src={center.image_url}
                              alt={center.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              <Building2 className="h-16 w-16 text-primary/40" />
                            </div>
                          )}
                        </div>
                        {showFavorites && (
                          <div 
                            className="absolute top-3 right-3 pointer-events-auto" 
                            style={{ zIndex: 9999, position: 'absolute', top: '12px', right: '12px' }}
                          >
                            <FavoriteButton
                              itemId={center.id}
                              favoriteType="holistic_center"
                              variant="floating"
                            />
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-1.5 px-4 pt-3">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">{center.name}</CardTitle>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {center.city && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span>{center.city}</span>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pt-0 pb-3 flex flex-col grow">
                        <div className="grow">
                          {cleanDescription && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {cleanDescription}
                            </p>
                          )}
                          {center.address && (
                            <div className="flex items-start gap-1 text-xs text-muted-foreground mb-2">
                              <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{center.address}</span>
                            </div>
                          )}
                        </div>
                        <Button variant="default" size="sm" className="w-full" asChild>
                          <Link href={`/explore/holistic-center/${center.id}`}>
                            Ver centro
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* 6. Restaurantes */}
        {(!loading && restaurants.length > 0) || loading ? (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-primary" />
                Restaurantes
              </h3>
              {!loading && restaurants.length > 0 && (
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
                    <Link href="/explore/restaurants">
                      Ver más <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            {loading ? (
              <div
                ref={restaurantsRef}
                className="flex gap-6 overflow-x-auto pb-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={`restaurant-skeleton-${i}`} />
                ))}
              </div>
            ) : restaurants.length > 0 ? (
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
                  <Card key={restaurant.id} className="relative shrink-0 w-[280px] sm:w-[320px] h-[480px] flex flex-col hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer">
                    <div className="relative w-full h-48 bg-gray-100 shrink-0">
                      <div className="absolute inset-0 overflow-hidden">
                        {restaurant.image_url ? (
                          <Image
                            src={restaurant.image_url}
                            alt={restaurant.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <UtensilsCrossed className="h-16 w-16 text-primary/40" />
                          </div>
                        )}
                      </div>
                      {showFavorites && (
                        <div 
                          className="absolute top-3 right-3 pointer-events-auto" 
                          style={{ zIndex: 9999, position: 'absolute', top: '12px', right: '12px' }}
                        >
                          <FavoriteButton
                            itemId={restaurant.id}
                            favoriteType="restaurant"
                            variant="floating"
                          />
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-1.5 px-4 pt-3">
                      <CardTitle className="text-lg line-clamp-2">{restaurant.name}</CardTitle>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {restaurant.cuisine_type && (
                          <Badge variant="secondary" className="text-xs">{restaurant.cuisine_type}</Badge>
                        )}
                        {restaurant.price_range && (
                          <Badge variant="outline" className="text-xs">{restaurant.price_range}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pt-0 pb-3 flex flex-col grow">
                      <div className="grow">
                        {restaurant.address && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {restaurant.address}
                          </p>
                        )}
                      </div>
                      <Button variant="default" size="sm" className="w-full" asChild>
                        <Link href={`/explore/restaurant/${restaurant.id}`}>
                          Ver restaurante
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

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
