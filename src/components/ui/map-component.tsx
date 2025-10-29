'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddressCacheEntry, MAP_CONFIG } from '@/types/google-maps';

// Declaración global para Google Maps
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: unknown) => unknown;
        Marker: new (options: unknown) => unknown;
        InfoWindow: new (options: unknown) => unknown;
        Geocoder: new () => {
          geocode: (request: { address: string }, callback: (results: unknown[], status: string) => void) => void;
        };
        MapTypeId: {
          ROADMAP: string;
        };
        LatLng: new (lat: number, lng: number) => unknown;
        LatLngBounds: new () => unknown;
        Size: new (width: number, height: number) => unknown;
        Point: new (x: number, y: number) => unknown;
      };
    };
  }
}

interface MapComponentProps {
  address: string;
  serviceName: string;
  className?: string;
}

// Cache mejorado para direcciones con timestamp y limpieza automática
class AddressCache {
  private cache = new Map<string, AddressCacheEntry>();
  private maxSize = MAP_CONFIG.MAX_CACHE_SIZE;
  private cacheDuration = MAP_CONFIG.CACHE_DURATION;

  get(address: string): { lat: number; lng: number } | null {
    const entry = this.cache.get(address);
    if (!entry) return null;

    // Verificar si la entrada ha expirado
    if (Date.now() - entry.timestamp > this.cacheDuration) {
      this.cache.delete(address);
      return null;
    }

    return entry.coordinates;
  }

  set(address: string, coordinates: { lat: number; lng: number }, formattedAddress: string) {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(address, {
      coordinates,
      timestamp: Date.now(),
      formatted_address: formattedAddress
    });
  }

  private cleanup() {
    const entries = Array.from(this.cache.entries());
    
    // Ordenar por timestamp (más antiguos primero)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Eliminar el 20% más antiguo
    const toDelete = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toDelete; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  clear() {
    this.cache.clear();
  }
}

const addressCache = new AddressCache();

export function MapComponent({ address, serviceName, className = '' }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Función para geocodificar una dirección
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Verificar cache primero
      const cachedCoords = addressCache.get(address);
      if (cachedCoords) {
        console.log('📍 Using cached coordinates for:', address);
        return cachedCoords;
      }

      console.log('🌍 Geocoding address:', address);

      // Usar la API de geocodificación de Google Maps
      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        geocoder.geocode({ address }, (results: any[], status: string) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            const coords = {
              lat: location.lat(),
              lng: location.lng()
            };
            
            // Guardar en cache con información adicional
            addressCache.set(address, coords, results[0].formatted_address);
            console.log('✅ Address geocoded and cached:', results[0].formatted_address);
            resolve(coords);
          } else {
            console.error('❌ Geocoding failed:', status, results);
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };

  // Función para inicializar el mapa
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || !coordinates) return;

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: MAP_CONFIG.DEFAULT_ZOOM,
        center: coordinates,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        gestureHandling: 'greedy',
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
      });

      // Agregar marcador
      new window.google.maps.Marker({
        position: coordinates,
        map: map,
        title: serviceName,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#10b981" stroke="white" stroke-width="2"/>
              <path d="M16 8C13.7909 8 12 9.79086 12 12C12 14.2091 13.7909 16 16 16C18.2091 16 20 14.2091 20 12C20 9.79086 18.2091 8 16 8Z" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32)
        }
      });

      // Agregar info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${serviceName}</h3>
            <p class="text-sm text-gray-600">${address}</p>
          </div>
        `
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;

      // Mostrar info window al hacer clic en el marcador
      const marker = new window.google.maps.Marker({
        position: coordinates,
        map: map,
        title: serviceName
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      setMapLoaded(true);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Error al cargar el mapa');
    }
  }, [coordinates, serviceName, address]);

  // Cargar coordenadas y inicializar mapa
  useEffect(() => {
    const loadMap = async () => {
      if (!address) return;

      try {
        setMapLoaded(false);
        setMapError(null);

        const coords = await geocodeAddress(address);
        if (coords) {
          setCoordinates(coords);
        } else {
          setMapError('No se pudo encontrar la ubicación');
        }
      } catch (error) {
        console.error('Error loading map:', error);
        setMapError('Error al cargar la ubicación');
      }
    };

    loadMap();
  }, [address]);

  // Inicializar mapa cuando tengamos coordenadas
  useEffect(() => {
    if (coordinates) {
      initializeMap();
    }
  }, [coordinates, initializeMap]);

  // Función para abrir en Google Maps
  const openInGoogleMaps = () => {
    if (coordinates) {
      const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
  };

  // Función para obtener direcciones
  const getDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  if (mapError) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <MapPin className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ubicación no encontrada</h3>
        <p className="text-sm text-gray-600 text-center mb-4">{mapError}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openInGoogleMaps}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir en Google Maps
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-gray-600">Cargando mapa...</p>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Botones de acción */}
      {mapLoaded && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={getDirections}
            className="flex items-center gap-2 shadow-lg"
          >
            <Navigation className="w-4 h-4" />
            Cómo llegar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={openInGoogleMaps}
            className="flex items-center gap-2 shadow-lg"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir
          </Button>
        </div>
      )}

      {/* Información de la dirección */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 truncate">{serviceName}</h4>
            <p className="text-xs text-gray-600 break-words">{address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
