"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EventFormData, EventWorkshop, Professional, EVENT_CATEGORIES, SESSION_TYPES, PARTICIPANT_LEVELS } from "@/types/event";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Upload, X, Crop } from "lucide-react";
import Image from "next/image";
import { EventImageCropEditor } from "@/components/ui/event-image-crop-editor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EventFormProps {
  event?: EventWorkshop | null;
  professionals: Professional[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function EventForm({ event, professionals, onSuccess, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    duration_hours: 1,
    session_type: "unique",
    price: 0,
    is_free: false,
    max_capacity: 10,
    has_parking: false,
    event_date: "",
    event_time: "",
    category: "salud_mental",
    location: "",
    description: "",
    participant_level: "principiante",
    professional_id: "",
    gallery_images: [],
  });

  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tempEventId] = useState(() => `temp-${Date.now()}-${Math.random().toString(36).substring(2)}`);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [cropImageIndex, setCropImageIndex] = useState<number>(0);
  const [currentImagePosition, setCurrentImagePosition] = useState<string>("center center");

  const supabase = createClient();

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        duration_hours: event.duration_hours,
        session_type: event.session_type,
        price: event.price,
        is_free: event.is_free,
        max_capacity: event.max_capacity,
        has_parking: event.has_parking,
        event_date: event.event_date,
        event_time: event.event_time,
        category: event.category,
        location: event.location,
        description: event.description || "",
        participant_level: event.participant_level,
        professional_id: event.professional_id || "",
        gallery_images: event.gallery_images || [],
      });
    }
  }, [event]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre del evento es requerido";
    }

    if (formData.duration_hours <= 0) {
      newErrors.duration_hours = "La duración debe ser mayor a 0";
    }

    if (!formData.is_free && formData.price <= 0) {
      newErrors.price = "El precio debe ser mayor a 0 para eventos con costo";
    }

    if (formData.max_capacity <= 0) {
      newErrors.max_capacity = "El cupo máximo debe ser mayor a 0";
    }

    if (!formData.event_date) {
      newErrors.event_date = "La fecha del evento es requerida";
    }

    if (!formData.event_time) {
      newErrors.event_time = "La hora del evento es requerida";
    }

    if (!formData.location.trim()) {
      newErrors.location = "La ubicación es requerida";
    }

    if (!formData.professional_id) {
      newErrors.professional_id = "Debe seleccionar un profesional";
    }

    if (formData.gallery_images.length === 0) {
      newErrors.gallery_images = "Debe subir al menos una imagen";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof EventFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
          toast.error(`El archivo ${file.name} no es una imagen válida`);
          continue;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`La imagen ${file.name} es demasiado grande (máximo 5MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const eventId = event?.id || tempEventId;
        const filePath = `${eventId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-gallery')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast.error(`Error al subir ${file.name}`);
          continue;
        }

        const { data } = supabase.storage
          .from('event-gallery')
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        const newImages = [...formData.gallery_images, ...uploadedUrls];
        if (newImages.length > 4) {
          toast.warning("Solo se pueden subir máximo 4 imágenes");
          handleInputChange('gallery_images', newImages.slice(0, 4));
        } else {
          handleInputChange('gallery_images', newImages);
        }
        toast.success(`${uploadedUrls.length} imagen(es) subida(s) exitosamente`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error("Error al subir las imágenes");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.gallery_images.filter((_, i) => i !== index);
    handleInputChange('gallery_images', newImages);
  };

  const handleCropSave = (newPosition: string) => {
    // Por ahora solo actualizamos el estado local
    // En el futuro se podría guardar la posición de cada imagen individualmente
    setCurrentImagePosition(newPosition);
    setIsCropDialogOpen(false);
    toast.success('Posición de imagen actualizada');
  };

  const handleOpenCropEditor = (index: number) => {
    if (formData.gallery_images.length === 0) {
      toast.error('Primero debes subir al menos una imagen');
      return;
    }
    setCropImageIndex(index);
    setIsCropDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevenir múltiples submissions
    if (saving) {
      return;
    }
    
    if (!validateForm()) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    try {
      setSaving(true);
      const eventData = {
        ...formData,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      if (event) {
        // Actualizar evento existente
        const { error } = await supabase
          .from("events_workshops")
          .update(eventData)
          .eq("id", event.id);

        if (error) throw error;
        toast.success("Evento actualizado exitosamente");
      } else {
        // Crear nuevo evento
        const { data: newEvent, error } = await supabase
          .from("events_workshops")
          .insert(eventData)
          .select()
          .single();

        if (error) throw error;

        // Si se creó un evento nuevo y hay imágenes en carpeta temporal, moverlas a la carpeta real
        if (newEvent && formData.gallery_images.length > 0) {
          const newEventId = newEvent.id;
          const updatedGalleryImages: string[] = [];

          for (const imageUrl of formData.gallery_images) {
            // Extraer el nombre del archivo de la URL
            const fileName = imageUrl.split('/').pop();
            if (fileName) {
              // Copiar de carpeta temporal a carpeta real
              const { error: copyError } = await supabase.storage
                .from('event-gallery')
                .copy(`${tempEventId}/${fileName}`, `${newEventId}/${fileName}`);

              if (!copyError) {
                // Obtener la nueva URL pública
                const { data } = supabase.storage
                  .from('event-gallery')
                  .getPublicUrl(`${newEventId}/${fileName}`);
                
                updatedGalleryImages.push(data.publicUrl);

                // Eliminar el archivo temporal
                await supabase.storage
                  .from('event-gallery')
                  .remove([`${tempEventId}/${fileName}`]);
              }
            }
          }

          // Actualizar el evento con las nuevas URLs de imágenes
          if (updatedGalleryImages.length > 0) {
            await supabase
              .from("events_workshops")
              .update({ gallery_images: updatedGalleryImages })
              .eq("id", newEventId);
          }
        }

        toast.success("Evento creado exitosamente");
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Error al guardar el evento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Evento *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ej: Taller de Mindfulness"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_hours">Duración (horas) *</Label>
              <Input
                id="duration_hours"
                type="number"
                value={formData.duration_hours}
                onChange={(e) => handleInputChange('duration_hours', e.target.value === '' ? 0 : parseInt(e.target.value))}
                onFocus={(e) => e.target.select()}
                min="1"
                max="24"
                className={errors.duration_hours ? "border-red-500" : ""}
              />
              {errors.duration_hours && <p className="text-sm text-red-500">{errors.duration_hours}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_type">Tipo de Sesión *</Label>
              <Select
                value={formData.session_type}
                onValueChange={(value: "unique" | "recurring") => handleInputChange('session_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe el contenido del evento..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Precio y cupo */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Precio y Cupo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_free"
              checked={formData.is_free}
              onCheckedChange={(checked) => handleInputChange('is_free', checked)}
            />
            <Label htmlFor="is_free">Evento gratuito</Label>
          </div>

          {!formData.is_free && (
            <div className="space-y-2">
              <Label htmlFor="price">Precio (MXN) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                onFocus={(e) => e.target.select()}
                min="0"
                step="0.01"
                className={errors.price ? "border-red-500" : ""}
              />
              {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="max_capacity">Cupo Máximo *</Label>
            <Input
              id="max_capacity"
              type="number"
              value={formData.max_capacity}
              onChange={(e) => handleInputChange('max_capacity', e.target.value === '' ? 0 : parseInt(e.target.value))}
              onFocus={(e) => e.target.select()}
              min="1"
              className={errors.max_capacity ? "border-red-500" : ""}
            />
            {errors.max_capacity && <p className="text-sm text-red-500">{errors.max_capacity}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Fecha, hora y ubicación */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Fecha, Hora y Ubicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date">Fecha del Evento *</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => handleInputChange('event_date', e.target.value)}
                className={errors.event_date ? "border-red-500" : ""}
              />
              {errors.event_date && <p className="text-sm text-red-500">{errors.event_date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_time">Hora del Evento *</Label>
              <Input
                id="event_time"
                type="time"
                value={formData.event_time}
                onChange={(e) => handleInputChange('event_time', e.target.value)}
                className={errors.event_time ? "border-red-500" : ""}
              />
              {errors.event_time && <p className="text-sm text-red-500">{errors.event_time}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ubicación *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Ej: Centro Holístico, Av. Principal 123"
              className={errors.location ? "border-red-500" : ""}
            />
            {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="has_parking"
              checked={formData.has_parking}
              onCheckedChange={(checked) => handleInputChange('has_parking', checked)}
            />
            <Label htmlFor="has_parking">Tiene estacionamiento</Label>
          </div>
        </CardContent>
      </Card>

      {/* Categoría y nivel */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Categoría y Nivel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select
              value={formData.category}
              onValueChange={(value: "espiritualidad" | "salud_mental" | "salud_fisica" | "alimentacion" | "social") => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="participant_level">Nivel del Participante *</Label>
            <Select
              value={formData.participant_level}
              onValueChange={(value: "principiante" | "medio" | "avanzado") => handleInputChange('participant_level', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTICIPANT_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Profesional */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Profesional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="professional_id">Profesional que imparte *</Label>
            <Select
              value={formData.professional_id}
              onValueChange={(value) => handleInputChange('professional_id', value)}
            >
              <SelectTrigger className={errors.professional_id ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecciona un profesional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map((professional) => (
                  <SelectItem key={professional.id} value={professional.id}>
                    {professional.first_name} {professional.last_name} - {professional.profession}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.professional_id && <p className="text-sm text-red-500">{errors.professional_id}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Galería de imágenes */}
      <Card className="p-4">
        <CardHeader>
          <CardTitle>Galería de Imágenes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Imágenes del Evento (máximo 4) *</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <span className="block text-base font-medium text-foreground mb-2">
                    {uploadingImages ? "Subiendo imágenes..." : "Haz clic para subir imágenes"}
                  </span>
                  <Input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    className="hidden"
                    disabled={uploadingImages}
                  />
                </Label>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, GIF hasta 5MB cada una
                </p>
              </div>
            </div>
            {errors.gallery_images && <p className="text-sm text-red-500">{errors.gallery_images}</p>}
          </div>

          {formData.gallery_images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">
                  Imágenes subidas ({formData.gallery_images.length}/4)
                </h4>
                <span className="text-xs text-muted-foreground">
                  Haz hover sobre una imagen para eliminarla
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.gallery_images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative overflow-hidden rounded-lg border-2 border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors">
                      <Image
                        src={image}
                        alt={`Imagen ${index + 1}`}
                        width={150}
                        height={150}
                        className="w-full h-32 object-cover"
                        style={{
                          objectPosition: index === 0 ? currentImagePosition : "center center"
                        }}
                      />
                      {/* Overlay con botones */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {index === 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenCropEditor(index)}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-colors"
                            title="Ajustar vista en card"
                          >
                            <Crop className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                          title="Eliminar imagen"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        Imagen {index + 1}
                      </p>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Principal
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botones */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={uploadingImages || saving}>
          {saving ? "Guardando..." : event ? "Actualizar Evento" : "Crear Evento"}
        </Button>
      </div>

      {/* Diálogo del editor de recorte */}
      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Editor de Imagen del Evento</DialogTitle>
          </DialogHeader>
          {formData.gallery_images.length > 0 && (
            <EventImageCropEditor
              imageSrc={formData.gallery_images[cropImageIndex]}
              currentPosition={currentImagePosition}
              onSave={handleCropSave}
              onCancel={() => setIsCropDialogOpen(false)}
              eventName={formData.name || "Evento"}
            />
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}
