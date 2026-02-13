"use client";

import { useState, useEffect } from "react";
import {
  Store,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Globe,
  Clock,
  Package,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import dynamic from "next/dynamic";
const RichTextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor").then(mod => mod.RichTextEditor),
  { ssr: false, loading: () => <div className="h-[200px] rounded-md border border-input bg-background animate-pulse" /> }
);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ScheduleEditor,
  DaySchedule,
  createEmptySchedule,
  parseScheduleFromString,
  formatScheduleForDisplay,
} from "@/components/ui/schedule-editor";
import { RestaurantCenterImageUploader } from "@/components/ui/restaurant-center-image-uploader";
import { ShopProductsManager } from "@/components/ui/shop-products-manager";
import { ShopGalleryManager } from "@/components/ui/shop-gallery-manager";
import { WellnessAreasSelector } from "@/components/ui/wellness-areas-selector";
import { formatPhone } from "@/utils/phone-utils";

interface Shop {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  image_url?: string;
  opening_hours?: DaySchedule[] | string;
  category?: string;
  wellness_areas?: string[];
  catalog_pdf_url?: string | null;
  gallery?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  image_url: string;
  opening_hours: DaySchedule[];
  category: string;
  wellness_areas: string[];
  catalog_pdf_url: string | null;
  gallery: string[];
  is_active: boolean;
}

const CATEGORIES = [
  { value: "ropa", label: "Ropa" },
  { value: "joyeria", label: "Joyería" },
  { value: "decoracion", label: "Decoración" },
  { value: "artesanias", label: "Artesanías" },
  { value: "libros", label: "Libros" },
  { value: "cosmetica", label: "Cosmética Natural" },
  { value: "otros", label: "Otros" },
];

