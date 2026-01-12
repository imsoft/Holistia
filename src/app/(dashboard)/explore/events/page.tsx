"use client";

import React, { useState, useEffect } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Calendar, MapPin, Users, Brain, Sparkles, Activity, Apple } from "lucide-react";
import Link from "next/link";
import { Filters } from "@/components/ui/filters";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventWorkshop } from "@/types/event";
import { formatEventDate, formatEventTime } from "@/utils/date-utils";
import Image from "next/image";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { Skeleton } from "@/components/ui/skeleton";

const categories = [
  {
    id: "salud_mental",
    name: "Salud mental",
    icon: Brain,
    description: "Expertos en salud mental",
  },
  {
    id: "espiritualidad",
    name: "Espiritualidad",
    icon: Sparkles,
    description: "Guías espirituales y terapeutas holísticos",
  },
  {
    id: "salud_fisica",
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
    id: "alimentacion",
    name: "Alimentación",
    icon: Apple,
    description: "Nutriólogos y especialistas en alimentación",
  },
];

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

export default function EventsPage() {
  useUserStoreInit();
  const userId = useUserId();
  const [events, setEvents] = useState<EventWorkshop[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventWorkshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [eventFilters, setEventFilters] = useState({
    category: "all",
    price: "all",
    date: "all"
  });
  const supabase = createClient();

  useEffect(() => {
    const getEvents = async () => {
      try {
        setLoading(true);

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
          .order("event_date", { ascending: true });

        if (eventsError) {
          console.error("Error fetching events:", eventsError);
        } else {
          setEvents(eventsData || []);
          setFilteredEvents(eventsData || []);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    getEvents();
  }, [supabase]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        const newCategories = prev.filter(id => id !== categoryId);
        applyEventFilters(newCategories);
        return newCategories;
      } else {
        const newCategories = [...prev, categoryId];
        applyEventFilters(newCategories);
        return newCategories;
      }
    });
  };

  const applyEventFilters = (categoryIds?: string[]) => {
    let filtered = [...events];
    const categoriesToUse = categoryIds !== undefined ? categoryIds : selectedCategories;

    // Filtrar por categorías de bienestar seleccionadas
    if (categoriesToUse.length > 0) {
      filtered = filtered.filter(event => {
        return categoriesToUse.some(categoryId => {
          // Mapear categorías de bienestar a categorías de eventos
          const categoryMap: Record<string, string> = {
            "salud_mental": "salud_mental",
            "espiritualidad": "espiritualidad",
            "salud_fisica": "salud_fisica",
            "social": "social",
            "alimentacion": "alimentacion",
          };
          const eventCategory = categoryMap[categoryId];
          return eventCategory && event.category === eventCategory;
        });
      });
    }

    // Filtrar por categoría del sidebar (si no hay categorías de bienestar seleccionadas)
    if (categoriesToUse.length === 0 && eventFilters.category !== "all") {
      filtered = filtered.filter(event => event.category === eventFilters.category);
    }

    if (eventFilters.price !== "all") {
      filtered = filtered.filter(event => {
        if (eventFilters.price === "free") return event.is_free;
        if (eventFilters.price === "paid") return !event.is_free;
        return true;
      });
    }

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

  useEffect(() => {
    applyEventFilters();
  }, [eventFilters, events, selectedCategories]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Eventos y Talleres
          </h1>
          <p className="text-muted-foreground">
            Descubre eventos y talleres que transformarán tu bienestar
          </p>
        </div>

        {/* Categories */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              Filtrar por categorías
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Selecciona una categoría para filtrar eventos
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
                  {category.id === "salud_mental" && <Brain className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`} />}
                  {category.id === "espiritualidad" && <Sparkles className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`} />}
                  {category.id === "salud_fisica" && <Activity className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`} />}
                  {category.id === "social" && <Users className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`} />}
                  {category.id === "alimentacion" && <Apple className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`} />}
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
              onFilterChange={() => {}} 
              eventFilters={eventFilters}
              onEventFilterChange={(filterType, value) => setEventFilters(prev => ({ ...prev, [filterType]: value }))}
            />
          </aside>

          {/* Main content with horizontal scroll */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={`event-skeleton-${i}`} className="h-[480px] flex flex-col">
                    <Skeleton className="w-full h-64 shrink-0 rounded-t-lg" />
                    <CardHeader className="pb-1.5 px-4 pt-3 shrink-0">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <div className="flex gap-1.5 mt-1">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pt-0 pb-3 flex flex-col grow min-h-0">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-5/6 mb-4" />
                      <Skeleton className="h-9 w-full mt-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/patient/${userId}/explore/event/${generateEventSlug(event.name, event.id!)}`}
                  >
                      <Card className="group hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-[480px] flex flex-col">
                        <div className="relative w-full h-48 shrink-0">
                          <div className="absolute inset-0 overflow-hidden">
                            <Image
                              src={(event.gallery_images && event.gallery_images.length > 0 && event.gallery_images[0]) || event.image_url || ""}
                              alt={event.name}
                              fill
                              className="object-cover"
                              unoptimized={((event.gallery_images && event.gallery_images.length > 0 && event.gallery_images[0]) || event.image_url || "").includes('supabase.co') || ((event.gallery_images && event.gallery_images.length > 0 && event.gallery_images[0]) || event.image_url || "").includes('supabase.in')}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/logos/holistia-black.png";
                              }}
                              style={{
                                objectPosition: event.image_position || "center center"
                              }}
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
                            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
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
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>Cupo: {event.max_capacity} personas</span>
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

