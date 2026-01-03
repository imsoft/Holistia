"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import ImageGalleryManager from "@/components/ui/image-gallery-manager";

interface GalleryTabProps {
  professionalId: string;
}

export function GalleryTab({ professionalId }: GalleryTabProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchGallery();
  }, [professionalId]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      
      // Obtener datos del profesional incluyendo user_id y gallery
      const { data: professionalData, error } = await supabase
        .from('professional_applications')
        .select('user_id, gallery')
        .eq('id', professionalId)
        .single();

      if (error) throw error;

      if (professionalData) {
        setUserId(professionalData.user_id);
        
        // gallery puede ser un array de strings, null, o un array vacío
        let galleryArray: string[] = [];
        
        if (professionalData.gallery) {
          // Asegurarse de que es un array
          if (Array.isArray(professionalData.gallery)) {
            galleryArray = professionalData.gallery.filter((url: any) => url && typeof url === 'string');
          } else if (typeof professionalData.gallery === 'string') {
            // Si es un string, intentar parsearlo como JSON
            try {
              const parsed = JSON.parse(professionalData.gallery);
              if (Array.isArray(parsed)) {
                galleryArray = parsed.filter((url: any) => url && typeof url === 'string');
              }
            } catch {
              // Si no es JSON válido, tratarlo como un solo string
              galleryArray = [professionalData.gallery];
            }
          }
        }
        
        console.log('🔍 Gallery data loaded:', {
          raw: professionalData.gallery,
          processed: galleryArray,
          count: galleryArray.length
        });
        
        setGalleryImages(galleryArray);
      }
    } catch (error) {
      console.error('❌ Error fetching gallery:', error);
      toast.error('Error al cargar la galería');
    } finally {
      setLoading(false);
    }
  };

  const handleImagesUpdate = async (newImages: string[]) => {
    try {
      console.log('💾 Updating gallery:', newImages);
      
      // Asegurarse de que newImages es un array válido
      const validImages = Array.isArray(newImages) 
        ? newImages.filter(url => url && typeof url === 'string')
        : [];
      
      // Actualizar el campo gallery en professional_applications
      const { error } = await supabase
        .from('professional_applications')
        .update({ gallery: validImages })
        .eq('id', professionalId);

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw error;
      }

      console.log('✅ Gallery updated successfully');
      setGalleryImages(validImages);
      toast.success('Galería actualizada exitosamente');
    } catch (error) {
      console.error('❌ Error updating gallery:', error);
      toast.error('Error al actualizar la galería');
    }
  };

  if (loading) {
    return (
      <Card className="py-4">
        <CardContent className="py-12">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userId) {
    return (
      <Card className="py-4">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No se pudo obtener la información del profesional
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Galería de Imágenes</CardTitle>
          <CardDescription>
            Gestiona las imágenes de la galería del profesional. Puedes agregar hasta 4 imágenes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {galleryImages.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                📸 {galleryImages.length} imagen{galleryImages.length !== 1 ? 'es' : ''} en la galería
              </p>
              {/* Debug info - remover en producción si es necesario */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer text-muted-foreground">
                    Debug info
                  </summary>
                  <pre className="text-xs mt-2 overflow-auto">
                    {JSON.stringify(galleryImages, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
          <ImageGalleryManager
            professionalId={userId}
            currentImages={galleryImages}
            onImagesUpdate={handleImagesUpdate}
            maxImages={4}
            maxSizeMB={2}
          />
        </CardContent>
      </Card>
    </div>
  );
}
