// Tipos para Google Maps API
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

export interface GoogleMapsCoordinates {
  lat: number;
  lng: number;
}

export interface GoogleMapsGeocodingResult {
  address_components: unknown[];
  formatted_address: string;
  geometry: {
    location: unknown;
    location_type: string;
    viewport: unknown;
  };
  place_id: string;
  types: string[];
}

export interface GoogleMapsMapOptions {
  zoom: number;
  center: GoogleMapsCoordinates;
  mapTypeId: string;
  styles?: unknown[];
}

export interface GoogleMapsMarkerOptions {
  position: GoogleMapsCoordinates;
  map: unknown;
  title: string;
  icon?: string | unknown;
}

export interface GoogleMapsInfoWindowOptions {
  content: string;
  position?: GoogleMapsCoordinates;
}

// Cache para direcciones
export interface AddressCacheEntry {
  coordinates: GoogleMapsCoordinates;
  timestamp: number;
  formatted_address: string;
}

// Configuración del mapa
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 15,
  DEFAULT_CENTER: {
    lat: 19.4326, // Ciudad de México
    lng: -99.1332
  },
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
  MAX_CACHE_SIZE: 100 // Máximo 100 direcciones en cache
} as const;
