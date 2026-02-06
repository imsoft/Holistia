"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import {
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
import { formatPrice } from "@/lib/price-utils";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { ChallengeCard } from "@/components/ui/challenge-card";
import { DigitalProductList } from "@/components/ui/digital-product-list";
import { mapApiProductToCardProduct } from "@/components/ui/digital-product-card";
import { EventCard, mapApiEventToCardEvent } from "@/components/ui/event-card";
import { ShopCard, mapApiShopToCardShop } from "@/components/ui/shop-card";
import { HolisticCenterCard, mapApiCenterToCardCenter } from "@/components/ui/holistic-center-card";
import { RestaurantCard, mapApiRestaurantToCardRestaurant } from "@/components/ui/restaurant-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserId } from "@/stores/user-store";

interface Professional {
  id: string;
  slug?: string;
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
  slug?: string;
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
  slug?: string;
  name: string;
  image_url: string | null;
  cuisine_type: string | null;
  price_range: string | null;
  address: string | null;
}

interface Event {
  id: string;
  slug: string;
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
  slug?: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  cover_image_url: string | null;
  duration_minutes?: number;
  pages_count?: number;
  sales_count: number;
  professional_applications?: {
    first_name: string;
    last_name: string;
    profile_photo?: string;
    is_verified?: boolean;
  };
}

interface HolisticCenter {
  id: string;
  slug?: string;
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

interface Challenge {
  id: string;
  slug?: string;
  title: string;
  short_description?: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: string;
  price?: number;
  professional_applications?: {
    first_name: string;
    last_name: string;
    profile_photo?: string;
    profession?: string;
    is_verified?: boolean;
  };
}

export function ExploreSection({ hideHeader = false, userId, showFavorites = false }: ExploreSectionProps) {
  const authUserId = useUserId();
  const showFavoritesWhenLoggedIn = !!authUserId;
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([]);
  const [holisticCenters, setHolisticCenters] = useState<HolisticCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(userId);

  const professionalsRef = useRef<HTMLDivElement>(null);
  const shopsRef = useRef<HTMLDivElement>(null);
  const restaurantsRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);
  const challengesRef = useRef<HTMLDivElement>(null);
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
          .select("id, slug, first_name, last_name, profile_photo, specializations, experience, user_id, profession, city, is_verified")
          .eq("status", "approved")
          .eq("is_active", true)
          .not("profile_photo", "is", null)
          .order("created_at", { ascending: false });

        if (professionalsData) {
          // OPTIMIZACIÓN: Batch queries en lugar de N+1 queries individuales
          // Similar a la optimización en /explore page
          const professionalIds = professionalsData.map(p => p.id);
          const userIds = professionalsData.map(p => p.user_id).filter((id): id is string => !!id);
          
          // Obtener todos los datos en batch (solo 2 queries en total en lugar de 2 * N)
          const [
            allAdminRatingResult,
            allReviewStatsResult,
          ] = await Promise.allSettled([
            // Todas las estadísticas de admin ratings
            supabase
              .from("professional_admin_rating_stats")
              .select("professional_id, average_admin_rating")
              .in("professional_id", professionalIds),
            // Todas las estadísticas de reviews (usar professional_review_stats que usa user_id)
            supabase
              .from("professional_review_stats")
              .select("professional_id, average_rating, total_reviews")
              .in("professional_id", userIds),
          ]);

          // Procesar resultados de batch queries
          const allAdminRatings = allAdminRatingResult.status === 'fulfilled' ? (allAdminRatingResult.value.data || []) : [];
          const allReviewStats = allReviewStatsResult.status === 'fulfilled' ? (allReviewStatsResult.value.data || []) : [];

          // Crear maps para acceso rápido O(1) en lugar de buscar en arrays
          const adminRatingMap = new Map<string, any>();
          const reviewStatsMap = new Map<string, any>();

          // Crear map de admin ratings por professional_id
          allAdminRatings.forEach((rating: any) => {
            adminRatingMap.set(rating.professional_id, rating);
          });

          // Crear map de review stats por professional_id (usando user_id)
          allReviewStats.forEach((stat: any) => {
            reviewStatsMap.set(stat.professional_id, stat);
          });

          // Mapear profesionales con sus datos (ya no necesitamos Promise.all, todo está en memoria)
          const professionalsWithRatings = professionalsData.map((prof) => {
            const adminRatingData = adminRatingMap.get(prof.id) || null;
            const reviewStats = reviewStatsMap.get(prof.user_id) || null;

            return {
              id: prof.id,
              slug: prof.slug,
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
              admin_rating: adminRatingData?.average_admin_rating || null,
              is_verified: prof.is_verified || false,
            };
          });

          // Filtrar solo profesionales con calificación de admin > 4.5
          const filteredProfessionals = professionalsWithRatings.filter(
            (prof) => prof.admin_rating !== null && prof.admin_rating > 4.5
          );

          // Ordenar por calificación de admin descendente (sin límite)
          const sortedProfessionals = filteredProfessionals
            .sort((a, b) => (b.admin_rating || 0) - (a.admin_rating || 0));

          setProfessionals(sortedProfessionals);
        }

