"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  Navigation,
} from "lucide-react";
import { Service } from "@/types/service";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { MapModal } from "@/components/ui/map-modal";

interface ServiceManagerProps {
  professionalId: string;
  userId: string;
  isAdminContext?: boolean;
}

export function ServiceManager({ professionalId, userId, isAdminContext = false }: ServiceManagerProps) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedServiceForMap, setSelectedServiceForMap] = useState<Service | null>(null);

  const supabase = createClient();
  
  // Determinar rutas según el contexto
  const getServicePath = (action: 'new' | 'edit', serviceId?: string) => {
    if (isAdminContext) {
      return action === 'new' 
        ? `/admin/professionals/${professionalId}/services/new`
        : `/admin/professionals/${professionalId}/services/${serviceId}/edit`;
    }
    return action === 'new'
      ? `/services/new`
      : `/services/${serviceId}/edit`;
  };
  
  const getRedirectPath = () => {
    if (isAdminContext) {
      return `/admin/professionals/${professionalId}`;
    }
    return `/services`;
  };

  const fetchServices = useCallback(async () => {
    try {
      console.log("🔍 ServiceManager: Buscando servicios para professional_id:", professionalId);
      const { data, error } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching services:", error);
        throw error;
      }
      
      console.log("✅ ServiceManager: Servicios encontrados:", data?.length || 0, data);
      setServices(data || []);
    } catch (error) {
      console.error("❌ Error fetching services:", error);
      toast.error("Error al cargar los servicios");
    } finally {
      setLoading(false);
    }
  }, [professionalId, supabase]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Recargar servicios cuando se crea/edita un servicio o cuando se vuelve a la página
  useEffect(() => {
    const handleServiceCreated = () => {
      fetchServices();
    };

    const handleFocus = () => {
      fetchServices();
    };

    window.addEventListener('service-created', handleServiceCreated);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('service-created', handleServiceCreated);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchServices]);

  const handleEdit = (service: Service) => {
    router.push(getServicePath('edit', service.id));
  };

  const handleDelete = (serviceId: string) => {
    setServiceToDelete(serviceId);
    setDeleteConfirmOpen(true);
  };

  const handleOpenMap = (service: Service) => {
    setSelectedServiceForMap(service);
    setMapModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      const { error } = await supabase
        .from("professional_services")
        .delete()
        .eq("id", serviceToDelete);

      if (error) throw error;
      toast.success("Servicio eliminado exitosamente");
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Error al eliminar el servicio");
    } finally {
      setServiceToDelete(null);
    }
  };

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("professional_services")
        .update({ isactive: !isActive })
        .eq("id", serviceId);

      if (error) throw error;
      toast.success(`Servicio ${!isActive ? "activado" : "desactivado"}`);
      fetchServices();
    } catch (error) {
      console.error("Error updating service status:", error);
      toast.error("Error al actualizar el estado del servicio");
    }
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

  const getModalityLabel = (modality: string) => {
    switch (modality) {
      case "presencial":
        return "Presencial";
      case "online":
        return "En línea";
      case "both":
        return "Presencial y en línea";
      default:
        return modality;
    }
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
        <Button onClick={() => router.push(getServicePath('new'))}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Servicio
        </Button>
      </div>

      {services.length === 0 ? (
        <Card className="p-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes servicios</h3>
            <p className="text-muted-foreground text-center mb-4">
              Agrega tu primer servicio para que los pacientes puedan reservar citas contigo
            </p>
            <Button onClick={() => router.push(getServicePath('new'))}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Servicio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {services.map((service) => (
            <Card key={service.id} className={!service.isactive ? "opacity-60" : ""}>
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                {/* Imagen del servicio */}
                <div className="relative h-48 md:h-full overflow-hidden rounded-l-lg">
                  <Image
                    src={service.image_url || "/logos/holistia-black.png"}
                    alt={service.name}
                    fill
                    className={service.image_url ? 'object-cover' : 'object-contain p-8 bg-muted'}
                  />
                </div>
                
                {/* Contenido del servicio */}
                <div>
                  <CardHeader className="pb-4 pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {getTypeIcon(service.type)}
                          {service.name}
                          {!service.isactive && (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            {getModalityIcon(service.modality)}
                            <span>{getModalityLabel(service.modality)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {service.type === "session"
                                ? `${service.duration} min`
                                : service.program_duration
                                  ? `${service.program_duration.value} ${service.program_duration.unit}`
                                  : "Duración no especificada"
                              }
                            </span>
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
                          checked={service.isactive}
                          onCheckedChange={() =>
                            toggleServiceStatus(service.id!, service.isactive)
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
                  <CardContent className="p-4">
                    {service.description && (
                      <div 
                        className="text-muted-foreground mb-4 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: service.description }}
                      />
                    )}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="w-4 h-4" />
                        <span>Costo: ${typeof service.cost === 'number' ? service.cost : (service.cost?.presencial || service.cost?.online || 0)}</span>
                      </div>
                      {service.address && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate flex-1">{service.address}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenMap(service)}
                            className="ml-2 h-6 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Navigation className="w-3 h-3 mr-1" />
                            Ver mapa
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de confirmación para eliminar */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar Servicio"
        description="¿Estás seguro de que quieres eliminar este servicio? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        variant="destructive"
      />

      {/* Modal del mapa */}
      {selectedServiceForMap && (
        <MapModal
          open={mapModalOpen}
          onOpenChange={setMapModalOpen}
          address={selectedServiceForMap.address!}
          serviceName={selectedServiceForMap.name}
        />
      )}
    </div>
  );
}
