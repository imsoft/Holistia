"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

const ReactPlayer = dynamic(() => import("react-player").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
      Cargando reproductor…
    </div>
  ),
});

export interface VideoPlayerProps {
  /** URL del vídeo (blob:, https:, etc.). */
  url: string;
  /** Clase del contenedor (ej. para tamaño). */
  className?: string;
  /** Si true, el reproductor ocupa todo el contenedor (aspect-video recomendado en el padre). */
  fill?: boolean;
  /** Mostrar controles (play, volumen, etc.). Por defecto true. */
  controls?: boolean;
  /** Vídeo silenciado (útil para miniaturas). Por defecto false. */
  muted?: boolean;
  /** Callback cuando falla la carga. */
  onError?: () => void;
}

/**
 * Reproductor de vídeo compatible con URLs de Supabase Storage y blob.
 * Usa react-player para mejor compatibilidad entre navegadores y CORS.
 */
export function VideoPlayer({ url, className = "", fill = true, controls = true, muted = false, onError }: VideoPlayerProps) {
  const [error, setError] = useState(false);

  const handleError = useCallback(() => {
    setError(true);
    onError?.();
  }, [onError]);

  if (!url) return null;

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground bg-muted rounded-lg ${className}`}
      >
        <p>No se pudo cargar el vídeo.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline font-medium"
        >
          Abrir o descargar vídeo
        </a>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg bg-black ${fill ? "w-full h-full" : ""} ${className}`}>
      <ReactPlayer
        src={url}
        controls={controls}
        muted={muted}
        playsInline
        width={fill ? "100%" : undefined}
        height={fill ? "100%" : undefined}
        style={fill ? { position: "absolute", top: 0, left: 0 } : undefined}
        onError={handleError}
      />
    </div>
  );
}
