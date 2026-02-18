"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  GripVertical,
} from "lucide-react";
import { Service } from "@/types/service";
import { createClient } from "@/utils/supabase/client";
import { formatPrice } from "@/lib/price-utils";
import { toast } from "sonner";
import { MapModal } from "@/components/ui/map-modal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type ServiceManagerStatusFilter = "all" | "active" | "inactive";
export type ServiceManagerTypeFilter = "all" | "session" | "program";
export type ServiceManagerSortBy = "recent" | "name" | "custom";

interface ServiceManagerProps {
  professionalId: string;
  userId: string;
  isAdminContext?: boolean;
  /** Filtro por búsqueda en nombre/descripción */
  searchTerm?: string;
  /** Filtro por estado: todos, activos, inactivos */
  statusFilter?: ServiceManagerStatusFilter;
  /** Filtro por tipo: todos, sesión, programa */
  typeFilter?: ServiceManagerTypeFilter;
  /** Orden: más recientes, por nombre, o personalizado */
  sortBy?: ServiceManagerSortBy;
}

// ---- Componente de tarjeta arrastrable ----

interface SortableServiceCardProps {
  service: Service;
  isDragMode: boolean;
  isAdminContext: boolean;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  onOpenMap: (service: Service) => void;
  getModalityIcon: (modality: string) => React.ReactNode;
  getModalityLabel: (modality: string) => string;
  getTypeIcon: (type: string) => React.ReactNode;
}

