"use client";

import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, CheckCircle, AlertCircle, Crop } from "lucide-react";
import Image from "next/image";
import { ImageCropEditor } from "@/components/ui/image-crop-editor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ProfilePhotoUploaderProps {
  professionalId: string;
  currentPhoto?: string;
  professionalName: string;
  onPhotoUpdate: (newPhotoUrl: string) => void;
}

export default function ProfilePhotoUploader({
  professionalId,
  currentPhoto,
  professionalName,
  onPhotoUpdate
}: ProfilePhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [currentImagePosition, setCurrentImagePosition] = useState<string>("center center");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validaciones
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      setUploadError('La imagen debe ser menor a 2MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      // Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Debes estar autenticado para subir imágenes');
      }

      if (user.id !== professionalId) {
        throw new Error('Solo puedes subir tu propia foto de perfil');
      }

      // Generar nombre único para la imagen
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${professionalId}/${fileName}`;

      console.log('Uploading profile photo to path:', filePath);

      // Subir imagen a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('professional-gallery')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
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

      // Actualizar la base de datos
      const { error: updateError } = await supabase
        .from('professional_applications')
        .update({ 
          profile_photo: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', professionalId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error('Error al actualizar el perfil en la base de datos');
      }

      // Llamar callback para actualizar el estado padre
      onPhotoUpdate(publicUrl);
      setUploadSuccess('Foto de perfil actualizada correctamente');

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setUploadSuccess(null), 3000);

    } catch (error) {
      console.error('Error uploading profile photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen. Inténtalo de nuevo.';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleCropSave = async (newPosition: string) => {
    try {
      // Actualizar la posición de la imagen en la base de datos
      const { error: updateError } = await supabase
        .from('professional_applications')
        .update({ 
          image_position: newPosition,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', professionalId);

      if (updateError) {
        console.error('Error updating image position:', updateError);
        throw new Error('Error al guardar la posición de la imagen');
      }

      setCurrentImagePosition(newPosition);
      setIsCropDialogOpen(false);
      setUploadSuccess('Posición de imagen actualizada correctamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setUploadSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error saving crop position:', error);
      setUploadError(error instanceof Error ? error.message : 'Error al guardar la posición');
    }
  };

  const handleOpenCropEditor = () => {
    if (!currentPhoto) {
      setUploadError('Primero debes subir una foto de perfil');
      return;
    }
    setIsCropDialogOpen(true);
  };

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Foto de Perfil
        </CardTitle>
        <CardDescription>
          Sube una foto profesional para tu perfil. Máximo 2MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Imagen actual */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {currentPhoto ? (
              <Image
                src={currentPhoto}
                alt={professionalName}
                width={80}
                height={80}
                className="h-20 w-20 aspect-square rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                <span className="text-2xl font-bold text-muted-foreground">
                  {professionalName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {currentPhoto ? 'Foto actual' : 'Sin foto de perfil'}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentPhoto 
                ? 'Tu foto se muestra en tu perfil profesional'
                : 'Agrega una foto para personalizar tu perfil'
              }
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="space-y-2">
          <Button
            onClick={handleClick}
            disabled={isUploading}
            variant="outline"
            className="w-full"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {currentPhoto ? 'Cambiar Foto' : 'Subir Foto'}
              </>
            )}
          </Button>
          
          {currentPhoto && (
            <Button
              onClick={handleOpenCropEditor}
              variant="outline"
              className="w-full"
            >
              <Crop className="h-4 w-4 mr-2" />
              Ajustar Vista en Card
            </Button>
          )}
        </div>

        {/* Input oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Mensajes de estado */}
        {uploadError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800">{uploadError}</p>
          </div>
        )}

        {uploadSuccess && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-800">{uploadSuccess}</p>
          </div>
        )}

        {/* Consejos */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-800 mb-1">Consejos para tu foto:</p>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Usa una foto profesional y clara</li>
            <li>• Asegúrate de que tu cara sea visible</li>
            <li>• Evita fondos muy cargados</li>
            <li>• Formatos recomendados: JPG, PNG</li>
          </ul>
        </div>
      </CardContent>

      {/* Diálogo del editor de recorte */}
      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="w-full max-w-none max-h-[85vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl">Editor de Imagen de Perfil</DialogTitle>
          </DialogHeader>
          {currentPhoto && (
            <ImageCropEditor
              imageSrc={currentPhoto}
              currentPosition={currentImagePosition}
              onSave={handleCropSave}
              onCancel={() => setIsCropDialogOpen(false)}
              professionalName={professionalName}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
