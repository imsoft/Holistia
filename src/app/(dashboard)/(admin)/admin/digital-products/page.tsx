"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { getFullErrorMessage } from "@/lib/error-messages";
import {
  Edit,
  Trash2,
  Eye,
  ShoppingBag,
  Tag,
  FileText,
  Headphones,
  BookOpen,
  Video,
  FileCheck,
  Search,
  User,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatCard } from "@/components/ui/admin-stat-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { formatPrice } from "@/lib/price-utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface DigitalProduct {
  id: string;
  professional_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  cover_image_url?: string;
  is_active: boolean;
  sales_count: number;
  created_at: string;
  professional_applications?: {
    id: string;
    first_name: string;
    last_name: string;
    profession?: string;
  };
}

const CATEGORY_OPTIONS = [
  { value: "meditation", label: "Meditación" },
  { value: "ebook", label: "Workbook" },
  { value: "manual", label: "Manual" },
  { value: "guide", label: "Guía" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "other", label: "Otro" },
] as const;

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  meditation: Tag,
  ebook: BookOpen,
  manual: FileText,
  guide: FileCheck,
  audio: Headphones,
  video: Video,
  other: Tag,
};

export default function AdminDigitalProductsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<DigitalProduct | null>(null);

  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data: productsData, error } = await supabase
        .from("digital_products")
        .select(
          `
          *,
          professional_applications!digital_products_professional_id_fkey(
            id,
            first_name,
            last_name,
            profession
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProducts(productsData || []);

      const totalSales = productsData?.reduce((sum, p) => sum + (p.sales_count || 0), 0) || 0;
      const totalRevenue =
        productsData?.reduce((sum, p) => sum + ((p.price || 0) * (p.sales_count || 0)), 0) || 0;

      setStats({
        totalProducts: productsData?.length || 0,
        activeProducts: productsData?.filter((p) => p.is_active).length || 0,
        totalSales,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error al cargar los programas");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      const { error } = await supabase
        .from("digital_products")
        .delete()
        .eq("id", deletingProduct.id);

      if (error) {
        toast.error(getFullErrorMessage(error, "Error al eliminar el programa"));
        return;
      }

      toast.success("Programa eliminado exitosamente");
      setIsDeleteOpen(false);
      setDeletingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar el programa");
    }
  };

  const getCategoryIcon = (category: string) =>
    CATEGORY_ICONS[category] || Tag;

  const getCategoryLabel = (category: string) =>
    CATEGORY_OPTIONS.find((opt) => opt.value === category)?.label || category;

  const getProfessionalName = (product: DigitalProduct) => {
    const prof = product.professional_applications;
    if (!prof) return "Sin asignar";
    const p = Array.isArray(prof) ? prof[0] : prof;
    if (!p) return "Sin asignar";
    return `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Sin asignar";
  };

  const filteredProducts = products
    .filter((product) => {
      // Search filter
      const matchesSearch =
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProfessionalName(product).toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && product.is_active) ||
        (statusFilter === "inactive" && !product.is_active);
      
      // Category filter
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "price_high":
          return b.price - a.price;
        case "price_low":
          return a.price - b.price;
        case "sales":
          return b.sales_count - a.sales_count;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="admin-page-shell">
        <div className="admin-page-header">
          <div className="admin-page-header-inner admin-page-header-inner-row">
            <SidebarTrigger />
            <div className="h-6 w-48 animate-pulse rounded bg-muted ml-4" />
          </div>
        </div>
        <div className="admin-page-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border">
                <CardContent className="p-6">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted mb-3" />
                  <div className="h-8 w-16 animate-pulse rounded bg-muted mb-2" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <div className="h-48 animate-pulse bg-muted" />
                <CardContent className="p-6">
                  <div className="h-6 animate-pulse rounded bg-muted mb-2" />
                  <div className="h-4 animate-pulse rounded bg-muted w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-shell">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-inner admin-page-header-inner-row">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Programas</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Ver y editar todos los programas digitales
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/admin/professionals")}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear desde Profesional
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-page-content space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminStatCard
            title="Total Programas"
            value={stats.totalProducts.toString()}
            trend={{ value: "+12%", positive: true }}
            secondaryText="vs mes anterior"
          />
          <AdminStatCard
            title="Programas Activos"
            value={stats.activeProducts.toString()}
            trend={{ value: `${stats.totalProducts > 0 ? Math.round((stats.activeProducts / stats.totalProducts) * 100) : 0}%`, positive: true }}
            tertiaryText="del total"
          />
          <AdminStatCard
            title="Total Ventas"
            value={stats.totalSales.toString()}
            trend={{ value: "+8%", positive: true }}
            secondaryText="vs mes anterior"
          />
          <AdminStatCard
            title="Ingresos Totales"
            value={formatPrice(stats.totalRevenue, "MXN")}
            trend={{ value: "+15%", positive: true }}
            secondaryText="vs mes anterior"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título o profesional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {CATEGORY_OPTIONS.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguos</SelectItem>
              <SelectItem value="price_high">Mayor precio</SelectItem>
              <SelectItem value="price_low">Menor precio</SelectItem>
              <SelectItem value="sales">Más vendidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {products.length === 0 ? "No hay programas" : "No se encontraron resultados"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {products.length === 0
                  ? "Los programas aparecerán cuando los profesionales los creen"
                  : "Intenta con otros términos de búsqueda"}
              </p>
              {products.length === 0 && (
                <Button onClick={() => router.push("/admin/professionals")}>
                  <User className="h-4 w-4 mr-2" />
                  Ver Profesionales
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const CategoryIcon = getCategoryIcon(product.category);
              const professionalName = getProfessionalName(product);
              return (
                <Card
                  key={product.id}
                  className="hover:shadow-lg transition-shadow overflow-hidden pt-0 pb-4 flex flex-col h-[520px]"
                >
                  <div className="relative h-44 w-full shrink-0 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                    {product.cover_image_url ? (
                      <Image
                        src={product.cover_image_url}
                        alt={product.title}
                        fill
                        className="object-cover"
                        unoptimized={
                          product.cover_image_url.includes("supabase") ||
                          product.cover_image_url.includes("supabase.in")
                        }
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

                  <CardHeader className="px-6 pt-4 shrink-0">
                    <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                    <div className="flex flex-wrap gap-1 mt-1 min-h-[24px]">
                      <Badge variant="outline" className="text-xs">
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {getCategoryLabel(product.category)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <User className="h-3 w-3 mr-1" />
                        {professionalName}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="px-6 pb-4 flex flex-col flex-1 min-h-0">
                    <div className="mb-2 overflow-y-auto min-h-0 flex-1 max-h-48 pr-1">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {product.description || "Sin descripción"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mb-2 shrink-0">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(product.price, product.currency || "MXN")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {product.sales_count} ventas
                      </span>
                    </div>

                    <div className="flex gap-2 mt-auto pt-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          router.push(
                            `/admin/digital-products/${product.id}/edit?professional_id=${product.professional_id}&from=list`
                          )
                        }
                        aria-label="Editar programa"
                      >
                        <Edit className="h-4 w-4" />
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/professionals/${product.professional_id}`)
                        }
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

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