function SortableServiceCard({
  service,
  isDragMode,
  isAdminContext,
  onEdit,
  onDelete,
  onToggle,
  onOpenMap,
  getModalityIcon,
  getModalityLabel,
  getTypeIcon,
}: SortableServiceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={!service.isactive ? "opacity-60" : ""}>
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
          {/* Imagen del servicio */}
          <div className="relative h-48 md:h-full overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-t-none">
            <Image
              src={service.image_url || "/logos/holistia-black.png"}
              alt={service.name}
              fill
              className={service.image_url ? "object-cover" : "object-contain p-8 bg-muted"}
            />
          </div>

          {/* Contenido del servicio */}
          <div>
            <CardHeader className="pb-4 pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-2 flex-1">
                  {/* Handle de arrastre — solo visible en modo drag */}
                  {isDragMode && (
                    <div
                      {...attributes}
                      {...listeners}
                      className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
                      title="Arrastrar para reordenar"
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>
                  )}
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
                            : "Duración no especificada"}
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
                </div>
                {!isDragMode && (
                  <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                    <Switch
                      checked={service.isactive}
                      onCheckedChange={() =>
                        onToggle(service.id!, service.isactive)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(service)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(service.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            {!isDragMode && (
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
                    <span className="whitespace-nowrap">
                      Costo:{" "}
                      {formatPrice(
                        typeof service.cost === "number"
                          ? service.cost
                          : service.cost?.presencial ||
                              service.cost?.online ||
                              0,
                        "MXN"
                      )}
                    </span>
                  </div>
                  {service.address && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate flex-1">{service.address}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenMap(service)}
                        className="h-6 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 sm:ml-2"
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        Ver mapa
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ---- Componente principal ----

export function ServiceManager({
  professionalId,
  userId: _userId,
  isAdminContext = false,
  searchTerm = "",
  statusFilter = "all",
  typeFilter = "all",
  sortBy = "recent",
}: ServiceManagerProps) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedServiceForMap, setSelectedServiceForMap] = useState<Service | null>(null);
  const [isDragMode, setIsDragMode] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  // Lista local solo para drag-and-drop (se sincroniza al guardar)
  const [dragList, setDragList] = useState<Service[]>([]);

  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Rutas según contexto
  const getServicePath = (action: "new" | "edit", serviceId?: string) => {
    if (isAdminContext) {
      return action === "new"
        ? `/admin/professionals/${professionalId}/services/new`
        : `/admin/professionals/${professionalId}/services/${serviceId}/edit`;
    }
    return action === "new" ? `/services/new` : `/services/${serviceId}/edit`;
  };

  const fetchServices = useCallback(async () => {
    try {
      console.log("🔍 ServiceManager: Buscando servicios para professional_id:", professionalId);
      const { data, error } = await supabase
        .from("professional_services")
        .select("*")
        .eq("professional_id", professionalId)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching services:", error);
        throw error;
      }

      console.log("✅ ServiceManager: Servicios encontrados:", data?.length || 0);
      setServices(data || []);
    } catch {
      toast.error("Error al cargar los servicios");
    } finally {
      setLoading(false);
    }
  }, [professionalId, supabase]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    const handleServiceCreated = () => fetchServices();
    window.addEventListener("service-created", handleServiceCreated);
    return () => window.removeEventListener("service-created", handleServiceCreated);
  }, [fetchServices]);

  // Inicializar dragList cuando entro a modo arrastrar
  const handleEnterDragMode = () => {
    // En modo drag siempre mostramos la lista base sin filtros
    const sorted = [...services].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    setDragList(sorted);
    setIsDragMode(true);
  };

  const handleCancelDragMode = () => {
    setIsDragMode(false);
    setDragList([]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDragList((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      // Actualizar sort_order de cada servicio según su posición en dragList
      const updates = dragList.map((service, index) => ({
        id: service.id!,
        sort_order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("professional_services")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
        if (error) throw error;
      }

      toast.success("Orden guardado correctamente");
      setIsDragMode(false);
      setDragList([]);
      await fetchServices();
    } catch {
      toast.error("Error al guardar el orden");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleEdit = (service: Service) => {
    router.push(getServicePath("edit", service.id));
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
    } catch {
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
    } catch {
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

  const filteredServices = useMemo(() => {
    let list = [...services];
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          (s.description &&
            String(s.description)
              .toLowerCase()
              .replace(/<[^>]*>/g, "")
              .includes(term))
      );
    }
    if (statusFilter === "active") list = list.filter((s) => s.isactive);
    if (statusFilter === "inactive") list = list.filter((s) => !s.isactive);
    if (typeFilter === "session") list = list.filter((s) => s.type === "session");
    if (typeFilter === "program") list = list.filter((s) => s.type === "program");
    if (sortBy === "name")
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortBy === "recent")
      list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    // "custom" → ya viene ordenado por sort_order desde fetchServices
    return list;
  }, [services, searchTerm, statusFilter, typeFilter, sortBy]);

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

  const sharedCardProps = {
    isDragMode,
    isAdminContext,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggle: toggleServiceStatus,
    onOpenMap: handleOpenMap,
    getModalityIcon,
    getModalityLabel,
    getTypeIcon,
  };

  return (
    <div className="space-y-6">
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {isAdminContext && !isDragMode && (
          <Button onClick={() => router.push(getServicePath("new"))}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Servicio
          </Button>
        )}
        {!isAdminContext && !isDragMode && services.length > 1 && (
          <div /> // spacer
        )}

        {services.length > 1 && (
          <>
            {isDragMode ? (
              <div className="flex items-center gap-2 ml-auto">
                <p className="text-sm text-muted-foreground">
                  Arrastra los servicios para reordenarlos
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelDragMode}
                  disabled={isSavingOrder}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveOrder}
                  disabled={isSavingOrder}
                >
                  {isSavingOrder ? "Guardando..." : "Guardar orden"}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnterDragMode}
                className="ml-auto flex items-center gap-2"
              >
                <GripVertical className="w-4 h-4" />
                Reordenar servicios
              </Button>
            )}
          </>
        )}
      </div>

      {/* Lista vacía */}
      {filteredServices.length === 0 && !isDragMode ? (
        <Card className="p-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes servicios</h3>
            <p className="text-muted-foreground text-center mb-4">
              Agrega tu primer servicio para que los pacientes puedan reservar citas contigo
            </p>
            <Button onClick={() => router.push(getServicePath("new"))}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Servicio
            </Button>
          </CardContent>
        </Card>
      ) : isDragMode ? (
        /* Modo drag-and-drop: muestra toda la lista sin filtros */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={dragList.map((s) => s.id!)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-6">
              {dragList.map((service) => (
                <SortableServiceCard
                  key={service.id}
                  service={service}
                  {...sharedCardProps}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        /* Vista normal con filtros */
        <div className="grid gap-6">
          {filteredServices.map((service) => (
            <SortableServiceCard
              key={service.id}
              service={service}
              {...sharedCardProps}
            />
          ))}
        </div>
      )}

      {/* Dialogo confirmar eliminación */}
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
