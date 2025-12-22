"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Image as ImageIcon, Video, Headphones, FileText, Loader2, X } from "lucide-react";
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
  const [evidenceType, setEvidenceType] = useState<'text' | 'photo' | 'video' | 'audio' | 'none'>('text');
  const [notes, setNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      formData.append('evidence_type', evidenceType);

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
      toast.success("Archivo subido exitosamente");

    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir el archivo');
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

    if (evidenceType !== 'none' && !evidenceUrl && evidenceType !== 'text') {
      toast.error("Por favor sube la evidencia o cambia el tipo a 'Solo texto'");
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
          evidence_type: evidenceType === 'none' ? 'text' : evidenceType,
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
      setEvidenceType('text');

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

  const getFileIcon = () => {
    switch (evidenceType) {
      case 'photo': return ImageIcon;
      case 'video': return Video;
      case 'audio': return Headphones;
      default: return FileText;
    }
  };

  const FileIcon = getFileIcon();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="mb-2 block">Tipo de evidencia</Label>
        <RadioGroup
          value={evidenceType}
          onValueChange={(value) => {
            setEvidenceType(value as typeof evidenceType);
            setEvidenceUrl(null); // Reset evidence when changing type
          }}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="text" id="text" />
            <Label htmlFor="text" className="cursor-pointer">Solo texto</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="photo" id="photo" />
            <Label htmlFor="photo" className="cursor-pointer">Foto</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="video" id="video" />
            <Label htmlFor="video" className="cursor-pointer">Video</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="audio" id="audio" />
            <Label htmlFor="audio" className="cursor-pointer">Audio</Label>
          </div>
        </RadioGroup>
      </div>

      {evidenceType !== 'none' && evidenceType !== 'text' && (
        <div>
          <Label className="mb-2 block">
            Subir {evidenceType === 'photo' ? 'foto' : evidenceType === 'video' ? 'video' : 'audio'}
          </Label>
          <div className="space-y-2">
            {evidenceUrl ? (
              <div className="relative">
                {evidenceType === 'photo' ? (
                  <div className="relative h-48 w-full rounded-lg overflow-hidden border">
                    <Image
                      src={evidenceUrl}
                      alt="Evidencia"
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
                ) : (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-8 w-8 text-muted-foreground" />
                      <span className="font-medium">Archivo subido</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveEvidence}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={
                    evidenceType === 'photo' ? 'image/*' :
                    evidenceType === 'video' ? 'video/*' :
                    'audio/*'
                  }
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
                      <Upload className="h-4 w-4 mr-2" />
                      Subir {evidenceType === 'photo' ? 'foto' : evidenceType === 'video' ? 'video' : 'audio'}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="notes" className="mb-2 block">
          Notas del día {dayNumber}
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="¿Cómo te sentiste hoy? ¿Qué lograste?"
          rows={4}
        />
      </div>

      <Button
        type="submit"
        disabled={submitting || uploading || (evidenceType !== 'text' && evidenceType !== 'none' && !evidenceUrl)}
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
