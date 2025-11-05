"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface License {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface HolisticCenterLicenseUploaderProps {
  centerId: string;
  centerName: string;
}

export function HolisticCenterLicenseUploader({
  centerId,
  centerName,
}: HolisticCenterLicenseUploaderProps) {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchLicenses();
  }, [centerId]);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("holistic_center_licenses")
        .select("*")
        .eq("center_id", centerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLicenses(data || []);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      toast.error("Error al cargar las licencias");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Tipo de archivo no válido. Solo PDF e imágenes.");
      return;
    }

    // Validar tamaño (10MB)
    if (file.size > 10485760) {
      toast.error("El archivo es muy grande. Máximo 10MB.");
      return;
    }

    try {
      setUploading(true);

      // Generar ID único para la licencia
      const licenseId = crypto.randomUUID();
      const fileExt = file.name.split(".").pop();
      const filePath = `${centerId}/licenses/${licenseId}.${fileExt}`;

      // Subir archivo al storage
      const { error: uploadError } = await supabase.storage
        .from("holistic-centers")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from("holistic-centers")
        .getPublicUrl(filePath);

      // Guardar registro en la base de datos
      const { error: dbError } = await supabase
        .from("holistic_center_licenses")
        .insert({
          id: licenseId,
          center_id: centerId,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      toast.success("Licencia subida exitosamente");
      fetchLicenses();

      // Reset input
      event.target.value = "";
    } catch (error) {
      console.error("Error uploading license:", error);
      toast.error("Error al subir la licencia");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (license: License) => {
    if (!confirm(`¿Eliminar ${license.file_name}?`)) return;

    try {
      // Eliminar del storage
      const filePath = license.file_url.split("/holistic-centers/")[1];
      const { error: storageError } = await supabase.storage
        .from("holistic-centers")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from("holistic_center_licenses")
        .delete()
        .eq("id", license.id);

      if (dbError) throw dbError;

      toast.success("Licencia eliminada");
      fetchLicenses();
    } catch (error) {
      console.error("Error deleting license:", error);
      toast.error("Error al eliminar la licencia");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === "application/pdf") {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-semibold">Licencias del Centro</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Sube las licencias y documentos legales del centro (PDF o imágenes, máx. 10MB)
        </p>
      </div>

      {/* Upload Button */}
      <div>
        <input
          type="file"
          id="license-upload"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
        <label htmlFor="license-upload">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            asChild
          >
            <span className="cursor-pointer">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Licencia
                </>
              )}
            </span>
          </Button>
        </label>
      </div>

      {/* Licenses List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : licenses.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            No hay licencias subidas aún
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {licenses.map((license) => (
            <Card key={license.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {getFileIcon(license.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {license.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(license.file_size)} • {" "}
                    {new Date(license.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(license.file_url, "_blank")}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(license)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
