"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { getDescriptiveErrorMessage, getFullErrorMessage, isSystemError } from "@/lib/error-messages";
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
  { value: 'ebook', label: 'Workbook', icon: BookOpen },
  { value: 'manual', label: 'Manual', icon: FileText },
  { value: 'guide', label: 'Guía', icon: FileCheck },
  { value: 'audio', label: 'Audio', icon: Headphones },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'other', label: 'Otro', icon: Tag },
] as const;

export default function ProfessionalDigitalProducts() {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<DigitalProduct | null>(null);

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
      toast.error("No pudimos cargar tus programas. Por favor, recarga la página e intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      const { error } = await supabase
        .from("digital_products")
        .delete()
        .eq("id", deletingProduct.id);

      if (error) {
        const errorMsg = getFullErrorMessage(error, "Error al eliminar el programa");
        toast.error(errorMsg, {
          duration: 6000,
        });
        return;
      }

      toast.success("Programa eliminado exitosamente");
      setIsDeleteOpen(false);
      setDeletingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      const errorMsg = getFullErrorMessage(error, "Error al eliminar el programa");
      toast.error(errorMsg, {
        duration: 6000,
      });
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
                Gestiona tus meditaciones, workbooks y cursos
              </p>
            </div>
          </div>
          <Button onClick={() => router.push(`/digital-products/new`)}>
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
              <h3 className="text-lg font-semibold mb-2">No tienes programas aún</h3>
              <p className="text-muted-foreground text-center mb-4">
                Comienza a vender meditaciones, workbooks y más
              </p>
              <Button onClick={() => router.push(`/digital-products/new`)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Programa
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const CategoryIcon = getCategoryIcon(product.category);
              return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow overflow-hidden py-4">
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
                        onClick={() => router.push(`/digital-products/${product.id}/edit`)}
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
