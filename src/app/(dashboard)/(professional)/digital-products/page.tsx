"use client";

import { useState, useEffect, useMemo } from "react";
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
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminStatCard } from "@/components/ui/admin-stat-card";
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

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "sales">("recent");

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

  const filteredProducts = useMemo(() => {
    let list = [...products];
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
      );
    }
    if (categoryFilter !== "all") list = list.filter((p) => p.category === categoryFilter);
    if (statusFilter === "active") list = list.filter((p) => p.is_active);
    if (statusFilter === "inactive") list = list.filter((p) => !p.is_active);
    if (sortBy === "name") list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (sortBy === "sales") list.sort((a, b) => (b.sales_count ?? 0) - (a.sales_count ?? 0));
    else list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    return list;
  }, [products, searchTerm, categoryFilter, statusFilter, sortBy]);

  if (loading) {
    return (
      <div className="professional-page-shell flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="animate-pulse space-y-4 mt-4 w-full">
            <div className="h-8 bg-muted rounded w-32 mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-muted rounded-lg" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="professional-page-shell">
      {/* Header */}
      <div className="professional-page-header">
        <div className="professional-page-header-inner professional-page-header-inner-row">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Programas</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona tus meditaciones, workbooks y cursos
              </p>
            </div>
          </div>
          <Button onClick={() => router.push(`/digital-products/new`)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Programa
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="professional-page-content space-y-6">
        {/* Cards de estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <AdminStatCard
            title="Total Programas"
            value={String(stats.totalProducts)}
            secondaryText="Programas publicados"
            tertiaryText="Meditaciones, workbooks, guías"
          />
          <AdminStatCard
            title="Programas Activos"
            value={String(stats.activeProducts)}
            trend={
              stats.totalProducts > 0
                ? {
                    value: `${Math.round((stats.activeProducts / stats.totalProducts) * 100)}%`,
                    positive: stats.activeProducts > 0,
                  }
                : undefined
            }
            secondaryText={stats.activeProducts > 0 ? "Visibles para compra" : "Ninguno activo"}
            tertiaryText="Del total"
          />
          <AdminStatCard
            title="Ventas Totales"
            value={String(stats.totalSales)}
            secondaryText="Unidades vendidas"
            tertiaryText="Total de ventas"
          />
          <AdminStatCard
            title="Ingresos Totales"
            value={`$${stats.totalRevenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`}
            secondaryText="Ingresos por programas"
            tertiaryText="MXN"
          />
        </div>

        {/* Filtros (máximo 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar programa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "recent" | "name" | "sales")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="name">Por nombre</SelectItem>
              <SelectItem value="sales">Por ventas</SelectItem>
            </SelectContent>
          </Select>
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
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin resultados</h3>
              <p className="text-muted-foreground text-center mb-4">
                No hay programas que coincidan con los filtros seleccionados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
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
                        variant="destructive"
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
