"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import { Image as ImageIcon, Trash2, Plus } from "lucide-react";
import Image from "next/image";

interface ImageGalleryManagerProps {
  professionalId: string;
  currentImages: string[];
  onImagesUpdate: (images: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export default function ImageGalleryManager({
  professionalId,
  currentImages,
  onImagesUpdate,
  maxImages = 5,
  maxSizeMB = 2
}: ImageGalleryManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validar tamaño
    if (file.size > maxSizeMB * 1024 * 1024) {
      setUploadError(`La imagen debe ser menor a ${maxSizeMB}MB`);
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setUploadError('Solo se permiten archivos de imagen');
      return;
    }

    // Validar cantidad máxima
    if (currentImages.length >= maxImages) {
      setUploadError(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Generar nombre único para la imagen
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `professional/${professionalId}/gallery/${fileName}`;

      // Subir imagen a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('professional-gallery')
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
        } else {
          throw new Error('Error al subir la imagen al servidor');
        }
      }

      // Obtener URL pública de la imagen
      const { data: { publicUrl } } = supabase.storage
        .from('professional-gallery')
        .getPublicUrl(filePath);

      // Actualizar la lista de imágenes
      const newImages = [...currentImages, publicUrl];
      onImagesUpdate(newImages);

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen. Inténtalo de nuevo.';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string, index: number) => {
    try {
      // Extraer el path del archivo de la URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `professional/${professionalId}/gallery/${fileName}`;

      // Eliminar de Supabase Storage
      const { error: deleteError } = await supabase.storage
        .from('professional-gallery')
        .remove([filePath]);

      if (deleteError) {
        console.error('Storage delete error:', deleteError);
        if (deleteError.message.includes('not found')) {
          console.warn('Image file not found in storage, removing from gallery anyway');
        } else {
          throw new Error('Error al eliminar la imagen del servidor');
        }
      }

      // Actualizar la lista de imágenes
      const newImages = currentImages.filter((_, i) => i !== index);
      onImagesUpdate(newImages);

    } catch (error) {
      console.error('Error deleting image:', error);
      // Mostrar un mensaje de error temporal al usuario
      setUploadError(error instanceof Error ? error.message : 'Error al eliminar la imagen');
      setTimeout(() => setUploadError(null), 3000);
    }
  };

  const canAddMore = currentImages.length < maxImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Galería de Imágenes</h3>
          <p className="text-sm text-muted-foreground">
            {currentImages.length}/{maxImages} imágenes • Máximo {maxSizeMB}MB por imagen
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              disabled={!canAddMore}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Imagen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Subir Nueva Imagen</DialogTitle>
              <DialogDescription>
                Selecciona una imagen para agregar a tu galería profesional.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gallery-image">Imagen</Label>
                <Input
                  id="gallery-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  disabled={isUploading}
                />
                <p className="text-xs text-muted-foreground">
                  Formatos: JPG, PNG, GIF • Máximo {maxSizeMB}MB
                </p>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}

              {isUploading && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-blue-600">Subiendo imagen...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de imágenes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {currentImages.map((imageUrl, index) => (
          <Card key={index} className="relative group">
            <CardContent className="p-2">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={`Imagen ${index + 1} de la galería`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
                
                {/* Botón de eliminar */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteImage(imageUrl, index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Placeholder para agregar más imágenes */}
        {canAddMore && (
          <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
            <CardContent className="p-2">
              <div 
                className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onClick={() => setIsDialogOpen(true)}
              >
                <div className="text-center">
                  <Plus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Agregar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {currentImages.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No hay imágenes en la galería</p>
          <p className="text-sm text-muted-foreground">
            Agrega hasta {maxImages} imágenes para mostrar tu espacio de trabajo
          </p>
        </div>
      )}
    </div>
  );
}
