"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface GoogleMapProps {
  address: string;
  className?: string;
  height?: string;
}

export default function GoogleMap({ 
  address, 
  className = "w-full h-64 rounded-lg", 
  height = "h-64" 
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Verificar si hay API key
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setError("API key de Google Maps no configurada");
          setIsLoading(false);
          return;
        }

        // Inicializar el loader de Google Maps
        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places", "geometry"],
        });

        const { Map } = await loader.importLibrary("maps");
        const { Geocoder } = await loader.importLibrary("geocoding");
        const { Marker } = await loader.importLibrary("marker");
        const { Animation } = await loader.importLibrary("maps");

        if (!mapRef.current) return;

        // Crear el mapa
        const map = new Map(mapRef.current, {
          center: { lat: 19.4326, lng: -99.1332 }, // Ciudad de México por defecto
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        // Geocodificar la dirección
        const geocoder = new Geocoder();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        geocoder.geocode({ address }, (results: any, status: string) => {
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            
            // Centrar el mapa en la ubicación encontrada
            map.setCenter(location);
            
            // Agregar marcador
            new Marker({
              position: location,
              map: map,
              title: address,
              animation: Animation.DROP,
            });
          } else {
            setError("No se pudo encontrar la ubicación");
          }
          setIsLoading(false);
        });

      } catch (err) {
        console.error("Error al cargar el mapa:", err);
        setError("Error al cargar el mapa");
        setIsLoading(false);
      }
    };

    if (address) {
      initMap();
    }
  }, [address]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted/50 border border-border`}>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">⚠️ Error al cargar el mapa</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} flex items-center justify-center bg-muted/50 border border-border`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Cargando mapa...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        style={{ minHeight: height }}
      />
    </div>
  );
}
