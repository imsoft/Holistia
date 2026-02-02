"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  const router = useRouter();
  const params = useParams();
  const adminId = params.id as string;

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);

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
        <Button onClick={() => router.push(`/admin/${adminId}/holistic-centers/${centerId}/services/new`)}>
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
                      onClick={() => router.push(`/admin/${adminId}/holistic-centers/${centerId}/services/${service.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