        // Cargar comercios (sin límite)
        const { data: shopsData, error: shopsError } = await supabase
          .from("shops")
          .select("id, slug, name, image_url, gallery, category, city, description, address")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

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

        // Cargar restaurantes (sin límite)
        const { data: restaurantsData } = await supabase
          .from("restaurants")
          .select("id, slug, name, image_url, cuisine_type, price_range, address")
          .eq("is_active", true);

        if (restaurantsData) {
          setRestaurants(restaurantsData);
        }

        // Cargar eventos (sin límite)
        const { data: eventsData } = await supabase
          .from("events_workshops")
          .select("id, slug, name, gallery_images, category, event_date, event_time, price, location")
          .eq("is_active", true)
          .gte("event_date", new Date().toISOString().split('T')[0])
          .order("event_date", { ascending: true });

        if (eventsData) {
          // Mapear gallery_images[0] a image_url
          const mappedEvents = eventsData.map(event => ({
            id: event.id,
            slug: event.slug,
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

        // Cargar retos públicos (de profesionales y admins)
        // Estrategia: obtener retos SIN join primero para evitar problemas de RLS
        console.log("🔍 [ExploreSection] Loading challenges...");
        const { data: challengesData, error: challengesError } = await supabase
          .from("challenges")
          .select("id, slug, title, short_description, cover_image_url, duration_days, difficulty_level, professional_id, linked_professional_id")
          .eq("is_active", true)
          .eq("is_public", true)
          .in("created_by_type", ["professional", "admin"])
          .order("created_at", { ascending: false })
          .limit(10);

        if (challengesError) {
          console.error("❌ [ExploreSection] Error loading challenges:", {
            error: challengesError.message,
            code: challengesError.code,
            details: challengesError.details,
            hint: challengesError.hint,
          });
          setChallenges([]);
        } else if (challengesData && challengesData.length > 0) {
          console.log("✅ [ExploreSection] Challenges query successful:", challengesData.length, "challenges found");
          console.log("✅ [ExploreSection] Challenges loaded:", challengesData.length);
          
          // Obtener profesionales por separado si existen
          const professionalIds = challengesData
            .map(c => c.professional_id || c.linked_professional_id)
            .filter((id): id is string => !!id);
          
          let professionalsMap = new Map();
          if (professionalIds.length > 0) {
            const { data: professionalsData } = await supabase
              .from("professional_applications")
              .select("id, first_name, last_name, profile_photo, profession, is_verified")
              .in("id", professionalIds)
              .eq("status", "approved")
              .eq("is_active", true);
            
            if (professionalsData) {
              professionalsData.forEach(prof => {
                professionalsMap.set(prof.id, prof);
              });
            }
          }
          
          // Transformar datos para asegurar el formato correcto que espera ChallengeCard
          const transformedChallenges = challengesData.map((challenge: any) => {
            const profId = challenge.professional_id || challenge.linked_professional_id;
            const professional = profId ? professionalsMap.get(profId) : null;
            
            return {
              id: challenge.id,
              slug: challenge.slug,
              title: challenge.title,
              short_description: challenge.short_description,
              cover_image_url: challenge.cover_image_url,
              duration_days: challenge.duration_days,
              difficulty_level: challenge.difficulty_level,
              // ChallengeCard espera propiedades planas, no professional_applications
              professional_first_name: professional?.first_name,
              professional_last_name: professional?.last_name,
              professional_photo: professional?.profile_photo,
              professional_profession: professional?.profession,
              professional_is_verified: professional?.is_verified,
            };
          });
          console.log("✅ [ExploreSection] Setting challenges:", {
            count: transformedChallenges.length,
            challenges: transformedChallenges.map(c => ({ id: c.id, title: c.title, slug: c.slug }))
          });
          setChallenges(transformedChallenges);
          
          // Log después de un pequeño delay para verificar que el estado se actualizó
          setTimeout(() => {
            console.log("🔍 [ExploreSection] State after setChallenges:", {
              challengesCount: transformedChallenges.length,
              firstChallenge: transformedChallenges[0] ? {
                id: transformedChallenges[0].id,
                title: transformedChallenges[0].title,
                hasProfessional: !!(transformedChallenges[0] as any).professional_first_name
              } : null
            });
          }, 100);
        } else {
          console.log("⚠️ [ExploreSection] No challenges found. Query returned:", {
            dataLength: challengesData?.length || 0,
            data: challengesData,
            error: challengesError
          });
          setChallenges([]);
        }

        // Cargar programas (sin límite)
        const { data: digitalProductsData, error: digitalProductsError } = await supabase
          .from("digital_products")
          .select(`
            id,
            slug,
            title,
            description,
            category,
            price,
            currency,
            cover_image_url,
            duration_minutes,
            pages_count,
            sales_count,
            professional_applications(
              first_name,
              last_name,
              profile_photo,
              is_verified
            )
          `)
          .eq('is_active', true)
          .order("created_at", { ascending: false });

        if (digitalProductsError) {
          console.error("❌ Error loading digital products:", digitalProductsError);
        }

        if (digitalProductsData && digitalProductsData.length > 0) {
          console.log("✅ Digital products loaded:", digitalProductsData.length);
          // Transformar datos para asegurar el formato correcto
          const transformedProducts = digitalProductsData.map((product: any) => {
            const pa = Array.isArray(product.professional_applications)
              ? product.professional_applications[0]
              : product.professional_applications;
            return {
              id: product.id,
              slug: product.slug,
              title: product.title,
              description: product.description,
              category: product.category,
              price: product.price,
              currency: product.currency,
              cover_image_url: product.cover_image_url,
              duration_minutes: product.duration_minutes,
              pages_count: product.pages_count,
              sales_count: product.sales_count ?? 0,
              professional_applications: pa ? {
                first_name: pa.first_name,
                last_name: pa.last_name,
                profile_photo: pa.profile_photo,
                is_verified: pa.is_verified,
              } : undefined,
            };
          });
          setDigitalProducts(transformedProducts);
        } else {
          console.log("⚠️ No digital products found or array is empty");
          setDigitalProducts([]);
        }

        // Cargar centros holísticos (sin límite)
        console.log("🔍 [ExploreSection] Loading holistic centers...");
        const { data: holisticCentersData, error: holisticCentersError } = await supabase
          .from("holistic_centers")
          .select("id, slug, name, image_url, city, description, address")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (holisticCentersError) {
          console.error("❌ [ExploreSection] Error loading holistic centers:", holisticCentersError);
          setHolisticCenters([]);
        } else if (holisticCentersData && holisticCentersData.length > 0) {
          console.log("✅ [ExploreSection] Holistic centers loaded:", holisticCentersData.length, holisticCentersData);
          setHolisticCenters(holisticCentersData);
        } else {
          console.log("⚠️ [ExploreSection] No holistic centers found or array is empty. Data:", holisticCentersData);
          setHolisticCenters([]);
        }
      } catch (error) {
        console.error("❌ [ExploreSection] Error loading explore data:", error);
      } finally {
        console.log("🔍 [ExploreSection] Finished loading. Final state:", {
          professionals: professionals.length,
          shops: shops.length,
          restaurants: restaurants.length,
          events: events.length,
          challenges: challenges.length,
          digitalProducts: digitalProducts.length,
          holisticCenters: holisticCenters.length,
          loading
        });
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

  // Los slugs de eventos ahora vienen de la base de datos

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
            <div className="mb-6">
              <Link
                href="/explore/programs"
                className="inline-flex items-center gap-1 text-2xl font-bold hover:text-primary transition-colors"
              >
                Programas
                <ChevronRight className="w-6 h-6" />
              </Link>
            </div>
            <div className="relative">
              {loading ? (
                <div
                  ref={digitalProductsRef}
                  className="flex gap-6 overflow-x-auto pb-4 px-12"
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
              ) : (
                <DigitalProductList
                  products={digitalProducts.map(mapApiProductToCardProduct)}
                  layout="carousel"
                  showProfessional={true}
                  showFavoriteButton={showFavoritesWhenLoggedIn}
                />
              )}
            </div>
          </div>
        ) : null}

        {/* 2. Eventos y Talleres */}
        {(!loading && events.length > 0) || loading ? (
          <div className="mb-16">
            <div className="mb-6">
              <Link
                href="/explore/events"
                className="inline-flex items-center gap-1 text-2xl font-bold hover:text-primary transition-colors"
              >
                Eventos y Talleres
                <ChevronRight className="w-6 h-6" />
              </Link>
            </div>
            <div className="relative">
              {!loading && events.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(eventsRef, 'left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(eventsRef, 'right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
              {loading ? (
                <div
                  ref={eventsRef}
                  className="flex gap-6 overflow-x-auto pb-4 px-12"
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
                  className="flex gap-6 overflow-x-auto pb-4 px-12"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                {events.map((event) => (
                  <div key={event.id} className="shrink-0 w-[280px] sm:w-[320px]">
                    <EventCard
                      event={mapApiEventToCardEvent({ ...event, is_free: event.price === 0 })}
                      showFavoriteButton={showFavoritesWhenLoggedIn}
                      className="w-full block"
                    />
                  </div>
                ))}
              </div>
            ) : null}
            </div>
          </div>
        ) : null}

        {/* 3. Retos */}
        {(!loading && challenges.length > 0) || loading ? (
          <div className="mb-16">
            <div className="mb-6">
              <Link
                href="/explore/challenges"
                className="inline-flex items-center gap-1 text-2xl font-bold hover:text-primary transition-colors"
              >
                Retos
                <ChevronRight className="w-6 h-6" />
              </Link>
            </div>
            <div className="relative">
              {!loading && challenges.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(challengesRef, 'left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(challengesRef, 'right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
              {loading ? (
                <div
                  ref={challengesRef}
                  className="flex gap-6 overflow-x-auto pb-4 px-12"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CardSkeleton key={`challenge-skeleton-${i}`} />
                  ))}
                </div>
              ) : challenges.length > 0 ? (
                <div
                  ref={challengesRef}
                  className="flex gap-6 overflow-x-auto pb-4 px-12"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="shrink-0 w-[280px] sm:w-[320px] h-[420px]">
                    <ChallengeCard challenge={challenge as any} userId={currentUserId} showFavoriteButton={showFavoritesWhenLoggedIn} />
                  </div>
                ))}
              </div>
            ) : null}
            </div>
          </div>
        ) : null}