// Función para normalizar URLs: agrega https:// si no tiene protocolo
const normalizeWebsiteUrl = (url: string): string | null => {
  if (!url || !url.trim()) return null;
  
  const trimmed = url.trim();
  
  // Si ya tiene protocolo (http:// o https://), devolverlo tal cual
  if (trimmed.match(/^https?:\/\//i)) {
    return trimmed;
  }
  
  // Si no tiene protocolo, agregar https://
  return `https://${trimmed}`;
};

export default function AdminShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [statsData, setStatsData] = useState({
    totalThisMonth: 0,
    lastMonth: 0,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [viewingShop, setViewingShop] = useState<Shop | null>(null);
  const [managingShop, setManagingShop] = useState<Shop | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tempShopId, setTempShopId] = useState<string | null>(null);
  const [isContentValid, setIsContentValid] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    instagram: "",
    image_url: "",
    opening_hours: createEmptySchedule(),
    category: "",
    wellness_areas: [],
    catalog_pdf_url: null,
    gallery: [],
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      
      // Fechas para comparaciones
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        { data, error },
        { data: lastMonthShops }
      ] = await Promise.all([
        supabase
          .from("shops")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("shops")
          .select("*")
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString())
      ]);

      if (error) throw error;
      setShops(data || []);

      // Calcular estadísticas
      const thisMonthShops = (data || []).filter(shop => {
        const createdAt = new Date(shop.created_at);
        return createdAt >= currentMonthStart;
      }).length;

      setStatsData({
        totalThisMonth: thisMonthShops,
        lastMonth: lastMonthShops?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching shops:", error);
      toast.error("Error al cargar los comercios");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (shop?: Shop) => {
    if (shop) {
      setEditingShop(shop);
      setTempShopId(null);
      setFormData({
        name: shop.name,
        description: shop.description || "",
        address: shop.address || "",
        city: shop.city || "",
        phone: shop.phone || "",
        email: shop.email || "",
        website: shop.website || "",
        instagram: shop.instagram || "",
        image_url: shop.image_url || "",
        opening_hours: parseScheduleFromString(shop.opening_hours),
        category: shop.category || "",
        wellness_areas: shop.wellness_areas || [],
        catalog_pdf_url: shop.catalog_pdf_url || null,
        gallery: shop.gallery || [],
        is_active: shop.is_active,
      });
    } else {
      const newTempId = crypto.randomUUID();
      setTempShopId(newTempId);
      setEditingShop(null);
      setFormData({
        name: "",
        description: "",
        address: "",
        city: "",
        phone: "",
        email: "",
        website: "",
        instagram: "",
        image_url: "",
        opening_hours: createEmptySchedule(),
        category: "",
        wellness_areas: [],
        catalog_pdf_url: null,
        gallery: [],
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleImageUploaded = async (imageUrl: string) => {
    setFormData({ ...formData, image_url: imageUrl });

    if (editingShop) {
      try {
        const { error } = await supabase
          .from("shops")
          .update({ image_url: imageUrl })
          .eq("id", editingShop.id);

        if (error) throw error;
        setEditingShop({ ...editingShop, image_url: imageUrl });
      } catch (error) {
        console.error("Error updating image:", error);
        toast.error("Error al actualizar la imagen");
      }
    }
  };

  const handleImageRemoved = async () => {
    setFormData({ ...formData, image_url: "" });

    if (editingShop) {
      try {
        const { error } = await supabase
          .from("shops")
          .update({ image_url: null })
          .eq("id", editingShop.id);

        if (error) throw error;
        setEditingShop({ ...editingShop, image_url: undefined });
      } catch (error) {
        console.error("Error removing image:", error);
        toast.error("Error al eliminar la imagen");
      }
    }
  };

  const handlePdfUpdated = async (pdfUrl: string | null) => {
    setFormData({ ...formData, catalog_pdf_url: pdfUrl });

    if (editingShop) {
      try {
        const { error } = await supabase
          .from("shops")
          .update({ catalog_pdf_url: pdfUrl })
          .eq("id", editingShop.id);

        if (error) throw error;
        setEditingShop({ ...editingShop, catalog_pdf_url: pdfUrl });
      } catch (error) {
        console.error("Error updating PDF:", error);
        toast.error("Error al actualizar el PDF");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que el contenido no exceda el límite
    if (!isContentValid) {
      toast.error('La descripción excede el límite de caracteres. Por favor, reduce el texto.');
      return;
    }

    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    try {
      setSaving(true);

      const shopData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        website: normalizeWebsiteUrl(formData.website),
        instagram: formData.instagram.trim() || null,
        image_url: formData.image_url.trim() || null,
        opening_hours: formData.opening_hours,
        category: formData.category || null,
        wellness_areas: formData.wellness_areas || [],
        catalog_pdf_url: formData.catalog_pdf_url,
        gallery: formData.gallery,
        is_active: formData.is_active,
      };

      if (editingShop) {
        const { error } = await supabase
          .from("shops")
          .update(shopData)
          .eq("id", editingShop.id);

        if (error) throw error;
        toast.success("Comercio actualizado exitosamente");
        fetchShops();
      } else {
        const newShopId = tempShopId || crypto.randomUUID();
        const { data, error } = await supabase
          .from("shops")
          .insert({
            id: newShopId,
            ...shopData,
          })
          .select()
          .single();

        if (error) throw error;

        toast.success("Comercio creado exitosamente. Ahora puedes agregar productos.");

        // Cambiar al modo de edición con el nuevo shop
        setEditingShop(data);
        setTempShopId(null);

        fetchShops();
        return; // No cerrar el formulario
      }
    } catch (error) {
      console.error("Error saving shop:", error);
      toast.error("Error al guardar el comercio");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("shops")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      toast.success("Comercio eliminado exitosamente");
      setIsDeleteOpen(false);
      setDeletingId(null);
      fetchShops();
    } catch (error) {
      console.error("Error deleting shop:", error);
      toast.error("Error al eliminar el comercio");
    }
  };

  // Obtener ciudades únicas para el filtro
  const uniqueCities = Array.from(new Set(shops.filter(s => s.city).map(s => s.city))).sort();

  // Función para calcular porcentaje de cambio
  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${Math.round(change)}%`;
  };

  const filteredShops = shops
    .filter((shop) => {
      const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && shop.is_active) ||
        (statusFilter === "inactive" && !shop.is_active);
      
      const matchesCity = cityFilter === "all" || shop.city === cityFilter;

      return matchesSearch && matchesStatus && matchesCity;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  const getCategoryLabel = (category?: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <div className="admin-page-shell">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-inner admin-page-header-inner-row">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Comercios</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona los comercios de la plataforma
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Comercio
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Shops */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Comercios</span>
                <Badge variant="secondary" className="text-xs">
                  {shops.length > 0 ? Math.round((shops.filter(s => s.is_active).length / shops.length) * 100) : 0}% activos
                </Badge>
              </div>
              <div className="text-3xl font-bold mb-1">{shops.length}</div>
              <div className="flex items-center gap-1 text-sm">
                {statsData.totalThisMonth >= statsData.lastMonth ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={statsData.totalThisMonth >= statsData.lastMonth ? "text-green-600" : "text-red-600"}>
                  {calculatePercentageChange(statsData.totalThisMonth, statsData.lastMonth)}
                </span>
                <span className="text-muted-foreground">vs mes anterior</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Comercios registrados en la plataforma</p>
            </CardContent>
          </Card>

          {/* Active Shops */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Activos</span>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  {shops.length > 0 ? Math.round((shops.filter(s => s.is_active).length / shops.length) * 100) : 0}%
                </Badge>
              </div>
              <div className="text-3xl font-bold mb-1">{shops.filter(s => s.is_active).length}</div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Visibles</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Comercios visibles en la plataforma</p>
            </CardContent>
          </Card>

          {/* Inactive Shops */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Inactivos</span>
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  {shops.length > 0 ? Math.round((shops.filter(s => !s.is_active).length / shops.length) * 100) : 0}%
                </Badge>
              </div>
              <div className="text-3xl font-bold mb-1">{shops.filter(s => !s.is_active).length}</div>
              <div className="flex items-center gap-1 text-sm">
                {shops.filter(s => !s.is_active).length > 0 ? (
                  <>
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-yellow-600">Ocultos</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Todo activo</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Comercios ocultos de la plataforma</p>
            </CardContent>
          </Card>

          {/* Growth This Month */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Crecimiento Este Mes</span>
                <Badge variant="secondary" className={`text-xs ${statsData.totalThisMonth >= statsData.lastMonth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {calculatePercentageChange(statsData.totalThisMonth, statsData.lastMonth)}
                </Badge>
              </div>
              <div className="text-3xl font-bold mb-1">+{statsData.totalThisMonth}</div>
              <div className="flex items-center gap-1 text-sm">
                {statsData.totalThisMonth >= statsData.lastMonth ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Creciendo</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-red-600">Decreciendo</span>
                  </>
                )}
                <span className="text-muted-foreground">vs {statsData.lastMonth} el mes pasado</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Nuevos comercios este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar comercio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {uniqueCities.map((city) => (
                <SelectItem key={city} value={city || ""}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguos</SelectItem>
              <SelectItem value="name_asc">Nombre A-Z</SelectItem>
              <SelectItem value="name_desc">Nombre Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Shops Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredShops.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Store className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay comercios</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? "No se encontraron resultados" : "Comienza agregando un comercio"}
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Comercio
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredShops.map((shop) => (
              <Card key={shop.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {shop.image_url && (
                  <div className="relative w-full h-48 bg-muted">
                    <Image
                      src={shop.image_url}
                      alt={shop.name}
                      fill
                      className="object-cover"
                      unoptimized={shop.image_url.includes('supabase.co') || shop.image_url.includes('supabase.in')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/logos/holistia-black.png";
                      }}
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}
                <CardHeader className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{shop.name}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={shop.is_active ? "default" : "secondary"}>
                          {shop.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                        {shop.category && (
                          <Badge variant="outline">
                            {getCategoryLabel(shop.category)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 py-4">
                  {shop.city && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground font-medium">{shop.city}</span>
                    </div>
                  )}
                  {shop.address && (
                    <div className="flex items-start gap-2 text-sm pl-6">
                      <span className="text-muted-foreground line-clamp-2">{shop.address}</span>
                    </div>
                  )}
                  {shop.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{formatPhone(shop.phone)}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setViewingShop(shop);
                        setIsViewOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setManagingShop(shop);
                        setIsManageOpen(true);
                      }}
                      title="Gestionar productos"
                    >
                      <Package className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenForm(shop)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeletingId(shop.id);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingShop ? "Editar Comercio" : "Nuevo Comercio"}
            </DialogTitle>
            <DialogDescription>
              {editingShop
                ? "Modifica la información del comercio y gestiona sus productos"
                : "Agrega un nuevo comercio a la plataforma"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del comercio"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <RichTextEditor
                content={formData.description || ""}
                onChange={(content) => setFormData({ ...formData, description: content })}
                placeholder="Descripción del comercio"
                onValidationChange={setIsContentValid}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Áreas de Bienestar */}
            <WellnessAreasSelector
              selectedAreas={formData.wellness_areas}
              onAreasChange={(areas) => setFormData({ ...formData, wellness_areas: areas })}
              label="Áreas de Bienestar"
              description="Selecciona las áreas de bienestar relacionadas con este comercio"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+52 333 123 4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contacto@comercio.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Calle, número, colonia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Guadalajara, Jalisco"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Sitio web (opcional)</Label>
                <Input
                  id="website"
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="comercio.com o www.comercio.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@nombre_del_comercio"
                />
              </div>
            </div>

            {editingShop || tempShopId ? (
              <RestaurantCenterImageUploader
                entityId={editingShop?.id || tempShopId || ""}
                bucketName="shops"
                onImageUploaded={handleImageUploaded}
                currentImageUrl={formData.image_url || undefined}
                onImageRemoved={handleImageRemoved}
                entityName={formData.name || "comercio"}
              />
            ) : (
              <div className="space-y-2">
                <Label>Imagen principal</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  <span className="inline-block h-4 w-20 bg-muted rounded animate-pulse" />
                </p>
              </div>
            )}

            {/* Galería de imágenes */}
            {(editingShop || tempShopId) && (
              <div className="py-4 border-t">
                <ShopGalleryManager
                  shopId={editingShop?.id || tempShopId || ""}
                  currentImages={formData.gallery}
                  onImagesUpdate={(images) => {
                    setFormData({ ...formData, gallery: images });
                    // Actualizar automáticamente en la base de datos si estamos editando
                    if (editingShop) {
                      supabase
                        .from("shops")
                        .update({ gallery: images })
                        .eq("id", editingShop.id)
                        .then(({ error }) => {
                          if (error) {
                            console.error("Error updating gallery:", error);
                            toast.error("Error al actualizar la galería");
                          }
                        });
                    }
                  }}
                  maxImages={4}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Horarios de atención</Label>
              <ScheduleEditor
                schedule={formData.opening_hours}
                onChange={(schedule) => setFormData({ ...formData, opening_hours: schedule })}
              />
            </div>

            {/* Gestor de Productos */}
            {(editingShop || tempShopId) && (
              <div className="py-4 border-t">
                <ShopProductsManager
                  shopId={editingShop?.id || tempShopId || ""}
                  shopName={formData.name || "comercio"}
                  catalogPdfUrl={formData.catalog_pdf_url}
                  onPdfUpdated={handlePdfUpdated}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">Comercio activo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !isContentValid}>
                {saving ? "Guardando..." : editingShop ? "Actualizar" : "Crear"}
              </Button>
              {!isContentValid && (
                <p className="text-sm text-destructive">
                  La descripción excede el límite de caracteres.
                </p>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingShop?.name}</DialogTitle>
            <DialogDescription>Detalles del comercio</DialogDescription>
          </DialogHeader>
          {viewingShop && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Estado</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={viewingShop.is_active ? "default" : "secondary"}>
                    {viewingShop.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                  {viewingShop.category && (
                    <Badge variant="outline">
                      {getCategoryLabel(viewingShop.category)}
                    </Badge>
                  )}
                </div>
              </div>

              {viewingShop.description && (
                <div>
                  <Label className="text-muted-foreground">Descripción</Label>
                  <div 
                    className="mt-1 text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: viewingShop.description }}
                  />
                </div>
              )}

              {viewingShop.city && (
                <div>
                  <Label className="text-muted-foreground">Ciudad</Label>
                  <p className="mt-1 text-sm flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    {viewingShop.city}
                  </p>
                </div>
              )}

              {viewingShop.address && (
                <div>
                  <Label className="text-muted-foreground">Dirección</Label>
                  <p className="mt-1 text-sm">{viewingShop.address}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {viewingShop.phone && (
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="mt-1 text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {formatPhone(viewingShop.phone)}
                    </p>
                  </div>
                )}

                {viewingShop.email && (
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="mt-1 text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {viewingShop.email}
                    </p>
                  </div>
                )}
              </div>

              {viewingShop.website && (
                <div>
                  <Label className="text-muted-foreground">Sitio web</Label>
                  <p className="mt-1 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a
                      href={viewingShop.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {viewingShop.website}
                    </a>
                  </p>
                </div>
              )}

              {viewingShop.instagram && (
                <div>
                  <Label className="text-muted-foreground">Instagram</Label>
                  <p className="mt-1 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a
                      href={`https://instagram.com/${viewingShop.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {viewingShop.instagram}
                    </a>
                  </p>
                </div>
              )}

              {viewingShop.opening_hours && (
                <div>
                  <Label className="text-muted-foreground">Horarios de atención</Label>
                  <div className="mt-1 text-sm whitespace-pre-line">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-0.5" />
                      <span>{formatScheduleForDisplay(parseScheduleFromString(viewingShop.opening_hours))}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Dialog - Productos */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-4xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar {managingShop?.name}</DialogTitle>
            <DialogDescription>
              Administra los productos del comercio
            </DialogDescription>
          </DialogHeader>

          {managingShop && (
            <ShopProductsManager
              shopId={managingShop.id}
              shopName={managingShop.name}
              catalogPdfUrl={managingShop.catalog_pdf_url}
              onPdfUpdated={handlePdfUpdated}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Eliminar Comercio"
        description="¿Estás seguro de que quieres eliminar este comercio? Esta acción no se puede deshacer y eliminará todos sus productos."
        confirmText="Eliminar"
        onConfirm={handleDelete}
      />
    </div>
  );
}
