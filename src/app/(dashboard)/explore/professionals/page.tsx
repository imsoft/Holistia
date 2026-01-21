"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Brain, Sparkles, Activity, Users, Apple, ArrowLeft } from "lucide-react";
import { Filters } from "@/components/ui/filters";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { createClient } from "@/utils/supabase/client";
import { determineProfessionalModality, transformServicesFromDB } from "@/utils/professional-utils";
import { sortProfessionalsByRanking, type ProfessionalRankingData } from "@/utils/professional-ranking";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

interface Professional {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profession: string;
  specializations: string[];
  experience: string;
  certifications: string[];
  wellness_areas: string[];
  services: Array<{
    name: string;
    description: string;
    presencialCost: string;
    onlineCost: string;
  }>;
  address: string;
  city: string;
  state: string;
  country: string;
  biography?: string;
  profile_photo?: string;
  gallery: string[];
  status: "pending" | "under_review" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  modality?: "presencial" | "online" | "both";
  imagePosition?: string;
  average_rating?: number;
  total_reviews?: number;
  admin_rating?: number;
}

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

export default function ProfessionalsPage() {
  useUserStoreInit();
  const router = useRouter();
  const userId = useUserId();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const supabase = createClient();

  // Verificar autenticación
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, [supabase]);

  useEffect(() => {
    const getProfessionals = async () => {
      try {
        setLoading(true);

        const { data: professionalsData, error } = await supabase
          .from("professional_applications")
          .select("*")
          .eq("status", "approved")
          .eq("is_active", true)
          .eq("registration_fee_paid", true)
          .gt("registration_fee_expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching professionals:", error);
          return;
        }

        // OPTIMIZACIÓN: Batch queries en lugar de N+1 queries individuales
        const professionalIds = (professionalsData || []).map(p => p.id);
        const userIds = (professionalsData || []).map(p => p.user_id).filter((id): id is string => !!id);
        
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
        const professionalsWithServices = (professionalsData || []).map((prof) => {
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

        // Usar algoritmo de ranking para ordenar profesionales
        const sortedProfessionals = sortProfessionalsByRanking(professionalsWithServices);

        setProfessionals(sortedProfessionals);
        setFilteredProfessionals(sortedProfessionals);
      } catch (error) {
        console.error("Error fetching professionals:", error);
      } finally {
        setLoading(false);
      }
    };

    getProfessionals();
  }, [supabase]);

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
    let filtered = [...professionals];

    if (categoryIds.length === 0) {
      setFilteredProfessionals(filtered);
      return;
    }

    filtered = filtered.filter((professional) => {
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

    setFilteredProfessionals(filtered);
  };

  const handleFilterChange = (filters: Record<string, string[]>) => {
    let filtered = [...professionals];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((professional) => {
        return selectedCategories.some((categoryId) => {
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

    if (filters.specialty && filters.specialty.length > 0 && !filters.specialty.includes("all")) {
      filtered = filtered.filter((professional) =>
        professional.specializations.some((spec) => {
          const specialtyMap: Record<string, string> = {
            cognitive: "Terapia Cognitivo-Conductual",
            psychiatric: "Medicina Psiquiátrica",
            child: "Psicología Infantil",
            sports: "Psicología del Deporte",
            couple: "Terapia de Pareja",
            neuropsychology: "Neuropsicología",
            anxiety: "Terapia de Ansiedad",
            depression: "Terapia de Depresión",
            family: "Terapia Familiar",
            ludic: "Terapia Lúdica",
          };

          return filters.specialty.some((filterValue) => {
            const mappedSpecialty = specialtyMap[filterValue];
            return mappedSpecialty ? spec.includes(mappedSpecialty) : false;
          });
        })
      );
    }

    if (filters["service-type"] && filters["service-type"].length > 0 && !filters["service-type"].includes("any")) {
      filtered = filtered.filter((professional) => {
        const hasPresencial = professional.services.some(
          (s) => s.presencialCost && s.presencialCost !== "" && parseInt(s.presencialCost) > 0
        );
        const hasOnline = professional.services.some(
          (s) => s.onlineCost && s.onlineCost !== "" && parseInt(s.onlineCost) > 0
        );

        return filters["service-type"].some((type) => {
          if (type === "presencial") return hasPresencial;
          if (type === "online") return hasOnline;
          if (type === "ambos") return hasPresencial && hasOnline;
          return false;
        });
      });
    }

    if (filters.location && filters.location.length > 0 && !filters.location.includes("any")) {
      filtered = filtered.filter((professional) => {
        return filters.location.some((loc) => {
          const cityLower = professional.city?.toLowerCase() || "";
          const stateLower = professional.state?.toLowerCase() || "";

          const locationMap: Record<string, string[]> = {
            cdmx: ["ciudad de méxico", "mexico city", "cdmx", "distrito federal"],
            guadalajara: ["guadalajara"],
            monterrey: ["monterrey"],
            puebla: ["puebla"],
            tijuana: ["tijuana"],
            cancun: ["cancún", "cancun"],
          };

          const mappedLocations = locationMap[loc] || [loc];
          return mappedLocations.some(
            (mappedLoc) =>
              cityLower.includes(mappedLoc.toLowerCase()) ||
              stateLower.includes(mappedLoc.toLowerCase())
          );
        });
      });
    }

    if (filters.price && filters.price.length > 0 && !filters.price.includes("any")) {
      filtered = filtered.filter((professional) => {
        return filters.price.some((priceRange) => {
          const minPrice = professional.services.reduce((min, service) => {
            const presencialPrice = parseInt(service.presencialCost) || 0;
            const onlinePrice = parseInt(service.onlineCost) || 0;
            const validPrices = [presencialPrice, onlinePrice].filter(price => price > 0);
            return validPrices.length > 0 ? Math.min(...validPrices) : Infinity;
          }, Infinity);

          if (priceRange === "budget") return minPrice < 1500;
          if (priceRange === "mid-range") return minPrice >= 1500 && minPrice <= 2000;
          if (priceRange === "premium") return minPrice > 2000;
          return false;
        });
      });
    }

    setFilteredProfessionals(filtered);
  };


  const renderProfessionalsContent = () => (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Expertos
          </h1>
          <p className="text-muted-foreground">
            Encuentra el profesional adecuado para tu bienestar mental y emocional
          </p>
        </div>

        {/* Categories */}
        <div className="mb-6 sm:mb-8">
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
                className={`group flex flex-col items-center p-3 sm:p-4 rounded-xl border transition-all duration-200 min-w-[120px] sm:min-w-[140px] flex-shrink-0 cursor-pointer ${
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

        <div className="lg:grid lg:grid-cols-3 lg:gap-x-8">
          {/* Sidebar with filters */}
          <aside className="lg:col-span-1 mb-6 lg:mb-0">
            <Filters 
              onFilterChange={handleFilterChange} 
              hideFilters={['category', 'location', 'eventFilters']}
            />
          </aside>

          {/* Main content with horizontal scroll */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={`professional-skeleton-${i}`} className="h-[480px] flex flex-col">
                    <Skeleton className="w-full h-64 shrink-0 rounded-t-lg" />
                    <CardContent className="px-4 pt-3 pb-4 flex flex-col grow min-h-0">
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
                ))}
              </div>
            ) : filteredProfessionals.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No se encontraron expertos
                </h3>
                <p className="text-muted-foreground">
                  {professionals.length === 0
                    ? "Aún no hay expertos aprobados en la plataforma."
                    : "Intenta ajustar los filtros para ver más resultados."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 justify-items-center">
                {filteredProfessionals.map((professional) => (
                  <div key={professional.id} className="w-full max-w-md">
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
                        }}
                      />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );

  // Si aún estamos verificando autenticación, mostrar loading
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar con navbar público
  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            {renderProfessionalsContent()}
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Si está autenticado, mostrar con layout normal (navbar del dashboard)
  return renderProfessionalsContent();
}

