"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Brain, Sparkles, Activity, Users, Apple, X } from "lucide-react";
import { Filters } from "@/components/ui/filters";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import GradientText from "@/components/ui/gradient-text";

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
}

const categories = [
  {
    id: "professionals",
    name: "Salud mental",
    icon: Brain,
    description: "Profesionales de salud mental",
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

const HomeUserPage = () => {
  const params = useParams();
  const userId = params.id as string;
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<
    Professional[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const supabase = createClient();

  // Obtener profesionales aprobados desde la base de datos
  useEffect(() => {
    const getProfessionals = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("professional_applications")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching professionals:", error);
          return;
        }

        setProfessionals(data || []);
        setFilteredProfessionals(data || []);
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
      // Si la categoría ya está seleccionada, la deseleccionamos
      if (prev.includes(categoryId)) {
        const newCategories: string[] = [];
        applyFilters(newCategories);
        return newCategories;
      } else {
        // Solo permitir una categoría seleccionada a la vez
        const newCategories = [categoryId];
        applyFilters(newCategories);
        return newCategories;
      }
    });
  };

  const applyFilters = (categoryIds: string[]) => {
    let filtered = [...professionals];

    // Si no hay categorías seleccionadas, mostrar todos
    if (categoryIds.length === 0) {
      setFilteredProfessionals(filtered);
      return;
    }

    // Filtrar por categorías seleccionadas
    filtered = filtered.filter((professional) => {
      return categoryIds.some((categoryId) => {
        // Mapear categorías a áreas de bienestar
        const categoryMap: Record<string, string[]> = {
          professionals: ["Salud mental"],
          spirituality: ["Espiritualidad"],
          "physical-activity": ["Actividad física"],
          social: ["Social"],
          nutrition: ["Alimentación"],
        };

        const mappedAreas = categoryMap[categoryId] || [];

        // Si es 'professionals', mostrar todos los profesionales de salud mental
        if (categoryId === "professionals") {
          return true; // Todos los profesionales en la tabla son de salud mental
        }

        // Para otras categorías, verificar si el profesional tiene esas áreas de bienestar
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
    console.log("Filtros aplicados:", filters);

    let filtered = [...professionals];

    // Aplicar filtros de categorías si están seleccionadas
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

          if (categoryId === "professionals") {
            return true;
          }

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

    // Filtrar por especialidad (specialty)
    if (
      filters.specialty &&
      filters.specialty.length > 0 &&
      !filters.specialty.includes("all")
    ) {
      filtered = filtered.filter((professional) =>
        professional.specializations.some((spec) => {
          // Mapear los valores de filtro a las especializaciones reales
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

    // Filtrar por modalidad (service-type)
    if (
      filters["service-type"] &&
      filters["service-type"].length > 0 &&
      !filters["service-type"].includes("any")
    ) {
      filtered = filtered.filter((professional) => {
        const hasPresencial = professional.services.some(
          (s) => s.presencialCost && s.presencialCost !== ""
        );
        const hasOnline = professional.services.some(
          (s) => s.onlineCost && s.onlineCost !== ""
        );

        return filters["service-type"].some((type) => {
          if (type === "presencial") return hasPresencial;
          if (type === "online") return hasOnline;
          if (type === "ambos") return hasPresencial && hasOnline;
          return false;
        });
      });
    }

    // Filtrar por ubicación
    if (
      filters.location &&
      filters.location.length > 0 &&
      !filters.location.includes("any")
    ) {
      filtered = filtered.filter((professional) => {
        return filters.location.some((loc) => {
          const cityLower = professional.city.toLowerCase();
          const stateLower = professional.state.toLowerCase();

          // Mapear valores de filtro a ubicaciones reales
          const locationMap: Record<string, string[]> = {
            cdmx: [
              "ciudad de méxico",
              "mexico city",
              "cdmx",
              "distrito federal",
            ],
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

    // Filtrar por rango de precios
    if (
      filters.price &&
      filters.price.length > 0 &&
      !filters.price.includes("any")
    ) {
      filtered = filtered.filter((professional) => {
        return filters.price.some((priceRange) => {
          const minPrice = professional.services.reduce((min, service) => {
            const presencialPrice =
              parseInt(service.presencialCost) || Infinity;
            const onlinePrice = parseInt(service.onlineCost) || Infinity;
            return Math.min(min, presencialPrice, onlinePrice);
          }, Infinity);

          if (priceRange === "budget") return minPrice < 1500;
          if (priceRange === "mid-range")
            return minPrice >= 1500 && minPrice <= 2000;
          if (priceRange === "premium") return minPrice > 2000;
          return false;
        });
      });
    }

    // Filtrar por categorías de bienestar
    if (
      filters.category &&
      filters.category.length > 0 &&
      !filters.category.includes("all")
    ) {
      filtered = filtered.filter((professional) => {
        // Mapear categorías de filtro a áreas de bienestar
        const categoryMap: Record<string, string[]> = {
          professionals: ["Salud mental"], // Todos los profesionales son de salud mental por defecto
          centers: [], // Para centros (futuro)
          events: [], // Para eventos (futuro)
          challenges: [], // Para retos (futuro)
          restaurants: ["Alimentación"],
          "food-market": ["Alimentación"],
        };

        return filters.category.some((category) => {
          const mappedAreas = categoryMap[category] || [];

          // Si es 'professionals', mostrar todos los profesionales de salud mental
          if (category === "professionals") {
            return true; // Todos los profesionales en la tabla son de salud mental
          }

          // Para otras categorías, verificar si el profesional tiene esas áreas de bienestar
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

    // Filtrar por disponibilidad (availability) - por ahora solo mostrar todos si no hay filtro específico
    if (
      filters.availability &&
      filters.availability.length > 0 &&
      !filters.availability.includes("any")
    ) {
      // Por ahora, si hay filtro de disponibilidad, mantenemos todos los profesionales
      // En el futuro se puede implementar lógica más compleja basada en citas disponibles
      filtered = filtered.filter(() => true);
    }

    setFilteredProfessionals(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-lg">
          <div className="px-6 py-6 sm:py-12 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
                Profesionales de Salud
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg/8 text-pretty text-muted-foreground">
                Encuentra el profesional adecuado para tu bienestar mental y
                emocional.
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Filtrar por categorías
            </h3>
            <p className="text-sm text-muted-foreground">
              Selecciona una categoría para filtrar profesionales
            </p>
          </div>
          <div className="flex gap-4 justify-center overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => handleCategoryToggle(category.id)}
                className={`group flex flex-col items-center p-4 rounded-xl border transition-all duration-200 min-w-[140px] flex-shrink-0 ${
                  selectedCategories.includes(category.id)
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-primary text-primary-foreground border-primary/20 hover:border-primary hover:shadow-md"
                }`}
              >
                <div
                  className={`mb-2 transition-transform duration-200 ${
                    selectedCategories.includes(category.id)
                      ? "scale-110"
                      : "group-hover:scale-110"
                  }`}
                >
                  <category.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium transition-colors duration-200 text-center text-primary-foreground">
                  {category.name}
                </span>
                <span className="text-xs mt-1 transition-colors duration-200 text-center leading-tight text-primary-foreground/80">
                  {category.description}
                </span>
              </Button>
            ))}
          </div>

          {/* Mostrar categorías seleccionadas */}
          {selectedCategories.length > 0 && (
            <div className="mt-4 text-center">
              <div className="inline-flex flex-wrap gap-2 justify-center">
                {selectedCategories.map((categoryId) => {
                  const category = categories.find((c) => c.id === categoryId);
                  return (
                    <span
                      key={categoryId}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm"
                    >
                      {category && <category.icon className="h-3 w-3" />}
                      {category?.name}
                      <button
                        onClick={() => handleCategoryToggle(categoryId)}
                        className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
          {/* Sidebar with filters */}
          <aside className="lg:col-span-1">
            <Filters onFilterChange={handleFilterChange} />
          </aside>

          {/* Main content */}
          <div className="lg:col-span-2 xl:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cargando profesionales...
                  </p>
                </div>
              </div>
            ) : filteredProfessionals.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No se encontraron profesionales
                </h3>
                <p className="text-muted-foreground">
                  {professionals.length === 0
                    ? "Aún no hay profesionales aprobados en la plataforma."
                    : "Intenta ajustar los filtros para ver más resultados."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProfessionals.map((professional) => (
                  <ProfessionalCard
                    key={professional.id}
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
                        presencial: professional.services.find(
                          (s) => s.presencialCost
                        )?.presencialCost
                          ? parseInt(
                              professional.services.find(
                                (s) => s.presencialCost
                              )?.presencialCost || "0"
                            )
                          : 0,
                        online: professional.services.find((s) => s.onlineCost)
                          ?.onlineCost
                          ? parseInt(
                              professional.services.find((s) => s.onlineCost)
                                ?.onlineCost || "0"
                            )
                          : 0,
                      },
                      serviceType: (() => {
                        const hasPresencial = professional.services.some(
                          (s) => s.presencialCost && s.presencialCost !== ""
                        );
                        const hasOnline = professional.services.some(
                          (s) => s.onlineCost && s.onlineCost !== ""
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
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomeUserPage;
