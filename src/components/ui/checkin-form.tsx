"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Image as ImageIcon, Loader2, X, Globe, Lock, Info } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Image from "next/image";
import { convertMovToMp4, isMovFile } from "@/lib/mov-to-mp4";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VideoPlayer } from "@/components/ui/video-player";

interface CheckinFormProps {
  challengePurchaseId: string;
  dayNumber: number;
  challengeDurationDays?: number;
  onCheckinComplete?: (data?: { completed: true; challenge_purchase_id: string }) => void;
}

export function CheckinForm({
  challengePurchaseId,
  dayNumber,
  challengeDurationDays,
  onCheckinComplete,
}: CheckinFormProps) {
  const [notes, setNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  /** URL para mostrar el vídeo en la vista previa (signed; la pública puede fallar por CORS/cache). */
  const [evidenceVideoPreviewUrl, setEvidenceVideoPreviewUrl] = useState<string | null>(null);
  const [evidenceType, setEvidenceType] = useState<'photo' | 'video' | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error("No se pudo cargar el video"));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const sanitizeFileName = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
    let sanitized = nameWithoutExt
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[<>:"|?*\x00-\x1F]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9\-_]/g, '')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    if (!sanitized || sanitized.trim().length === 0) sanitized = 'imagen';
    return `${sanitized}${extension}`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error("Por favor selecciona una imagen o video válido");
      return;
    }

    const fileType: 'photo' | 'video' = isImage ? 'photo' : 'video';

    try {
      setUploading(true);

      // Límite 50MB: según docs Supabase Free = 50MB (Storage Settings → Global file size limit)
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      const maxSizeLabel = isVideo ? "50MB" : "10MB";
      if (file.size > maxSize) {
        toast.error(`El archivo es demasiado grande. Máximo ${maxSizeLabel}`);
        return;
      }

      if (isVideo) {
        try {
          const duration = await getVideoDuration(file);
          if (duration > 30) {
            toast.error("El video no puede durar más de 30 segundos");
            return;
          }
        } catch {
          toast.error("No se pudo verificar la duración del video");
          return;
        }
      }

      // Convertir .mov a MP4 en el navegador para que se reproduzca en todos los dispositivos (Chrome, etc.)
      let fileToUpload = file;
      if (isVideo && isMovFile(file)) {
        try {
          toast.info("Convirtiendo a MP4 para compatibilidad…");
          fileToUpload = await convertMovToMp4(file);
        } catch (err) {
          console.error("Error converting MOV to MP4:", err);
          toast.error("No se pudo convertir el vídeo. Prueba subiendo un MP4.");
          return;
        }
      }

      // Subida directa a Supabase Storage para evitar límite de payload de Vercel (~4.5 MB)
      const sanitizedFileName = sanitizeFileName(fileToUpload.name);
      const fileName = `${Date.now()}-${sanitizedFileName}`;
      const filePath = `${challengePurchaseId}/evidence/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('challenges')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
          contentType: fileToUpload.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        });

      if (uploadError) {
        const msg = uploadError.message || 'Error al subir el archivo';
        if (msg.includes('policy') || msg.includes('403') || msg.includes('permission')) {
          throw new Error('No tienes permiso para subir a este reto. Verifica que seas participante.');
        }
        if (msg.toLowerCase().includes('mime') || msg.toLowerCase().includes('file type') || msg.toLowerCase().includes('not allowed')) {
          throw new Error('El bucket no permite vídeos. Contacta al administrador para habilitar MP4/WEBM/MOV.');
        }
        if (msg.toLowerCase().includes('file size') || msg.toLowerCase().includes('too large')) {
          throw new Error(isVideo ? 'El vídeo supera 50MB. Comprime o acorta el vídeo.' : 'La imagen supera 10MB.');
        }
        throw new Error(msg);
      }

      const { data: { publicUrl } } = supabase.storage.from('challenges').getPublicUrl(filePath);
      setEvidenceUrl(publicUrl);
      setEvidenceType(fileType);
      if (isVideo) {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
        }
        const blobUrl = URL.createObjectURL(fileToUpload);
        blobUrlRef.current = blobUrl;
        setEvidenceVideoPreviewUrl(blobUrl);
      } else {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
        setEvidenceVideoPreviewUrl(null);
      }
      toast.success(isVideo ? "Video subido exitosamente" : "Imagen subida exitosamente");
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir el archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveEvidence = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setEvidenceUrl(null);
    setEvidenceVideoPreviewUrl(null);
    setEvidenceType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que al menos haya notas o una imagen
    if (!notes.trim() && !evidenceUrl) {
      toast.error("Por favor completa la descripción o sube una imagen");
      return;
    }

    try {
      setSubmitting(true);

      const now = new Date();
      const checkinDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const response = await fetch('/api/challenges/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challenge_purchase_id: challengePurchaseId,
          checkin_date: checkinDate,
          evidence_type: evidenceUrl && evidenceType ? evidenceType : 'text',
          evidence_url: evidenceUrl,
          notes: notes || null,
          is_public: isPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el check-in');
      }

      // Mostrar badges desbloqueados si hay
      if (data.unlocked_badges && data.unlocked_badges.length > 0) {
        data.unlocked_badges.forEach((badge: any) => {
          toast.success(`🎉 ¡Badge desbloqueado! ${badge.badge_name} (+${badge.points_earned} puntos)`, {
            duration: 5000,
          });
        });
      }

      toast.success(`Check-in del día ${dayNumber} completado! +${data.checkin.points_earned} puntos`);
      
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setNotes("");
      setEvidenceUrl(null);
      setEvidenceVideoPreviewUrl(null);
      setEvidenceType(null);
      setIsPublic(false);

      if (onCheckinComplete) {
        if (data.completed && data.challenge_purchase_id) {
          onCheckinComplete({ completed: true, challenge_purchase_id: data.challenge_purchase_id });
        } else {
          onCheckinComplete();
        }
      }

    } catch (error) {
      console.error('Error submitting checkin:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear el check-in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Descripción del check-in */}
      <div>
        <Label htmlFor="notes" className="mb-2 block">
          Descripción del día {dayNumber}
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="¿Cómo te sentiste hoy? ¿Qué lograste?"
          rows={4}
        />
      </div>

      {/* Subir foto o video (opcional) */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Label>Foto o Video (opcional)</Label>
          <Tooltip>
            <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[260px] p-3">
                <div className="space-y-2 text-sm text-background">
                  <p className="font-semibold">Requisitos de la evidencia:</p>
                  <div>
                    <p className="font-medium">Foto:</p>
                    <ul className="list-disc list-inside opacity-90 mt-1 space-y-0.5">
                      <li>Formatos: JPG, PNG, WEBP, GIF</li>
                      <li>Tamaño máximo: 10MB</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Video:</p>
                    <ul className="list-disc list-inside opacity-90 mt-1 space-y-0.5">
                      <li>Formatos: MP4, WEBM, MOV (los .mov se convierten a MP4 automáticamente)</li>
                      <li>Tamaño máximo: 50MB</li>
                      <li>Duración máxima: 30 segundos</li>
                    </ul>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Fotos: máx 10MB • Videos: máx 50MB, 30 s (MP4, WEBM, MOV)
        </p>
        <div className="space-y-2">
          {evidenceUrl ? (
            <div className="relative">
              <div className="relative h-48 w-full rounded-lg overflow-hidden border">
                {evidenceType === 'video' ? (
                  <VideoPlayer
                    url={evidenceVideoPreviewUrl ?? evidenceUrl ?? ''}
                    className="w-full h-48"
                    fill
                  />
                ) : (
                  <Image
                    src={evidenceUrl}
                    alt="Imagen del check-in"
                    fill
                    className="object-cover"
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                  onClick={handleRemoveEvidence}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime,video/mov"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Subir foto o video
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Opción de privacidad */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-3">
          {isPublic ? (
            <Globe className="h-5 w-5 text-primary" />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <Label htmlFor="is-public" className="text-sm font-medium cursor-pointer">
              {isPublic ? "Público" : "Privado"}
            </Label>
            <p className="text-xs text-muted-foreground">
              {isPublic 
                ? "Este check-in será visible en el feed social" 
                : "Solo tú y el profesional pueden ver este check-in"}
            </p>
          </div>
        </div>
        <Switch
          id="is-public"
          checked={isPublic}
          onCheckedChange={setIsPublic}
          disabled={submitting}
        />
      </div>

      <Button
        type="submit"
        disabled={submitting || uploading || (!notes.trim() && !evidenceUrl)}
        className="w-full"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Guardando...
          </>
        ) : (
          `Completar Día ${dayNumber}`
        )}
      </Button>
    </form>
  );
}
