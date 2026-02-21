"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Image as ImageIcon,
  X,
  CheckCircle,
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
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import HolisticServiceImagesManager from "@/components/ui/holistic-service-images-manager";
import Image from "next/image";

interface HolisticService {
  id: string;
  name: string;
  description: string;
  benefits?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HolisticServiceImage {
  id: string;
  image_url: string;
  image_order: number;
}

interface FormData {
  name: string;
  description: string;
  benefits: string[];
  is_active: boolean;
}

export default function AdminHolisticServices() {
  const [services, setServices] = useState<HolisticService[]>([]);
  const [serviceImages, setServiceImages] = useState<Record<string, HolisticServiceImage[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingService, setEditingService] = useState<HolisticService | null>(null);
  const [viewingService, setViewingService] = useState<HolisticService | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    benefits: [],
    is_active: true,
  });
  const [newBenefit, setNewBenefit] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("holistic_services")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices(data || []);

      // Cargar imágenes para todos los servicios
      if (data && data.length > 0) {
        const serviceIds = data.map(s => s.id);
        const { data: imagesData, error: imagesError } = await supabase
          .from("holistic_service_images")
          .select("*")
          .in("service_id", serviceIds)
          .order("image_order", { ascending: true });

        if (!imagesError && imagesData) {
          const imagesMap: Record<string, HolisticServiceImage[]> = {};
          imagesData.forEach(img => {
            if (!imagesMap[img.service_id]) {
              imagesMap[img.service_id] = [];
            }
            imagesMap[img.service_id].push(img);
          });
          setServiceImages(imagesMap);
        }
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Error al cargar los servicios");
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceImages = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from("holistic_service_images")
        .select("*")
        .eq("service_id", serviceId)
        .order("image_order", { ascending: true });

      if (!error && data) {
        setServiceImages(prev => ({
          ...prev,
          [serviceId]: data
        }));
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  const handleOpenForm = (service?: HolisticService) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        benefits: service.benefits || [],
        is_active: service.is_active,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: "",
        description: "",
        benefits: [],
        is_active: true,
      });
    }
    setNewBenefit("");
    setIsFormOpen(true);
  };

  const saveService = async (): Promise<string | null> => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("El título y la descripción son requeridos");
      return null;
    }

    try {
      if (editingService) {
        const { error } = await supabase
          .from("holistic_services")
          .update({
            name: formData.name.trim(),
            description: formData.description.trim(),
            benefits: formData.benefits,
            is_active: formData.is_active,
          })
          .eq("id", editingService.id);

        if (error) throw error;
        return editingService.id;
      } else {
        const { data: newService, error } = await supabase
          .from("holistic_services")
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim(),
            benefits: formData.benefits,
            is_active: formData.is_active,
          })
          .select()
          .single();

        if (error) throw error;

        if (newService) {
          setEditingService(newService);
          setServiceImages(prev => ({
            ...prev,
            [newService.id]: []
          }));
          fetchServices();
          return newService.id;
        }
        return null;
      }
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error("Error al guardar el servicio");
      return null;
    }
  };

  const addBenefit = () => {
    if (newBenefit.trim() && formData.benefits.length < 10) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, newBenefit.trim()]
      });
      setNewBenefit("");
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const savedServiceId = await saveService();
    if (!savedServiceId) return;

    if (editingService) {
      toast.success("Servicio actualizado exitosamente");
      setIsFormOpen(false);
      fetchServices();
    } else {
      toast.success("Servicio creado exitosamente");
      // El diálogo permanece abierto para agregar imágenes
      fetchServices();
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      // Eliminar imágenes primero
      const { error: imagesError } = await supabase
        .from("holistic_service_images")
        .delete()
        .eq("service_id", deletingId);

      if (imagesError) {
        console.error("Error deleting images:", imagesError);
      }

      // Eliminar el servicio
      const { error } = await supabase
        .from("holistic_services")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      toast.success("Servicio eliminado exitosamente");
      setIsDeleteOpen(false);
      setDeletingId(null);
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Error al eliminar el servicio");
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const totalServices = services.length;
    const activeServices = services.filter(s => s.is_active).length;
    const inactiveServices = services.filter(s => !s.is_active).length;

    const thisMonthServices = services.filter(s => new Date(s.created_at) >= startOfMonth).length;
    const lastMonthServices = services.filter(s => {
      const date = new Date(s.created_at);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    }).length;

    const growthPercentage = lastMonthServices === 0 
      ? (thisMonthServices > 0 ? 100 : 0)
      : Math.round(((thisMonthServices - lastMonthServices) / lastMonthServices) * 100);

    return {
      total: totalServices,
      active: activeServices,
      inactive: inactiveServices,
      thisMonth: thisMonthServices,
      growth: growthPercentage,
    };
  }, [services]);

  const filteredServices = useMemo(() => {
    let filtered = services.filter((service) =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(s => 
        statusFilter === "active" ? s.is_active : !s.is_active
      );
    }

    // Category filter - for now using benefits count as a proxy
    if (categoryFilter !== "all") {
      filtered = filtered.filter(s => {
        const benefitsCount = s.benefits?.length || 0;
        if (categoryFilter === "with-benefits") return benefitsCount > 0;
        if (categoryFilter === "no-benefits") return benefitsCount === 0;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [services, searchTerm, statusFilter, categoryFilter, sortBy]);

  const getServiceImages = (serviceId: string) => {
    return serviceImages[serviceId] || [];
  };

  return (
    <div className="admin-page-shell">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-inner admin-page-header-inner-row">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Servicios Holísticos</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona los servicios ofrecidos para empresas
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Servicio
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-page-content">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Total Servicios</span>
                <Badge variant="secondary">Todos</Badge>
              </div>
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="flex items-center gap-1 mt-2">
                {stats.thisMonth > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-muted-foreground" />
                )}
                <span className={`text-sm ${stats.thisMonth > 0 ? "text-green-500" : "text-muted-foreground"}`}>
                  +{stats.thisMonth} este mes
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Servicios registrados</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Activos</span>
                <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Activo</Badge>
              </div>
              <div className="text-3xl font-bold">{stats.active}</div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500">
                  {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Del total de servicios</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Inactivos</span>
                <Badge variant="secondary">Inactivo</Badge>
              </div>
              <div className="text-3xl font-bold">{stats.inactive}</div>
              <div className="flex items-center gap-1 mt-2">
                {stats.inactive > 0 ? (
                  <TrendingDown className="w-4 h-4 text-amber-500" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                )}
                <span className={`text-sm ${stats.inactive > 0 ? "text-amber-500" : "text-green-500"}`}>
                  {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Del total de servicios</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Crecimiento</span>
                <Badge variant="outline">Mensual</Badge>
              </div>
              <div className="text-3xl font-bold">{stats.growth >= 0 ? "+" : ""}{stats.growth}%</div>
              <div className="flex items-center gap-1 mt-2">
                {stats.growth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm ${stats.growth >= 0 ? "text-green-500" : "text-red-500"}`}>
                  vs mes anterior
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Comparado con el mes pasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar servicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

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

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="with-benefits">Con beneficios</SelectItem>
              <SelectItem value="no-benefits">Sin beneficios</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más recientes</SelectItem>
              <SelectItem value="oldest">Más antiguos</SelectItem>
              <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Services Grid */}
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
        ) : filteredServices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay servicios holísticos</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? "No se encontraron resultados" : "Comienza agregando un servicio"}
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Servicio
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => {
              const images = getServiceImages(service.id);
              const firstImage = images.length > 0 ? images[0].image_url : null;

              return (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  {firstImage && (
                    <div className="relative w-full h-48">
                      <Image
                        src={firstImage}
                        alt={service.name}
                        fill
                        className="object-cover rounded-t-lg"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <CardHeader className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{service.name}</CardTitle>
                        <Badge variant={service.is_active ? "default" : "secondary"}>
                          {service.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 py-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {service.description}
                    </p>

                    {images.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ImageIcon className="w-3 h-3" />
                        <span>{images.length} imagen{images.length !== 1 ? 'es' : ''}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setViewingService(service);
                          setIsViewOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenForm(service)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeletingId(service.id);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
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
        <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Editar Servicio Holístico" : "Nuevo Servicio Holístico"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Modifica la información del servicio"
                : "Agrega un nuevo servicio para ofrecer a las empresas"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Título del Servicio <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Yoga Corporativo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el servicio y sus beneficios..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Beneficios del Servicio</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Agrega hasta 10 beneficios que este servicio ofrece a las empresas
              </p>

              {/* Lista de beneficios */}
              {formData.benefits.length > 0 && (
                <div className="space-y-2 mb-3">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="flex-1 text-sm">{benefit}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBenefit(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input para agregar beneficio */}
              {formData.benefits.length < 10 && (
                <div className="flex gap-2">
                  <Input
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Ej: Mejora el bienestar general de los colaboradores"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addBenefit();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addBenefit}
                    disabled={!newBenefit.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Imágenes del Servicio</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Agrega hasta 4 imágenes para mostrar el servicio (máximo 2MB por imagen)
              </p>
              <HolisticServiceImagesManager
                serviceId={editingService?.id || null}
                currentImages={editingService ? getServiceImages(editingService.id) : []}
                onImagesUpdate={async () => {
                  if (editingService) {
                    await fetchServiceImages(editingService.id);
                    fetchServices();
                  } else {
                    // Si no hay editingService, recargar todo para obtener el servicio guardado
                    await fetchServices();
                  }
                }}
                onSaveService={async () => {
                  const savedId = await saveService();
                  if (savedId) {
                    // Asegurar que el servicio se cargue en el estado
                    const { data: service } = await supabase
                      .from("holistic_services")
                      .select("*")
                      .eq("id", savedId)
                      .single();
                    if (service) {
                      setEditingService(service);
                      setServiceImages(prev => ({
                        ...prev,
                        [savedId]: []
                      }));
                    }
                  }
                  return savedId;
                }}
                maxImages={4}
                maxSizeMB={2}
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
              <Label htmlFor="is_active">Servicio activo (visible en la landing page)</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingService ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingService?.name}</DialogTitle>
            <DialogDescription>Detalles del servicio holístico</DialogDescription>
          </DialogHeader>
          {viewingService && (
            <div className="space-y-6">
              <div>
                <Label className="text-muted-foreground">Estado</Label>
                <div className="mt-1">
                  <Badge variant={viewingService.is_active ? "default" : "secondary"}>
                    {viewingService.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Descripción</Label>
                <p className="mt-1 text-sm">{viewingService.description}</p>
              </div>

              {viewingService.benefits && viewingService.benefits.length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Beneficios</Label>
                  <ul className="space-y-2">
                    {viewingService.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {getServiceImages(viewingService.id).length > 0 && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">Imágenes</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {getServiceImages(viewingService.id).map((image) => (
                      <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden border">
                        <Image
                          src={image.image_url}
                          alt={`Imagen ${image.image_order + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Eliminar Servicio Holístico"
        description="¿Estás seguro de que quieres eliminar este servicio? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={handleDelete}
      />
    </div>
  );
}
