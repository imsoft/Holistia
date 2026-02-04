"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar, MapPin, Users, ChevronLeft, ChevronRight, Brain, Sparkles, Activity, Apple, UtensilsCrossed, Store, Building2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { ChallengeCard } from "@/components/ui/challenge-card";
import { SkeletonChallengeCard } from "@/components/ui/skeleton-challenge-card";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventWorkshop } from "@/types/event";
import { formatEventDate, formatEventTime } from "@/utils/date-utils";
import { EventCard, mapApiEventToCardEvent } from "@/components/ui/event-card";
import { ShopCard, mapApiShopToCardShop } from "@/components/ui/shop-card";
import { HolisticCenterCard, mapApiCenterToCardCenter } from "@/components/ui/holistic-center-card";
import { RestaurantCard, mapApiRestaurantToCardRestaurant } from "@/components/ui/restaurant-card";
import { formatPrice } from "@/lib/price-utils";
import { determineProfessionalModality, transformServicesFromDB } from "@/utils/professional-utils";
import { sortProfessionalsByRanking } from "@/utils/professional-ranking";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { DigitalProductList } from "@/components/ui/digital-product-list";
import { mapApiProductToCardProduct } from "@/components/ui/digital-product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { useParams } from "next/navigation";

const categories = [
  {
    id: "professionals",
    name: "Salud mental",
    icon: Brain,
    description: "Expertos en salud mental",
  },
  {
    id: "spirituality",
    name: "Espiritualidad",
    icon: Sparkles,
    description: "Guías espirituales y terapeutas holísticos",
  },
  {
    id: "physical-activity",
    name: "Actividad física",
    icon: Activity,
    description: "Entrenadores y terapeutas físicos",
  },
  {
    id: "social",
    name: "Social",
    icon: Users,
    description: "Especialistas en desarrollo social",
  },
  {
    id: "nutrition",
    name: "Alimentación",
    icon: Apple,
    description: "Nutriólogos y especialistas en alimentación",
  },
];

interface Professional {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profession: string;
  specializations: string[];
  wellness_areas: string[];
  services: Array<{
    name: string;
    description: string;
    presencialCost: string;
    onlineCost: string;
  }>;
  city: string;
  state: string;
  country: string;
  address: string;
  biography?: string;
  profile_photo?: string;
  gallery: string[];
  created_at: string;
  modality?: "presencial" | "online" | "both";
  imagePosition?: string;
  average_rating?: number;
  total_reviews?: number;
  admin_rating?: number;
  is_verified?: boolean;
  verified?: boolean;
}

interface Restaurant {
  id: string;
  slug?: string;
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
  is_active: boolean;
  created_at: string;
}

interface Shop {
  id: string;
  slug?: string;
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
  is_active: boolean;
  created_at: string;
}

interface DigitalProduct {
  id: string;
  slug?: string;
  professional_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  cover_image_url?: string;
  file_url?: string;
  duration_minutes?: number;
  pages_count?: number;
  is_active: boolean;
  created_at: string;
  sales_count?: number;
  wellness_areas?: string[];
  professional_applications?: {
    first_name: string;
    last_name: string;
    profile_photo?: string;
    is_verified?: boolean;
    wellness_areas?: string[];
  };
}

