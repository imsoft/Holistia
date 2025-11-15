"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Calendar, MapPin, Users, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Filters } from "@/components/ui/filters";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventWorkshop } from "@/types/event";
import { formatEventDate, formatEventTime } from "@/utils/date-utils";
import { StableImage } from "@/components/ui/stable-image";

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
  const params = useParams();
  const userId = params.id as string;
  const [events, setEvents] = useState<EventWorkshop[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventWorkshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilters, setEventFilters] = useState({
    category: "all",
    price: "all",
    date: "all"
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  const applyEventFilters = () => {
    let filtered = [...events];

    if (eventFilters.category !== "all") {
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
  }, [eventFilters, events]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Eventos y Talleres
          </h1>
          <p className="text-muted-foreground">
            Descubre eventos y talleres que transformarán tu bienestar
          </p>
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
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cargando eventos...
                  </p>
                </div>
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
              <div className="relative">
                {/* Scroll buttons */}
                <button
                  onClick={scrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-background transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Horizontal scroll container */}
                <div
                  ref={scrollContainerRef}
                  className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar"
                >
                  {filteredEvents.map((event) => (
                    <Link 
                      key={event.id} 
                      href={`/patient/${userId}/explore/event/${generateEventSlug(event.name, event.id!)}`}
                      className="flex-shrink-0 w-80"
                    >
                      <Card className="hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                        {event.gallery_images && event.gallery_images.length > 0 && (
                          <div className="relative w-full h-48">
                            <StableImage
                              src={event.gallery_images[0]}
                              alt={event.name}
                              fill
                              className="object-cover"
                              objectFit="cover"
                              objectPosition={event.image_position || "center center"}
                              fallbackSrc="/logos/holistia-black.png"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg mb-2">{event.name}</CardTitle>
                          <div className="flex flex-wrap gap-2 mb-3">
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
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

