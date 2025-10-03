"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Monitor,
  MapPin,
  Calendar,
  Package,
} from "lucide-react";
import { Service, ServiceFormData } from "@/types/service";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { toTitleCase } from "@/lib/text-utils";

interface ServiceManagerProps {
  professionalId: string;
  userId: string;
}

export function ServiceManager({ professionalId, userId }: ServiceManagerProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    type: "session",
    modality: "both",
    duration: 60,
    presencialCost: undefined,
    onlineCost: undefined,
  });

  const supabase = createClient();

  const fetchServices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Error al cargar los servicios");
    } finally {
      setLoading(false);
    }
  }, [professionalId, supabase]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("El nombre del servicio es requerido");
      return;
    }

    if (!formData.presencialCost && !formData.onlineCost) {
      toast.error("Debe especificar al menos un costo");
      return;
    }

    try {
      const serviceData = {
        professional_id: professionalId,
        user_id: userId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        modality: formData.modality,
        duration: formData.duration,
        cost: {
          presencial: formData.presencialCost,
          online: formData.onlineCost,
        },
        isActive: true,
      };

      if (editingService) {
        // Actualizar servicio existente
        const { error } = await supabase
          .from("professional_services")
          .update(serviceData)
          .eq("id", editingService.id);

        if (error) throw error;
        toast.success("Servicio actualizado exitosamente");
      } else {
        // Crear nuevo servicio
        const { error } = await supabase
          .from("professional_services")
          .insert(serviceData);

        if (error) throw error;
        toast.success("Servicio creado exitosamente");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Error al guardar el servicio");
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      type: service.type,
      modality: service.modality,
      duration: service.duration,
      presencialCost: service.cost.presencial,
      onlineCost: service.cost.online,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este servicio?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("professional_services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;
      toast.success("Servicio eliminado exitosamente");
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Error al eliminar el servicio");
    }
  };

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("professional_services")
        .update({ isActive: !isActive })
        .eq("id", serviceId);

      if (error) throw error;
      toast.success(`Servicio ${!isActive ? "activado" : "desactivado"}`);
      fetchServices();
    } catch (error) {
      console.error("Error updating service status:", error);
      toast.error("Error al actualizar el estado del servicio");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "session",
      modality: "both",
      duration: 60,
      presencialCost: undefined,
      onlineCost: undefined,
    });
    setEditingService(null);
  };

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case "presencial":
        return <MapPin className="w-4 h-4" />;
      case "online":
        return <Monitor className="w-4 h-4" />;
      case "both":
        return (
          <div className="flex gap-1">
            <MapPin className="w-4 h-4" />
            <Monitor className="w-4 h-4" />
          </div>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "program" ? (
      <Package className="w-4 h-4" />
    ) : (
      <Calendar className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mis Servicios</h2>
          <p className="text-muted-foreground">
            Gestiona los servicios que ofreces a tus pacientes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Servicio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Editar Servicio" : "Nuevo Servicio"}
              </DialogTitle>
              <DialogDescription>
                {editingService
                  ? "Modifica la información de tu servicio"
                  : "Agrega un nuevo servicio para tus pacientes"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Servicio *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: toTitleCase(e.target.value) })
                    }
                    placeholder="Ej: Consulta de Psicología"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Servicio *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "session" | "program") =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">Sesión Individual</SelectItem>
                      <SelectItem value="program">Programa/Paquete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe qué incluye este servicio..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modality">Modalidad *</Label>
                  <Select
                    value={formData.modality}
                    onValueChange={(value: "presencial" | "online" | "both") =>
                      setFormData({ ...formData, modality: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Solo Presencial</SelectItem>
                      <SelectItem value="online">Solo En Línea</SelectItem>
                      <SelectItem value="both">Presencial y En Línea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                    }
                    placeholder="60"
                    min="15"
                    max="480"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.modality === "presencial" || formData.modality === "both") && (
                  <div className="space-y-2">
                    <Label htmlFor="presencialCost">Costo Presencial (MXN)</Label>
                    <Input
                      id="presencialCost"
                      type="number"
                      value={formData.presencialCost || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          presencialCost: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="800"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
                {(formData.modality === "online" || formData.modality === "both") && (
                  <div className="space-y-2">
                    <Label htmlFor="onlineCost">Costo En Línea (MXN)</Label>
                    <Input
                      id="onlineCost"
                      type="number"
                      value={formData.onlineCost || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          onlineCost: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="600"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingService ? "Actualizar" : "Crear"} Servicio
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes servicios</h3>
            <p className="text-muted-foreground text-center mb-4">
              Agrega tu primer servicio para que los pacientes puedan reservar citas contigo
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Servicio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id} className={!service.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {getTypeIcon(service.type)}
                      {service.name}
                      {!service.isActive && (
                        <Badge variant="secondary">Inactivo</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {getModalityIcon(service.modality)}
                        <span className="capitalize">{service.modality}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getTypeIcon(service.type)}
                        <span className="capitalize">
                          {service.type === "session" ? "Sesión" : "Programa"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={service.isActive}
                      onCheckedChange={() =>
                        toggleServiceStatus(service.id!, service.isActive)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {service.description && (
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                )}
                <div className="flex gap-4">
                  {service.cost.presencial && (
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="w-4 h-4" />
                      <span>Presencial: ${service.cost.presencial}</span>
                    </div>
                  )}
                  {service.cost.online && (
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="w-4 h-4" />
                      <span>Online: ${service.cost.online}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
