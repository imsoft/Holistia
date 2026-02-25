"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Brain,
  Sparkles,
  Activity,
  Users,
  Apple,
  Calendar,
  UtensilsCrossed,
  Store,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { ChallengeCard } from "@/components/ui/challenge-card";
import { EventCard, mapApiEventToCardEvent } from "@/components/ui/event-card";
import { ShopCard, mapApiShopToCardShop } from "@/components/ui/shop-card";
import {
  HolisticCenterCard,
  mapApiCenterToCardCenter,
} from "@/components/ui/holistic-center-card";
import {
  RestaurantCard,
  mapApiRestaurantToCardRestaurant,
} from "@/components/ui/restaurant-card";
import { DigitalProductList } from "@/components/ui/digital-product-list";
import { mapApiProductToCardProduct } from "@/components/ui/digital-product-card";
// PatientOnboardingChecklist ahora se muestra como botón en la navbar (PatientOnboardingButton)
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { EventWorkshop } from "@/types/event";

// ─── Interfaces ─────────────────────────────────────────────────────

interface Professional {
  id: string;
  slug?: string;
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
  difficulty_level?: "beginner" | "intermediate" | "advanced" | "expert";
  category?: string;
  price?: number | null;
  currency?: string;
  is_active: boolean;
  is_public?: boolean;
  created_by_type?: "professional" | "patient" | "admin";
  created_at: string;
  wellness_areas?: string[];
  professional_applications?:
    | {
        first_name?: string;
        last_name?: string;
        profile_photo?: string;
        profession?: string;
        is_verified?: boolean;
        status?: string;
        is_active?: boolean;
      }
    | { [key: string]: unknown }[]
    | null;
}

// ─── Props ──────────────────────────────────────────────────────────

interface ExploreClientProps {
  userId: string | null;
  professionals: Professional[];
  events: EventWorkshop[];
  challenges: Challenge[];
  restaurants: Restaurant[];
  shops: Shop[];
  digitalProducts: DigitalProduct[];
  holisticCenters: HolisticCenter[];
}

// ─── Categorías ─────────────────────────────────────────────────────

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

// ─── Componente ─────────────────────────────────────────────────────

