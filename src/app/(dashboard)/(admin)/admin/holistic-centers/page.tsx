"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Building2,
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
  Settings,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import dynamic from "next/dynamic";
const RichTextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor").then(mod => mod.RichTextEditor),
  { ssr: false, loading: () => <div className="h-[200px] rounded-md border border-input bg-background animate-pulse" /> }
);
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
import { formatPhone } from "@/utils/phone-utils";
import { HolisticCenterLicenseUploader } from "@/components/ui/holistic-center-license-uploader";
import { HolisticCenterServicesManager } from "@/components/ui/holistic-center-services-manager";
import { HolisticCenterProfessionalsManager } from "@/components/ui/holistic-center-professionals-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HolisticCenter {
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
  is_active: boolean;
}

export default function AdminHolisticCenters() {
  const [centers, setCenters] = useState<HolisticCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [statsData, setStatsData] = useState({
    totalThisMonth: 0,
    lastMonth: 0,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<HolisticCenter | null>(null);
  const [viewingCenter, setViewingCenter] = useState<HolisticCenter | null>(null);
  const [managingCenter, setManagingCenter] = useState<HolisticCenter | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tempCenterId, setTempCenterId] = useState<string | null>(null); // ID temporal para nuevas creaciones
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
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      
      // Fechas para comparaciones
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      const [
        { data, error },
        { data: lastMonthCenters }
      ] = await Promise.all([
        supabase
          .from("holistic_centers")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("holistic_centers")
          .select("id")
          .gte("created_at", lastMonthStart.toISOString())
          .lte("created_at", lastMonthEnd.toISOString())
      ]);

      if (error) throw error;
      setCenters(data || []);
      
      // Calcular estadísticas
      const thisMonthCenters = data?.filter(center => {
        const createdAt = new Date(center.created_at);
        return createdAt >= currentMonthStart;
      }).length || 0;
      
      setStatsData({
        totalThisMonth: thisMonthCenters,
        lastMonth: lastMonthCenters?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching centers:", error);
      toast.error("Error al cargar los centros holísticos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (center?: HolisticCenter) => {
    if (center) {
      setEditingCenter(center);
      setTempCenterId(null); // No necesitamos ID temporal si estamos editando
      setFormData({
        name: center.name,
        description: center.description || "",
        address: center.address || "",
        city: center.city || "",
        phone: center.phone || "",
        email: center.email || "",
        website: center.website || "",
        instagram: center.instagram || "",
        image_url: center.image_url || "",
        opening_hours: parseScheduleFromString(center.opening_hours),
        is_active: center.is_active,
      });
    } else {
      // Generar ID temporal para nueva creación
      const newTempId = crypto.randomUUID();
      setTempCenterId(newTempId);
      setEditingCenter(null);
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
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleImageUploaded = async (imageUrl: string) => {
    setFormData({ ...formData, image_url: imageUrl });
    
    // Actualizar automáticamente en la base de datos solo si estamos editando un centro existente
    if (editingCenter) {
      try {
        const { error } = await supabase
          .from("holistic_centers")
          .update({ image_url: imageUrl })
          .eq("id", editingCenter.id);
        
        if (error) throw error;
        // Actualizar el estado local
        setEditingCenter({ ...editingCenter, image_url: imageUrl });
      } catch (error) {
        console.error("Error updating image in database:", error);
        toast.error("Error al actualizar la imagen en la base de datos");
      }
    }
    // Si estamos creando un nuevo centro (tempCenterId existe), 
    // la imagen ya está subida al storage con el ID temporal,
    // y se guardará cuando se cree el centro con ese mismo ID
  };

  const handleImageRemoved = async () => {
    setFormData({ ...formData, image_url: "" });
    
    // Actualizar automáticamente en la base de datos solo si estamos editando un centro existente
    if (editingCenter) {
      try {
        const { error } = await supabase
          .from("holistic_centers")
          .update({ image_url: null })
          .eq("id", editingCenter.id);
        
        if (error) throw error;
        // Actualizar el estado local
        setEditingCenter({ ...editingCenter, image_url: undefined });
      } catch (error) {
        console.error("Error removing image from database:", error);
        toast.error("Error al eliminar la imagen de la base de datos");
      }
    }
    // Si estamos creando un nuevo centro, solo actualizamos el estado del formulario
    // La imagen se elimina del storage pero no afecta la base de datos porque aún no existe el registro
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

      if (editingCenter) {
        const { error } = await supabase
          .from("holistic_centers")
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null,
            website: formData.website.trim() || null,
            instagram: formData.instagram.trim() || null,
            image_url: formData.image_url.trim() || null,
            opening_hours: formData.opening_hours,
            is_active: formData.is_active,
          })
          .eq("id", editingCenter.id);

        if (error) throw error;
        toast.success("Centro holístico actualizado exitosamente");
        setIsFormOpen(false);
        fetchCenters();
      } else {
        // Usar el ID temporal para crear el centro con el mismo ID que usamos para la imagen
        const { error } = await supabase
          .from("holistic_centers")
          .insert({
            id: tempCenterId || undefined, // Usar el ID temporal si existe
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null,
            website: formData.website.trim() || null,
            instagram: formData.instagram.trim() || null,
            image_url: formData.image_url.trim() || null,
            opening_hours: formData.opening_hours,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast.success("Centro holístico creado exitosamente");
        
        // Limpiar ID temporal
        setTempCenterId(null);
        setIsFormOpen(false);
        fetchCenters();
      }
    } catch (error) {
      console.error("Error saving center:", error);
      toast.error("Error al guardar el centro holístico");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("holistic_centers")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      toast.success("Centro holístico eliminado exitosamente");
      setIsDeleteOpen(false);
      setDeletingId(null);
      fetchCenters();
    } catch (error) {
      console.error("Error deleting center:", error);
      toast.error("Error al eliminar el centro holístico");
    }
  };

  // Función para calcular porcentaje de cambio
  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${Math.round(change)}%`;
  };

  // Obtener lista única de ciudades para el filtro
  const uniqueCities = useMemo(() => {
    const cities = centers
      .map(center => center.city)
      .filter((city): city is string => !!city);
    return [...new Set(cities)].sort();
  }, [centers]);

  // Estadísticas derivadas
  const activeCenters = centers.filter(c => c.is_active).length;
  const inactiveCenters = centers.filter(c => !c.is_active).length;

  const filteredCenters = useMemo(() => {
    let filtered = centers.filter((center) => {
      const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.city?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && center.is_active) ||
        (statusFilter === "inactive" && !center.is_active);
      
      const matchesCity = cityFilter === "all" || center.city === cityFilter;
      
      return matchesSearch && matchesStatus && matchesCity;
    });

    // Ordenar
    switch (sortBy) {
      case "oldest":
        filtered = [...filtered].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "name":
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "recent":
      default:
        filtered = [...filtered].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    return filtered;
  }, [centers, searchTerm, statusFilter, cityFilter, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Centros Holísticos</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona los centros holísticos de la plataforma
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Centro
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Centros */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Centros</span>
                <Badge 
                  variant={statsData.totalThisMonth >= statsData.lastMonth ? "default" : "secondary"}
                  className={statsData.totalThisMonth >= statsData.lastMonth ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"}
                >
                  {calculatePercentageChange(statsData.totalThisMonth, statsData.lastMonth)}
                </Badge>
              </div>
              <div className="text-3xl font-bold mb-2">{centers.length}</div>
              <div className="flex items-center gap-1 text-sm">
                {statsData.totalThisMonth >= statsData.lastMonth ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={statsData.totalThisMonth >= statsData.lastMonth ? "text-green-600" : "text-red-600"}>
                  {statsData.totalThisMonth} nuevos este mes
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs {statsData.lastMonth} el mes anterior</p>
            </CardContent>
          </Card>

          {/* Centros Activos */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Centros Activos</span>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  {centers.length > 0 ? Math.round((activeCenters / centers.length) * 100) : 0}%
                </Badge>
              </div>
              <div className="text-3xl font-bold mb-2">{activeCenters}</div>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Centros operando</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Del total de {centers.length} centros</p>
            </CardContent>
          </Card>

          {/* Centros Inactivos */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Centros Inactivos</span>
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  {centers.length > 0 ? Math.round((inactiveCenters / centers.length) * 100) : 0}%
                </Badge>
              </div>
              <div className="text-3xl font-bold mb-2">{inactiveCenters}</div>
              <div className="flex items-center gap-1 text-sm">
                <Building2 className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-600">Centros desactivados</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Requieren activación</p>
            </CardContent>
          </Card>

          {/* Crecimiento del Mes */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Crecimiento Mensual</span>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  Este mes
                </Badge>
              </div>
              <div className="text-3xl font-bold mb-2">{statsData.totalThisMonth}</div>
              <div className="flex items-center gap-1 text-sm">
                {statsData.totalThisMonth >= statsData.lastMonth ? (
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-blue-600">Nuevos centros agregados</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Comparado con {statsData.lastMonth} del mes anterior</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar centros..."
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
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguos</SelectItem>
              <SelectItem value="name">Nombre A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Centers Grid */}
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
        ) : filteredCenters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay centros holísticos</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? "No se encontraron resultados" : "Comienza agregando un centro holístico"}
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Centro
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCenters.map((center) => (
              <Card key={center.id} className="hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
                {center.image_url && (
                  <div className="relative w-full h-48 bg-muted">
                    <Image
                      src={center.image_url}
                      alt={center.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <CardHeader className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{center.name}</CardTitle>
                      <Badge variant={center.is_active ? "default" : "secondary"}>
                        {center.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 py-4 flex-grow flex flex-col">
                  {center.city && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground font-medium">{center.city}</span>
                    </div>
                  )}
                  {center.address && (
                    <div className="flex items-start gap-2 text-sm pl-6">
                      <span className="text-muted-foreground line-clamp-2">{center.address}</span>
                    </div>
                  )}
                  {center.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{formatPhone(center.phone)}</span>
                    </div>
                  )}
                  {center.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground truncate">{center.email}</span>
                    </div>
                  )}
                  {center.opening_hours && (
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground whitespace-pre-line">
                        {formatScheduleForDisplay(parseScheduleFromString(center.opening_hours))}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setViewingCenter(center);
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
                        setManagingCenter(center);
                        setIsManageOpen(true);
                      }}
                      title="Gestionar licencias, servicios y profesionales"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenForm(center)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeletingId(center.id);
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCenter ? "Editar Centro Holístico" : "Nuevo Centro Holístico"}
            </DialogTitle>
            <DialogDescription>
              {editingCenter
                ? "Modifica la información del centro holístico"
                : "Agrega un nuevo centro holístico a la plataforma"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del centro holístico"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <RichTextEditor
                content={formData.description || ""}
                onChange={(content) => setFormData({ ...formData, description: content })}
                placeholder="Descripción del centro"
                onValidationChange={setIsContentValid}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contacto@centro.com"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Sitio web</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.centro.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@nombre_del_centro"
                />
              </div>
            </div>

            {editingCenter || tempCenterId ? (
              <RestaurantCenterImageUploader
                entityId={editingCenter?.id || tempCenterId || ""}
                bucketName="holistic-centers"
                onImageUploaded={handleImageUploaded}
                currentImageUrl={formData.image_url || undefined}
                onImageRemoved={handleImageRemoved}
                entityName={formData.name || "centro holístico"}
              />
            ) : (
              <div className="space-y-2">
                <Label>Imagen principal</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  <span className="inline-block h-4 w-20 bg-muted rounded animate-pulse" />
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Horarios de atención</Label>
              <ScheduleEditor
                schedule={formData.opening_hours}
                onChange={(schedule) => setFormData({ ...formData, opening_hours: schedule })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">Centro activo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !isContentValid}>
                {saving ? "Guardando..." : editingCenter ? "Actualizar" : "Crear"}
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
            <DialogTitle>{viewingCenter?.name}</DialogTitle>
            <DialogDescription>Detalles del centro holístico</DialogDescription>
          </DialogHeader>
          {viewingCenter && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Estado</Label>
                <div className="mt-1">
                  <Badge variant={viewingCenter.is_active ? "default" : "secondary"}>
                    {viewingCenter.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>

              {viewingCenter.description && (
                <div>
                  <Label className="text-muted-foreground">Descripción</Label>
                  <div 
                    className="mt-1 text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: viewingCenter.description }}
                  />
                </div>
              )}

              {viewingCenter.city && (
                <div>
                  <Label className="text-muted-foreground">Ciudad</Label>
                  <p className="mt-1 text-sm flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    {viewingCenter.city}
                  </p>
                </div>
              )}

              {viewingCenter.address && (
                <div>
                  <Label className="text-muted-foreground">Dirección</Label>
                  <p className="mt-1 text-sm">{viewingCenter.address}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {viewingCenter.phone && (
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="mt-1 text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {formatPhone(viewingCenter.phone)}
                    </p>
                  </div>
                )}

                {viewingCenter.email && (
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="mt-1 text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {viewingCenter.email}
                    </p>
                  </div>
                )}
              </div>

              {viewingCenter.website && (
                <div>
                  <Label className="text-muted-foreground">Sitio web</Label>
                  <p className="mt-1 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a
                      href={viewingCenter.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {viewingCenter.website}
                    </a>
                  </p>
                </div>
              )}

              {viewingCenter.instagram && (
                <div>
                  <Label className="text-muted-foreground">Instagram</Label>
                  <p className="mt-1 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a
                      href={`https://instagram.com/${viewingCenter.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {viewingCenter.instagram}
                    </a>
                  </p>
                </div>
              )}

              {viewingCenter.opening_hours && (
                <div>
                  <Label className="text-muted-foreground">Horarios de atención</Label>
                  <div className="mt-1 text-sm whitespace-pre-line">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-0.5" />
                      <span>{formatScheduleForDisplay(parseScheduleFromString(viewingCenter.opening_hours))}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Dialog - Licencias, Servicios y Profesionales */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar {managingCenter?.name}</DialogTitle>
            <DialogDescription>
              Administra las licencias, servicios y profesionales del centro
            </DialogDescription>
          </DialogHeader>

          {managingCenter && (
            <Tabs defaultValue="licenses" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="licenses">Licencias</TabsTrigger>
                <TabsTrigger value="services">Servicios</TabsTrigger>
                <TabsTrigger value="professionals">Profesionales</TabsTrigger>
              </TabsList>

              <TabsContent value="licenses" className="space-y-4 mt-4">
                <HolisticCenterLicenseUploader
                  centerId={managingCenter.id}
                  centerName={managingCenter.name}
                />
              </TabsContent>

              <TabsContent value="services" className="space-y-4 mt-4">
                <HolisticCenterServicesManager
                  centerId={managingCenter.id}
                  centerName={managingCenter.name}
                />
              </TabsContent>

              <TabsContent value="professionals" className="space-y-4 mt-4">
                <HolisticCenterProfessionalsManager
                  centerId={managingCenter.id}
                  centerName={managingCenter.name}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Eliminar Centro Holístico"
        description="¿Estás seguro de que quieres eliminar este centro holístico? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={handleDelete}
      />
    </div>
  );
}
