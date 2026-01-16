"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  BookOpen,
  Headphones,
  Video,
  FileText,
  ExternalLink,
  File,
  Plus,
  Trash2,
  Edit,
  GripVertical,
  Loader2,
} from "lucide-react";
import { ChallengeResource } from "@/types/challenge";

interface ChallengeResourcesManagerProps {
  challengeId: string;
  isReadOnly?: boolean;
}

const RESOURCE_TYPE_OPTIONS = [
  { value: "ebook", label: "eBook", icon: BookOpen },
  { value: "audio", label: "Audio", icon: Headphones },
  { value: "video", label: "Video", icon: Video },
  { value: "pdf", label: "Documento PDF", icon: FileText },
  { value: "link", label: "Enlace externo", icon: ExternalLink },
  { value: "other", label: "Otro", icon: File },
] as const;

interface ResourceFormData {
  title: string;
  description: string;
  resource_type: string;
  url: string;
}

const emptyFormData: ResourceFormData = {
  title: "",
  description: "",
  resource_type: "link",
  url: "",
};

export function ChallengeResourcesManager({
  challengeId,
  isReadOnly = false,
}: ChallengeResourcesManagerProps) {
  const [resources, setResources] = useState<ChallengeResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ResourceFormData>(emptyFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchResources();
  }, [challengeId]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("challenge_resources")
        .select("*")
        .eq("challenge_id", challengeId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      setResources(data || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast.error("Error al cargar los recursos");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData(emptyFormData);
  };

  const handleEdit = (resource: ChallengeResource) => {
    setEditingId(resource.id);
    setIsAdding(false);
    setFormData({
      title: resource.title,
      description: resource.description || "",
      resource_type: resource.resource_type,
      url: resource.url,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(emptyFormData);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.url.trim()) {
      toast.error("Título y URL son obligatorios");
      return;
    }

    try {
      setSubmitting(true);

      const resourceData = {
        challenge_id: challengeId,
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        resource_type: formData.resource_type,
        url: formData.url.trim(),
        display_order: editingId
          ? undefined
          : resources.length > 0
          ? Math.max(...resources.map((r) => r.display_order)) + 1
          : 0,
        is_active: true,
      };

      if (editingId) {
        const { error } = await supabase
          .from("challenge_resources")
          .update(resourceData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Recurso actualizado correctamente");
      } else {
        const { error } = await supabase
          .from("challenge_resources")
          .insert([resourceData]);

        if (error) throw error;
        toast.success("Recurso agregado correctamente");
      }

      handleCancel();
      await fetchResources();
    } catch (error) {
      console.error("Error saving resource:", error);
      toast.error("Error al guardar el recurso");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("challenge_resources")
        .update({ is_active: false })
        .eq("id", deletingId);

      if (error) throw error;

      toast.success("Recurso eliminado correctamente");
      setDeleteDialogOpen(false);
      setDeletingId(null);
      await fetchResources();
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Error al eliminar el recurso");
    }
  };

  const getResourceIcon = (type: string) => {
    const option = RESOURCE_TYPE_OPTIONS.find((opt) => opt.value === type);
    if (!option) return File;
    return option.icon;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recursos del Reto</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Agrega enlaces, archivos y materiales de apoyo para los
              participantes
            </p>
          </div>
          {!isReadOnly && !isAdding && !editingId && (
            <Button onClick={handleAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Recurso
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resource Form */}
        {(isAdding || editingId) && (
          <Card className="border-2 border-primary/20 bg-muted/30 py-4">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resource-title">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="resource-title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Nombre del recurso"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource-type">Tipo de Recurso</Label>
                <Select
                  value={formData.resource_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, resource_type: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource-url">
                  URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="resource-url"
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://ejemplo.com/recurso"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource-description">
                  Descripción (Opcional)
                </Label>
                <Textarea
                  id="resource-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción breve del recurso"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : editingId ? (
                    "Actualizar"
                  ) : (
                    "Agregar"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resources List */}
        {resources.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay recursos agregados aún</p>
            {!isReadOnly && (
              <p className="text-sm mt-2">
                Haz clic en &quot;Agregar Recurso&quot; para comenzar
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {resources.map((resource) => {
              const Icon = getResourceIcon(resource.resource_type);
              const resourceType = RESOURCE_TYPE_OPTIONS.find(
                (opt) => opt.value === resource.resource_type
              );

              return (
                <Card key={resource.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {!isReadOnly && (
                        <div className="mt-1 cursor-move">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}

                      <div className="mt-1">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{resource.title}</h4>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {resource.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Icon className="h-3 w-3" />
                            {resourceType?.label}
                          </span>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Ver recurso ↗
                          </a>
                        </div>
                      </div>

                      {!isReadOnly && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(resource)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(resource.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar recurso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El recurso será eliminado
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
