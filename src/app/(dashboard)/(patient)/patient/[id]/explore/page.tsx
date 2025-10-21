"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Brain, Sparkles, Activity, Users, Apple, X, Calendar, MapPin, Clock } from "lucide-react";
import Link from "next/link";
import { Filters } from "@/components/ui/filters";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventWorkshop } from "@/types/event";
import { formatEventDate, formatEventTime } from "@/utils/date-utils";
import { determineProfessionalModality, transformServicesFromDB } from "@/utils/professional-utils";
import { StableImage } from "@/components/ui/stable-image";

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
  modality?: "presencial" | "online" | "both"; // Modalidad calculada basada en servicios
  imagePosition?: string; // Posición de la imagen en la card
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
  const [events, setEvents] = useState<EventWorkshop[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventWorkshop[]>([]);
  const [eventFilters, setEventFilters] = useState({
    category: "all",
    price: "all",
    date: "all"
  });
  const supabase = createClient();

  // Obtener profesionales aprobados y eventos desde la base de datos
  useEffect(() => {
    const getProfessionals = async () => {
      try {
        setLoading(true);

        const { data: professionalsData, error } = await supabase
          .from("professional_applications")
          .select("*")
          .eq("status", "approved")
          .eq("is_active", true)
          .order("created_at", { ascending: false});

        if (error) {
          console.error("Error fetching professionals:", error);
          return;
        }

        // Obtener servicios para cada profesional
        const professionalsWithServices = await Promise.all(
          (professionalsData || []).map(async (prof) => {
            const { data: services } = await supabase
              .from("professional_services")
              .select("*")
              .eq("professional_id", prof.id)
              .eq("isactive", true);

            // Transformar servicios a la estructura esperada usando la función utilitaria
            const transformedServices = transformServicesFromDB(services || []);
            
            // Determinar la modalidad del profesional basándose en los servicios
            const professionalModality = determineProfessionalModality(transformedServices);

            return {
              ...prof,
              services: transformedServices.length > 0 ? transformedServices : prof.services || [],
              modality: professionalModality, // Agregar la modalidad calculada
              imagePosition: prof.image_position || "center center" // Agregar posición de imagen
            };
          })
        );

        setProfessionals(professionalsWithServices);
        setFilteredProfessionals(professionalsWithServices);

        // Obtener eventos activos
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
          .gte("event_date", new Date().toISOString().split('T')[0]) // Solo eventos futuros
          .order("event_date", { ascending: true });

        if (eventsError) {
          console.error("Error fetching events:", eventsError);
        } else {
          setEvents(eventsData || []);
          setFilteredEvents(eventsData || []);
        }
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

        // Verificar si el profesional tiene las áreas de bienestar correspondientes
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

    // Filtrar por ubicación
    if (
      filters.location &&
      filters.location.length > 0 &&
      !filters.location.includes("any")
    ) {
      filtered = filtered.filter((professional) => {
        return filters.location.some((loc) => {
          const cityLower = professional.city?.toLowerCase() || "";
          const stateLower = professional.state?.toLowerCase() || "";

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

  const applyEventFilters = () => {
    let filtered = [...events];

    // Filtrar por categoría
    if (eventFilters.category !== "all") {
      filtered = filtered.filter(event => event.category === eventFilters.category);
    }

    // Filtrar por precio
    if (eventFilters.price !== "all") {
      filtered = filtered.filter(event => {
        if (eventFilters.price === "free") return event.is_free;
        if (eventFilters.price === "paid") return !event.is_free;
        return true;
      });
    }

    // Filtrar por fecha
    if (eventFilters.date !== "all") {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      filtered = filtered.filter(event => {
        const eventDate = new Date(event.event_date);
        switch (eventFilters.date) {
          case "today":
            return eventDate.toDateString() === today.toDateString();
          case "tomorrow":
            return eventDate.toDateString() === tomorrow.toDateString();
          case "week":
            return eventDate >= today && eventDate <= nextWeek;
          case "month":
            return eventDate >= today && eventDate <= nextMonth;
          default:
            return true;
        }
      });
    }

    setFilteredEvents(filtered);
  };

  // Aplicar filtros cuando cambien
  useEffect(() => {
    applyEventFilters();
  }, [eventFilters, events]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCategoryLabel = (category: string) => {
    const categories = {
      espiritualidad: "Espiritualidad",
      salud_mental: "Salud Mental",
      salud_fisica: "Salud Física",
      alimentacion: "Alimentación",
      social: "Social"
    };
    return categories[category as keyof typeof categories] || category;
  };


  const generateEventSlug = (eventName: string, eventId: string) => {
    const slug = eventName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    return `${slug}--${eventId}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="rounded-lg">
          <div className="px-4 sm:px-6 py-6 sm:py-12 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-balance text-foreground">
                Profesionales de Salud
              </h2>
              <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg text-pretty text-muted-foreground">
                Encuentra el profesional adecuado para tu bienestar mental y emocional.
              </p>
            </div>
          </div>
        </div>


        {/* Categories - Para profesionales */}
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
            <Filters 
              onFilterChange={handleFilterChange} 
              eventFilters={eventFilters}
              onEventFilterChange={(filterType, value) => setEventFilters(prev => ({ ...prev, [filterType]: value }))}
            />
          </aside>

          {/* Main content */}
          <div className="lg:col-span-2 xl:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cargando contenido...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 sm:space-y-12">
                {/* Sección de Eventos */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Eventos y Talleres</h3>
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No hay eventos disponibles
                      </h3>
                      <p className="text-muted-foreground">
                        {events.length === 0 
                          ? "Próximamente habrá eventos y talleres disponibles."
                          : "No se encontraron eventos que coincidan con los filtros aplicados."
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredEvents.map((event) => (
                        <Link 
                          key={event.id} 
                          href={`/patient/${userId}/explore/event/${generateEventSlug(event.name, event.id!)}`}
                          className="block"
                        >
                          <Card className="hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                            {/* Imagen del evento - abarca toda la parte superior */}
                            {event.gallery_images && event.gallery_images.length > 0 && (
                              <StableImage
                                src={event.gallery_images[0]}
                                alt={event.name}
                                fill
                                className="w-full h-48"
                                objectFit="cover"
                                objectPosition={event.image_position || "center center"}
                                fallbackSrc="/logos/holistia-black.png"
                              />
                            )}
                            <CardHeader className="pb-3 sm:pb-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <CardTitle className="text-base sm:text-lg mb-2">{event.name}</CardTitle>
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="secondary">
                                      {getCategoryLabel(event.category)}
                                    </Badge>
                                    <Badge variant={event.is_free ? "default" : "outline"}>
                                      {event.is_free ? "Gratuito" : `$${event.price}`}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2 sm:space-y-3 flex-1 pb-4 sm:pb-6">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>{formatEventDate(event.event_date)} a las {formatEventTime(event.event_time)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate">{event.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span>Cupo: {event.max_capacity} personas</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{event.duration_hours} horas</span>
                              </div>
                              {event.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sección de Profesionales */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Profesionales de Salud</h3>
                  {filteredProfessionals.length === 0 ? (
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
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                        // Usar la modalidad calculada si está disponible, sino calcularla
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
                        
                        // Fallback: calcular basándose en los servicios
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
                    }}
                  />
                ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomeUserPage;