        {/* 4. Expertos */}
        {(!loading && professionals.length > 0) || loading ? (
          <div className="mb-16">
            <div className="mb-6">
              <Link
                href="/explore/professionals"
                className="inline-flex items-center gap-1 text-2xl font-bold hover:text-primary transition-colors"
              >
                Expertos
                <ChevronRight className="w-6 h-6" />
              </Link>
            </div>
            <div className="relative">
              {!loading && professionals.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(professionalsRef, 'left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(professionalsRef, 'right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
              {loading ? (
                <div
                  ref={professionalsRef}
                  className="flex gap-6 overflow-x-auto pb-4 px-12"
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
                  className="flex gap-6 overflow-x-auto pb-4 px-12"
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
                        showFavoriteButton={showFavoritesWhenLoggedIn}
                        professional={{
                          id: prof.id,
                          slug: prof.slug || prof.id,
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
          </div>
        ) : null}

        {/* 4. Comercios */}
        {(!loading && shops.length > 0) || loading ? (
          <div className="mb-16">
            <div className="mb-6">
              <Link
                href="/explore/shops"
                className="inline-flex items-center gap-1 text-2xl font-bold hover:text-primary transition-colors"
              >
                Comercios
                <ChevronRight className="w-6 h-6" />
              </Link>
            </div>
            <div className="relative">
              {!loading && shops.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(shopsRef, 'left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(shopsRef, 'right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
              {loading ? (
                <div
                  ref={shopsRef}
                  className="flex gap-6 overflow-x-auto pb-4 px-12"
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
                  className="flex gap-6 overflow-x-auto pb-4 px-12"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                {shops.map((shop) => (
                  <div key={shop.id} className="shrink-0 w-[280px] sm:w-[320px]">
                    <ShopCard
                      shop={mapApiShopToCardShop(shop)}
                      showFavoriteButton={showFavoritesWhenLoggedIn}
                      className="w-full block"
                    />
                  </div>
                ))}
              </div>
            ) : null}
            </div>
          </div>
        ) : null}

        {/* 5. Centros Holísticos */}
        {(!loading && holisticCenters.length > 0) || loading ? (
          <div className="mb-16">
            <div className="mb-6">
              <Link
                href="/explore/holistic-centers"
                className="inline-flex items-center gap-1 text-2xl font-bold hover:text-primary transition-colors"
              >
                Centros Holísticos
                <ChevronRight className="w-6 h-6" />
              </Link>
            </div>
            <div className="relative">
              {!loading && holisticCenters.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(holisticCentersRef, 'left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(holisticCentersRef, 'right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
              {loading ? (
                <div
                  ref={holisticCentersRef}
                  className="flex gap-6 overflow-x-auto pb-4 px-12"
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
                  className="flex gap-6 overflow-x-auto pb-4 px-12"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                {holisticCenters.map((center) => (
                  <div key={center.id} className="shrink-0 w-[280px] sm:w-[320px]">
                    <HolisticCenterCard
                      center={mapApiCenterToCardCenter(center)}
                      showFavoriteButton={showFavoritesWhenLoggedIn}
                      className="w-full block"
                    />
                  </div>
                ))}
              </div>
            ) : null}
            </div>
          </div>
        ) : null}

        {/* 6. Restaurantes */}
        {(!loading && restaurants.length > 0) || loading ? (
          <div className="mb-16">
            <div className="mb-6">
              <Link
                href="/explore/restaurants"
                className="inline-flex items-center gap-1 text-2xl font-bold hover:text-primary transition-colors"
              >
                Restaurantes
                <ChevronRight className="w-6 h-6" />
              </Link>
            </div>
            <div className="relative">
              {!loading && restaurants.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(restaurantsRef, 'left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => scroll(restaurantsRef, 'right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-md hover:bg-background border"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
              {loading ? (
                <div
                  ref={restaurantsRef}
                  className="flex gap-6 overflow-x-auto pb-4 px-12"
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
                  className="flex gap-6 overflow-x-auto pb-4 px-12"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                {restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="shrink-0 w-[280px] sm:w-[320px]">
                    <RestaurantCard
                      restaurant={mapApiRestaurantToCardRestaurant(restaurant)}
                      showFavoriteButton={showFavoritesWhenLoggedIn}
                      className="w-full block"
                    />
                  </div>
                ))}
              </div>
            ) : null}
            </div>
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
