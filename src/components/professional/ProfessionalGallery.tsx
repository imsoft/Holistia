"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface ProfessionalGalleryProps {
  name: string;
  gallery: string[];
}

const ProfessionalGallery = ({ name, gallery }: ProfessionalGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
  };

  const handleNextImage = () => {
    if (selectedImageIndex < gallery.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isGalleryOpen) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          if (selectedImageIndex > 0) {
            setSelectedImageIndex(selectedImageIndex - 1);
          }
          break;
        case 'ArrowRight':
          if (selectedImageIndex < gallery.length - 1) {
            setSelectedImageIndex(selectedImageIndex + 1);
          }
          break;
        case 'Escape':
          handleCloseGallery();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, selectedImageIndex, gallery.length]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Galería</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group"
                onClick={() => handleImageClick(index)}
              >
                <Image
                  src={image}
                  alt={`Imagen ${index + 1} de ${name}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  width={400}
                  height={400}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Galería */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-card">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Galería de {name}</h3>
                <p className="text-sm text-muted-foreground">Imagen {selectedImageIndex + 1} de {gallery.length}</p>
              </div>
              <Button
                onClick={handleCloseGallery}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Contenido principal */}
            <div className="relative flex-1 min-h-0">
              {/* Imagen principal */}
              <div className="flex items-center justify-center h-[60vh] bg-muted/20">
                <Image
                  src={gallery[selectedImageIndex]}
                  alt={`Imagen ${selectedImageIndex + 1} de ${name}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  width={800}
                  height={600}
                  priority
                />
              </div>

              {/* Botones de navegación */}
              {selectedImageIndex > 0 && (
                <Button
                  onClick={handlePrevImage}
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background border border-border"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
              )}

              {selectedImageIndex < gallery.length - 1 && (
                <Button
                  onClick={handleNextImage}
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background border border-border"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              )}
            </div>

            {/* Footer con thumbnails */}
            <div className="p-6 border-t border-border bg-card">
              <div className="flex justify-center">
                <div className="flex space-x-2 max-w-full overflow-x-auto pb-2">
                  {gallery.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === selectedImageIndex 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                        width={64}
                        height={64}
                      />
                      {index === selectedImageIndex && (
                        <div className="absolute inset-0 bg-primary/20" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfessionalGallery;
