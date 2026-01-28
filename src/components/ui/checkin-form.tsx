"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Image as ImageIcon, Loader2, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import Image from "next/image";

interface CheckinFormProps {
  challengePurchaseId: string;
  dayNumber: number;
  challengeDurationDays?: number;
  onCheckinComplete?: () => void;
}

export function CheckinForm({
  challengePurchaseId,
  dayNumber,
  challengeDurationDays,
  onCheckinComplete,
}: CheckinFormProps) {
  const [notes, setNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor selecciona una imagen válida");
      return;
    }

    try {
      setUploading(true);

      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 10MB");
        return;
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('challenge_purchase_id', challengePurchaseId);
      formData.append('evidence_type', 'photo');

      // Subir archivo
      const response = await fetch('/api/challenges/checkins/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir el archivo');
      }

      setEvidenceUrl(data.url);
      toast.success("Imagen subida exitosamente");

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveEvidence = () => {
    setEvidenceUrl(null);
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

      const response = await fetch('/api/challenges/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challenge_purchase_id: challengePurchaseId,
          day_number: dayNumber,
          evidence_type: evidenceUrl ? 'photo' : 'text',
          evidence_url: evidenceUrl,
          notes: notes || null,
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
      
      // Reset form
      setNotes("");
      setEvidenceUrl(null);

      if (onCheckinComplete) {
        onCheckinComplete();
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

      {/* Subir imagen (opcional) */}
      <div>
        <Label className="mb-2 block">Imagen (opcional)</Label>
        <div className="space-y-2">
          {evidenceUrl ? (
            <div className="relative">
              <div className="relative h-48 w-full rounded-lg overflow-hidden border">
                <Image
                  src={evidenceUrl}
                  alt="Imagen del check-in"
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
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
                accept="image/*"
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
                    Subir imagen
                  </>
                )}
              </Button>
            </>
          )}
        </div>
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