interface HolisticCenter {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

interface Challenge {
  id: string;
  slug?: string;
  title: string;
  description: string;
  short_description?: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  price?: number | null;
  currency?: string;
  is_active: boolean;
  is_public?: boolean;
  created_by_type?: 'professional' | 'patient' | 'admin';
  created_at: string;
  wellness_areas?: string[];
  professional_applications?: {
    first_name?: string;
    last_name?: string;
    profile_photo?: string;
    profession?: string;
    is_verified?: boolean;
    status?: string;
    is_active?: boolean;
  } | { [key: string]: unknown }[] | null;
}

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

const HomeUserPage = () => {
  useUserStoreInit(); // Inicializar store de Zustand
  const params = useParams();
  const storeUserId = useUserId(); // Obtener userId del store
  // Usar userId de los parámetros de la URL, con fallback al store
  const userId = (params?.userId as string) || storeUserId || null;
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventWorkshop[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [filteredDigitalProducts, setFilteredDigitalProducts] = useState<DigitalProduct[]>([]);
  const [holisticCenters, setHolisticCenters] = useState<HolisticCenter[]>([]);
  const [filteredHolisticCenters, setFilteredHolisticCenters] = useState<HolisticCenter[]>([]);
  const [loading, setLoading] = useState(true);

  // Componentes de skeleton
  const ProfessionalCardSkeleton = () => (
    <div className="shrink-0 w-96">
      <Card className="h-[480px] flex flex-col py-4">
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

  const CardSkeleton = () => (
    <div className="shrink-0 w-96">
      <Card className="h-[480px] flex flex-col py-4">
        <Skeleton className="w-full h-64 shrink-0 rounded-t-lg" />
        <CardHeader className="pb-1.5 px-4 pt-3 shrink-0">
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
    </div>
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [events, setEvents] = useState<EventWorkshop[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([]);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const professionalsScrollRef = useRef<HTMLDivElement>(null);
  const challengesScrollRef = useRef<HTMLDivElement>(null);
  const restaurantsScrollRef = useRef<HTMLDivElement>(null);
  const shopsScrollRef = useRef<HTMLDivElement>(null);
  const holisticCentersScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true; // Flag para evitar actualizaciones de estado si el componente se desmontó
    const supabase = createClient(); // Crear cliente dentro del efecto
    
    const getData = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);

        // Cargar todos los datos en paralelo para mejorar el rendimiento
        const [
          professionalsResult,
          eventsResult,
          challengesResult,
          restaurantsResult,
          shopsResult,
          productsResult,
          holisticCentersResult
        ] = await Promise.allSettled([
          // Profesionales - Remover filtro de registration_fee para mostrar todos los aprobados
          supabase
            .from("professional_applications")
            .select("*")
            .eq("status", "approved")
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
          // Eventos
          supabase
            .from("events_workshops")
            .select(`
              *,
              professional_applications(
                first_name,
                last_name,
                profession
              )
            `)
            .eq("is_active", true)
            .gte("event_date", new Date().toISOString().split('T')[0])
            .order("event_date", { ascending: true }),
          // Retos públicos (de profesionales y admins)
          // Obtener sin join para evitar problemas de RLS
          supabase
            .from("challenges")
            .select("*")
            .eq("is_active", true)
            .eq("is_public", true)
            .in("created_by_type", ["professional", "admin"])
            .order("created_at", { ascending: false })
            .limit(20),
          // Restaurantes
          supabase
            .from("restaurants")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
          // Comercios
          supabase
            .from("shops")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
          // Programas
          supabase
            .from("digital_products")
            .select(`
              *,
              professional_applications!digital_products_professional_id_fkey(
                first_name,
                last_name,
                profile_photo,
                is_verified,
                wellness_areas,
                status,
                is_active
              )
            `)
            .eq("is_active", true)
            // Asegurar que solo mostremos productos de profesionales aprobados y activos
            // El JOIN ya filtra automáticamente por RLS, pero agregamos filtro explícito
            .order("created_at", { ascending: false }),
          // Centros holísticos
          supabase
            .from("holistic_centers")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
        ]);

        // Procesar profesionales
        console.log("🔍 [Explore] Processing professionals result:", professionalsResult.status);
        if (professionalsResult.status === 'fulfilled') {
          const professionalsData = professionalsResult.value.data;
          console.log("✅ [Explore] Professionals result:", {
            hasData: !!professionalsData,
            dataLength: professionalsData?.length || 0,
            error: professionalsResult.value.error
          });
          
          if (professionalsData && professionalsData.length > 0) {
            console.log("✅ [Explore] Processing", professionalsData.length, "professionals");
            
            // OPTIMIZACIÓN: Batch queries en lugar de N+1 queries individuales
            const professionalIds = professionalsData.map(p => p.id);
            const userIds = professionalsData.map(p => p.user_id).filter((id): id is string => !!id);
            
            // Obtener todos los datos en batch (solo 4 queries en total en lugar de 4 * N)
            const [
              allServicesResult,
              allReviewStatsResult,
              allAdminRatingResult,
              allAppointmentsResult
            ] = await Promise.allSettled([
              // Todos los servicios de todos los profesionales
              supabase
                .from("professional_services")
                .select("*")
                .in("professional_id", professionalIds)
                .eq("isactive", true),
              // Todas las estadísticas de reviews
              supabase
                .from("professional_review_stats")
                .select("professional_id, average_rating, total_reviews")
                .in("professional_id", userIds),
              // Todas las estadísticas de admin ratings
              supabase
                .from("professional_admin_rating_stats")
                .select("professional_id, average_admin_rating")
                .in("professional_id", professionalIds),
              // Count de citas completadas para todos los profesionales
              supabase
                .from("appointments")
                .select("professional_id", { count: "exact", head: false })
                .in("professional_id", professionalIds)
                .eq("status", "completed")
            ]);

            // Procesar resultados de batch queries
            const allServices = allServicesResult.status === 'fulfilled' ? (allServicesResult.value.data || []) : [];
            const allReviewStats = allReviewStatsResult.status === 'fulfilled' ? (allReviewStatsResult.value.data || []) : [];
            const allAdminRatings = allAdminRatingResult.status === 'fulfilled' ? (allAdminRatingResult.value.data || []) : [];
            const allAppointments = allAppointmentsResult.status === 'fulfilled' ? (allAppointmentsResult.value.data || []) : [];

            // Crear maps para acceso rápido O(1) en lugar de buscar en arrays
            const servicesMap = new Map<string, any[]>();
            const reviewStatsMap = new Map<string, any>();
            const adminRatingMap = new Map<string, any>();
            const appointmentsMap = new Map<string, number>();

            // Agrupar servicios por professional_id
            allServices.forEach((service: any) => {
              const profId = service.professional_id;
              if (!servicesMap.has(profId)) {
                servicesMap.set(profId, []);
              }
              servicesMap.get(profId)!.push(service);
            });

            // Crear map de review stats por professional_id (usando user_id)
            allReviewStats.forEach((stat: any) => {
              reviewStatsMap.set(stat.professional_id, stat);
            });

            // Crear map de admin ratings por professional_id
            allAdminRatings.forEach((rating: any) => {
              adminRatingMap.set(rating.professional_id, rating);
            });

            // Agrupar y contar appointments por professional_id
            allAppointments.forEach((apt: any) => {
              const profId = apt.professional_id;
              appointmentsMap.set(profId, (appointmentsMap.get(profId) || 0) + 1);
            });

            // Mapear profesionales con sus datos (ya no necesitamos Promise.all, todo está en memoria)
            const professionalsWithServices = professionalsData.map((prof) => {
              const services = servicesMap.get(prof.id) || [];
              const reviewStats = reviewStatsMap.get(prof.user_id) || null;
              const adminRatingData = adminRatingMap.get(prof.id) || null;
              const completedAppointmentsCount = appointmentsMap.get(prof.id) || 0;

              const transformedServices = transformServicesFromDB(services);
              const professionalModality = determineProfessionalModality(transformedServices);

              return {
                ...prof,
                services: transformedServices.length > 0 ? transformedServices : prof.services || [],
                modality: professionalModality,
                imagePosition: prof.image_position || "center center",
                average_rating: reviewStats?.average_rating || undefined,
                total_reviews: reviewStats?.total_reviews || undefined,
                admin_rating: adminRatingData?.average_admin_rating || undefined,
                completed_appointments: completedAppointmentsCount,
                is_active: prof.is_active !== false,
                is_verified: prof.is_verified || false,
                verified: prof.is_verified || false
              };
            });

            // Mostrar todos los profesionales sin filtrar por membresía
            // Solo ordenar por ranking
            const sortedProfessionals = sortProfessionalsByRanking(professionalsWithServices);

            setProfessionals(sortedProfessionals);
            setFilteredProfessionals(sortedProfessionals);
            console.log("✅ [Explore] Set professionals:", sortedProfessionals.length);
          } else {
            console.log("⚠️ [Explore] No professionals data or empty array");
            setProfessionals([]);
            setFilteredProfessionals([]);
          }
        } else if (professionalsResult.status === 'rejected') {
          console.error("❌ [Explore] Error fetching professionals:", professionalsResult.reason);
          setProfessionals([]);
          setFilteredProfessionals([]);
        } else {
          console.log("⚠️ [Explore] Professionals result not fulfilled");
          setProfessionals([]);
          setFilteredProfessionals([]);
        }

        // Procesar eventos
        console.log("🔍 [Explore] Processing events result:", eventsResult.status);
        if (eventsResult.status === 'fulfilled') {
          const eventsData = eventsResult.value.data;
          if (eventsData && eventsData.length > 0) {
            console.log("✅ [Explore] Events data:", eventsData.length, "events");
            setEvents(eventsData);
            setFilteredEvents(eventsData);
          } else {
            console.log("⚠️ [Explore] No events data or empty array");
            setEvents([]);
            setFilteredEvents([]);
          }
        } else if (eventsResult.status === 'rejected') {
          console.error("❌ [Explore] Error fetching events:", eventsResult.reason);
          setEvents([]);
          setFilteredEvents([]);
        } else {
          setEvents([]);
          setFilteredEvents([]);
        }

        // Procesar retos
        console.log("🔍 [Explore] Processing challenges result:", challengesResult.status);
        if (challengesResult.status === 'fulfilled') {
          const challengesData = challengesResult.value.data as any[] | null;
          const error = challengesResult.value.error;

          if (error) {
            console.error("❌ [Explore] Error fetching challenges:", error);
            setChallenges([]);
            setFilteredChallenges([]);
          } else if (challengesData && challengesData.length > 0) {
            // Obtener profesionales por separado para evitar problemas de RLS en joins
            const professionalIds = challengesData
              .map((c: any) => c.professional_id)
              .filter((id: any): id is string => !!id);
            
            let professionalsMap = new Map();
            if (professionalIds.length > 0) {
              const { data: professionalsData } = await supabase
                .from("professional_applications")
                .select("id, first_name, last_name, profile_photo, profession, is_verified, status, is_active")
                .in("id", professionalIds)
                .eq("status", "approved")
                .eq("is_active", true);
              
              if (professionalsData) {
                professionalsData.forEach(prof => {
                  professionalsMap.set(prof.id, prof);
                });
              }
            }

            // Filtrar solo retos que tengan profesional válido (si tienen professional_id)
            const validChallenges = challengesData.filter((challenge: any) => {
              // Si no tiene professional_id, está bien (puede ser creado por admin sin profesional)
              if (!challenge.professional_id) return true;
              // Si tiene professional_id, debe existir en el map
              return professionalsMap.has(challenge.professional_id);
            });

            const transformedChallenges = validChallenges.map((challenge: any) => {
              const professional = challenge.professional_id 
                ? professionalsMap.get(challenge.professional_id)
                : null;

              return {
                ...challenge,
                professional_first_name: professional?.first_name,
                professional_last_name: professional?.last_name,
                professional_photo: professional?.profile_photo,
                professional_profession: professional?.profession,
                professional_is_verified: professional?.is_verified,
              };
            });

            setChallenges(transformedChallenges);
            setFilteredChallenges(transformedChallenges);
          } else {
            setChallenges([]);
            setFilteredChallenges([]);
          }
        } else if (challengesResult.status === 'rejected') {
          console.error("❌ [Explore] Error fetching challenges:", challengesResult.reason);
          setChallenges([]);
          setFilteredChallenges([]);
        } else {
          setChallenges([]);
          setFilteredChallenges([]);
        }

        // Procesar restaurantes
        console.log("🔍 [Explore] Processing restaurants result:", restaurantsResult.status);
        if (restaurantsResult.status === 'fulfilled') {
          const restaurantsData = restaurantsResult.value.data;
          if (restaurantsData && restaurantsData.length > 0) {
            console.log("✅ [Explore] Restaurants data:", restaurantsData.length, "restaurants");
            setRestaurants(restaurantsData);
            setFilteredRestaurants(restaurantsData);
          } else {
            console.log("⚠️ [Explore] No restaurants data or empty array");
            setRestaurants([]);
            setFilteredRestaurants([]);
          }
        } else if (restaurantsResult.status === 'rejected') {
          console.error("❌ [Explore] Error fetching restaurants:", restaurantsResult.reason);
          setRestaurants([]);
          setFilteredRestaurants([]);
        } else {
          setRestaurants([]);
          setFilteredRestaurants([]);
        }

        // Procesar comercios
        console.log("🔍 [Explore] Processing shops result:", shopsResult.status);
        if (shopsResult.status === 'fulfilled') {
          const shopsData = shopsResult.value.data;
          if (shopsData && shopsData.length > 0) {
            console.log("✅ [Explore] Shops data:", shopsData.length, "shops");
            setShops(shopsData);
            setFilteredShops(shopsData);
          } else {
            console.log("⚠️ [Explore] No shops data or empty array");
            setShops([]);
            setFilteredShops([]);
          }
        } else if (shopsResult.status === 'rejected') {
          console.error("❌ [Explore] Error fetching shops:", shopsResult.reason);
          setShops([]);
          setFilteredShops([]);
        } else {
          setShops([]);
          setFilteredShops([]);
        }

        // Procesar programas
        console.log("🔍 [Explore] Processing products result:", productsResult.status);
        if (productsResult.status === 'fulfilled') {
          const productsData = productsResult.value.data;
          const error = productsResult.value.error;
          
          if (error) {
            console.error("❌ [Explore] Error fetching digital products:", error);
            setDigitalProducts([]);
            setFilteredDigitalProducts([]);
          } else if (productsData && productsData.length > 0) {
            console.log("✅ [Explore] Products data:", productsData.length, "products");
            
            // Filtrar productos que tienen información del profesional válida
            const validProducts = productsData.filter((product: any) => {
              const professional = product.professional_applications;
              // Verificar que el producto tenga información del profesional y que esté aprobado
              if (Array.isArray(professional)) {
                const prof = professional[0];
                return prof && prof.status === 'approved' && prof.is_active !== false;
              } else if (professional) {
                return professional.status === 'approved' && professional.is_active !== false;
              }
              return false;
            });
            
            console.log("✅ [Explore] Valid products (after filtering):", validProducts.length, "products");
            
            const transformedProducts = validProducts.map((product: any) => ({
              ...product,
              professional_applications: Array.isArray(product.professional_applications) && product.professional_applications.length > 0
                ? product.professional_applications[0]
                : product.professional_applications || undefined,
            }));

            setDigitalProducts(transformedProducts);
            setFilteredDigitalProducts(transformedProducts);
          } else {
            console.log("⚠️ [Explore] No products data or empty array");
            setDigitalProducts([]);
            setFilteredDigitalProducts([]);
          }
        } else if (productsResult.status === 'rejected') {
          console.error("❌ [Explore] Error fetching digital products:", productsResult.reason);
          setDigitalProducts([]);
          setFilteredDigitalProducts([]);
        } else {
          setDigitalProducts([]);
          setFilteredDigitalProducts([]);
        }

        // Procesar centros holísticos
        console.log("🔍 [Explore] Processing holistic centers result:", holisticCentersResult.status);
        if (holisticCentersResult.status === 'fulfilled') {
          const centersData = holisticCentersResult.value.data;
          if (centersData && centersData.length > 0) {
            console.log("✅ [Explore] Holistic centers data:", centersData.length, "centers");
            setHolisticCenters(centersData);
            setFilteredHolisticCenters(centersData);
          } else {
            console.log("⚠️ [Explore] No holistic centers data or empty array");
            setHolisticCenters([]);
            setFilteredHolisticCenters([]);
          }
        } else if (holisticCentersResult.status === 'rejected') {
          console.error("❌ [Explore] Error fetching holistic centers:", holisticCentersResult.reason);
          setHolisticCenters([]);
          setFilteredHolisticCenters([]);
        } else {
          setHolisticCenters([]);
          setFilteredHolisticCenters([]);
        }
      } catch (error) {
        console.error("❌ [Explore] Error fetching data:", error);
        // Solo mostrar error si es un error crítico, no errores menores de datos individuales
        if (error instanceof Error && !error.message.includes('PGRST')) {
          console.error("Error crítico:", error);
        }
      } finally {
        // Solo actualizar loading si el componente aún está montado
        if (isMounted) {
          setLoading(false);
        }
        // Los estados aún no se han actualizado aquí porque setState es asíncrono
        // Los logs reales están en cada sección donde se setean los datos
      }
    };

    getData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Cambiar dependencias a array vacío para que solo se ejecute una vez

  // Asegurar que los carruseles se muestren desde el inicio cuando cambian los datos
  useEffect(() => {
    if (professionalsScrollRef.current && filteredProfessionals.length > 0) {
      professionalsScrollRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
    if (eventsScrollRef.current && filteredEvents.length > 0) {
      eventsScrollRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
    if (challengesScrollRef.current && filteredChallenges.length > 0) {
      challengesScrollRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
  }, [filteredProfessionals.length, filteredEvents.length, filteredChallenges.length]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        const newCategories = prev.filter(id => id !== categoryId);
        applyFilters(newCategories);
        return newCategories;
      } else {
        const newCategories = [...prev, categoryId];
        applyFilters(newCategories);
        return newCategories;
      }
    });
  };

  const applyFilters = (categoryIds: string[]) => {
    // Mapeo de categorías a áreas de bienestar
    const categoryToWellnessAreas: Record<string, string[]> = {
      professionals: ["Salud mental"],
      spirituality: ["Espiritualidad"],
      "physical-activity": ["Actividad física"],
      social: ["Social"],
      nutrition: ["Alimentación"],
    };

    // Mapeo de categorías a categorías de eventos
    const categoryToEventCategory: Record<string, string> = {
      professionals: "salud_mental",
      spirituality: "espiritualidad",
      "physical-activity": "salud_fisica",
      social: "social",
      nutrition: "alimentacion",
    };

    // Filtrar profesionales
    let filteredProfs = [...professionals];
    if (categoryIds.length > 0) {
      filteredProfs = filteredProfs.filter((professional) => {
        return categoryIds.some((categoryId) => {
          const mappedAreas = categoryToWellnessAreas[categoryId] || [];
          return (
            mappedAreas.length > 0 &&
            professional.wellness_areas &&
            professional.wellness_areas.some((area) => mappedAreas.includes(area))
          );
        });
      });
    }
    setFilteredProfessionals(filteredProfs);
    
    // Reiniciar scroll del carrusel de profesionales al inicio
    if (professionalsScrollRef.current) {
      professionalsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }

    // Filtrar eventos
    let filteredEvts = [...events];
    if (categoryIds.length > 0) {
      filteredEvts = filteredEvts.filter(event => {
        return categoryIds.some(categoryId => {
          const eventCategory = categoryToEventCategory[categoryId];
          return eventCategory && event.category === eventCategory;
        });
      });
    }
    setFilteredEvents(filteredEvts);
    
    // Reiniciar scroll del carrusel de eventos al inicio
    if (eventsScrollRef.current) {
      eventsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }

    // Filtrar programas por wellness_areas del programa o del profesional
    let filteredProds = [...digitalProducts];
    if (categoryIds.length > 0) {
      filteredProds = filteredProds.filter((product) => {
        // Priorizar wellness_areas del programa si existe y no está vacío
        let productWellnessAreas: string[] = [];
        
        if (product.wellness_areas && Array.isArray(product.wellness_areas) && product.wellness_areas.length > 0) {
          // Usar wellness_areas del programa directamente
          productWellnessAreas = product.wellness_areas;
        } else {
          // Fallback: usar wellness_areas del profesional asociado
          const professional = product.professional_applications;
          if (professional && professional.wellness_areas && Array.isArray(professional.wellness_areas)) {
            productWellnessAreas = professional.wellness_areas;
          }
        }
        
        // Si no tiene wellness_areas ni del programa ni del profesional, ocultar cuando hay filtros activos
        if (productWellnessAreas.length === 0) {
          return false;
        }
        
        // Verificar si alguna de las áreas de bienestar coincide con las categorías seleccionadas
        return categoryIds.some((categoryId) => {
          const mappedAreas = categoryToWellnessAreas[categoryId] || [];
          if (mappedAreas.length === 0) return false;
          
          // Verificar si alguna de las áreas de bienestar coincide con las áreas mapeadas
          return productWellnessAreas.some((area) => mappedAreas.includes(area));
        });
      });
    } else {
      // Si no hay filtros, mostrar todos los programas
      filteredProds = [...digitalProducts];
    }
    setFilteredDigitalProducts(filteredProds);

    // Filtrar retos (públicos) por wellness_areas
    let filteredChals = [...challenges];
    if (categoryIds.length > 0) {
      filteredChals = filteredChals.filter((challenge) => {
        const challengeAreas = Array.isArray(challenge.wellness_areas) ? challenge.wellness_areas : [];
        if (challengeAreas.length === 0) return false;

        return categoryIds.some((categoryId) => {
          const mappedAreas = categoryToWellnessAreas[categoryId] || [];
          if (mappedAreas.length === 0) return false;
          return challengeAreas.some((area) => mappedAreas.includes(area));
        });
      });
    } else {
      filteredChals = [...challenges];
    }
    setFilteredChallenges(filteredChals);

    // Reiniciar scroll del carrusel de retos al inicio
    if (challengesScrollRef.current) {
      challengesScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }

    // Filtrar restaurantes - siempre mostrar en "Alimentación"
    let filteredRests = [...restaurants];
    if (categoryIds.length > 0) {
      if (categoryIds.includes("nutrition")) {
        // Si se selecciona "Alimentación", mostrar todos los restaurantes
        setFilteredRestaurants(filteredRests);
      } else {
        // Si no se selecciona "Alimentación", ocultar restaurantes
        setFilteredRestaurants([]);
      }
    } else {
      // Si no hay filtros, mostrar todos
      setFilteredRestaurants(filteredRests);
    }

    // Reiniciar scroll del carrusel de restaurantes al inicio
    if (restaurantsScrollRef.current) {
      restaurantsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }

    // Filtrar comercios - mostrar en todas las categorías o sin filtro
    let filteredShps = [...shops];
    if (categoryIds.length > 0) {
      // Por ahora, mostrar comercios en todas las categorías seleccionadas
      // (puedes ajustar esta lógica según necesites)
      setFilteredShops(filteredShps);
    } else {
      setFilteredShops(filteredShps);
    }

    // Reiniciar scroll del carrusel de comercios al inicio
    if (shopsScrollRef.current) {
      shopsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scrollEventsLeft = () => {
    if (eventsScrollRef.current) {
      eventsScrollRef.current.scrollBy({ left: -416, behavior: 'smooth' }); // w-96 (384px) + gap (16px) + padding
    }
  };

  const scrollEventsRight = () => {
    if (eventsScrollRef.current) {
      eventsScrollRef.current.scrollBy({ left: 416, behavior: 'smooth' });
    }
  };

  const scrollChallengesLeft = () => {
    if (challengesScrollRef.current) {
      challengesScrollRef.current.scrollBy({ left: -416, behavior: 'smooth' });
    }
  };

  const scrollChallengesRight = () => {
    if (challengesScrollRef.current) {
      challengesScrollRef.current.scrollBy({ left: 416, behavior: 'smooth' });
    }
  };

  const scrollProfessionalsLeft = () => {
    if (professionalsScrollRef.current) {
      const scrollAmount = 416; // Ancho de la card (w-96 = 384px) + gap (16px) + padding
      professionalsScrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollProfessionalsRight = () => {
    if (professionalsScrollRef.current) {
      const scrollAmount = 416; // Ancho de la card (w-96 = 384px) + gap (16px) + padding
      professionalsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRestaurantsLeft = () => {
    if (restaurantsScrollRef.current) {
      restaurantsScrollRef.current.scrollBy({ left: -416, behavior: 'smooth' });
    }
  };

  const scrollRestaurantsRight = () => {
    if (restaurantsScrollRef.current) {
      restaurantsScrollRef.current.scrollBy({ left: 416, behavior: 'smooth' });
    }
  };

  const scrollShopsLeft = () => {
    if (shopsScrollRef.current) {
      shopsScrollRef.current.scrollBy({ left: -416, behavior: 'smooth' });
    }
  };

  const scrollShopsRight = () => {
    if (shopsScrollRef.current) {
      shopsScrollRef.current.scrollBy({ left: 416, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Categories Filter */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              Filtrar por categorías
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Selecciona una categoría para filtrar profesionales, programas, eventos, restaurantes y comercios
            </p>
          </div>
          <div className="flex gap-3 sm:gap-4 justify-center overflow-x-auto pb-2">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryToggle(category.id)}
                className={`group flex flex-col items-center p-3 sm:p-4 rounded-xl border transition-all duration-200 min-w-[120px] sm:min-w-[140px] shrink-0 cursor-pointer ${
                  selectedCategories.includes(category.id)
                    ? "bg-white text-primary border-primary shadow-md"
                    : "bg-primary text-white border-primary/20 hover:border-primary hover:shadow-md"
                }`}
              >
                <div className="mb-1 sm:mb-2">
                  {category.id === "professionals" && <Brain className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`} />}
                  {category.id === "spirituality" && <Sparkles className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`} />}
                  {category.id === "physical-activity" && <Activity className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`} />}
                  {category.id === "social" && <Users className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`} />}
                  {category.id === "nutrition" && <Apple className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`} />}
                </div>
                <span className={`text-sm sm:text-base font-medium text-center ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`}>
                  {category.name}
                </span>
                <span className={`text-[10px] sm:text-xs mt-1 text-center leading-tight ${selectedCategories.includes(category.id) ? "text-primary/80" : "text-white/80"}`}>
                  {category.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-12 relative">
          {/* Mostrar skeletons mientras carga */}
          {loading && (
            <>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Programas</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CardSkeleton key={`program-skeleton-${i}`} />
                  ))}
                </div>
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Retos</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`challenge-skeleton-${i}`} className="shrink-0 w-96">
                      <SkeletonChallengeCard />
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative z-0">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Eventos</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CardSkeleton key={`event-skeleton-${i}`} />
                  ))}
                </div>
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Expertos</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <ProfessionalCardSkeleton key={`professional-skeleton-${i}`} />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Restaurantes</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CardSkeleton key={`restaurant-skeleton-${i}`} />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Comercios</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CardSkeleton key={`shop-skeleton-${i}`} />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Centros Holísticos</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CardSkeleton key={`holistic-center-skeleton-${i}`} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Mostrar mensaje cuando no hay datos y no está cargando - Solo si realmente no hay datos */}
          {!loading && 
           filteredDigitalProducts.length === 0 && 
           filteredChallenges.length === 0 &&
           filteredEvents.length === 0 && 
           filteredProfessionals.length === 0 && 
           filteredRestaurants.length === 0 && 
           filteredShops.length === 0 && 
           filteredHolisticCenters.length === 0 && (
            <div className="text-center py-16">
              <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hay contenido disponible
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Por el momento no hay profesionales, retos, eventos, programas, restaurantes, comercios o centros holísticos disponibles. 
                Vuelve más tarde para descubrir nuevo contenido.
              </p>
              <div className="mt-4 text-xs text-muted-foreground">
                Debug: professionals={professionals.length}, challenges={challenges.length}, events={events.length}, products={digitalProducts.length}, restaurants={restaurants.length}, shops={shops.length}, centers={holisticCenters.length}
              </div>
            </div>
          )}

          {/* Sección de Programas - Solo mostrar si hay datos */}
          {!loading && filteredDigitalProducts.length > 0 && (
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <Link
                  href={`/patient/${userId}/explore/programs`}
                  className="group flex items-center gap-2"
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground group-hover:text-primary transition-colors">
                    Programas
                  </h2>
                  <ChevronRight className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                </Link>
              </div>

              <DigitalProductList
                products={filteredDigitalProducts.map(mapApiProductToCardProduct)}
                layout="carousel"
                showProfessional={true}
              />
            </div>
          )}

          {/* Sección de Retos - Solo mostrar si hay datos */}
          {!loading && filteredChallenges.length > 0 && (
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <Link href="/explore/challenges" className="group flex items-center gap-2">
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground group-hover:text-primary transition-colors">
                    Retos
                  </h2>
                  <ChevronRight className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                </Link>
              </div>

              <div className="relative">
                <button
                  onClick={scrollChallengesLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={scrollChallengesRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                <div
                  ref={challengesScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12"
                  style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
                >
                  {filteredChallenges.map((challenge) => (
                    <div key={challenge.id} className="shrink-0 w-96 h-[420px]">
                      <ChallengeCard challenge={challenge as any} userId={userId || undefined} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sección de Eventos y Talleres - Solo mostrar si hay datos */}
          {!loading && filteredEvents.length > 0 && (
          <div className="relative z-0">
            <div className="flex items-center justify-between mb-6">
              <Link
                href={`/patient/${userId}/explore/events`}
                className="group flex items-center gap-2"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground group-hover:text-primary transition-colors">
                  Eventos y Talleres
                </h2>
                <ChevronRight className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {events.length === 0
                    ? "No hay eventos disponibles"
                    : "No se encontraron eventos que coincidan con los filtros aplicados."}
                </p>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={scrollEventsLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={scrollEventsRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                <div
                  ref={eventsScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12"
                  style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
                >
                  {filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={mapApiEventToCardEvent(event)}
                      showFavoriteButton
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Sección de Expertos - Solo mostrar si hay datos */}
          {!loading && filteredProfessionals.length > 0 && (
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Link
                href={`/patient/${userId}/explore/professionals`}
                className="group flex items-center gap-2"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground group-hover:text-primary transition-colors">
                  Expertos
                </h2>
                <ChevronRight className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>

            {filteredProfessionals.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {professionals.length === 0
                    ? "No hay expertos disponibles"
                    : "No se encontraron expertos que coincidan con los filtros aplicados."}
                </p>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={scrollProfessionalsLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={scrollProfessionalsRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                <div
                  ref={professionalsScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12"
                  style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
                >
                  {filteredProfessionals.map((professional) => (
                    <div 
                      key={professional.id} 
                      className="shrink-0 w-96"
                      onClick={() => {
                      }}
                    >
                      <ProfessionalCard
                        userId={userId || undefined}
                        professional={{
                          id: professional.id,
                          slug: `${professional.first_name.toLowerCase()}-${professional.last_name.toLowerCase()}`,
                          name: `${professional.first_name} ${professional.last_name}`,
                          email: professional.email,
                          whatsapp: professional.phone || "",
                          socialMedia: {
                            instagram: "",
                            linkedin: "",
                          },
                          profession: professional.profession,
                          therapyTypes: professional.specializations,
                          wellnessAreas: professional.wellness_areas || [],
                          costs: {
                            presencial: professional.services.find((s) => s.presencialCost)?.presencialCost
                              ? parseInt(professional.services.find((s) => s.presencialCost)?.presencialCost || "0")
                              : 0,
                            online: professional.services.find((s) => s.onlineCost)?.onlineCost
                              ? parseInt(professional.services.find((s) => s.onlineCost)?.onlineCost || "0")
                              : 0,
                          },
                          serviceType: (() => {
                            if (professional.modality) {
                              switch (professional.modality) {
                                case 'presencial':
                                  return 'in-person';
                                case 'online':
                                  return 'online';
                                case 'both':
                                  return 'both';
                                default:
                                  return 'in-person';
                              }
                            }
                            const hasPresencial = professional.services.some(
                              (s) => s.presencialCost && s.presencialCost !== "" && s.presencialCost !== "0" && Number(s.presencialCost) > 0
                            );
                            const hasOnline = professional.services.some(
                              (s) => s.onlineCost && s.onlineCost !== "" && s.onlineCost !== "0" && Number(s.onlineCost) > 0
                            );
                            if (hasPresencial && hasOnline) return "both";
                            if (hasPresencial) return "in-person";
                            return "online";
                          })(),
                          location: {
                            city: professional.city,
                            state: professional.state,
                            country: professional.country,
                            address: professional.address,
                          },
                          bookingOption: true,
                          serviceDescription:
                            professional.services[0]?.description ||
                            professional.biography ||
                            "",
                          biography: professional.biography || "",
                          profilePhoto: professional.profile_photo || "",
                          gallery: professional.gallery,
                          imagePosition: professional.imagePosition || "center center",
                          average_rating: professional.average_rating,
                          total_reviews: professional.total_reviews,
                          is_verified: professional.is_verified,
                          verified: professional.verified,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Sección de Restaurantes - Solo mostrar si hay datos */}
          {!loading && filteredRestaurants.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <Link
                href={`/patient/${userId}/explore/restaurants`}
                className="group flex items-center gap-2"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground group-hover:text-primary transition-colors">
                  Restaurantes
                </h2>
                <ChevronRight className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>

            {filteredRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {restaurants.length === 0
                    ? "No hay restaurantes disponibles"
                    : "No se encontraron restaurantes que coincidan con los filtros aplicados."}
                </p>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={scrollRestaurantsLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={scrollRestaurantsRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                <div
                  ref={restaurantsScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12"
                >
                  {filteredRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={mapApiRestaurantToCardRestaurant(restaurant)}
                      showFavoriteButton
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Sección de Comercios - Solo mostrar si hay datos */}
          {!loading && filteredShops.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <Link
                href={`/patient/${userId}/explore/shops`}
                className="group flex items-center gap-2"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground group-hover:text-primary transition-colors">
                  Comercios
                </h2>
                <ChevronRight className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>

            {filteredShops.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {shops.length === 0
                    ? "No hay comercios disponibles"
                    : "No se encontraron comercios que coincidan con los filtros aplicados."}
                </p>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={scrollShopsLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={scrollShopsRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                <div
                  ref={shopsScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12"
                >
                  {filteredShops.map((shop) => (
                    <ShopCard
                      key={shop.id}
                      shop={mapApiShopToCardShop(shop)}
                      showFavoriteButton
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Sección de Centros Holísticos - Solo mostrar si hay datos */}
          {!loading && filteredHolisticCenters.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <Link
                href={`/patient/${userId}/explore/holistic-centers`}
                className="group flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground group-hover:text-primary transition-colors">
                  Centros Holísticos
                </h2>
                <ChevronRight className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>

            {filteredHolisticCenters.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {holisticCenters.length === 0
                    ? "No hay centros holísticos disponibles"
                    : "No se encontraron centros holísticos que coincidan con los filtros aplicados."}
                </p>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => {
                    if (holisticCentersScrollRef.current) {
                      holisticCentersScrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
                    }
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => {
                    if (holisticCentersScrollRef.current) {
                      holisticCentersScrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                    }
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                <div
                  ref={holisticCentersScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12"
                  style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
                >
                  {filteredHolisticCenters.map((center) => (
                    <HolisticCenterCard
                      key={center.id}
                      center={mapApiCenterToCardCenter(center)}
                      showFavoriteButton
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomeUserPage;
