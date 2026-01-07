"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { Service, ServiceFormData } from "@/types/service";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { toTitleCase } from "@/lib/text-utils";

interface ServiceFormProps {
  professionalId: string;
  userId: string;
  service?: Service | null;
  redirectPath: string;
}

export function ServiceForm({
  professionalId,
  userId,
  service,
  redirectPath,
}: ServiceFormProps) {
  const router = useRouter();
  const supabase = createClient();

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

  // Cargar datos del servicio si estamos editando
  useEffect(() => {
    if (service) {
      let serviceCost: number | undefined;
      if (typeof service.cost === 'number') {
        serviceCost = service.cost;
      } else if (service.cost && typeof service.cost === 'object') {
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

      if (service.image_url) {
        setImagePreview(service.image_url);
      }

      if (service.type === "program") {
        setProgramDuration({
          value: 1,
          unit: "semanas"
        });
      }
    }
  }, [service]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 5MB");
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
      const fileName = `${serviceId}-${Date.now()}.${fileExt}`;
      const filePath = `${professionalId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('professional-services')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

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
        duration: formData.type === "session" ? formData.duration : 60,
        program_duration: formData.type === "program" ? {
          value: programDuration.value,
          unit: programDuration.unit
        } : null,
        cost: formData.cost,
        address: formData.address?.trim() || null,
        image_url: formData.image_url || null,
        isactive: true,
      };

      if (service) {
        // Actualizar servicio existente
        if (imageFile) {
          const imageUrl = await uploadServiceImage(service.id!);
          if (imageUrl) {
            serviceData.image_url = imageUrl;
          }
        }

        const { error } = await supabase
          .from("professional_services")
          .update(serviceData)
          .eq("id", service.id);

        if (error) throw error;
        toast.success("Servicio actualizado exitosamente");
      } else {
        // Crear nuevo servicio
        const { data: newService, error: insertError } = await supabase
          .from("professional_services")
          .insert(serviceData)
          .select()
          .single();

        if (insertError) throw insertError;

        if (imageFile && newService) {
          const imageUrl = await uploadServiceImage(newService.id);
          if (imageUrl) {
            await supabase
              .from("professional_services")
              .update({ image_url: imageUrl })
              .eq("id", newService.id);
          }
        }

        toast.success("Servicio creado exitosamente");
      }

      router.push(redirectPath);
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Error al guardar el servicio");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-6">
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
              maxLength={500}
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
            <Label htmlFor="cost">Costo del Servicio (MXN) *</Label>
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
              required
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
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(redirectPath)}
          disabled={uploadingImage}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={uploadingImage}
        >
          {uploadingImage ? "Subiendo..." : service ? "Actualizar Servicio" : "Crear Servicio"}
        </Button>
      </div>
    </form>
  );
}
