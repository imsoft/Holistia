'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapComponent } from '@/components/ui/map-component';
import { X, MapPin } from 'lucide-react';

interface MapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  serviceName: string;
}

export function MapModal({ open, onOpenChange, address, serviceName }: MapModalProps) {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Cargar Google Maps API solo cuando el modal se abre
  useEffect(() => {
    if (open && !isGoogleMapsLoaded) {
      loadGoogleMapsAPI();
    }
  }, [open, isGoogleMapsLoaded]);

  const loadGoogleMapsAPI = () => {
    // Verificar si ya está cargada
    if (window.google && window.google.maps) {
      setIsGoogleMapsLoaded(true);
      return;
    }

    // Verificar si ya se está cargando
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Esperar a que termine de cargar
      const checkLoaded = () => {
        if (window.google && window.google.maps) {
          setIsGoogleMapsLoaded(true);
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    // Cargar la API de Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsGoogleMapsLoaded(true);
    };
    
    script.onerror = () => {
      console.error('Error loading Google Maps API');
    };

    document.head.appendChild(script);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Ubicación del Servicio</DialogTitle>
                <DialogDescription className="text-base font-medium text-gray-900">
                  {serviceName}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Información de la dirección */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Dirección:</span> {address}
            </p>
          </div>

          {/* Mapa */}
          <div className="h-96 w-full rounded-lg overflow-hidden border">
            {isGoogleMapsLoaded ? (
              <MapComponent
                address={address}
                serviceName={serviceName}
                className="h-full w-full"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-gray-600">Cargando mapa...</p>
                </div>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>
              💡 <strong>Tip:</strong> Usa los botones en el mapa para obtener direcciones o abrir en Google Maps
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
