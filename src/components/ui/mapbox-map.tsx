"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

// Importar estilos de Mapbox
import "mapbox-gl/dist/mapbox-gl.css";

interface MapboxMapProps {
  address: string;
  className?: string;
  height?: string;
}

export default function MapboxMap({ 
  address, 
  className = "w-full h-64 rounded-lg", 
  height = "h-64" 
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Verificar si hay access token
        const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        if (!accessToken) {
          setError("Mapbox access token no configurado");
          setIsLoading(false);
          return;
        }

        if (!mapContainer.current) return;

        // Configurar el access token
        mapboxgl.accessToken = accessToken;

        // Crear el mapa con estilo moderno
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/streets-v12", // Estilo moderno
          center: [-99.1332, 19.4326], // Ciudad de México por defecto
          zoom: 15,
          pitch: 0,
          bearing: 0,
          antialias: true,
        });

        // Asegurar que el mapa se ajuste al contenedor
        map.current.on('load', () => {
          if (map.current) {
            map.current.resize();
          }
        });

        // Agregar controles de navegación
        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Geocodificar la dirección usando la API de Mapbox
        const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${accessToken}&country=mx&limit=1`;

        const response = await fetch(geocodingUrl);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          const placeName = data.features[0].place_name;

          // Centrar el mapa en la ubicación encontrada
          map.current.setCenter([lng, lat]);

          // Crear un marcador personalizado moderno
          const markerElement = document.createElement("div");
          markerElement.className = "custom-marker";
          markerElement.style.cssText = `
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            background: #3b82f6;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: rotate(-45deg);
            cursor: pointer;
            transition: all 0.2s ease;
          `;

          // Agregar el marcador al mapa
          new mapboxgl.Marker(markerElement)
            .setLngLat([lng, lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div class="p-2">
                    <h3 class="font-semibold text-gray-900">${placeName}</h3>
                    <p class="text-sm text-gray-600">${address}</p>
                  </div>
                `)
            )
            .addTo(map.current);

        } else {
          setError("No se pudo encontrar la ubicación");
        }

        setIsLoading(false);

      } catch (err) {
        console.error("Error al cargar el mapa:", err);
        setError("Error al cargar el mapa");
        setIsLoading(false);
      }
    };

    if (address) {
      initMap();
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [address]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200`}>
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-blue-900 mb-1">Mapa no disponible</p>
          <p className="text-xs text-blue-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200`}>
          <div className="text-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <div className="h-4 w-32 bg-blue-100 rounded animate-pulse mx-auto" />
            <p className="text-xs text-blue-700 mt-1">Mapbox</p>
          </div>
        </div>
      )}
      <div 
        ref={mapContainer} 
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        style={{ 
          minHeight: height,
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
}
