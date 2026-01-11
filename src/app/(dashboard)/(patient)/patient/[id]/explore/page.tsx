"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Calendar, MapPin, Users, ChevronLeft, ChevronRight, Brain, Sparkles, Activity, Apple, UtensilsCrossed, Store, Building2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventWorkshop } from "@/types/event";
import { formatEventDate, formatEventTime } from "@/utils/date-utils";
import { determineProfessionalModality, transformServicesFromDB } from "@/utils/professional-utils";
import { sortProfessionalsByRanking } from "@/utils/professional-ranking";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { Skeleton } from "@/components/ui/skeleton";

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
}

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
  is_active: boolean;
  created_at: string;
}

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
  is_active: boolean;
  created_at: string;
}

interface DigitalProduct {
  id: string;
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

const HomeUserPage = () => {
  const params = useParams();
  const userId = params.id as string;
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventWorkshop[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [filteredDigitalProducts, setFilteredDigitalProducts] = useState<DigitalProduct[]>([]);
  const [holisticCenters, setHolisticCenters] = useState<HolisticCenter[]>([]);
  const [filteredHolisticCenters, setFilteredHolisticCenters] = useState<HolisticCenter[]>([]);
  const [loading, setLoading] = useState(true);

  // Componentes de skeleton
  const ProfessionalCardSkeleton = () => (
    <div className="shrink-0 w-96">
      <Card className="h-[480px] flex flex-col">
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
      <Card className="h-[480px] flex flex-col">
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
  const restaurantsScrollRef = useRef<HTMLDivElement>(null);
  const shopsScrollRef = useRef<HTMLDivElement>(null);
  const digitalProductsScrollRef = useRef<HTMLDivElement>(null);
  const holisticCentersScrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);

        // Cargar todos los datos en paralelo para mejorar el rendimiento
        const [
          professionalsResult,
          eventsResult,
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
            .order("created_at", { ascending: false })
            .limit(50), // Limitar para mejor rendimiento
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
            .order("event_date", { ascending: true })
            .limit(20),
          // Restaurantes
          supabase
            .from("restaurants")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(10),
          // Comercios
          supabase
            .from("shops")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(10),
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
                wellness_areas
              )
            `)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(10),
          // Centros holísticos
          supabase
            .from("holistic_centers")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(10)
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
            const professionalsWithServices = await Promise.all(
              professionalsData.map(async (prof) => {
              const [servicesResult, reviewStatsResult, adminRatingResult, appointmentsResult] = await Promise.allSettled([
                supabase.from("professional_services").select("*").eq("professional_id", prof.id).eq("isactive", true),
                supabase.from("professional_review_stats").select("average_rating, total_reviews").eq("professional_id", prof.user_id),
                supabase.from("professional_admin_rating_stats").select("average_admin_rating").eq("professional_id", prof.id).maybeSingle(),
                supabase.from("appointments").select("*", { count: "exact", head: true }).eq("professional_id", prof.id).eq("status", "completed")
              ]);

              const services = servicesResult.status === 'fulfilled' ? servicesResult.value.data : [];
              const reviewStats = reviewStatsResult.status === 'fulfilled' && reviewStatsResult.value.data && reviewStatsResult.value.data.length > 0 ? reviewStatsResult.value.data[0] : null;
              const adminRatingData = adminRatingResult.status === 'fulfilled' ? adminRatingResult.value.data : null;
              const completedAppointmentsCount = appointmentsResult.status === 'fulfilled' ? appointmentsResult.value.count : 0;

              const transformedServices = transformServicesFromDB(services || []);
              const professionalModality = determineProfessionalModality(transformedServices);

              return {
                ...prof,
                services: transformedServices.length > 0 ? transformedServices : prof.services || [],
                modality: professionalModality,
                imagePosition: prof.image_position || "center center",
                average_rating: reviewStats?.average_rating || undefined,
                total_reviews: reviewStats?.total_reviews || undefined,
                admin_rating: adminRatingData?.average_admin_rating || undefined,
                completed_appointments: completedAppointmentsCount || 0,
                is_active: prof.is_active !== false,
                is_verified: prof.is_verified || false,
                verified: prof.is_verified || false
              };
            })
          );

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
          if (productsData && productsData.length > 0) {
            console.log("✅ [Explore] Products data:", productsData.length, "products");
            const transformedProducts = productsData.map((product: any) => ({
              ...product,
              professional_applications: Array.isArray(product.professional_applications) && product.professional_applications.length > 0
                ? product.professional_applications[0]
                : undefined,
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
        setLoading(false);
        // Los estados aún no se han actualizado aquí porque setState es asíncrono
        // Los logs reales están en cada sección donde se setean los datos
      }
    };

    getData();
  }, [supabase]);

  // Asegurar que los carruseles se muestren desde el inicio cuando cambian los datos
  useEffect(() => {
    if (professionalsScrollRef.current && filteredProfessionals.length > 0) {
      professionalsScrollRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
    if (eventsScrollRef.current && filteredEvents.length > 0) {
      eventsScrollRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
  }, [filteredProfessionals.length, filteredEvents.length]);

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

    // Reiniciar scroll del carrusel de programas al inicio
    if (digitalProductsScrollRef.current) {
      digitalProductsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
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

  const scrollDigitalProductsLeft = () => {
    if (digitalProductsScrollRef.current) {
      digitalProductsScrollRef.current.scrollBy({ left: -416, behavior: 'smooth' });
    }
  };

  const scrollDigitalProductsRight = () => {
    if (digitalProductsScrollRef.current) {
      digitalProductsScrollRef.current.scrollBy({ left: 416, behavior: 'smooth' });
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
                Por el momento no hay profesionales, eventos, programas, restaurantes, comercios o centros holísticos disponibles. 
                Vuelve más tarde para descubrir nuevo contenido.
              </p>
              <div className="mt-4 text-xs text-muted-foreground">
                Debug: professionals={professionals.length}, events={events.length}, products={digitalProducts.length}, restaurants={restaurants.length}, shops={shops.length}, centers={holisticCenters.length}
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

              <div className="relative">
                <button
                  onClick={scrollDigitalProductsLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={scrollDigitalProductsRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                <div
                  ref={digitalProductsScrollRef}
                  className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12"
                  style={{ scrollPaddingLeft: '1rem', scrollPaddingRight: '1rem' }}
                >
                  {filteredDigitalProducts.map((product) => {
                    return (
                      <Link
                        key={product.id}
                        href={`/patient/${userId}/explore/program/${product.id}`}
                        className="shrink-0 w-96"
                      >
                        <Card className="group overflow-hidden hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer h-[480px] flex flex-col">
                          <div className="relative h-64 w-full shrink-0">
                            <div className="absolute inset-0 overflow-hidden">
                              {product.cover_image_url ? (
                                <Image
                                  src={product.cover_image_url}
                                  alt={product.title}
                                  fill
                                  className="object-cover"
                                  unoptimized={product.cover_image_url.includes('supabase.co') || product.cover_image_url.includes('supabase.in')}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/logos/holistia-black.png";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                  <Store className="h-12 w-12 text-primary/40" />
                                </div>
                              )}
                            </div>
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
                          </div>
                          <CardHeader className="pb-3 shrink-0">
                            <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{product.title}</CardTitle>
                            {product.professional_applications && (
                              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                <span>Por {product.professional_applications.first_name} {product.professional_applications.last_name}</span>
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="flex-1 pb-4 min-h-0">
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                              {product.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">{product.category}</Badge>
                              <span className="text-lg font-bold text-primary">
                                ${product.price.toFixed(2)} {product.currency}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
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
                  {filteredEvents.map((event) => {
                    return (
                      <Link
                        key={event.id}
                        href={`/patient/${userId}/explore/event/${generateEventSlug(event.name, event.id!)}`}
                        className="shrink-0 w-96"
                      >
                        <Card className="group hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-[480px] flex flex-col">
                          <div className="relative w-full h-64 bg-gray-100 shrink-0">
                            <div className="absolute inset-0 overflow-hidden">
                              <Image
                                src={(event.gallery_images && event.gallery_images.length > 0 && event.gallery_images[0]) || event.image_url || "/logos/holistia-black.png"}
                                alt={event.name}
                                fill
                                className="object-cover"
                                style={{ objectPosition: event.image_position || "center center" }}
                                unoptimized
                              />
                            </div>
                            <div 
                              className="absolute top-3 right-3 pointer-events-auto" 
                              style={{ zIndex: 9999, position: 'absolute', top: '12px', right: '12px' }}
                            >
                              <FavoriteButton
                                itemId={event.id!}
                                favoriteType="event"
                                variant="floating"
                              />
                            </div>
                          </div>
                          <CardHeader className="pb-3 shrink-0">
                            <CardTitle className="text-lg mb-1.5 group-hover:text-primary transition-colors">{event.name}</CardTitle>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge variant="secondary">
                                {getCategoryLabel(event.category)}
                              </Badge>
                              <Badge variant={event.is_free ? "default" : "outline"}>
                                {event.is_free ? "Gratuito" : `$${event.price}`}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 flex-1 pb-4 min-h-0">
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <div className="font-medium text-foreground">
                                  {event.end_date && event.event_date !== event.end_date
                                    ? `${formatEventDate(event.event_date)} - ${formatEventDate(event.end_date)}`
                                    : formatEventDate(event.event_date)
                                  }
                                </div>
                                <div className="text-xs">
                                  {formatEventTime(event.event_time)}
                                  {event.end_time && ` - ${formatEventTime(event.end_time)}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                            {event.description && (
                              <div
                                className="text-sm text-muted-foreground line-clamp-2 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: event.description }}
                              />
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
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
                        userId={userId}
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
                    <Link
                      key={restaurant.id}
                      href={`/patient/${userId}/explore/restaurant/${restaurant.id}`}
                      className="shrink-0 w-96"
                      onClick={() => {
                      }}
                    >
                      <Card className="group hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-[480px] flex flex-col">
                        <div className="relative w-full h-64 bg-gray-100 shrink-0">
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
                        </div>
                        <CardHeader className="pb-3 shrink-0">
                          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{restaurant.name}</CardTitle>
                          <div className="flex gap-2 mt-1.5">
                            {restaurant.cuisine_type && (
                              <Badge variant="secondary">{restaurant.cuisine_type}</Badge>
                            )}
                            {restaurant.price_range && (
                              <Badge variant="outline">{restaurant.price_range}</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4 min-h-0">
                          {restaurant.description && (
                            <div
                              className="text-sm text-muted-foreground line-clamp-3 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: restaurant.description }}
                            />
                          )}
                          {restaurant.address && (
                            <div className="flex items-start gap-2 mt-3 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{restaurant.address}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
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
                    <Link
                      key={shop.id}
                      href={`/patient/${userId}/explore/shop/${shop.id}`}
                      className="shrink-0 w-96"
                      onClick={() => {
                      }}
                    >
                      <Card className="group hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-[480px] flex flex-col">
                        <div className="relative w-full h-64 bg-gray-100 shrink-0">
                          <div className="absolute inset-0 overflow-hidden">
                            {shop.image_url ? (
                              <Image
                                src={shop.image_url}
                                alt={shop.name}
                                fill
                                className="object-cover"
                                unoptimized={shop.image_url.includes('supabase.co') || shop.image_url.includes('supabase.in')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/logos/holistia-black.png";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <Store className="h-16 w-16 text-primary/40" />
                              </div>
                            )}
                          </div>
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
                        </div>
                        <CardHeader className="pb-3 shrink-0">
                          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{shop.name}</CardTitle>
                          {shop.category && (
                            <Badge variant="secondary" className="w-fit mt-1.5">{shop.category}</Badge>
                          )}
                        </CardHeader>
                        <CardContent className="flex-1 pb-4 min-h-0">
                          {shop.description && (
                            <div
                              className="text-sm text-muted-foreground line-clamp-3 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: shop.description }}
                            />
                          )}
                          {(shop.address || shop.city) && (
                            <div className="flex items-start gap-2 mt-3 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">
                                {shop.address && shop.city ? `${shop.address}, ${shop.city}` : shop.address || shop.city}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
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
                    <Link
                      key={center.id}
                      href={`/patient/${userId}/explore/holistic-center/${center.id}`}
                      className="shrink-0 w-96"
                      onClick={() => {
                      }}
                    >
                      <Card className="group hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-[480px] flex flex-col">
                        <div className="relative w-full h-64 bg-gray-100 shrink-0">
                          <div className="absolute inset-0 overflow-hidden">
                            {center.image_url ? (
                              <Image
                                src={center.image_url}
                                alt={center.name}
                                fill
                                className="object-cover"
                                unoptimized={center.image_url.includes('supabase.co') || center.image_url.includes('supabase.in')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/logos/holistia-black.png";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                <Building2 className="h-16 w-16 text-primary/40" />
                              </div>
                            )}
                          </div>
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
                        </div>
                        <CardHeader className="pb-3 shrink-0">
                          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{center.name}</CardTitle>
                          <div className="flex gap-2 mt-1.5">
                            {center.city && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{center.city}</span>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 flex-1 pb-4 min-h-0">
                          {center.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {center.description.replace(/<[^>]*>/g, '')}
                            </p>
                          )}
                          {center.address && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{center.address}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
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
