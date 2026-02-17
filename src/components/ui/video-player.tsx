"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

/** Extrae la ruta del objeto en el bucket a partir de la URL pública de Supabase. */
function getStoragePathFromPublicUrl(publicUrl: string): string | null {
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/challenges\/(.+?)(?:\?|$)/);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return null;
}

/** Infiere el MIME type a partir de la extensión del archivo en la URL. */
function inferVideoMimeType(url: string): string {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".webm")) return "video/webm";
  if (clean.endsWith(".mov")) return "video/quicktime";
  return "video/mp4";
}

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
 *
 * Estrategia:
 * 1. URLs blob → se usan directamente (preview local).
 * 2. URLs públicas de Supabase Storage → se usan directamente (el bucket es público).
 * 3. Si la URL pública falla → se intenta con signed URL como fallback.
 */
export function VideoPlayer({ url, className = "", fill = true, controls = true, muted = false, onError }: VideoPlayerProps) {
  const [error, setError] = useState(false);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const triedSignedRef = useRef(false);

  useEffect(() => {
    setError(false);
    triedSignedRef.current = false;

    if (!url) {
      setPlayUrl(null);
      return;
    }

    // Usar la URL directamente (blob o pública) — sin signed URL innecesaria
    setPlayUrl(url);
  }, [url]);

  const handleError = useCallback(() => {
    // Si ya intentamos signed URL, no hay más que hacer
    if (triedSignedRef.current) {
      setError(true);
      setLoading(false);
      onError?.();
      return;
    }

    // Intentar con signed URL como fallback (por si la URL pública tiene problemas de cache/CORS)
    const path = getStoragePathFromPublicUrl(url);
    if (!path) {
      setError(true);
      onError?.();
      return;
    }

    triedSignedRef.current = true;
    setLoading(true);
    const supabase = createClient();
    supabase.storage
      .from("challenges")
      .createSignedUrl(path, 3600)
      .then(({ data, error: err }) => {
        if (!err && data?.signedUrl) {
          setPlayUrl(data.signedUrl);
          setError(false);
        } else {
          console.warn("Signed URL fallback falló:", err?.message);
          setError(true);
          onError?.();
        }
      })
      .catch(() => {
        setError(true);
        onError?.();
      })
      .finally(() => setLoading(false));
  }, [url, onError]);

  const handleLoadedData = useCallback(() => {
    setError(false);
    setLoading(false);
  }, []);

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

  if (loading || playUrl === null) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg ${className}`} style={fill ? { minHeight: 200 } : undefined}>
        <span className="text-sm text-muted-foreground">Cargando vídeo…</span>
      </div>
    );
  }

  const mimeType = inferVideoMimeType(url);

  return (
    <div className={`relative overflow-hidden rounded-lg bg-black ${fill ? "w-full h-full" : ""} ${className}`}>
      <video
        key={playUrl}
        controls={controls}
        muted={muted}
        playsInline
        preload="metadata"
        className="w-full h-full object-contain"
        onError={handleError}
        onLoadedData={handleLoadedData}
      >
        <source src={playUrl} type={mimeType} />
      </video>
    </div>
  );
}
