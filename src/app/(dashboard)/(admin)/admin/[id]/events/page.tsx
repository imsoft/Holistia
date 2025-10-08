"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { EventWorkshop, Professional } from "@/types/event";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Edit,
  Trash2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EventForm } from "@/components/ui/event-form";

const EventsAdminPage = () => {
  const params = useParams();
  const adminId = params.id as string;
  const [events, setEvents] = useState<EventWorkshop[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWorkshop | null>(null);

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

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este evento?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("events_workshops")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
      toast.success("Evento eliminado exitosamente");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Error al eliminar el evento");
    }
  };

  const handleToggleStatus = async (eventId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("events_workshops")
        .update({ is_active: !isActive })
        .eq("id", eventId);

      if (error) throw error;
      toast.success(`Evento ${!isActive ? "activado" : "desactivado"}`);
      fetchEvents();
    } catch (error) {
      console.error("Error updating event status:", error);
      toast.error("Error al actualizar el estado del evento");
    }
  };

  const handleEditEvent = (event: EventWorkshop) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEvent(null);
  };

  const handleFormSuccess = () => {
    fetchEvents();
    handleFormClose();
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

  const getProfessionalName = (professionalId?: string) => {
    if (!professionalId) return "Sin asignar";
    const professional = professionals.find(p => p.id === professionalId);
    return professional ? `${professional.first_name} ${professional.last_name}` : "Profesional no encontrado";
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
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEvent(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? "Editar Evento" : "Crear Nuevo Evento"}
                </DialogTitle>
                <DialogDescription>
                  {editingEvent 
                    ? "Modifica la información del evento" 
                    : "Agrega un nuevo evento o taller a la plataforma"
                  }
                </DialogDescription>
              </DialogHeader>
              <EventForm
                event={editingEvent}
                professionals={professionals}
                onSuccess={handleFormSuccess}
                onCancel={handleFormClose}
              />
            </DialogContent>
          </Dialog>
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
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay eventos</h3>
              <p className="text-muted-foreground text-center mb-4">
                {events.length === 0 
                  ? "Aún no hay eventos creados en la plataforma."
                  : "No se encontraron eventos que coincidan con los filtros aplicados."
                }
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Evento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Card key={event.id} className={`py-6 ${!event.is_active ? "opacity-60" : ""}`}>
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
                  <div className="text-sm text-muted-foreground">
                    <strong>Profesional:</strong> {getProfessionalName(event.professional_id)}
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEvent(event)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(event.id!, event.is_active)}
                    >
                      {event.is_active ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsAdminPage;
