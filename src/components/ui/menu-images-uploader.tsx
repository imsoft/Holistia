"use client";

import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  X, 
  AlertCircle
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface MenuImagesUploaderProps {
  restaurantId: string;
  menuId: string;
  currentImages: string[];
  onImagesUpdated: (images: string[]) => void;
  maxImages?: number;
}

export function MenuImagesUploader({ 
  restaurantId,
  menuId,
  currentImages = [],
  onImagesUpdated,
  maxImages = 4
}: MenuImagesUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const canAddMore = currentImages.length < maxImages;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const remainingSlots = maxImages - currentImages.length;
    
    if (filesArray.length > remainingSlots) {
      setError(`Solo puedes agregar ${remainingSlots} imagen${remainingSlots > 1 ? 'es' : ''} más (máximo ${maxImages})`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Debes estar autenticado para subir imágenes');
      }

      const uploadedUrls: string[] = [];

      // Subir cada archivo
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
          throw new Error(`El archivo ${file.name} no es una imagen válida`);
        }

        // Validar tamaño (5MB máximo)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`El archivo ${file.name} es demasiado grande (máximo 5MB)`);
        }

        // Generar nombre de archivo único con timestamp para evitar conflictos
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const fileName = `imagen-${timestamp}-${random}.${fileExt}`;
        // Estructura: restaurants/<restaurant-id>/menu/imagenes/imagen-{timestamp}-{random}.{ext}
        const filePath = `${restaurantId}/menu/imagenes/${fileName}`;

        // Subir archivo a Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('restaurants')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          
          let errorMessage = 'Error al subir la imagen';
          if (uploadError.message) {
            if (uploadError.message.includes('404') || uploadError.message.includes('not found')) {
              errorMessage = 'El bucket de almacenamiento no existe. Contacta al administrador.';
            } else if (uploadError.message.includes('403') || uploadError.message.includes('401') || uploadError.message.includes('permission')) {
              errorMessage = 'No tienes permisos para subir imágenes. Verifica tu autenticación y las políticas RLS.';
            } else {
              errorMessage += ': ' + uploadError.message;
            }
          }
          
          throw new Error(errorMessage);
        }

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('restaurants')
          .getPublicUrl(filePath);

        if (publicUrl) {
          uploadedUrls.push(publicUrl);
        }
      }

      // Actualizar lista de imágenes
      const newImages = [...currentImages, ...uploadedUrls];
      onImagesUpdated(newImages);
      toast.success(`${uploadedUrls.length} imagen${uploadedUrls.length > 1 ? 'es' : ''} subida${uploadedUrls.length > 1 ? 's' : ''} exitosamente`);

    } catch (err) {
      console.error('Error uploading images:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado al subir las imágenes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (imageUrl: string, index: number) => {
    try {
      // Extraer el path del storage desde la URL
      // URL formato: https://...supabase.co/storage/v1/object/public/restaurants/{path}
      const urlParts = imageUrl.split('/restaurants/');
      if (urlParts.length < 2) {
        throw new Error('URL de imagen inválida');
      }
      
      const filePath = urlParts[1];

      // Eliminar del storage
      const { error: deleteError } = await supabase.storage
        .from('restaurants')
        .remove([filePath]);

      if (deleteError) {
        throw deleteError;
      }

      // Actualizar lista de imágenes
      const newImages = currentImages.filter((_, i) => i !== index);
      onImagesUpdated(newImages);
      toast.success('Imagen eliminada exitosamente');

    } catch (err) {
      console.error('Error removing image:', err);
      toast.error('Error al eliminar la imagen');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Imágenes del menú (máximo {maxImages})
        </label>
        <span className="text-sm text-muted-foreground">
          {currentImages.length}/{maxImages}
        </span>
      </div>

      {/* Lista de imágenes actuales */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {currentImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="relative aspect-video rounded-lg overflow-hidden border">
                <Image
                  src={imageUrl}
                  alt={`Imagen ${index + 1} del menú`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(imageUrl, index)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón para subir imágenes */}
      {canAddMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !canAddMore}
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Agregar {maxImages - currentImages.length > 1 ? 'imágenes' : 'imagen'} ({maxImages - currentImages.length} disponible{maxImages - currentImages.length > 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>
      )}

      {/* Mensaje cuando está al límite */}
      {!canAddMore && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            Has alcanzado el límite de {maxImages} imágenes. Elimina una para agregar otra.
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}
    </div>
  );
}
