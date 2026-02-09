'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
const MapComponent = dynamic(
  () => import('@/components/ui/map-component').then(mod => mod.MapComponent),
  { ssr: false, loading: () => <div className="h-full w-full rounded-lg bg-muted animate-pulse" /> }
);
import { X, MapPin } from 'lucide-react';

interface MapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: string;
  serviceName: string;
}

export function MapModal({ open, onOpenChange, address, serviceName }: MapModalProps) {
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
            {open && (
              <MapComponent
                address={address}
                serviceName={serviceName}
                className="h-full w-full"
              />
            )}
          </div>

          {/* Información adicional */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>
              💡 <strong>Tip:</strong> Usa los botones en el mapa para obtener direcciones o abrir la ubicación
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}