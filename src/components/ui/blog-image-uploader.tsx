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

interface BlogImageUploaderProps {
  blogPostId: string;
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  onImageRemoved?: () => void;
}

export function BlogImageUploader({ 
  blogPostId, 
  onImageUploaded, 
  currentImageUrl,
  onImageRemoved 
}: BlogImageUploaderProps) {
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

    setError(null);
    setSuccess(false);

    // Crear preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      setUploading(true);

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `imagen.${fileExt}`;
      const filePath = `${blogPostId}/${fileName}`;

             // Subir archivo a Supabase Storage
             const { error: uploadError } = await supabase.storage
               .from('consultorios')
               .upload(filePath, file, {
                 cacheControl: '3600',
                 upsert: true // Permite sobrescribir si existe
               });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        setError('Error al subir la imagen: ' + uploadError.message);
        return;
      }

      // Obtener URL pública de la imagen
      const { data: urlData } = supabase.storage
        .from('consultorios')
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
      setError('Error inesperado al subir la imagen');
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
      const urlParts = currentImageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${blogPostId}/${fileName}`;

      // Eliminar archivo del storage
      const { error } = await supabase.storage
        .from('blog-images')
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
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Imagen Destacada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Imagen actual */}
        {currentImageUrl && (
          <div className="relative">
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
              <Image
                src={currentImageUrl}
                alt="Imagen destacada actual"
                fill
                className="object-cover"
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
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
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium">Subir imagen destacada</p>
                <p className="text-sm text-muted-foreground">
                  Arrastra y suelta una imagen aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG, GIF hasta 5MB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Input oculto */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
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

        {/* Botón de subida alternativo */}
        {!currentImageUrl && !preview && (
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Seleccionar Imagen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
