"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

/** Extrae la ruta del objeto en el bucket a partir de la URL pública de Supabase. */
function getStoragePathFromPublicUrl(publicUrl: string): string | null {
  // Formato: https://xxx.supabase.co/storage/v1/object/public/challenges/path/to/file.mp4
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
 * Usa elemento <video> nativo para mejor compatibilidad con Supabase Storage.
 */
export function VideoPlayer({ url, className = "", fill = true, controls = true, muted = false, onError }: VideoPlayerProps) {
  const [error, setError] = useState(false);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [triedSigned, setTriedSigned] = useState(false);

  useEffect(() => {
    setError(false);
    if (!url) {
      setPlayUrl(null);
      setLoading(false);
      setTriedSigned(false);
      return;
    }
    if (url.startsWith("blob:")) {
      setPlayUrl(url);
      setLoading(false);
      setTriedSigned(false);
      return;
    }
    const path = getStoragePathFromPublicUrl(url);
    if (path) {
      setLoading(true);
      setError(false);
      const supabase = createClient();
      supabase.storage
        .from("challenges")
        .createSignedUrl(path, 3600)
        .then(({ data, error: err }) => {
          if (!err && data?.signedUrl) {
            setPlayUrl(data.signedUrl);
            setTriedSigned(true);
          } else {
            console.warn("No se pudo crear URL firmada, usando URL pública:", err?.message);
            setPlayUrl(url);
            setTriedSigned(false);
          }
        })
        .catch((err) => {
          console.warn("Error al crear URL firmada, usando URL pública:", err);
          setPlayUrl(url);
          setTriedSigned(false);
        })
        .finally(() => setLoading(false));
    } else {
      setPlayUrl(url);
      setLoading(false);
      setTriedSigned(false);
    }
  }, [url]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = e.currentTarget;
    const errorCode = videoElement.error;
    let errorMsg = "Error desconocido";
    if (errorCode) {
      switch (errorCode.code) {
        case 1: errorMsg = "MEDIA_ERR_ABORTED - La carga fue abortada"; break;
        case 2: errorMsg = "MEDIA_ERR_NETWORK - Error de red"; break;
        case 3: errorMsg = "MEDIA_ERR_DECODE - Error al decodificar"; break;
        case 4: errorMsg = "MEDIA_ERR_SRC_NOT_SUPPORTED - Formato no soportado"; break;
      }
    }
    console.error("Error al cargar vídeo:", {
      error: errorMsg,
      code: errorCode?.code,
      url: playUrl || url,
      triedSigned,
      videoSrc: videoElement.src,
    });
    
    if (!triedSigned && playUrl === url) {
      const path = getStoragePathFromPublicUrl(url);
      if (path) {
        console.log("Intentando con URL firmada como fallback...");
        const supabase = createClient();
        supabase.storage
          .from("challenges")
          .createSignedUrl(path, 3600)
          .then(({ data, error: err }) => {
            if (!err && data?.signedUrl) {
              setPlayUrl(data.signedUrl);
              setTriedSigned(true);
              setError(false);
            } else {
              setError(true);
              onError?.();
            }
          })
          .catch(() => {
            setError(true);
            onError?.();
          });
        return;
      }
    }
    
    setError(true);
    onError?.();
  }, [onError, playUrl, url, triedSigned]);

  const handleLoadedData = useCallback(() => {
    setError(false);
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

  const src = playUrl;

  return (
    <div className={`relative overflow-hidden rounded-lg bg-black ${fill ? "w-full h-full" : ""} ${className}`}>
      <video
        key={src}
        src={src}
        controls={controls}
        muted={muted}
        playsInline
        preload="metadata"
        className="w-full h-full object-contain"
        onError={handleError}
        onLoadedData={handleLoadedData}
      />
    </div>
  );
}
