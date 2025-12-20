"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { Image as ImageIcon, Trash2, Plus, Upload } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface HolisticServiceImagesManagerProps {
  serviceId: string;
  currentImages: Array<{ id: string; image_url: string; image_order: number }>;
  onImagesUpdate: () => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export default function HolisticServiceImagesManager({
  serviceId,
  currentImages,
  onImagesUpdate,
  maxImages = 4,
  maxSizeMB = 2
}: HolisticServiceImagesManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Ordenar imágenes por image_order
  const sortedImages = [...currentImages].sort((a, b) => a.image_order - b.image_order);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validar tamaño
    if (file.size > maxSizeMB * 1024 * 1024) {
      setUploadError(`La imagen debe ser menor a ${maxSizeMB}MB`);
      toast.error(`La imagen debe ser menor a ${maxSizeMB}MB`);
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setUploadError('Solo se permiten archivos de imagen');
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validar cantidad máxima
    if (currentImages.length >= maxImages) {
      setUploadError(`Máximo ${maxImages} imágenes permitidas`);
      toast.error(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Debes estar autenticado para subir imágenes');
      }

      // Determinar el siguiente order disponible
      const nextOrder = currentImages.length;

      // Generar nombre único para la imagen
      const fileExt = file.name.split('.').pop();
      const fileName = `image-${nextOrder}.${fileExt}`;
      const filePath = `${serviceId}/${fileName}`;

      // Subir imagen a Supabase Storage (bucket holistic-services)
      const { error: uploadError } = await supabase.storage
        .from('holistic-services')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        if (uploadError.message.includes('File size')) {
          throw new Error('El archivo es demasiado grande');
        } else if (uploadError.message.includes('quota')) {
          throw new Error('Se ha alcanzado el límite de almacenamiento');
        } else if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
          throw new Error('El bucket de almacenamiento no existe. Por favor, ejecuta la migración 135 para crear el bucket.');
        } else {
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }
      }

      // Obtener URL pública de la imagen
      const { data: { publicUrl } } = supabase.storage
        .from('holistic-services')
        .getPublicUrl(filePath);

      // Guardar en la base de datos
      const { error: dbError } = await supabase
        .from('holistic_service_images')
        .insert({
          service_id: serviceId,
          image_url: publicUrl,
          image_order: nextOrder,
        });

      if (dbError) {
        // Si falla la BD, eliminar la imagen del storage
        await supabase.storage
          .from('holistic-services')
          .remove([filePath]);
        throw dbError;
      }

      toast.success('Imagen agregada exitosamente');
      onImagesUpdate();

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen. Inténtalo de nuevo.';
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    try {
      // Extraer el path del storage de la URL
      const urlParts = imageUrl.split('/holistic-services/');
      if (urlParts.length < 2) {
        throw new Error('URL de imagen inválida');
      }
      const filePath = urlParts[1];

      // Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('holistic_service_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      // Eliminar del storage
      const { error: storageError } = await supabase.storage
        .from('holistic-services')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // No lanzar error, ya se eliminó de la BD
      }

      toast.success('Imagen eliminada exitosamente');
      onImagesUpdate();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Error al eliminar la imagen');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Imágenes del Servicio</Label>
        <div className="text-sm text-muted-foreground">
          {currentImages.length}/{maxImages} imágenes
        </div>
      </div>

      {/* Grid de imágenes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {sortedImages.map((image) => (
          <Card key={image.id} className="relative group">
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <Image
                  src={image.image_url}
                  alt={`Imagen ${image.image_order + 1}`}
                  fill
                  className="object-cover rounded-lg"
                  unoptimized
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteImage(image.id, image.image_url)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Botón para agregar nueva imagen */}
        {currentImages.length < maxImages && (
          <Card className="border-dashed">
            <CardContent className="p-0">
              <label
                htmlFor={`holistic-service-image-${serviceId}`}
                className="flex flex-col items-center justify-center aspect-square cursor-pointer hover:bg-muted/50 transition-colors rounded-lg"
              >
                <input
                  ref={fileInputRef}
                  id={`holistic-service-image-${serviceId}`}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="text-xs text-muted-foreground">Subiendo...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Plus className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Agregar</span>
                  </div>
                )}
              </label>
            </CardContent>
          </Card>
        )}
      </div>

      {uploadError && (
        <div className="text-sm text-destructive">{uploadError}</div>
      )}

      <p className="text-xs text-muted-foreground">
        Formatos: JPG, PNG, WebP. Máximo {maxSizeMB}MB por imagen.
      </p>
    </div>
  );
}
