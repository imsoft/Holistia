"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WellnessAreasSelector } from "@/components/ui/wellness-areas-selector";
import { Upload, X, Loader2, Plus, Trash2, BookOpen, Headphones, Video, FileText, ExternalLink, File } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface ChallengeFormProps {
  userId: string;
  challenge?: any | null;
  redirectPath: string;
  userType?: 'professional' | 'patient' | 'admin'; // Tipo de usuario creando el reto
  professionalId?: string | null; // ID del profesional para asignar el reto (solo para creación)
}

interface ChallengeFormData {
  title: string;
  description: string;
  cover_image_url: string;
  duration_days: string;
  difficulty_level: string;
  category: string;
  wellness_areas: string[];
  linked_professional_id: string;
  price: string;
  currency: string;
  is_active: boolean;
}

interface ResourceFormData {
  title: string;
  description: string;
  resource_type: 'ebook' | 'audio' | 'video' | 'pdf' | 'link' | 'other';
  url: string;
  pages_count?: string;
  duration_minutes?: string;
  file_size_mb?: string;
}

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
  { value: 'expert', label: 'Experto' },
] as const;

const RESOURCE_TYPE_OPTIONS = [
  { value: 'ebook', label: 'eBook', icon: BookOpen },
  { value: 'audio', label: 'Audio', icon: Headphones },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'pdf', label: 'Documento PDF', icon: FileText },
  { value: 'link', label: 'Enlace externo', icon: ExternalLink },
  { value: 'other', label: 'Otro', icon: File },
] as const;

