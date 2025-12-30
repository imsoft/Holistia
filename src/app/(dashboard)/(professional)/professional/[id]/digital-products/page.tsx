"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Download,
  ShoppingBag,
  Tag,
  FileText,
  Headphones,
  BookOpen,
  Video,
  FileCheck,
  Sparkles,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";

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
  sales_count: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  price: string;
  currency: string;
  cover_image_url: string;
  file_url: string;
  duration_minutes: string;
  pages_count: string;
  is_active: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'meditation', label: 'Meditación', icon: Sparkles },
  { value: 'ebook', label: 'eBook', icon: BookOpen },
  { value: 'manual', label: 'Manual', icon: FileText },
  { value: 'guide', label: 'Guía', icon: FileCheck },
  { value: 'audio', label: 'Audio', icon: Headphones },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'other', label: 'Otro', icon: Tag },
] as const;

export default function ProfessionalDigitalProducts() {
  const params = useParams();
  const supabase = createClient();

  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DigitalProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<DigitalProduct | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "meditation",
    price: "",
    currency: "MXN",
    cover_image_url: "",
    file_url: "",
    duration_minutes: "",
    pages_count: "",
    is_active: true,
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Obtener el professional_id del usuario
      const { data: professional } = await supabase
        .from("professional_applications")
        .select("id, is_verified")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .single();

      if (!professional) {
        toast.error("No se encontró tu perfil de profesional");
        return;
      }

      if (!professional.is_verified) {
        toast.error("Solo profesionales verificados pueden vender programas");
        return;
      }

      const { data: productsData, error } = await supabase
        .from("digital_products")
        .select("*")
        .eq("professional_id", professional.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProducts(productsData || []);

      // Calcular estadísticas
      const totalSales = productsData?.reduce((sum, p) => sum + p.sales_count, 0) || 0;
      const totalRevenue = productsData?.reduce((sum, p) => sum + (p.price * p.sales_count), 0) || 0;

      setStats({
        totalProducts: productsData?.length || 0,
        activeProducts: productsData?.filter(p => p.is_active).length || 0,
        totalSales,
        totalRevenue,
      });

    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error al cargar programas");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (product?: DigitalProduct) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        description: product.description,
        category: product.category,
        price: product.price.toString(),
        currency: product.currency,
        cover_image_url: product.cover_image_url || "",
        file_url: product.file_url || "",
        duration_minutes: product.duration_minutes?.toString() || "",
        pages_count: product.pages_count?.toString() || "",
        is_active: product.is_active,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        title: "",
        description: "",
        category: "meditation",
        price: "",
        currency: "MXN",
        cover_image_url: "",
        file_url: "",
        duration_minutes: "",
        pages_count: "",
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.price) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data: professional } = await supabase
        .from("professional_applications")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!professional) {
        toast.error("No se encontró tu perfil de profesional");
        return;
      }

      const productData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        currency: formData.currency,
        cover_image_url: formData.cover_image_url || null,
        file_url: formData.file_url || null,
        preview_url: null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        pages_count: formData.pages_count ? parseInt(formData.pages_count) : null,
        file_size_mb: null,
        file_format: null,
        tags: null,
        is_active: formData.is_active,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("digital_products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Programa actualizado exitosamente");
      } else {
        const { error } = await supabase
          .from("digital_products")
          .insert({
            ...productData,
            professional_id: professional.id,
          });

        if (error) throw error;
        toast.success("Programa creado exitosamente");
      }

      setIsFormOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Error al guardar programa");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      const { error } = await supabase
        .from("digital_products")
        .delete()
        .eq("id", deletingProduct.id);

      if (error) throw error;

      toast.success("Programa eliminado exitosamente");
      setIsDeleteOpen(false);
      setDeletingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar programa");
    }
  };

  const getCategoryIcon = (category: string) => {
    const option = CATEGORY_OPTIONS.find(opt => opt.value === category);
    return option ? option.icon : Tag;
  };

  const getCategoryLabel = (category: string) => {
    const option = CATEGORY_OPTIONS.find(opt => opt.value === category);
    return option ? option.label : category;
  };

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
      let productId = editingProduct?.id;
      
      if (!productId) {
        // Para productos nuevos, necesitamos guardar primero el producto
        // Validar que tenga los campos mínimos requeridos
        if (!formData.title || !formData.description || !formData.price) {
          toast.error('Por favor completa título, descripción y precio antes de subir la imagen');
          setUploadingCover(false);
          return;
        }

        // Obtener professional_id
        const { data: professional } = await supabase
          .from("professional_applications")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!professional) {
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
            professional_id: professional.id,
            is_active: formData.is_active,
            duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
            pages_count: formData.pages_count ? parseInt(formData.pages_count) : null,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating product:', createError);
          throw new Error('Error al crear el producto');
        }

        productId = tempProduct.id;
        setEditingProduct(tempProduct);
        toast.success('Producto creado. Ahora puedes subir la imagen.');
      }

      // Generar nombre único para la imagen
      const fileExt = file.name.split('.').pop();
      const fileName = `cover.${fileExt}`;
      const filePath = `${productId}/${fileName}`;

      // Subir imagen a Supabase Storage (bucket digital-products)
      const { error: uploadError } = await supabase.storage
        .from('digital-products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Permite sobrescribir si existe
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('not found')) {
          throw new Error('El bucket digital-products no existe. Por favor, crea el bucket primero.');
        }
        throw new Error('Error al subir la imagen');
      }

      // Obtener URL pública de la imagen
      const { data: { publicUrl } } = supabase.storage
        .from('digital-products')
        .getPublicUrl(filePath);

      setFormData({ ...formData, cover_image_url: publicUrl });
      toast.success('Imagen de portada subida exitosamente');

      // Limpiar input
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir la imagen');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCoverImage = async () => {
    if (!formData.cover_image_url) return;

    try {
      // Extraer el path del URL
      const url = new URL(formData.cover_image_url);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === 'digital-products');
      
      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        
        const { error } = await supabase.storage
          .from('digital-products')
          .remove([filePath]);

        if (error) {
          console.error('Error removing image:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando programas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Programas</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona tus meditaciones, ebooks y cursos
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Programa
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Programas
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Programas Activos
              </CardTitle>
              <Eye className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">{stats.activeProducts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ventas Totales
              </CardTitle>
              <Download className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">{stats.totalSales}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos Totales
              </CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                ${stats.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes productos aún</h3>
              <p className="text-muted-foreground text-center mb-4">
                Comienza a vender meditaciones, ebooks y más
              </p>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Producto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const CategoryIcon = getCategoryIcon(product.category);
              return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5">
                    {product.cover_image_url ? (
                      <Image
                        src={product.cover_image_url}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <CategoryIcon className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="px-6 pt-6">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      <CategoryIcon className="h-3 w-3 mr-1" />
                      {getCategoryLabel(product.category)}
                    </Badge>
                  </CardHeader>

                  <CardContent className="px-6 pb-6 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          ${product.price.toLocaleString('es-MX')}
                        </p>
                        <p className="text-xs text-muted-foreground">{product.currency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{product.sales_count} ventas</p>
                        <p className="text-xs text-muted-foreground">
                          ${(product.price * product.sales_count).toLocaleString('es-MX')}
                        </p>
                      </div>
                    </div>


                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenForm(product)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeletingProduct(product);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Programa" : "Nuevo Programa"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Modifica la información de tu programa"
                : "Crea un nuevo programa para vender"}
            </DialogDescription>
          </DialogHeader>

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
              <Label htmlFor="category" className="mb-2 block">Categoría *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
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
                      Sube una imagen de portada para tu producto
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
              <Label htmlFor="file_url" className="mb-2 block">URL del Archivo (producto final)</Label>
              <Input
                id="file_url"
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Los compradores recibirán acceso a este archivo después del pago
              </p>
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
                  placeholder="Para ebooks/manuales"
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingProduct ? "Actualizar" : "Crear Programa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Eliminar Programa"
        description="¿Estás seguro de que quieres eliminar este programa? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={handleDelete}
      />
    </div>
  );
}
