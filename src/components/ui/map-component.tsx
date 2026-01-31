'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddressCacheEntry, MAP_CONFIG } from '@/types/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Función para geocodificar una dirección usando Mapbox Geocoding API
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Verificar cache primero
      const cachedCoords = addressCache.get(address);
      if (cachedCoords) {
        console.log('📍 Using cached coordinates for:', address);
        return cachedCoords;
      }

      console.log('🌍 Geocoding address:', address);

      const apiKey = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!apiKey) {
        throw new Error('Mapbox access token no configurado');
      }

      // Usar la API de geocodificación de Mapbox
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${apiKey}&limit=1&country=MX`
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const coords = {
          lng: feature.center[0],
          lat: feature.center[1]
        };

        // Guardar en cache con información adicional
        addressCache.set(address, coords, feature.place_name || address);
        console.log('✅ Address geocoded and cached:', feature.place_name || address);
        return coords;
      } else {
        throw new Error('No se encontraron resultados');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  };

  // Función para inicializar el mapa
  const initializeMap = useCallback(async () => {
    if (!mapContainerRef.current || !coordinates) return;

    const apiKey = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!apiKey) {
      setMapError('Mapbox access token no configurado');
      return;
    }

    try {
      // Configurar el token de acceso
      mapboxgl.accessToken = apiKey;

      // Crear el mapa
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [coordinates.lng, coordinates.lat],
        zoom: MAP_CONFIG.DEFAULT_ZOOM,
        attributionControl: false
      });

      mapRef.current = map;

      // Crear elemento HTML personalizado para el marcador
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="12" fill="#10b981" stroke="white" stroke-width="2"/>
          <path d="M16 8C13.7909 8 12 9.79086 12 12C12 14.2091 13.7909 16 16 16C18.2091 16 20 14.2091 20 12C20 9.79086 18.2091 8 16 8Z" fill="white"/>
        </svg>
      `;
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.cursor = 'pointer';

      // Crear marcador
      const marker = new mapboxgl.Marker(el)
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map);

      markerRef.current = marker;

      // Crear popup
      const popup = new mapboxgl.Popup({ offset: 25, closeOnClick: true })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${serviceName}</h3>
            <p class="text-sm text-gray-600">${address}</p>
          </div>
        `);

      marker.setPopup(popup);

      // Mostrar popup al hacer clic en el marcador
      marker.getElement().addEventListener('click', () => {
        popup.addTo(map);
      });

      // Esperar a que el mapa cargue completamente
      map.on('load', () => {
        setMapLoaded(true);
      });

      map.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Error al cargar el mapa');
      });

      // Agregar controles de navegación
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
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

    // Cleanup: destruir el mapa cuando el componente se desmonte
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [coordinates, initializeMap]);

  // Función para abrir en Mapbox
  const openInMapbox = () => {
    if (coordinates) {
      const url = `https://www.mapbox.com/directions/?destination=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.mapbox.com/directions/?destination=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
  };

  // Función para obtener direcciones (usando Google Maps como fallback ya que Mapbox no tiene direcciones web)
  const getDirections = () => {
    if (coordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
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
            onClick={getDirections}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir ubicación
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
            <div className="h-4 w-32 bg-muted rounded animate-pulse mx-auto" />
          </div>
        </div>
      )}

      {/* Mapa */}
      <div ref={mapContainerRef} className="w-full h-full rounded-lg" />

      {/* Botones de acción */}
      {mapLoaded && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
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
            onClick={openInMapbox}
            className="flex items-center gap-2 shadow-lg"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir
          </Button>
        </div>
      )}

      {/* Información de la dirección */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
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
