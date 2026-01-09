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
        name: service.name || "",
        description: service.description || "", // Asegurar que siempre sea string
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

    // Validar tipo MIME
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Tipo de archivo no permitido. Solo se permiten imágenes: JPG, PNG, GIF, WEBP`);
      e.target.value = ''; // Limpiar el input
      return;
    }

    // Validar tamaño (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(`La imagen es demasiado grande (${sizeInMB}MB). El tamaño máximo permitido es 5MB`);
      e.target.value = ''; // Limpiar el input
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

  /**
   * Sanitiza el nombre de archivo removiendo caracteres especiales problemáticos
   * pero manteniendo caracteres válidos como acentos y espacios
   */
  const sanitizeFileName = (fileName: string): string => {
    // Obtener la extensión
    const lastDotIndex = fileName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
    
    // Reemplazar caracteres problemáticos pero mantener acentos y caracteres válidos
    // Remover solo caracteres que pueden causar problemas en URLs/paths
    let sanitized = nameWithoutExt
      .replace(/[<>:"|?*\x00-\x1F]/g, '') // Remover caracteres de control y caracteres problemáticos
      .replace(/\s+/g, '-') // Reemplazar espacios múltiples con un guión
      .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
    
    // Si después de sanitizar queda vacío, usar un nombre por defecto
    if (!sanitized || sanitized.trim().length === 0) {
      sanitized = 'imagen';
    }
    
    return `${sanitized}${extension}`;
  };

  const uploadServiceImage = async (serviceId: string): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);
      
      // Validar nuevamente antes de subir (por si acaso)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(imageFile.type)) {
        toast.error(`Tipo de archivo no permitido: ${imageFile.type}. Solo se permiten imágenes: JPG, PNG, GIF, WEBP`);
        return null;
      }

      const maxSize = 5 * 1024 * 1024;
      if (imageFile.size > maxSize) {
        const sizeInMB = (imageFile.size / (1024 * 1024)).toFixed(2);
        toast.error(`La imagen es demasiado grande (${sizeInMB}MB). El tamaño máximo permitido es 5MB`);
        return null;
      }
      
      // Obtener el user_id actual para usar en el path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Sanitizar el nombre del archivo original
      const sanitizedOriginalName = sanitizeFileName(imageFile.name);
      
      // Obtener la extensión del archivo original (después de sanitizar)
      const fileExt = sanitizedOriginalName.split('.').pop()?.toLowerCase() || 'jpg';
      
      // Crear nombre único: usar el nombre sanitizado + timestamp + extensión
      // Si el nombre original tenía caracteres especiales, se mantendrán los válidos
      const baseName = sanitizedOriginalName.substring(0, sanitizedOriginalName.lastIndexOf('.')) || 'imagen';
      const fileName = `${baseName}-${Date.now()}.${fileExt}`;
      
      // Usar userId como primer folder para cumplir con las políticas RLS
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('professional-services')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: imageFile.type, // Especificar el tipo MIME explícitamente
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        
        // Mensajes de error más específicos
        let errorMessage = 'Error desconocido al subir la imagen';
        if (uploadError.message.includes('File size')) {
          errorMessage = 'El archivo es demasiado grande. El tamaño máximo permitido es 5MB';
        } else if (uploadError.message.includes('Invalid file type')) {
          errorMessage = 'Tipo de archivo no válido. Solo se permiten imágenes: JPG, PNG, GIF, WEBP';
        } else if (uploadError.message.includes('permission') || uploadError.message.includes('policy')) {
          errorMessage = 'No tienes permiso para subir imágenes. Por favor, contacta al soporte';
        } else if (uploadError.message.includes('character') || uploadError.message.includes('name')) {
          errorMessage = 'El nombre del archivo contiene caracteres no permitidos. Por favor, renombra el archivo';
        } else {
          errorMessage = `Error al subir la imagen: ${uploadError.message}`;
        }
        
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const { data: urlData } = supabase.storage
        .from('professional-services')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      // No mostrar toast aquí si ya se mostró arriba
      if (!errorMessage.includes('Error al subir la imagen')) {
        toast.error(`Error al subir la imagen: ${errorMessage}`);
      }
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación exhaustiva de todos los campos antes de proceder
    const errors: string[] = [];

    // Validar nombre
    if (!formData.name || !formData.name.trim()) {
      errors.push("El nombre del servicio es requerido");
    } else if (formData.name.trim().length < 3) {
      errors.push("El nombre del servicio debe tener al menos 3 caracteres");
    } else if (formData.name.trim().length > 100) {
      errors.push("El nombre del servicio no puede exceder 100 caracteres");
    }

    // Validar descripción (opcional pero si se proporciona, debe tener límites)
    if (formData.description && formData.description.length > 2000) {
      errors.push("La descripción no puede exceder 2000 caracteres");
    }

    // Validar modalidad
    if (!formData.modality || !['presencial', 'online', 'both'].includes(formData.modality)) {
      errors.push("Debes seleccionar una modalidad válida");
    }

    // Validar tipo
    if (!formData.type || !['session', 'program'].includes(formData.type)) {
      errors.push("Debes seleccionar un tipo de servicio válido");
    }

    // Validar duración según el tipo
    if (formData.type === 'session') {
      if (!formData.duration || formData.duration < 15) {
        errors.push("La duración de la sesión debe ser de al menos 15 minutos");
      } else if (formData.duration > 480) {
        errors.push("La duración de la sesión no puede exceder 480 minutos (8 horas)");
      }
    } else if (formData.type === 'program') {
      if (!programDuration.value || programDuration.value < 1) {
        errors.push("La duración del programa debe ser de al menos 1 unidad");
      }
    }

    // Validar costo
    if (!formData.cost || formData.cost <= 0) {
      errors.push("El costo del servicio debe ser mayor a 0");
    } else if (formData.cost > 1000000) {
      errors.push("El costo del servicio no puede exceder $1,000,000 MXN");
    }

    // Validar imagen si se proporciona
    if (imageFile) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(imageFile.type)) {
        errors.push(`Tipo de archivo no permitido: ${imageFile.type}. Solo se permiten imágenes: JPG, PNG, GIF, WEBP`);
      }

      const maxSize = 5 * 1024 * 1024;
      if (imageFile.size > maxSize) {
        const sizeInMB = (imageFile.size / (1024 * 1024)).toFixed(2);
        errors.push(`La imagen es demasiado grande (${sizeInMB}MB). El tamaño máximo permitido es 5MB`);
      }

      // Validar nombre del archivo
      if (imageFile.name) {
        // Verificar caracteres problemáticos en el nombre
        const problematicChars = /[<>:"|?*\x00-\x1F]/;
        if (problematicChars.test(imageFile.name)) {
          errors.push(`El nombre del archivo contiene caracteres no permitidos. Por favor, renombra el archivo antes de subirlo`);
        }
      }
    }

    // Mostrar todos los errores encontrados
    if (errors.length > 0) {
      errors.forEach((error) => {
        toast.error(error);
      });
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
        <CardContent className="py-4 px-6 space-y-6">
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
              key={service?.id || 'new-service'} // Forzar recreación cuando cambia el servicio
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
