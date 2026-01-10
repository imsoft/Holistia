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

  const CardSkeleton = () => (
    <div className="shrink-0 w-96">
      <Card className="h-full flex flex-col">
        <Skeleton className="w-full h-64 shrink-0 rounded-t-lg" />
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

        // Obtener profesionales - Todos los aprobados y activos
        const { data: professionalsData, error: professionalsError } = await supabase
          .from("professional_applications")
          .select("*")
          .eq("status", "approved")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (professionalsError) {
          console.error("Error fetching professionals:", professionalsError);
        } else {
          const professionalsWithServices = await Promise.all(
            (professionalsData || []).map(async (prof) => {
              const { data: services } = await supabase
                .from("professional_services")
                .select("*")
                .eq("professional_id", prof.id)
                .eq("isactive", true);

              const { data: reviewStatsData } = await supabase
                .from("professional_review_stats")
                .select("average_rating, total_reviews")
                .eq("professional_id", prof.user_id);

              const { data: adminRatingData, error: adminRatingError } = await supabase
                .from("professional_admin_rating_stats")
                .select("average_admin_rating")
                .eq("professional_id", prof.id)
                .maybeSingle();

              // Obtener número de citas completadas para el ranking
              const { count: completedAppointmentsCount } = await supabase
                .from("appointments")
                .select("*", { count: "exact", head: true })
                .eq("professional_id", prof.id)
                .eq("status", "completed");

              if (adminRatingError && adminRatingError.code !== 'PGRST116' && adminRatingError.message !== 'Not Acceptable') {
                console.error("Error loading admin rating:", adminRatingError);
              }

              const reviewStats = reviewStatsData && reviewStatsData.length > 0 ? reviewStatsData[0] : null;
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

          // Separar profesionales con membresía activa y sin membresía
          const currentDate = new Date();
          const professionalsWithMembership = professionalsWithServices.filter(prof =>
            prof.registration_fee_paid === true &&
            prof.registration_fee_expires_at &&
            new Date(prof.registration_fee_expires_at) > currentDate
          );
          const professionalsWithoutMembership = professionalsWithServices.filter(prof =>
            !prof.registration_fee_paid ||
            !prof.registration_fee_expires_at ||
            new Date(prof.registration_fee_expires_at) <= currentDate
          );

          // Ordenar cada grupo por ranking
          const sortedWithMembership = sortProfessionalsByRanking(professionalsWithMembership);
          const sortedWithoutMembership = sortProfessionalsByRanking(professionalsWithoutMembership);

          // Combinar: primero con membresía, luego sin membresía
          const sortedProfessionals = [...sortedWithMembership, ...sortedWithoutMembership];

          setProfessionals(sortedProfessionals);
          setFilteredProfessionals(sortedProfessionals);
        }

        // Obtener eventos
        const { data: eventsData, error: eventsError } = await supabase
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
          .limit(20);

        if (eventsError) {
          console.error("Error fetching events:", eventsError);
        } else {
          setEvents(eventsData || []);
          setFilteredEvents(eventsData || []);
        }

        // Obtener restaurantes
        const { data: restaurantsData, error: restaurantsError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(10);

        if (restaurantsError) {
          console.error("Error fetching restaurants:", restaurantsError);
        } else {
          console.log("🍽️ Restaurants data:", restaurantsData?.map(r => ({ id: r.id, name: r.name, image_url: r.image_url })));
          setRestaurants(restaurantsData || []);
          setFilteredRestaurants(restaurantsData || []);
        }

        // Obtener comercios
        const { data: shopsData, error: shopsError } = await supabase
          .from("shops")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(10);

        if (shopsError) {
          console.error("Error fetching shops:", shopsError);
        } else {
          console.log("🛍️ Shops data:", shopsData?.map(s => ({ id: s.id, name: s.name, image_url: s.image_url })));
          setShops(shopsData || []);
          setFilteredShops(shopsData || []);
        }

        // Obtener programas
        const { data: productsData, error: productsError } = await supabase
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
          .limit(10);

        if (productsError) {
          console.error("Error fetching digital products:", productsError);
        } else {
          const transformedProducts = (productsData || []).map((product: any) => ({
            ...product,
            professional_applications: Array.isArray(product.professional_applications) && product.professional_applications.length > 0
              ? product.professional_applications[0]
              : undefined,
          }));
          setDigitalProducts(transformedProducts);
          setFilteredDigitalProducts(transformedProducts);
        }

        // Obtener centros holísticos
        const { data: holisticCentersData, error: holisticCentersError } = await supabase
          .from("holistic_centers")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(10);

        if (holisticCentersError) {
          console.error("Error fetching holistic centers:", holisticCentersError);
        } else {
          console.log("🏢 Holistic centers data:", holisticCentersData?.map(c => ({ id: c.id, name: c.name, image_url: c.image_url })));
          setHolisticCenters(holisticCentersData || []);
          setFilteredHolisticCenters(holisticCentersData || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
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
          {/* Sección de Programas - Solo mostrar si hay datos */}
          {filteredDigitalProducts.length > 0 && (
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
                  {filteredDigitalProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/patient/${userId}/explore/program/${product.id}`}
                      className="shrink-0 w-96"
                    >
                      <Card className="group overflow-hidden hover:shadow-lg hover:-translate-y-2 transition-all duration-300 cursor-pointer h-full flex flex-col">
                        <div className="relative h-64 w-full">
                          <div className="absolute inset-0 overflow-hidden">
                            {product.cover_image_url ? (
                              <Image
                                src={product.cover_image_url}
                                alt={product.title}
                                fill
                                className="object-cover"
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
                        <CardHeader className="pb-3">
                          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{product.title}</CardTitle>
                          {product.professional_applications && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <span>Por {product.professional_applications.first_name} {product.professional_applications.last_name}</span>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
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
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sección de Eventos y Talleres - Solo mostrar si hay datos */}
          {filteredEvents.length > 0 && (
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

            {loading ? (
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CardSkeleton key={`event-skeleton-${i}`} />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
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
                    <Link
                      key={event.id}
                      href={`/patient/${userId}/explore/event/${generateEventSlug(event.name, event.id!)}`}
                      className="shrink-0 w-96"
                    >
                      <Card className="group hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                        <div className="relative w-full h-64 bg-gray-100">
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
                        <CardHeader className="pb-3">
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
                        <CardContent className="space-y-2 flex-1 pb-4">
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
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Sección de Expertos - Solo mostrar si hay datos */}
          {filteredProfessionals.length > 0 && (
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

            {loading ? (
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ProfessionalCardSkeleton key={`professional-skeleton-${i}`} />
                ))}
              </div>
            ) : filteredProfessionals.length === 0 ? (
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
                    <div key={professional.id} className="shrink-0 w-96">
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
          {filteredRestaurants.length > 0 && (
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

            {loading ? (
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CardSkeleton key={`restaurant-skeleton-${i}`} />
                ))}
              </div>
            ) : filteredRestaurants.length === 0 ? (
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
                    >
                      <Card className="group hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                        <div className="relative w-full h-64 bg-gray-100">
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
                        <CardHeader className="pb-3">
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
                        <CardContent className="flex-1 pb-4">
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
          {filteredShops.length > 0 && (
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

            {loading ? (
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CardSkeleton key={`shop-skeleton-${i}`} />
                ))}
              </div>
            ) : filteredShops.length === 0 ? (
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
                    >
                      <Card className="group hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                        <div className="relative w-full h-64 bg-gray-100">
                          <div className="absolute inset-0 overflow-hidden">
                            {shop.image_url ? (
                              <Image
                                src={shop.image_url}
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
                        <CardHeader className="pb-3">
                          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{shop.name}</CardTitle>
                          {shop.category && (
                            <Badge variant="secondary" className="w-fit mt-1.5">{shop.category}</Badge>
                          )}
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
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
          {filteredHolisticCenters.length > 0 && (
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

            {loading ? (
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CardSkeleton key={`holistic-center-skeleton-${i}`} />
                ))}
              </div>
            ) : filteredHolisticCenters.length === 0 ? (
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
                    >
                      <Card className="group hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                        <div className="relative w-full h-64 bg-gray-100">
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
                        <CardHeader className="pb-3">
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
                        <CardContent className="space-y-2 flex-1 pb-4">
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
