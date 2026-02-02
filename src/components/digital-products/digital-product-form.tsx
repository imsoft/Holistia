"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import {
  Trash2,
  Upload,
  ImageIcon,
  Sparkles,
  BookOpen,
  FileText,
  FileCheck,
  Headphones,
  Video,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { getFullErrorMessage } from "@/lib/error-messages";
import { WellnessAreasSelector } from "@/components/ui/wellness-areas-selector";

interface DigitalProduct {
  id: string;
  professional_id: string;
  title: string;
  description: string;
  category: 'meditation' | 'ebook' | 'manual' | 'guide' | 'audio' | 'video' | 'other';
  price: number;
  currency: string;
  cover_image_url?: string;
  file_url?: string;
  duration_minutes?: number;
  pages_count?: number;
  is_active: boolean;
  wellness_areas?: string[];
}

interface DigitalProductFormProps {
  professionalId: string;
  product: DigitalProduct | null;
  redirectPath: string;
  isAdminContext?: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'meditation', label: 'Meditación', icon: Sparkles },
  { value: 'ebook', label: 'Workbook', icon: BookOpen },
  { value: 'manual', label: 'Manual', icon: FileText },
  { value: 'guide', label: 'Guía', icon: FileCheck },
  { value: 'audio', label: 'Audio', icon: Headphones },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'other', label: 'Otro', icon: Tag },
] as const;

