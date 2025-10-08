"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { EventWorkshop } from "@/types/event";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Clock,
  Filter,
  CalendarDays,
  Image as ImageIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

const ProfessionalEventsPage = () => {
  const params = useParams();
  const professionalId = params.id as string;
  const [events, setEvents] = useState<EventWorkshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const supabase = createClient();

  useEffect(() => {
    fetchEvents();
  }, [professionalId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Obtener el ID del profesional desde la tabla professional_applications
      const { data: professionalData, error: profError } = await supabase
        .from("professional_applications")
        .select("id")
        .eq("user_id", professionalId)
        .eq("status", "approved")
        .single();

      if (profError || !professionalData) {
        console.error("Error fetching professional data:", profError);
        toast.error("Error al cargar los datos del profesional");
        return;
      }

      // Obtener eventos donde el profesional está asignado
      const { data, error } = await supabase
        .from("events_workshops")
        .select("*")
        .eq("professional_id", professionalData.id)
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Error al cargar los eventos");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && event.is_active) ||
                         (statusFilter === "inactive" && !event.is_active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Mis Eventos</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Eventos y talleres donde participas
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Mis Eventos</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Eventos y talleres donde participas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre o ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="espiritualidad">Espiritualidad</SelectItem>
                <SelectItem value="salud_mental">Salud Mental</SelectItem>
                <SelectItem value="salud_fisica">Salud Física</SelectItem>
                <SelectItem value="alimentacion">Alimentación</SelectItem>
                <SelectItem value="social">Social</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Card className="p-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarDays className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes eventos asignados</h3>
              <p className="text-muted-foreground text-center mb-4">
                {events.length === 0 
                  ? "Aún no tienes eventos asignados. Los administradores pueden asignarte a eventos y talleres."
                  : "No se encontraron eventos que coincidan con los filtros aplicados."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Card key={event.id} className={`${!event.is_active ? "opacity-60" : ""}`}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{event.name}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary">
                          {getCategoryLabel(event.category)}
                        </Badge>
                        <Badge variant={event.is_free ? "default" : "outline"}>
                          {event.is_free ? "Gratuito" : `$${event.price}`}
                        </Badge>
                        {!event.is_active && (
                          <Badge variant="destructive">Inactivo</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(event.event_date)} a las {formatTime(event.event_time)}</span>
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
                  
                  {/* Galería de imágenes */}
                  {event.gallery_images && event.gallery_images.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ImageIcon className="w-4 h-4" />
                        <span>Galería ({event.gallery_images.length} imágenes)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {event.gallery_images.slice(0, 2).map((image, index) => (
                          <div key={index} className="relative">
                            <Image
                              src={image}
                              alt={`Imagen ${index + 1}`}
                              width={100}
                              height={100}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalEventsPage;
