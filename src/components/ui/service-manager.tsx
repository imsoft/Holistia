"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";
import { Service, ServiceFormData } from "@/types/service";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { toTitleCase } from "@/lib/text-utils";
import { MapModal } from "@/components/ui/map-modal";

interface ServiceManagerProps {
  professionalId: string;
  userId: string;
}

export function ServiceManager({ professionalId, userId }: ServiceManagerProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedServiceForMap, setSelectedServiceForMap] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: "",
    description: "",
    type: "session",
    modality: "both",
    duration: 60,
    cost: undefined,
  });
  const [programDuration, setProgramDuration] = useState({
    value: 1,
    unit: "semanas" as "meses" | "semanas" | "dias" | "horas"
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es demasiado grande (máximo 5MB)');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, image_url: undefined });
  };

  const uploadServiceImage = async (serviceId: string): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `service-${serviceId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/services/${fileName}`;

      // Subir imagen a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('professional-services')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('professional-services')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir la imagen');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("El nombre del servicio es requerido");
      return;
    }

    if (!formData.cost) {
      toast.error("El costo del servicio es requerido");
      return;
    }

    try {
      const serviceData = {
        professional_id: professionalId,
        user_id: userId,
        name: toTitleCase(formData.name.trim()),
        description: formData.description.trim(),
        type: formData.type,
        modality: formData.modality,
        duration: formData.type === "session" ? formData.duration : 60, // Valor por defecto para programas
        program_duration: formData.type === "program" ? {
          value: programDuration.value,
          unit: programDuration.unit
        } : null,
        cost: formData.cost,
        address: formData.address?.trim() || null, // Guardar como null si está vacío
        image_url: formData.image_url || null,
        isactive: true,
      };

      if (editingService) {
        // Si hay una nueva imagen, subirla primero
        if (imageFile) {
          const imageUrl = await uploadServiceImage(editingService.id!);
          if (imageUrl) {
            serviceData.image_url = imageUrl;
          }
        }

        // Actualizar servicio existente
        const { error } = await supabase
          .from("professional_services")
          .update(serviceData)
          .eq("id", editingService.id);

        if (error) throw error;
        toast.success("Servicio actualizado exitosamente");
      } else {
        // Crear nuevo servicio y obtener el ID
        const { data: newService, error: insertError } = await supabase
          .from("professional_services")
          .insert(serviceData)
          .select()
          .single();

        if (insertError) throw insertError;

        // Si hay imagen, subirla y actualizar el servicio
        if (imageFile && newService) {
          const imageUrl = await uploadServiceImage(newService.id);
          if (imageUrl) {
            const { error: updateError } = await supabase
              .from("professional_services")
              .update({ image_url: imageUrl })
              .eq("id", newService.id);

            if (updateError) throw updateError;
          }
        }

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
    // Manejar tanto el formato nuevo (number) como el antiguo (jsonb)
    let serviceCost: number | undefined;
    if (typeof service.cost === 'number') {
      serviceCost = service.cost;
    } else if (service.cost && typeof service.cost === 'object') {
      // Usar presencial como prioridad, luego online
      serviceCost = service.cost.presencial || service.cost.online;
    }
    
    setFormData({
      name: service.name,
      description: service.description,
      type: service.type,
      modality: service.modality,
      duration: service.duration,
      cost: serviceCost,
      address: service.address || "",
      image_url: service.image_url,
    });

    // Cargar imagen existente si hay
    if (service.image_url) {
      setImagePreview(service.image_url);
    }

    // Si es un programa, intentar extraer la duración del programa
    if (service.type === "program") {
      // Por ahora, establecer valores por defecto para programas
      // En el futuro se puede extraer de metadata o campos adicionales
      setProgramDuration({
        value: 1,
        unit: "semanas"
      });
    }
    
    setIsDialogOpen(true);
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "session",
      modality: "both",
      duration: 60,
      cost: undefined,
      address: "",
      image_url: undefined,
    });
    setProgramDuration({
      value: 1,
      unit: "semanas"
    });
    setImageFile(null);
    setImagePreview(null);
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
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Servicio *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Consulta de Psicología"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <RichTextEditor
                  content={formData.description || ""}
                  onChange={(content) =>
                    setFormData({ ...formData, description: content })
                  }
                  placeholder="Describe qué incluye este servicio..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modality">Modalidad *</Label>
                <Select
                  value={formData.modality}
                  onValueChange={(value: "presencial" | "online" | "both") =>
                    setFormData({ ...formData, modality: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Solo Presencial</SelectItem>
                    <SelectItem value="online">Solo En Línea</SelectItem>
                    <SelectItem value="both">Presencial y En Línea</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "session" ? (
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
              ) : (
                <div className="space-y-2">
                  <Label>Duración del Programa *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={programDuration.value}
                      onChange={(e) =>
                        setProgramDuration({ ...programDuration, value: parseInt(e.target.value) || 1 })
                      }
                      placeholder="1"
                      min="1"
                      className="flex-1"
                      required
                    />
                    <Select
                      value={programDuration.unit}
                      onValueChange={(value: "meses" | "semanas" | "dias" | "horas") =>
                        setProgramDuration({ ...programDuration, unit: value })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horas">Horas</SelectItem>
                        <SelectItem value="dias">Días</SelectItem>
                        <SelectItem value="semanas">Semanas</SelectItem>
                        <SelectItem value="meses">Meses</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Servicio *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "session" | "program") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session">Sesión Individual</SelectItem>
                    <SelectItem value="program">Programa/Paquete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Costo del Servicio (MXN)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cost: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  placeholder="800"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección del Servicio (Opcional)</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Ej: Consultorio 205, Torre Médica, Av. Reforma 123"
                />
                <p className="text-sm text-muted-foreground">
                  Si no especificas una dirección, se usará la dirección de tu perfil profesional
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceImage">Imagen del Servicio (Opcional)</Label>
                <div className="space-y-2">
                  {imagePreview ? (
                    <div className="relative h-48 w-full rounded-lg overflow-hidden">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 z-10"
                        onClick={handleRemoveImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="serviceImage"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">Click para subir</span> o arrastra una imagen
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG hasta 5MB</p>
                        </div>
                        <input
                          id="serviceImage"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageSelect}
                        />
                      </label>
                    </div>
                  )}
                </div>
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
        <Card className="p-4">
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