export function ChallengeForm({ userId, challenge, redirectPath, userType = 'patient', professionalId }: ChallengeFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isProfessional = userType === 'professional';

  const [formData, setFormData] = useState<ChallengeFormData>({
    title: "",
    description: "",
    cover_image_url: "",
    duration_days: "",
    difficulty_level: "",
    category: "",
    wellness_areas: [],
    linked_professional_id: "none",
    price: "",
    currency: "MXN",
    is_active: true,
  });

  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileInputRef = React.useRef<HTMLInputElement>(null);
  const [resources, setResources] = useState<ResourceFormData[]>([]);
  const [editingResourceIndex, setEditingResourceIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  // Si es profesional, vincular automáticamente al profesional actual
  useEffect(() => {
    if (isProfessional && userId && formData.linked_professional_id === "none") {
      // Buscar el professional_id basado en el user_id
      const findProfessionalId = async () => {
        try {
          const { data: professionalData } = await supabase
            .from('professional_applications')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'approved')
            .single();

          if (professionalData) {
            setFormData({ ...formData, linked_professional_id: professionalData.id });
          }
        } catch (error) {
          console.error('Error finding professional ID:', error);
        }
      };
      findProfessionalId();
    }
  }, [isProfessional, userId]);

  useEffect(() => {
    if (challenge) {
      setFormData({
        title: challenge.title,
        description: challenge.description,
        cover_image_url: challenge.cover_image_url || "",
        duration_days: challenge.duration_days?.toString() || "",
        difficulty_level: challenge.difficulty_level || "",
        category: challenge.category || "",
        wellness_areas: challenge.wellness_areas || [],
        linked_professional_id: challenge.linked_professional_id || "none",
        price: challenge.price?.toString() || "",
        currency: challenge.currency || "MXN",
        is_active: challenge.is_active,
      });
    }
  }, [challenge]);

  const fetchProfessionals = async () => {
    try {
      setLoadingProfessionals(true);
      const { data, error } = await supabase
        .from('professional_applications')
        .select('id, first_name, last_name, profession, is_verified')
        .eq('status', 'approved')
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error cargando profesionales:', error);
        return;
      }

      setProfessionals(data || []);
    } catch (error) {
      console.error("Error fetching professionals:", error);
    } finally {
      setLoadingProfessionals(false);
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. El tamaño máximo es 5MB.');
      return;
    }

    try {
      setUploadingCover(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      let challengeId = challenge?.id;

      // Si estamos creando (no hay challenge.id), crear reto temporal
      if (!challengeId) {
        const tempChallenge = {
          created_by_user_id: user.id,
          created_by_type: 'patient',
          title: formData.title || "Nuevo Reto",
          description: formData.description || "",
          linked_professional_id: formData.linked_professional_id && formData.linked_professional_id !== 'none' ? formData.linked_professional_id : null,
          is_active: false,
        };

        const response = await fetch('/api/challenges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tempChallenge),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al crear reto temporal");

        challengeId = data.challenge.id;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `cover.${fileExt}`;
      const filePath = `${challengeId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('challenges')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('challenges')
        .getPublicUrl(filePath);

      setFormData({ ...formData, cover_image_url: publicUrl });
      toast.success("Imagen de portada subida exitosamente");

    } catch (error) {
      console.error("Error uploading cover image:", error);
      toast.error("Error al subir la imagen de portada");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim() || !formData.description?.trim()) {
      toast.error("Por favor completa el título y la descripción");
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Validar precio si es profesional
      if (isProfessional && formData.price && parseFloat(formData.price) < 0) {
        toast.error("El precio no puede ser negativo");
        return;
      }

      // Si es profesional, obtener el professional_id basado en user_id
      let finalProfessionalId = professionalId || challenge?.professional_id;
      if (isProfessional && !finalProfessionalId) {
        const { data: professionalData } = await supabase
          .from('professional_applications')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .single();
        
        if (professionalData) {
          finalProfessionalId = professionalData.id;
        }
      }

      const challengeData = {
        professional_id: finalProfessionalId || null,
        created_by_user_id: user.id,
        created_by_type: userType,
        title: formData.title.trim(),
        description: formData.description.trim(),
        short_description: null,
        cover_image_url: formData.cover_image_url || null,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
        difficulty_level: formData.difficulty_level || null,
        category: formData.category || null,
        wellness_areas: formData.wellness_areas || [],
        linked_professional_id: formData.linked_professional_id && formData.linked_professional_id !== 'none' ? formData.linked_professional_id : null,
        price: isProfessional && formData.price ? parseFloat(formData.price) : null,
        currency: isProfessional && formData.price ? formData.currency : null,
        is_active: formData.is_active,
      };

      let createdChallengeId: string;

      if (challenge && challenge.id) {
        // Actualizar reto existente
        const response = await fetch(`/api/challenges/${challenge.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(challengeData),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al actualizar reto");

        createdChallengeId = challenge.id;
        toast.success("Reto actualizado exitosamente");
      } else {
        // Crear nuevo reto
        const response = await fetch('/api/challenges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(challengeData),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Error al crear reto");

        createdChallengeId = data.challenge.id;
        toast.success("Reto creado exitosamente");
      }

      // Guardar recursos si hay alguno
      if (resources.length > 0 && createdChallengeId) {
        try {
          for (let i = 0; i < resources.length; i++) {
            const resource = resources[i];
            if (!resource.title.trim() || !resource.url.trim()) {
              continue; // Saltar recursos incompletos
            }

            const resourceData: any = {
              challenge_id: createdChallengeId,
              title: resource.title.trim(),
              description: resource.description?.trim() || null,
              resource_type: resource.resource_type,
              url: resource.url.trim(),
              display_order: i,
              is_active: true,
            };

            // Agregar campos específicos según el tipo
            if (resource.resource_type === 'ebook' || resource.resource_type === 'pdf') {
              // Para ebooks/PDFs, podríamos usar file_size_bytes si tenemos el tamaño
              // Por ahora solo guardamos la URL
            }

            if (resource.resource_type === 'audio' || resource.resource_type === 'video') {
              if (resource.duration_minutes) {
                resourceData.duration_minutes = parseInt(resource.duration_minutes);
              }
            }

            const resourceResponse = await fetch(`/api/challenges/${createdChallengeId}/resources`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(resourceData),
            });

            if (!resourceResponse.ok) {
              const errorData = await resourceResponse.json();
              console.error('Error guardando recurso:', errorData);
              // Continuar con los demás recursos aunque uno falle
            }
          }
        } catch (error) {
          console.error('Error guardando recursos:', error);
          // No bloquear la navegación si falla guardar recursos
          toast.error("El reto se creó pero algunos recursos no se pudieron guardar");
        }
      }

      router.push(redirectPath);
    } catch (error) {
      console.error("Error saving challenge:", error);
      toast.error(error instanceof Error ? error.message : "Error al guardar reto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="py-4">
          <CardTitle>{challenge ? "Editar Reto Personal" : "Crear Reto Personal"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {challenge
              ? "Modifica la información de tu reto personalizado"
              : "Crea tu propio reto personalizado. Podrás invitar hasta 5 amigos y opcionalmente vincularlo a un profesional para supervisión."}
          </p>
        </CardHeader>
        <CardContent className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Reto de Meditación 21 Días"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe el reto en detalle..."
              rows={5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linked_professional_id">
              {isProfessional ? "Profesional Vinculado" : "Vincular a Profesional (Opcional)"}
            </Label>
            <Select
              value={formData.linked_professional_id}
              onValueChange={(value) => setFormData({ ...formData, linked_professional_id: value })}
              disabled={loadingProfessionals || isProfessional}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingProfessionals ? "Cargando..." : isProfessional ? "Este reto está vinculado a ti" : "Selecciona un profesional (opcional)"} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {!isProfessional && <SelectItem value="none">Ninguno (Reto público)</SelectItem>}
                {professionals.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.first_name} {prof.last_name}{prof.profession ? ` - ${prof.profession}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isProfessional && (
              <p className="text-xs text-muted-foreground">
                Este reto se vinculará automáticamente a tu perfil profesional
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration_days">Duración (días)</Label>
              <Input
                id="duration_days"
                type="number"
                min="1"
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                placeholder="Ej: 21"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty_level">Nivel de Dificultad</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ej: Meditación, Fitness, Nutrición"
            />
          </div>

          <WellnessAreasSelector
            selectedAreas={formData.wellness_areas}
            onAreasChange={(areas) => setFormData({ ...formData, wellness_areas: areas })}
            label="Áreas de Bienestar"
            description="Selecciona las áreas de bienestar relacionadas con este reto"
          />

          {isProfessional && (
            <div className="space-y-2">
              <Label htmlFor="price">Precio (MXN)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Imagen de Portada</Label>
            <div className="space-y-3">
              {formData.cover_image_url ? (
                <div className="relative h-48 w-full rounded-lg overflow-hidden border-2 border-dashed border-muted">
                  <Image
                    src={formData.cover_image_url}
                    alt="Portada"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 shadow-lg"
                    onClick={() => setFormData({ ...formData, cover_image_url: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative h-48 w-full rounded-lg border-2 border-dashed border-muted bg-muted/10 flex flex-col items-center justify-center gap-2 hover:bg-muted/20 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Subir imagen de portada</p>
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => coverFileInputRef.current?.click()}
                    disabled={uploadingCover}
                  >
                    {uploadingCover ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      "Seleccionar Imagen"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección de Recursos */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recursos y Enlaces</CardTitle>
              <p className="text-sm text-muted-foreground">
                Agrega ebooks, audios, videos y otros recursos para los participantes
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setResources([...resources, {
                  title: "",
                  description: "",
                  resource_type: "link",
                  url: "",
                }]);
                setEditingResourceIndex(resources.length);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Recurso
            </Button>
          </div>
        </CardHeader>
        <CardContent className="py-4 space-y-4">
          {resources.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay recursos agregados. Haz clic en "Agregar Recurso" para comenzar.
            </p>
          ) : (
            resources.map((resource, index) => {
              const ResourceIcon = RESOURCE_TYPE_OPTIONS.find(opt => opt.value === resource.resource_type)?.icon || File;
              const isEditing = editingResourceIndex === index;
              const showPages = resource.resource_type === 'ebook' || resource.resource_type === 'pdf';
              const showDuration = resource.resource_type === 'audio' || resource.resource_type === 'video';

              return (
                <Card key={index} className="border-2">
                  <CardContent className="py-4 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ResourceIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">Recurso {index + 1}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setResources(resources.filter((_, i) => i !== index));
                          if (editingResourceIndex === index) {
                            setEditingResourceIndex(null);
                          } else if (editingResourceIndex !== null && editingResourceIndex > index) {
                            setEditingResourceIndex(editingResourceIndex - 1);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Título del Recurso *</Label>
                      <Input
                        value={resource.title}
                        onChange={(e) => {
                          const updated = [...resources];
                          updated[index].title = e.target.value;
                          setResources(updated);
                        }}
                        placeholder="Ej: Guía de Meditación"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Recurso *</Label>
                      <Select
                        value={resource.resource_type}
                        onValueChange={(value: 'ebook' | 'audio' | 'video' | 'pdf' | 'link' | 'other') => {
                          const updated = [...resources];
                          updated[index].resource_type = value;
                          // Limpiar campos específicos cuando cambia el tipo
                          if (value !== 'ebook' && value !== 'pdf') {
                            delete updated[index].pages_count;
                          }
                          if (value !== 'audio' && value !== 'video') {
                            delete updated[index].duration_minutes;
                          }
                          setResources(updated);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RESOURCE_TYPE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {option.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>URL del Recurso *</Label>
                      <Input
                        type="url"
                        value={resource.url}
                        onChange={(e) => {
                          const updated = [...resources];
                          updated[index].url = e.target.value;
                          setResources(updated);
                        }}
                        placeholder="https://ejemplo.com/recurso"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descripción (Opcional)</Label>
                      <Textarea
                        value={resource.description}
                        onChange={(e) => {
                          const updated = [...resources];
                          updated[index].description = e.target.value;
                          setResources(updated);
                        }}
                        placeholder="Descripción breve del recurso"
                        rows={2}
                      />
                    </div>

                    {showPages && (
                      <div className="space-y-2">
                        <Label>Número de Páginas</Label>
                        <Input
                          type="number"
                          min="0"
                          value={resource.pages_count || ""}
                          onChange={(e) => {
                            const updated = [...resources];
                            updated[index].pages_count = e.target.value;
                            setResources(updated);
                          }}
                          placeholder="Ej: 150"
                        />
                      </div>
                    )}

                    {showDuration && (
                      <div className="space-y-2">
                        <Label>Duración (minutos)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={resource.duration_minutes || ""}
                          onChange={(e) => {
                            const updated = [...resources];
                            updated[index].duration_minutes = e.target.value;
                            setResources(updated);
                          }}
                          placeholder="Ej: 30"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(redirectPath)}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            challenge ? "Actualizar Reto" : "Crear Reto"
          )}
        </Button>
      </div>
    </form>
  );
}
