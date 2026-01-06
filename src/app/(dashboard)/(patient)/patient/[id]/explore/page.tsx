"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Calendar, MapPin, Users, ChevronLeft, ChevronRight, Brain, Sparkles, Activity, Apple, UtensilsCrossed, Store } from "lucide-react";
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
  professional_applications?: {
    first_name: string;
    last_name: string;
    profile_photo?: string;
    is_verified?: boolean;
  };
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
  const [loading, setLoading] = useState(true);
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
        }

        // Obtener programas (productos digitales)
        const { data: productsData, error: productsError } = await supabase
          .from("digital_products")
          .select(`
            *,
            professional_applications!digital_products_professional_id_fkey(
              first_name,
              last_name,
              profile_photo,
              is_verified
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
    // Filtrar profesionales
    let filteredProfs = [...professionals];
    if (categoryIds.length > 0) {
      filteredProfs = filteredProfs.filter((professional) => {
        return categoryIds.some((categoryId) => {
          const categoryMap: Record<string, string[]> = {
            professionals: ["Salud mental"],
            spirituality: ["Espiritualidad"],
            "physical-activity": ["Actividad física"],
            social: ["Social"],
            nutrition: ["Alimentación"],
          };
          const mappedAreas = categoryMap[categoryId] || [];
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
          const categoryMap: Record<string, string> = {
            professionals: "salud_mental",
            spirituality: "espiritualidad",
            "physical-activity": "salud_fisica",
            social: "social",
            nutrition: "alimentacion",
          };
          const eventCategory = categoryMap[categoryId];
          return eventCategory && event.category === eventCategory;
        });
      });
    }
    setFilteredEvents(filteredEvts);
    
    // Reiniciar scroll del carrusel de eventos al inicio
    if (eventsScrollRef.current) {
      eventsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const scrollEventsLeft = () => {
    if (eventsScrollRef.current) {
      eventsScrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollEventsRight = () => {
    if (eventsScrollRef.current) {
      eventsScrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  const scrollProfessionalsLeft = () => {
    if (professionalsScrollRef.current) {
      const scrollAmount = 400; // Ancho de la card (w-96 = 384px) + gap (16px)
      professionalsScrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollProfessionalsRight = () => {
    if (professionalsScrollRef.current) {
      const scrollAmount = 400; // Ancho de la card (w-96 = 384px) + gap (16px)
      professionalsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRestaurantsLeft = () => {
    if (restaurantsScrollRef.current) {
      restaurantsScrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRestaurantsRight = () => {
    if (restaurantsScrollRef.current) {
      restaurantsScrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  const scrollShopsLeft = () => {
    if (shopsScrollRef.current) {
      shopsScrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollShopsRight = () => {
    if (shopsScrollRef.current) {
      shopsScrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  const scrollDigitalProductsLeft = () => {
    if (digitalProductsScrollRef.current) {
      digitalProductsScrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollDigitalProductsRight = () => {
    if (digitalProductsScrollRef.current) {
      digitalProductsScrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Categories Filter */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              Filtrar por categorías
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Selecciona una categoría para filtrar profesionales
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
          {digitalProducts.length > 0 && (
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
                  {digitalProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/patient/${userId}/my-products`}
                      className="shrink-0 w-80"
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow py-4">
                        <div className="relative h-48">
                          {product.cover_image_url ? (
                            <Image
                              src={product.cover_image_url}
                              alt={product.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                              <Store className="h-12 w-12 text-primary/40" />
                            </div>
                          )}
                        </div>
                        <CardHeader>
                          <CardTitle className="line-clamp-2">{product.title}</CardTitle>
                          {product.professional_applications && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <span>Por {product.professional_applications.first_name} {product.professional_applications.last_name}</span>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
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
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                      className="shrink-0 w-80"
                    >
                      <Card className="hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                        <div className="relative w-full h-48 bg-gray-100">
                          <Image
                            src={(event.gallery_images && event.gallery_images.length > 0 && event.gallery_images[0]) || event.image_url || "/logos/holistia-black.png"}
                            alt={event.name}
                            fill
                            className="object-cover"
                            style={{ objectPosition: event.image_position || "center center" }}
                            unoptimized
                          />
                        </div>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg mb-1.5">{event.name}</CardTitle>
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
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredProfessionals.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {professionals.length === 0
                    ? "No hay profesionales disponibles"
                    : "No se encontraron profesionales que coincidan con los filtros aplicados."}
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
          {restaurants.length > 0 && (
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
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-12">
                <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay restaurantes disponibles</p>
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
                  className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar justify-center px-12"
                >
                  {restaurants.map((restaurant) => (
                    <Link
                      key={restaurant.id}
                      href={`/patient/${userId}/explore/restaurant/${restaurant.id}`}
                      className="shrink-0 w-80"
                    >
                      <Card className="hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                        <div className="relative w-full h-48 bg-gray-100">
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
                        <CardHeader className="pb-3">
                          <CardTitle className="line-clamp-2">{restaurant.name}</CardTitle>
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
          {shops.length > 0 && (
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
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : shops.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay comercios disponibles</p>
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
                  className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar justify-center px-12"
                >
                  {shops.map((shop) => (
                    <Link
                      key={shop.id}
                      href={`/patient/${userId}/explore/shop/${shop.id}`}
                      className="shrink-0 w-80"
                    >
                      <Card className="hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                        <div className="relative w-full h-48 bg-gray-100">
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
                        <CardHeader className="pb-3">
                          <CardTitle className="line-clamp-2">{shop.name}</CardTitle>
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
        </div>
      </main>
    </div>
  );
};

export default HomeUserPage;