export function ExploreClient({
  userId,
  professionals,
  events,
  challenges,
  restaurants,
  shops,
  digitalProducts,
  holisticCenters,
}: ExploreClientProps) {
  useUserStoreInit();

  const exploreHref = (path: string) =>
    userId ? `/patient/${userId}/explore/${path}` : `/explore/${path}`;

  // ─── State ──────────────────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] =
    useState<Professional[]>(professionals);
  const [filteredEvents, setFilteredEvents] =
    useState<EventWorkshop[]>(events);
  const [filteredChallenges, setFilteredChallenges] =
    useState<Challenge[]>(challenges);
  const [filteredRestaurants, setFilteredRestaurants] =
    useState<Restaurant[]>(restaurants);
  const [filteredShops, setFilteredShops] = useState<Shop[]>(shops);
  const [filteredDigitalProducts, setFilteredDigitalProducts] =
    useState<DigitalProduct[]>(digitalProducts);
  const [filteredHolisticCenters, setFilteredHolisticCenters] =
    useState<HolisticCenter[]>(holisticCenters);

  // ─── Refs ───────────────────────────────────────────────────────
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const professionalsScrollRef = useRef<HTMLDivElement>(null);
  const challengesScrollRef = useRef<HTMLDivElement>(null);
  const restaurantsScrollRef = useRef<HTMLDivElement>(null);
  const shopsScrollRef = useRef<HTMLDivElement>(null);
  const holisticCentersScrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll when filtered data changes
  useEffect(() => {
    if (
      professionalsScrollRef.current &&
      filteredProfessionals.length > 0
    ) {
      professionalsScrollRef.current.scrollTo({ left: 0, behavior: "auto" });
    }
    if (eventsScrollRef.current && filteredEvents.length > 0) {
      eventsScrollRef.current.scrollTo({ left: 0, behavior: "auto" });
    }
    if (challengesScrollRef.current && filteredChallenges.length > 0) {
      challengesScrollRef.current.scrollTo({ left: 0, behavior: "auto" });
    }
  }, [
    filteredProfessionals.length,
    filteredEvents.length,
    filteredChallenges.length,
  ]);

  // ─── Category Filter ───────────────────────────────────────────

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        const newCategories = prev.filter((id) => id !== categoryId);
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
    const categoryToWellnessAreas: Record<string, string[]> = {
      professionals: ["Salud mental"],
      spirituality: ["Espiritualidad"],
      "physical-activity": ["Actividad física"],
      social: ["Social"],
      nutrition: ["Alimentación"],
    };

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
            professional.wellness_areas.some((area) =>
              mappedAreas.includes(area)
            )
          );
        });
      });
    }
    setFilteredProfessionals(filteredProfs);

    if (professionalsScrollRef.current) {
      professionalsScrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }

    // Filtrar eventos
    let filteredEvts = [...events];
    if (categoryIds.length > 0) {
      filteredEvts = filteredEvts.filter((event) => {
        return categoryIds.some((categoryId) => {
          const eventCategory = categoryToEventCategory[categoryId];
          return eventCategory && event.category === eventCategory;
        });
      });
    }
    setFilteredEvents(filteredEvts);

    if (eventsScrollRef.current) {
      eventsScrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }

    // Filtrar programas por wellness_areas del programa o del profesional
    let filteredProds = [...digitalProducts];
    if (categoryIds.length > 0) {
      filteredProds = filteredProds.filter((product) => {
        let productWellnessAreas: string[] = [];

        if (
          product.wellness_areas &&
          Array.isArray(product.wellness_areas) &&
          product.wellness_areas.length > 0
        ) {
          productWellnessAreas = product.wellness_areas;
        } else {
          const professional = product.professional_applications;
          if (
            professional &&
            professional.wellness_areas &&
            Array.isArray(professional.wellness_areas)
          ) {
            productWellnessAreas = professional.wellness_areas;
          }
        }

        if (productWellnessAreas.length === 0) {
          return false;
        }

        return categoryIds.some((categoryId) => {
          const mappedAreas = categoryToWellnessAreas[categoryId] || [];
          if (mappedAreas.length === 0) return false;
          return productWellnessAreas.some((area) =>
            mappedAreas.includes(area)
          );
        });
      });
    } else {
      filteredProds = [...digitalProducts];
    }
    setFilteredDigitalProducts(filteredProds);

    // Filtrar retos por wellness_areas
    let filteredChals = [...challenges];
    if (categoryIds.length > 0) {
      filteredChals = filteredChals.filter((challenge) => {
        const challengeAreas = Array.isArray(challenge.wellness_areas)
          ? challenge.wellness_areas
          : [];
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

    if (challengesScrollRef.current) {
      challengesScrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }

    // Filtrar restaurantes
    if (categoryIds.length > 0) {
      if (categoryIds.includes("nutrition")) {
        setFilteredRestaurants([...restaurants]);
      } else {
        setFilteredRestaurants([]);
      }
    } else {
      setFilteredRestaurants([...restaurants]);
    }

    if (restaurantsScrollRef.current) {
      restaurantsScrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }

    // Comercios - mostrar en todas las categorías
    setFilteredShops([...shops]);

    if (shopsScrollRef.current) {
      shopsScrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  // ─── Scroll Handlers ───────────────────────────────────────────

  const scrollEventsLeft = () => {
    eventsScrollRef.current?.scrollBy({ left: -416, behavior: "smooth" });
  };
  const scrollEventsRight = () => {
    eventsScrollRef.current?.scrollBy({ left: 416, behavior: "smooth" });
  };
  const scrollChallengesLeft = () => {
    challengesScrollRef.current?.scrollBy({ left: -416, behavior: "smooth" });
  };
  const scrollChallengesRight = () => {
    challengesScrollRef.current?.scrollBy({ left: 416, behavior: "smooth" });
  };
  const scrollProfessionalsLeft = () => {
    professionalsScrollRef.current?.scrollBy({
      left: -416,
      behavior: "smooth",
    });
  };
  const scrollProfessionalsRight = () => {
    professionalsScrollRef.current?.scrollBy({
      left: 416,
      behavior: "smooth",
    });
  };
  const scrollRestaurantsLeft = () => {
    restaurantsScrollRef.current?.scrollBy({ left: -416, behavior: "smooth" });
  };
  const scrollRestaurantsRight = () => {
    restaurantsScrollRef.current?.scrollBy({ left: 416, behavior: "smooth" });
  };
  const scrollShopsLeft = () => {
    shopsScrollRef.current?.scrollBy({ left: -416, behavior: "smooth" });
  };
  const scrollShopsRight = () => {
    shopsScrollRef.current?.scrollBy({ left: 416, behavior: "smooth" });
  };

  // ─── JSX ────────────────────────────────────────────────────────

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
              Selecciona una categoría para filtrar profesionales, programas,
              eventos, restaurantes y comercios
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
                  {category.id === "professionals" && (
                    <Brain
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`}
                    />
                  )}
                  {category.id === "spirituality" && (
                    <Sparkles
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`}
                    />
                  )}
                  {category.id === "physical-activity" && (
                    <Activity
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`}
                    />
                  )}
                  {category.id === "social" && (
                    <Users
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`}
                    />
                  )}
                  {category.id === "nutrition" && (
                    <Apple
                      className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`}
                    />
                  )}
                </div>
                <span
                  className={`text-sm sm:text-base font-medium text-center ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`}
                >
                  {category.name}
                </span>
                <span
                  className={`text-[10px] sm:text-xs mt-1 text-center leading-tight ${selectedCategories.includes(category.id) ? "text-primary/80" : "text-white/80"}`}
                >
                  {category.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-12 relative">
          {/* Mensaje cuando no hay datos */}
          {filteredDigitalProducts.length === 0 &&
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
                  Por el momento no hay profesionales, retos, eventos,
                  programas, restaurantes, comercios o centros holísticos
                  disponibles. Vuelve más tarde para descubrir nuevo contenido.
                </p>
              </div>
            )}

          {/* Sección de Programas */}
          {filteredDigitalProducts.length > 0 && (
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <Link
                  href={exploreHref('programs')}
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
                showFavoriteButton={!!userId}
              />
            </div>
          )}

          {/* Sección de Retos */}
          {filteredChallenges.length > 0 && (
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <Link
                  href="/explore/challenges"
                  className="group flex items-center gap-2"
                >
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
                  style={{
                    scrollPaddingLeft: "1rem",
                    scrollPaddingRight: "1rem",
                  }}
                >
                  {filteredChallenges.map((challenge) => (
                    <div key={challenge.id} className="shrink-0 w-[280px] sm:w-[320px] h-[420px]">
                      <ChallengeCard
                        challenge={challenge as any}
                        userId={userId || undefined}
                        showFavoriteButton={!!userId}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sección de Eventos y Talleres */}
          {filteredEvents.length > 0 && (
            <div className="relative z-0">
              <div className="flex items-center justify-between mb-6">
                <Link
                  href={exploreHref('events')}
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
                    style={{
                      scrollPaddingLeft: "1rem",
                      scrollPaddingRight: "1rem",
                    }}
                  >
                    {filteredEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={mapApiEventToCardEvent(event)}
                        showFavoriteButton={!!userId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sección de Expertos */}
          {filteredProfessionals.length > 0 && (
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <Link
                  href={exploreHref('professionals')}
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
                    style={{
                      scrollPaddingLeft: "1rem",
                      scrollPaddingRight: "1rem",
                    }}
                  >
                    {filteredProfessionals.map((professional) => (
                      <div
                        key={professional.id}
                        className="shrink-0 w-[280px] sm:w-[320px]"
                        onClick={() => {}}
                      >
                        <ProfessionalCard
                          userId={userId || undefined}
                          showFavoriteButton={!!userId}
                          professional={{
                            id: professional.id,
                            slug:
                              professional.slug ||
                              `${professional.first_name.toLowerCase()}-${professional.last_name.toLowerCase()}`,
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
                              presencial: professional.services.find(
                                (s) => s.presencialCost
                              )?.presencialCost
                                ? parseInt(
                                    professional.services.find(
                                      (s) => s.presencialCost
                                    )?.presencialCost || "0"
                                  )
                                : 0,
                              online: professional.services.find(
                                (s) => s.onlineCost
                              )?.onlineCost
                                ? parseInt(
                                    professional.services.find(
                                      (s) => s.onlineCost
                                    )?.onlineCost || "0"
                                  )
                                : 0,
                            },
                            serviceType: (() => {
                              if (professional.modality) {
                                switch (professional.modality) {
                                  case "presencial":
                                    return "in-person";
                                  case "online":
                                    return "online";
                                  case "both":
                                    return "both";
                                  default:
                                    return "in-person";
                                }
                              }
                              const hasPresencial = professional.services.some(
                                (s) =>
                                  s.presencialCost &&
                                  s.presencialCost !== "" &&
                                  s.presencialCost !== "0" &&
                                  Number(s.presencialCost) > 0
                              );
                              const hasOnline = professional.services.some(
                                (s) =>
                                  s.onlineCost &&
                                  s.onlineCost !== "" &&
                                  s.onlineCost !== "0" &&
                                  Number(s.onlineCost) > 0
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
                            imagePosition:
                              professional.imagePosition || "center center",
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

          {/* Sección de Restaurantes */}
          {filteredRestaurants.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <Link
                  href={exploreHref('restaurants')}
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
                        showFavoriteButton={!!userId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sección de Comercios */}
          {filteredShops.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <Link
                  href={exploreHref('shops')}
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
                        showFavoriteButton={!!userId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sección de Centros Holísticos */}
          {filteredHolisticCenters.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <Link
                  href={exploreHref('holistic-centers')}
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
                      holisticCentersScrollRef.current?.scrollBy({
                        left: -400,
                        behavior: "smooth",
                      });
                    }}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => {
                      holisticCentersScrollRef.current?.scrollBy({
                        left: 400,
                        behavior: "smooth",
                      });
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>

                  <div
                    ref={holisticCentersScrollRef}
                    className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-12"
                    style={{
                      scrollPaddingLeft: "1rem",
                      scrollPaddingRight: "1rem",
                    }}
                  >
                    {filteredHolisticCenters.map((center) => (
                      <HolisticCenterCard
                        key={center.id}
                        center={mapApiCenterToCardCenter(center)}
                        showFavoriteButton={!!userId}
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
}