export function DigitalProductForm({ professionalId, product, redirectPath, isAdminContext = false }: DigitalProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  /** ID del producto creado al subir imagen de portada (evita duplicado al hacer submit) */
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    title: product?.title || "",
    description: product?.description || "",
    category: product?.category || "meditation",
    price: product?.price?.toString() || "",
    currency: product?.currency || "MXN",
    cover_image_url: product?.cover_image_url || "",
    file_url: product?.file_url || "",
    duration_minutes: product?.duration_minutes?.toString() || "",
    pages_count: product?.pages_count?.toString() || "",
    is_active: product?.is_active ?? true,
    wellness_areas: product?.wellness_areas || [],
  });

  // Actualizar el estado cuando product cambie (para modo edición)
  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || "",
        description: product.description || "",
        category: product.category || "meditation",
        price: product.price?.toString() || "",
        currency: product.currency || "MXN",
        cover_image_url: product.cover_image_url || "",
        file_url: product.file_url || "",
        duration_minutes: product.duration_minutes?.toString() || "",
        pages_count: product.pages_count?.toString() || "",
        is_active: product.is_active ?? true,
        wellness_areas: product.wellness_areas || [],
      });
    }
  }, [product]);

  // Determinar qué campos mostrar según la categoría
  const shouldShowDuration = ['meditation', 'audio', 'video'].includes(formData.category);
  const shouldShowPages = ['ebook', 'manual', 'guide'].includes(formData.category);

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    setUploadingCover(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Debes estar autenticado para subir imágenes');
      }

      // Si estamos editando un producto existente, usar su ID
      // Si es un producto nuevo, necesitamos guardarlo primero
      let productId = product?.id;

      if (!productId) {
        // Para productos nuevos, necesitamos guardar primero el producto
        // Validar que tenga los campos mínimos requeridos
        if (!formData.title || !formData.description || !formData.price) {
          toast.error('Por favor completa título, descripción y precio antes de subir la imagen');
          setUploadingCover(false);
          return;
        }

        // Obtener professional_id
        // Si es contexto de admin, professionalId es el id del profesional
        // Si es contexto de profesional, professionalId es el user_id
        const { data: professionalData } = await supabase
          .from("professional_applications")
          .select("id")
          .eq(isAdminContext ? "id" : "user_id", professionalId)
          .eq("status", "approved")
          .single();

        if (!professionalData) {
          throw new Error('No se encontró tu perfil de profesional');
        }

        // Crear producto con los datos del formulario
        const { data: tempProduct, error: createError } = await supabase
          .from("digital_products")
          .insert({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            price: parseFloat(formData.price),
            currency: formData.currency,
            professional_id: professionalData.id,
            is_active: formData.is_active,
            duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
            pages_count: formData.pages_count ? parseInt(formData.pages_count) : null,
            wellness_areas: formData.wellness_areas && formData.wellness_areas.length > 0 ? formData.wellness_areas : [],
          })
          .select()
          .single();

        if (createError) {
          throw new Error(createError.message);
        }

        productId = tempProduct.id;
        setCreatedProductId(tempProduct.id);
      }

      // Generar nombre único para la imagen
      const fileExt = file.name.split('.').pop();
      const fileName = `cover-${Date.now()}.${fileExt}`;
      const filePath = `${productId}/${fileName}`;

      // Subir imagen a Supabase Storage (bucket digital-products)
      const { error: uploadError } = await supabase.storage
        .from('digital-products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública de la imagen
      const { data: { publicUrl } } = supabase.storage
        .from('digital-products')
        .getPublicUrl(filePath);

      setFormData({ ...formData, cover_image_url: publicUrl });
      toast.success('Imagen de portada subida exitosamente');

    } catch (error) {
      console.error('Error uploading cover image:', error);
      const errorMsg = getFullErrorMessage(error, 'Error al subir la imagen de portada');
      toast.error(errorMsg, { duration: 6000 });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCoverImage = async () => {
    try {
      if (formData.cover_image_url && product?.id) {
        // Extraer el path del archivo de la URL
        const urlParts = formData.cover_image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${product.id}/${fileName}`;

        // Eliminar de Supabase Storage
        const { error: deleteError } = await supabase.storage
          .from('digital-products')
          .remove([filePath]);

        if (deleteError && !deleteError.message.includes('not found')) {
          throw deleteError;
        }
      }

      setFormData({ ...formData, cover_image_url: '' });
      toast.success('Imagen de portada eliminada');
    } catch (error) {
      console.error('Error removing cover image:', error);
      // Aún así, limpiar el campo del formulario
      setFormData({ ...formData, cover_image_url: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones más específicas
    if (!formData.title?.trim()) {
      toast.error("El título es requerido. Por favor, ingresa un título para tu programa.");
      return;
    }

    if (!formData.description?.trim()) {
      toast.error("La descripción es requerida. Por favor, describe tu programa.");
      return;
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      toast.error("El precio es requerido y debe ser un número válido mayor o igual a 0.");
      return;
    }

    if (!formData.category) {
      toast.error("Por favor, selecciona una categoría para tu programa.");
      return;
    }

    try {
      setSaving(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error("Debes iniciar sesión para crear o editar programas. Por favor, inicia sesión e intenta nuevamente.");
        return;
      }

      // Si es contexto de admin, professionalId es el id del profesional
      // Si es contexto de profesional, professionalId es el user_id
      const { data: professionalData, error: profError } = await supabase
        .from("professional_applications")
        .select("id, status, is_active, user_id")
        .eq(isAdminContext ? "id" : "user_id", professionalId)
        .eq("status", "approved")
        .single();

      if (profError) {
        const errorMsg = getFullErrorMessage(profError, "No pudimos verificar tu perfil");
        toast.error(errorMsg, { duration: 6000 });
        return;
      }

      if (!professionalData) {
        toast.error("No encontramos tu perfil de profesional. Por favor, completa tu registro como profesional primero. Si ya lo completaste, contacta al soporte de Holistia.", { duration: 6000 });
        return;
      }

      if (professionalData.status !== 'approved') {
        const statusMessages: Record<string, string> = {
          'pending': 'Tu perfil está en revisión. Espera a que un administrador lo apruebe antes de crear programas.',
          'rejected': 'Tu perfil fue rechazado. Contacta al administrador para más información.',
          'draft': 'Tu perfil no está completo. Por favor, completa tu registro primero.'
        };
        const message = statusMessages[professionalData.status] || `Tu perfil está en estado "${professionalData.status}". Solo los profesionales aprobados pueden crear programas. Contacta al administrador si crees que esto es un error.`;
        toast.error(message, { duration: 6000 });
        return;
      }

      const priceValue = parseFloat(formData.price);
      if (priceValue < 0) {
        toast.error("El precio no puede ser negativo. Por favor, ingresa un precio válido.");
        return;
      }

      // Validar URL del archivo si se proporciona
      let fileUrl = formData.file_url?.trim() || null;
      if (fileUrl) {
        try {
          // Intentar crear un objeto URL para validar el formato
          // Si no tiene protocolo, intentar agregar https://
          if (!fileUrl.match(/^https?:\/\//i)) {
            fileUrl = `https://${fileUrl}`;
          }
          new URL(fileUrl);
        } catch {
          toast.error("La URL del archivo no es válida. Por favor, ingresa una URL completa que empiece con http:// o https://. Por ejemplo: https://ejemplo.com/archivo.pdf", { duration: 7000 });
          return;
        }
      }

      const productData = {
        professional_id: professionalData.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: priceValue,
        currency: formData.currency,
        cover_image_url: formData.cover_image_url || null,
        file_url: fileUrl,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        pages_count: formData.pages_count ? parseInt(formData.pages_count) : null,
        is_active: formData.is_active,
        wellness_areas: formData.wellness_areas && formData.wellness_areas.length > 0 ? formData.wellness_areas : [],
      };

      const productIdToUse = product?.id ?? createdProductId;

      if (productIdToUse) {
        const { error } = await supabase
          .from("digital_products")
          .update(productData)
          .eq("id", productIdToUse);

        if (error) throw error;
        toast.success(product ? "Programa actualizado exitosamente" : "Programa creado exitosamente");
      } else {
        const { error } = await supabase
          .from("digital_products")
          .insert(productData);

        if (error) throw error;
        toast.success("Programa creado exitosamente");
      }

      router.push(redirectPath);
    } catch (error) {
      console.error("Error saving product:", error);
      const errorMsg = getFullErrorMessage(error, "Error al guardar el programa");
      toast.error(errorMsg, { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title" className="mb-2 block">Título *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Ej: Meditación Guiada para Dormir Profundo"
          required
        />
      </div>

      <div>
        <Label htmlFor="description" className="mb-2 block">Descripción *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe tu programa, qué incluye y qué beneficios ofrece..."
          rows={4}
          required
        />
      </div>

      <div>
        <Label htmlFor="category" className="mb-2 block">Tipo de Programa *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value as 'meditation' | 'ebook' | 'manual' | 'guide' | 'audio' | 'video' | 'other' })}
        >
          <SelectTrigger id="category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((option) => {
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
        <p className="text-xs text-muted-foreground mt-1">
          Selecciona el tipo de programa (meditación, workbook, audio, etc.)
        </p>
      </div>

      <div>
        <WellnessAreasSelector
          selectedAreas={formData.wellness_areas}
          onAreasChange={(areas) => setFormData({ ...formData, wellness_areas: areas })}
          label="Categoría de Bienestar"
          description="Selecciona a qué categoría de bienestar pertenece este programa. Esto ayudará a que los usuarios lo encuentren más fácilmente."
        />
      </div>

      <div>
        <Label htmlFor="price" className="mb-2 block">Precio (MXN) *</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="0.00"
          required
        />
      </div>

      <div>
        <Label htmlFor="cover_image" className="mb-2 block">Imagen de Portada</Label>
        {formData.cover_image_url ? (
          <div className="space-y-2">
            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
              <Image
                src={formData.cover_image_url}
                alt="Portada"
                fill
                className="object-cover"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveCoverImage}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Imagen
            </Button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-lg p-6">
            <input
              ref={coverFileInputRef}
              type="file"
              id="cover_image"
              accept="image/*"
              onChange={handleCoverImageUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Sube una imagen de portada para tu programa
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => coverFileInputRef.current?.click()}
                disabled={uploadingCover}
              >
                {uploadingCover ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar Imagen
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Máximo 5MB. Formatos: JPG, PNG, WebP
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="file_url" className="mb-2 block">
          URL del Archivo (producto final) <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="file_url"
          type="url"
          value={formData.file_url}
          onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
          placeholder="https://ejemplo.com/archivo.pdf"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Los compradores recibirán acceso a este archivo después del pago. Puedes dejar este campo vacío si no tienes un archivo para compartir.
        </p>
        {formData.file_url && formData.file_url.trim() && (
          <p className="text-xs text-muted-foreground mt-1">
            💡 Tip: Si no tienes https://, lo agregaremos automáticamente. Ejemplo: "ejemplo.com/archivo.pdf" se convertirá en "https://ejemplo.com/archivo.pdf"
          </p>
        )}
      </div>

      {shouldShowDuration && (
        <div>
          <Label htmlFor="duration_minutes" className="mb-2 block">Duración (minutos)</Label>
          <Input
            id="duration_minutes"
            type="number"
            min="0"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
            placeholder="Para audio/video"
          />
        </div>
      )}

      {shouldShowPages && (
        <div>
          <Label htmlFor="pages_count" className="mb-2 block">Número de Páginas</Label>
          <Input
            id="pages_count"
            type="number"
            min="0"
            value={formData.pages_count}
            onChange={(e) => setFormData({ ...formData, pages_count: e.target.value })}
            placeholder="Para workbooks/manuales"
          />
        </div>
      )}

      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
        <Label htmlFor="is_active" className="cursor-pointer">
          {formData.is_active ? "Programa Activo (visible para comprar)" : "Programa Inactivo (oculto)"}
        </Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(redirectPath)}
          disabled={saving}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? "Guardando..." : product ? "Actualizar Programa" : "Crear Programa"}
        </Button>
      </div>
    </form>
  );
}
