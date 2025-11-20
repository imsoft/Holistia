"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, Upload, X, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface PDFUploaderProps {
  entityType: "restaurant" | "shop";
  entityId: string;
  entityName: string;
  currentPdfUrl?: string | null;
  onPdfUpdated: (pdfUrl: string | null) => void;
  label?: string;
  description?: string;
}

export function PDFUploader({
  entityType,
  entityId,
  entityName,
  currentPdfUrl,
  onPdfUpdated,
  label = "Subir PDF",
  description = "Sube un archivo PDF (máximo 10MB)",
}: PDFUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(currentPdfUrl || null);
  const supabase = createClient();

  const bucketName = entityType === "restaurant" ? "restaurants" : "shops";
  const fileName = entityType === "restaurant" ? "menu.pdf" : "catalog.pdf";

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea un PDF
    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF");
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no puede ser mayor a 10MB");
      return;
    }

    setUploading(true);

    try {
      // Crear nombre de archivo único basado en el entityName
      const sanitizedName = entityName.toLowerCase().replace(/\s+/g, "-");
      const timestamp = Date.now();
      const filePath = `${entityId}/${fileName}`;

      // Eliminar PDF anterior si existe
      if (pdfUrl) {
        const oldPath = pdfUrl.split(`/${bucketName}/`)[1];
        if (oldPath) {
          await supabase.storage.from(bucketName).remove([oldPath]);
        }
      }

      // Subir nuevo PDF
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const newPdfUrl = urlData.publicUrl;
      setPdfUrl(newPdfUrl);
      onPdfUpdated(newPdfUrl);

      toast.success("PDF subido exitosamente");
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast.error("Error al subir el PDF");
    } finally {
      setUploading(false);
      // Limpiar el input
      e.target.value = "";
    }
  };

  const handleRemovePdf = async () => {
    if (!pdfUrl) return;

    if (!confirm("¿Estás seguro de eliminar este PDF?")) return;

    setUploading(true);

    try {
      // Eliminar del storage
      const filePath = pdfUrl.split(`/${bucketName}/`)[1];
      if (filePath) {
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([filePath]);

        if (error) throw error;
      }

      setPdfUrl(null);
      onPdfUpdated(null);
      toast.success("PDF eliminado exitosamente");
    } catch (error) {
      console.error("Error removing PDF:", error);
      toast.error("Error al eliminar el PDF");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      {pdfUrl ? (
        <div className="border-2 border-dashed rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm font-medium">PDF cargado</p>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  Ver PDF
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemovePdf}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Eliminar
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Aún no has subido un PDF
          </p>
          <label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={(e) => {
                e.preventDefault();
                (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
              }}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar PDF
                </>
              )}
            </Button>
          </label>
        </div>
      )}
    </div>
  );
}
