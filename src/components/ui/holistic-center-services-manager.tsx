"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Upload, X, Users, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  service_type: "individual" | "group";
  max_capacity: number | null;
  is_active: boolean;
  images?: ServiceImage[];
}

interface ServiceImage {
  id: string;
  image_url: string;
  image_order: number;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  service_type: "individual" | "group";
  max_capacity: string;
  is_active: boolean;
}

interface HolisticCenterServicesManagerProps {
  centerId: string;
  centerName: string;
}

export function HolisticCenterServicesManager({
  centerId,
  centerName,
}: HolisticCenterServicesManagerProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    service_type: "individual",
    max_capacity: "",
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchServices();
  }, [centerId]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data: servicesData, error: servicesError } = await supabase
        .from("holistic_center_services")
        .select("*")
        .eq("center_id", centerId)
        .order("created_at", { ascending: false });

      if (servicesError) throw servicesError;

      // Fetch images for each service
      const servicesWithImages = await Promise.all(
        (servicesData || []).map(async (service) => {
          const { data: imagesData } = await supabase
            .from("holistic_center_service_images")
            .select("*")
            .eq("service_id", service.id)
            .order("image_order");

          return {
            ...service,
            images: imagesData || [],
          };
        })
      );

      setServices(servicesWithImages);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Error al cargar los servicios");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || "",
        price: service.price?.toString() || "",
        service_type: service.service_type,
        max_capacity: service.max_capacity?.toString() || "",
        is_active: service.is_active,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        service_type: "individual",
        max_capacity: "",
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (formData.service_type === "group" && (!formData.max_capacity || parseInt(formData.max_capacity) <= 0)) {
      toast.error("Los servicios grupales requieren una capacidad máxima mayor a 0");
      return;
    }

    try {
      setSaving(true);

      const serviceData = {
        center_id: centerId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        service_type: formData.service_type,
        max_capacity: formData.service_type === "group" && formData.max_capacity
          ? parseInt(formData.max_capacity)
          : null,
        is_active: formData.is_active,
      };

      if (editingService) {
        const { error } = await supabase
          .from("holistic_center_services")
          .update(serviceData)
          .eq("id", editingService.id);

        if (error) throw error;
        toast.success("Servicio actualizado exitosamente");
      } else {
        const { error } = await supabase
          .from("holistic_center_services")
          .insert(serviceData);

        if (error) throw error;
        toast.success("Servicio creado exitosamente");
      }

      setIsFormOpen(false);
      fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Error al guardar el servicio");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("¿Estás seguro de eliminar este servicio?")) return;

    try {
      const { error } = await supabase
        .from("holistic_center_services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;
      toast.success("Servicio eliminado");
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Error al eliminar el servicio");
    }
  };

  const handleImageUpload = async (serviceId: string, file: File, imageOrder: number) => {
    try {
      setUploadingImages(true);

      const fileExt = file.name.split(".").pop();
      const service = services.find(s => s.id === serviceId);
      const serviceName = service?.name.toLowerCase().replace(/\s+/g, "-") || "service";
      const filePath = `${centerId}/services/${serviceName}/image-${imageOrder}.${fileExt}`;

      // Subir al storage
      const { error: uploadError } = await supabase.storage
        .from("holistic-centers")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from("holistic-centers")
        .getPublicUrl(filePath);

      // Guardar en BD (upsert por si ya existe)
      const { error: dbError } = await supabase
        .from("holistic_center_service_images")
        .upsert({
          service_id: serviceId,
          image_url: urlData.publicUrl,
          image_order: imageOrder,
        }, {
          onConflict: "service_id,image_order",
        });

      if (dbError) throw dbError;

      toast.success("Imagen subida exitosamente");
      fetchServices();
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!confirm("¿Eliminar esta imagen?")) return;

    try {
      // Eliminar del storage
      const filePath = imageUrl.split("/holistic-centers/")[1];
      await supabase.storage.from("holistic-centers").remove([filePath]);

      // Eliminar de BD
      const { error } = await supabase
        .from("holistic_center_service_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;
      toast.success("Imagen eliminada");
      fetchServices();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Error al eliminar la imagen");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Servicios del Centro</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los servicios que ofrece el centro
          </p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Servicio
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : services.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            No hay servicios registrados aún
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={service.service_type === "group" ? "default" : "secondary"}>
                        {service.service_type === "group" ? (
                          <><Users className="w-3 h-3 mr-1" /> Grupal</>
                        ) : (
                          <><User className="w-3 h-3 mr-1" /> Individual</>
                        )}
                      </Badge>
                      {service.service_type === "group" && service.max_capacity && (
                        <Badge variant="outline">
                          Capacidad: {service.max_capacity}
                        </Badge>
                      )}
                      {service.price && (
                        <Badge variant="outline">
                          ${service.price.toFixed(2)}
                        </Badge>
                      )}
                      <Badge variant={service.is_active ? "default" : "secondary"}>
                        {service.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenForm(service)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {service.description && (
                  <div 
                    className="text-sm text-muted-foreground prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: service.description }}
                  />
                )}

                {/* Images Section */}
                <div>
                  <Label className="text-sm font-medium">Imágenes (máx. 4)</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[0, 1, 2, 3].map((order) => {
                      const image = service.images?.find((img) => img.image_order === order);
                      return (
                        <div key={order} className="relative aspect-square border-2 border-dashed rounded-lg overflow-hidden">
                          {image ? (
                            <>
                              <Image
                                src={image.image_url}
                                alt={`${service.name} - imagen ${order + 1}`}
                                fill
                                className="object-cover"
                              />
                              <button
                                onClick={() => handleDeleteImage(image.id, image.image_url)}
                                className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <label className="flex items-center justify-center w-full h-full cursor-pointer hover:bg-muted/50">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(service.id, file, order);
                                }}
                                disabled={uploadingImages}
                                className="hidden"
                              />
                              <Upload className="w-6 h-6 text-muted-foreground" />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Editar Servicio" : "Nuevo Servicio"}
            </DialogTitle>
            <DialogDescription>
              {editingService ? "Modifica la información del servicio" : "Agrega un nuevo servicio al centro"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Servicio *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Yoga Terapéutico"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el servicio..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_type">Tipo de Servicio</Label>
                <select
                  id="service_type"
                  value={formData.service_type}
                  onChange={(e) => setFormData({
                    ...formData,
                    service_type: e.target.value as "individual" | "group",
                    max_capacity: e.target.value === "individual" ? "" : formData.max_capacity
                  })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="individual">Individual</option>
                  <option value="group">Grupal</option>
                </select>
              </div>
            </div>

            {formData.service_type === "group" && (
              <div className="space-y-2">
                <Label htmlFor="max_capacity">Capacidad Máxima *</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  min="1"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                  placeholder="Ej: 15"
                  required={formData.service_type === "group"}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">Servicio activo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingService ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
