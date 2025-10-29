// Tipos para Mapbox GL

export interface MapboxCoordinates {
  lat: number;
  lng: number;
}

export interface MapboxGeocodingResult {
  features: Array<{
    center: [number, number]; // [lng, lat]
    place_name: string;
    geometry: {
      type: string;
      coordinates: [number, number];
    };
    properties: {
      accuracy?: string;
    };
  }>;
  query: string[];
}

// Cache para direcciones
export interface AddressCacheEntry {
  coordinates: MapboxCoordinates;
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
