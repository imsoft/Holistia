"use client";

import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  X, 
  Image as ImageIcon,
  Check,
  AlertCircle
} from "lucide-react";
import Image from "next/image";

interface RestaurantCenterImageUploaderProps {
  entityId: string;
  bucketName: 'restaurants' | 'holistic-centers';
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  onImageRemoved?: () => void;
  entityName: string; // Para mostrar en los mensajes
}

export function RestaurantCenterImageUploader({ 
  entityId, 
  bucketName,
  onImageUploaded, 
  currentImageUrl,
  onImageRemoved,
  entityName 
}: RestaurantCenterImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    // Validar que tenemos un entityId
    if (!entityId) {
      setError('No se puede subir la imagen: ID no válido');
      return;
    }

    setError(null);
    setSuccess(false);

    // Crear preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      setUploading(true);

      // Verificar autenticación antes de subir
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Debes estar autenticado para subir imágenes');
      }

      // Generar nombre de archivo: imagen.{ext}
      const fileExt = file.name.split('.').pop();
      const fileName = `imagen.${fileExt}`;
      // Estructura: <entity-id>/imagen.{ext}
      const filePath = `${entityId}/${fileName}`;

      console.log('Uploading to:', {
        bucket: bucketName,
        path: filePath,
        userId: user.id,
        entityId
      });

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Permite sobrescribir si existe
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        
        // Mejorar mensajes de error
        let errorMessage = 'Error al subir la imagen';
        if (uploadError.message) {
          errorMessage += ': ' + uploadError.message;
          
          // Verificar tipos específicos de error basándose en el mensaje
          if (uploadError.message.includes('404') || uploadError.message.includes('not found')) {
            errorMessage = 'El bucket de almacenamiento no existe. Contacta al administrador.';
          } else if (uploadError.message.includes('403') || uploadError.message.includes('401') || uploadError.message.includes('permission') || uploadError.message.includes('policy')) {
            errorMessage = 'No tienes permisos para subir imágenes. Verifica tu autenticación y las políticas RLS.';
          } else if (uploadError.message.includes('500') || uploadError.message.includes('Internal')) {
            errorMessage = 'Error del servidor al subir la imagen. Verifica que el bucket exista y las políticas RLS estén configuradas.';
          }
        }
        
        setError(errorMessage);
        return;
      }

      // Obtener URL pública de la imagen
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setSuccess(true);
        onImageUploaded(urlData.publicUrl);
        
        // Limpiar preview después de un momento
        setTimeout(() => {
          setPreview(null);
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado al subir la imagen';
      setError(errorMessage);
    } finally {
      setUploading(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    try {
      // Extraer el path del archivo de la URL
      // La URL tiene formato: https://...supabase.co/storage/v1/object/public/{bucket}/{entityId}/imagen.{ext}
      const urlParts = currentImageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${entityId}/${fileName}`;

      // Eliminar archivo del storage
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Error removing image:', error);
        setError('Error al eliminar la imagen');
        return;
      }

      onImageRemoved?.();
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('Error inesperado al eliminar la imagen');
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      // Crear un evento de input sintético
      const syntheticEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(syntheticEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        Imagen principal
      </label>
      
      <Card className="p-4">
        <CardContent className="space-y-4 p-0">
          {/* Imagen actual */}
          {currentImageUrl && (
            <div className="relative">
              <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                <Image
                  src={currentImageUrl}
                  alt={`Imagen de ${entityName}`}
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Preview de nueva imagen */}
          {preview && !currentImageUrl && (
            <div className="relative">
              <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                <Image
                  src={preview}
                  alt="Vista previa"
                  fill
                  className="object-cover"
                />
              </div>
              {success && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <div className="bg-green-500 text-white p-2 rounded-full">
                    <Check className="w-6 h-6" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Área de subida */}
          {!currentImageUrl && !preview && (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => {
                if (window.innerWidth >= 640) {
                  fileInputRef.current?.click();
                }
              }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-medium">Subir imagen</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="sm:hidden">Usa el selector de archivo de arriba o </span>
                    <span className="hidden sm:inline">Arrastra y suelta una imagen aquí o haz clic para </span>
                    seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, WEBP hasta 5MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Input de archivo - oculto en desktop, visible en móvil */}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden sm:hidden"
            disabled={uploading}
          />
          
          {/* Input visible para móvil */}
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="sm:hidden w-full"
            disabled={uploading}
          />

          {/* Estados de carga y error */}
          {uploading && (
            <div className="flex items-center gap-2 text-primary">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Subiendo imagen...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span>Imagen subida exitosamente</span>
            </div>
          )}

          {/* Botón de subida alternativo - solo visible en desktop */}
          {!currentImageUrl && !preview && (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="hidden sm:flex w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Seleccionar Imagen
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
