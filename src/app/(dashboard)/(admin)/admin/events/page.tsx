"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatCard } from "@/components/ui/admin-stat-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { EventWorkshop, Professional } from "@/types/event";
import { createClient } from "@/utils/supabase/client";
import { formatPrice } from "@/lib/price-utils";
import { toast } from "sonner";
import { formatEventDate, formatEventTime } from "@/utils/date-utils";
import Image from "next/image";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Edit,
  Trash2,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  UserCheck
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const EventsAdminPage = () => {
  useUserStoreInit();
  const router = useRouter();
  const adminId = useUserId();
  const [events, setEvents] = useState<EventWorkshop[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const supabase = createClient();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("events_workshops")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Error al cargar los eventos");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchProfessionals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("professional_applications")
        .select("id, first_name, last_name, profession")
        .eq("status", "approved")
        .order("first_name", { ascending: true });

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      console.error("Error fetching professionals:", error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEvents();
    fetchProfessionals();
  }, [fetchEvents, fetchProfessionals]);

  const handleDeleteEvent = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      // Primero obtener el evento para saber qué imágenes eliminar
      const { data: event, error: fetchError } = await supabase
        .from("events_workshops")
        .select("gallery_images")
        .eq("id", eventToDelete)
        .single();

      if (fetchError) throw fetchError;

      // Eliminar imágenes del storage si existen
      if (event?.gallery_images && event.gallery_images.length > 0) {
        for (const imageUrl of event.gallery_images) {
          try {
            // Extraer el path de la imagen desde la URL pública
            const urlParts = imageUrl.split('/event-gallery/');
            if (urlParts.length > 1) {
              const imagePath = urlParts[1];
              
              const { error: storageError } = await supabase.storage
                .from('event-gallery')
                .remove([imagePath]);

              if (storageError) {
                console.error('Error deleting image from storage:', storageError);
              }
            }
          } catch (imgError) {
            console.error('Error processing image deletion:', imgError);
          }
        }
      }

      // Eliminar el evento de la base de datos
      const { error } = await supabase
        .from("events_workshops")
        .delete()
        .eq("id", eventToDelete);

      if (error) throw error;
      toast.success("Evento e imágenes eliminados exitosamente");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Error al eliminar el evento");
    } finally {
      setEventToDelete(null);
    }
  };

  const handleToggleStatus = async (eventId: string, isActive: boolean) => {
    try {
      const targetEvent = events.find((evt) => evt.id === eventId);

      const { error } = await supabase
        .from("events_workshops")
        .update({ is_active: !isActive })
        .eq("id", eventId);

      if (error) throw error;

      if (isActive && targetEvent) {
        try {
          const { data: registrations, error: regError } = await supabase
            .from("event_registrations")
            .select("id, user_id")
            .eq("event_id", eventId)
            .eq("status", "confirmed");

          if (regError) {
            console.warn("Error fetching registrations for cancellation notification:", regError);
          } else if (registrations && registrations.length > 0) {
            const notificationsPayload = registrations
              .filter((reg): reg is { id: string; user_id: string } => Boolean(reg.user_id))
              .map((reg) => ({
                user_id: reg.user_id,
                type: "event_cancelled",
                title: "Evento cancelado",
                message: `El evento "${targetEvent.name}" ha sido cancelado.`,
                action_url: `/my-registrations?event=${eventId}`,
                metadata: {
                  event_id: eventId,
                  event_name: targetEvent.name,
                  event_registration_id: reg.id,
                  event_date: targetEvent.event_date,
                  event_time: targetEvent.event_time,
                  end_time: targetEvent.end_time,
                },
              }));

            if (notificationsPayload.length > 0) {
              await supabase.from("notifications").insert(notificationsPayload);
            }
          }
        } catch (notifyError) {
          console.warn("Error creating cancellation notifications:", notifyError);
        }
      }

      toast.success(`Evento ${!isActive ? "activado" : "desactivado"}`);
      fetchEvents();
    } catch (error) {
      console.error("Error updating event status:", error);
      toast.error("Error al actualizar el estado del evento");
    }
  };

  const handleEditEvent = (event: EventWorkshop) => {
    router.push(`/admin/events/${event.id}/edit`);
  };

  const [dateFilter, setDateFilter] = useState<string>("all");

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && event.is_active) ||
                         (statusFilter === "inactive" && !event.is_active);
    
    // Date filter logic
    let matchesDate = true;
    if (dateFilter !== "all") {
      const eventDate = new Date(event.event_date);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (dateFilter === "upcoming") {
        matchesDate = eventDate >= today;
      } else if (dateFilter === "past") {
        matchesDate = eventDate < today;
      } else if (dateFilter === "this_month") {
        matchesDate = eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
      } else if (dateFilter === "next_month") {
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        matchesDate = eventDate.getMonth() === nextMonth.getMonth() && eventDate.getFullYear() === nextMonth.getFullYear();
      }
    }
    
    return matchesSearch && matchesCategory && matchesStatus && matchesDate;
  });

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.is_active).length;
    const upcomingEvents = events.filter(e => new Date(e.event_date) >= today).length;
    
    const thisMonthEvents = events.filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate >= thisMonthStart && eventDate <= now;
    }).length;
    
    const lastMonthEvents = events.filter(e => {
      const eventDate = new Date(e.event_date);
      return eventDate >= lastMonthStart && eventDate <= lastMonthEnd;
    }).length;
    
    const freeEvents = events.filter(e => e.is_free).length;
    const paidEvents = totalEvents - freeEvents;
    
    // Calculate percentage changes
    const eventsChange = lastMonthEvents > 0 
      ? Math.round(((thisMonthEvents - lastMonthEvents) / lastMonthEvents) * 100)
      : thisMonthEvents > 0 ? 100 : 0;
    
    const activePercentage = totalEvents > 0 ? Math.round((activeEvents / totalEvents) * 100) : 0;
    const freePercentage = totalEvents > 0 ? Math.round((freeEvents / totalEvents) * 100) : 0;
    
    return {
      totalEvents,
      activeEvents,
      upcomingEvents,
      thisMonthEvents,
      lastMonthEvents,
      eventsChange,
      activePercentage,
      freeEvents,
      paidEvents,
      freePercentage
    };
  }, [events]);

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

  const getProfessionalName = (professionalId?: string) => {
    if (!professionalId) return "Sin asignar";
    const professional = professionals.find(p => p.id === professionalId);
    return professional ? `${professional.first_name} ${professional.last_name}` : "Profesional no encontrado";
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Eventos y Talleres</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gestiona los eventos y talleres de la plataforma
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
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Eventos y Talleres</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gestiona los eventos y talleres de la plataforma
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/admin/events/new`)}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Evento</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <AdminStatCard
            title="Total Eventos"
            value={stats.totalEvents.toString()}
            trend={{ value: `${stats.eventsChange >= 0 ? "+" : ""}${stats.eventsChange}%`, positive: stats.eventsChange >= 0 }}
            secondaryText="vs mes anterior"
            tertiaryText={`${stats.thisMonthEvents} este mes · ${stats.lastMonthEvents} mes anterior`}
          />
          <AdminStatCard
            title="Eventos Activos"
            value={stats.activeEvents.toString()}
            trend={{ value: `${stats.activePercentage}%`, positive: true }}
            tertiaryText={`De ${stats.totalEvents} eventos totales`}
          />
          <AdminStatCard
            title="Próximos Eventos"
            value={stats.upcomingEvents.toString()}
            tertiaryText="Eventos por realizarse"
          />
          <AdminStatCard
            title="Gratuitos"
            value={stats.freeEvents.toString()}
            trend={{ value: `${stats.freePercentage}%`, positive: true }}
            tertiaryText={`${stats.paidEvents} eventos de pago`}
          />
        </div>

        {/* Filters */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nombre o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fechas</SelectItem>
              <SelectItem value="upcoming">Próximos</SelectItem>
              <SelectItem value="past">Pasados</SelectItem>
              <SelectItem value="this_month">Este mes</SelectItem>
              <SelectItem value="next_month">Próximo mes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full">
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
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Card className="p-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay eventos</h3>
              <p className="text-muted-foreground text-center mb-4">
                {events.length === 0 
                  ? "Aún no hay eventos creados en la plataforma."
                  : "No se encontraron eventos que coincidan con los filtros aplicados."
                }
              </p>
              <Button onClick={() => router.push(`/admin/${adminId}/events/new`)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Card key={event.id} className={`${!event.is_active ? "opacity-60" : ""} overflow-hidden flex flex-col h-full`}>
                {/* Event Image */}
                {event.gallery_images && event.gallery_images.length > 0 && (
                  <div className="relative w-full h-48">
                    <Image
                      src={event.gallery_images[0]}
                      alt={event.name}
                      fill
                      className="object-cover"
                      style={{
                        objectFit: 'cover',
                        objectPosition: event.image_position || "center center"
                      }}
                      unoptimized={event.gallery_images[0].includes('supabase.co') || event.gallery_images[0].includes('supabase.in')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/logos/holistia-black.png";
                      }}
                    />
                  </div>
                )}
                <CardHeader className="pb-6 pt-8">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-3">{event.name}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary">
                          {getCategoryLabel(event.category)}
                        </Badge>
                        <Badge variant={event.is_free ? "default" : "outline"}>
                          {event.is_free ? "Gratuito" : formatPrice(event.price, "MXN")}
                        </Badge>
                        {!event.is_active && (
                          <Badge variant="destructive">Inactivo</Badge>
                        )}
                        {event.gallery_images && event.gallery_images.length > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            {event.gallery_images.length} imagen{event.gallery_images.length !== 1 ? 'es' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 pb-8">
                  <div className="space-y-4 flex-1">
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
                    <div className="text-sm text-muted-foreground">
                      <strong>Profesional:</strong> {getProfessionalName(event.professional_id)}
                    </div>
                    {event.description && (
                      <div 
                        className="text-sm text-muted-foreground line-clamp-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: event.description }}
                      />
                    )}
                  </div>

                  {/* Botones de acción con mejor espaciado */}
                  <div className="pt-4 border-t border-border/50 mt-auto">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => router.push(`/admin/${adminId}/events/${event.id}/registrations`)}
                        className="flex items-center justify-center gap-1 w-full"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span className="text-xs">Registrados</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                        className="flex items-center justify-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs">Editar</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(event.id!, event.is_active)}
                        className="flex items-center justify-center"
                      >
                        <span className="text-xs">
                          {event.is_active ? "Desactivar" : "Activar"}
                        </span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id!)}
                        className="flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline text-xs">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de confirmación para eliminar */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar Evento"
        description="¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDeleteEvent}
        variant="destructive"
      />
    </div>
  );
};

export default EventsAdminPage;
