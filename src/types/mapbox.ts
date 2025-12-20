// Tipos para Mapbox GL

export interface MapboxCoordinates {
  lat: number;
  lng: number;
}

export interface MapboxGeocodingResult {
  features: Array<{
    center: [number, number];
    place_name: string;
  }>;
}

export interface AddressCacheEntry {
  coordinates: MapboxCoordinates;
  timestamp: number;
  formatted_address: string;
}

export const MAP_CONFIG = {
  DEFAULT_ZOOM: 15,
  DEFAULT_CENTER: { lat: 19.4326, lng: -99.1332 }, // Ciudad de México
  MAX_CACHE_SIZE: 100,
  CACHE_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 días en milisegundos
};
