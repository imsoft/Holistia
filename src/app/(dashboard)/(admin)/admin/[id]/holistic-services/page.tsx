"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import HolisticServiceImagesManager from "@/components/ui/holistic-service-images-manager";
import Image from "next/image";

interface HolisticService {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HolisticServiceImage {
  id: string;
  image_url: string;
  image_order: number;
}

interface FormData {
  name: string;
  description: string;
  is_active: boolean;
}

export default function AdminHolisticServices() {
  const [services, setServices] = useState<HolisticService[]>([]);
  const [serviceImages, setServiceImages] = useState<Record<string, HolisticServiceImage[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingService, setEditingService] = useState<HolisticService | null>(null);
  const [viewingService, setViewingService] = useState<HolisticService | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("holistic_services")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);

      // Cargar imágenes para todos los servicios
      if (data && data.length > 0) {
        const serviceIds = data.map(s => s.id);
        const { data: imagesData, error: imagesError } = await supabase
          .from("holistic_service_images")
          .select("*")
          .in("service_id", serviceIds)
          .order("image_order", { ascending: true });

        if (!imagesError && imagesData) {
          const imagesMap: Record<string, HolisticServiceImage[]> = {};
          imagesData.forEach(img => {
            if (!imagesMap[img.service_id]) {
              imagesMap[img.service_id] = [];
            }
            imagesMap[img.service_id].push(img);
          });
          setServiceImages(imagesMap);
        }
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Error al cargar los servicios");
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceImages = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from("holistic_service_images")
        .select("*")
        .eq("service_id", serviceId)
        .order("image_order", { ascending: true });

      if (!error && data) {
        setServiceImages(prev => ({
          ...prev,
          [serviceId]: data
        }));
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  const handleOpenForm = (service?: HolisticService) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        is_active: service.is_active,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        description: "",
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

  const saveService = async (): Promise<string | null> => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("El título y la descripción son requeridos");
      return null;
    }

    try {
      if (editingService) {
        const { error } = await supabase
          .from("holistic_services")
          .update({
            name: formData.name.trim(),
            description: formData.description.trim(),
            is_active: formData.is_active,
          })
          .eq("id", editingService.id);

        if (error) throw error;
        return editingService.id;
      } else {
        const { data: newService, error } = await supabase
          .from("holistic_services")
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim(),
            is_active: formData.is_active,
          })
          .select()
          .single();

        if (error) throw error;
        
        if (newService) {
          setEditingService(newService);
          setServiceImages(prev => ({
            ...prev,
            [newService.id]: []
          }));
          fetchServices();
          return newService.id;
        }
        return null;
      }
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Error al guardar el servicio");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const savedServiceId = await saveService();
    if (!savedServiceId) return;

    if (editingService) {
      toast.success("Servicio actualizado exitosamente");
      setIsFormOpen(false);
      fetchServices();
    } else {
      toast.success("Servicio creado exitosamente");
      // El diálogo permanece abierto para agregar imágenes
      fetchServices();
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      // Eliminar imágenes primero
      const { error: imagesError } = await supabase
        .from("holistic_service_images")
        .delete()
        .eq("service_id", deletingId);

      if (imagesError) {
        console.error("Error deleting images:", imagesError);
      }

      // Eliminar el servicio
      const { error } = await supabase
        .from("holistic_services")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      toast.success("Servicio eliminado exitosamente");
      setIsDeleteOpen(false);
      setDeletingId(null);
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Error al eliminar el servicio");
    }
  };

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getServiceImages = (serviceId: string) => {
    return serviceImages[serviceId] || [];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Servicios Holísticos</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona los servicios ofrecidos para empresas
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Servicio
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay servicios holísticos</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? "No se encontraron resultados" : "Comienza agregando un servicio"}
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Servicio
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => {
              const images = getServiceImages(service.id);
              const firstImage = images.length > 0 ? images[0].image_url : null;

              return (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  {firstImage && (
                    <div className="relative w-full h-48">
                      <Image
                        src={firstImage}
                        alt={service.name}
                        fill
                        className="object-cover rounded-t-lg"
                        unoptimized
                      />
                    </div>
                  )}
                  <CardHeader className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{service.name}</CardTitle>
                        <Badge variant={service.is_active ? "default" : "secondary"}>
                          {service.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 py-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {service.description}
                    </p>

                    {images.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ImageIcon className="w-3 h-3" />
                        <span>{images.length} imagen{images.length !== 1 ? 'es' : ''}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setViewingService(service);
                          setIsViewOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenForm(service)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeletingId(service.id);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Editar Servicio Holístico" : "Nuevo Servicio Holístico"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Modifica la información del servicio"
                : "Agrega un nuevo servicio para ofrecer a las empresas"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Título del Servicio <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Yoga Corporativo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el servicio y sus beneficios..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Imágenes del Servicio</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Agrega hasta 4 imágenes para mostrar el servicio (máximo 2MB por imagen)
              </p>
              <HolisticServiceImagesManager
                serviceId={editingService?.id || null}
                currentImages={editingService ? getServiceImages(editingService.id) : []}
                onImagesUpdate={async () => {
                  if (editingService) {
                    await fetchServiceImages(editingService.id);
                    fetchServices();
                  } else {
                    // Si no hay editingService, recargar todo para obtener el servicio guardado
                    await fetchServices();
                  }
                }}
                onSaveService={async () => {
                  const savedId = await saveService();
                  if (savedId) {
                    // Asegurar que el servicio se cargue en el estado
                    const { data: service } = await supabase
                      .from("holistic_services")
                      .select("*")
                      .eq("id", savedId)
                      .single();
                    if (service) {
                      setEditingService(service);
                      setServiceImages(prev => ({
                        ...prev,
                        [savedId]: []
                      }));
                    }
                  }
                  return savedId;
                }}
                maxImages={4}
                maxSizeMB={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">Servicio activo (visible en la landing page)</Label>
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

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingService?.name}</DialogTitle>
            <DialogDescription>Detalles del servicio holístico</DialogDescription>
          </DialogHeader>
          {viewingService && (
            <div className="space-y-6">
              <div>
                <Label className="text-muted-foreground">Estado</Label>
                <div className="mt-1">
                  <Badge variant={viewingService.is_active ? "default" : "secondary"}>
                    {viewingService.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Descripción</Label>
                <p className="mt-1 text-sm">{viewingService.description}</p>
              </div>

              {getServiceImages(viewingService.id).length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Imágenes</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {getServiceImages(viewingService.id).map((image) => (
                      <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden border">
                        <Image
                          src={image.image_url}
                          alt={`Imagen ${image.image_order + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Eliminar Servicio Holístico"
        description="¿Estás seguro de que quieres eliminar este servicio? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={handleDelete}
      />
    </div>
  );
}
