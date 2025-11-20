"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
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

interface Shop {
  id: string;
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
  catalog_pdf_url?: string | null;
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
  catalog_pdf_url: string | null;
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

export default function AdminShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
  const [activeTab, setActiveTab] = useState<'basic' | 'products'>('basic');
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
    catalog_pdf_url: null,
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShops(data || []);
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
        catalog_pdf_url: shop.catalog_pdf_url || null,
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
        catalog_pdf_url: null,
        is_active: true,
      });
    }
    setActiveTab('basic');
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
        website: formData.website.trim() || null,
        instagram: formData.instagram.trim() || null,
        image_url: formData.image_url.trim() || null,
        opening_hours: formData.opening_hours,
        category: formData.category || null,
        catalog_pdf_url: formData.catalog_pdf_url,
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
        setActiveTab('products'); // Cambiar automáticamente al tab de productos

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

  const filteredShops = shops.filter((shop) =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryLabel = (category?: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
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
      <div className="container mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar comercios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                      <span className="text-muted-foreground">{shop.phone}</span>
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
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeletingId(shop.id);
                        setIsDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 pb-4">
              {/* Tabs for Basic Info and Products */}
              <div className="border rounded-lg">
                <div className="border-b">
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => setActiveTab('basic')}
                      className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                        activeTab === 'basic'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Información Básica
                    </button>
                    {(editingShop || tempShopId) && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('products')}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                          activeTab === 'products'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Productos
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {activeTab === 'basic' && (
                    <form onSubmit={handleSubmit} className="space-y-4" id="shop-form">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Sitio web</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.comercio.com"
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
                  Cargando...
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
                        <Label htmlFor="is_active">Comercio activo</Label>
                      </div>
                    </form>
                  )}

                  {activeTab === 'products' && (editingShop || tempShopId) && (
                    <div className="min-h-[400px]">
                      <ShopProductsManager
                        shopId={editingShop?.id || tempShopId || ""}
                        shopName={formData.name || "comercio"}
                        catalogPdfUrl={formData.catalog_pdf_url}
                        onPdfUpdated={handlePdfUpdated}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="shop-form"
              disabled={saving || activeTab !== 'basic'}
              className={activeTab !== 'basic' ? 'hidden' : ''}
            >
              {saving ? "Guardando..." : editingShop ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
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
                      {viewingShop.phone}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
