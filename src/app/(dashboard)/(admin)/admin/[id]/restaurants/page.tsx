"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  UtensilsCrossed,
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
  Star,
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

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  image_url?: string;
  cuisine_type?: string;
  price_range?: string;
  opening_hours?: DaySchedule[] | string;
  rating?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  image_url: string;
  cuisine_type: string;
  price_range: string;
  opening_hours: DaySchedule[];
  is_active: boolean;
}

const CUISINE_TYPES = [
  { value: "vegetariana", label: "Vegetariana" },
  { value: "vegana", label: "Vegana" },
  { value: "organica", label: "Orgánica" },
  { value: "mexicana", label: "Mexicana" },
  { value: "internacional", label: "Internacional" },
  { value: "fusion", label: "Fusión" },
  { value: "saludable", label: "Saludable" },
  { value: "otra", label: "Otra" },
];

const PRICE_RANGES = [
  { value: "$", label: "$ - Económico" },
  { value: "$$", label: "$$ - Moderado" },
  { value: "$$$", label: "$$$ - Costoso" },
  { value: "$$$$", label: "$$$$ - Muy costoso" },
];

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [viewingRestaurant, setViewingRestaurant] = useState<Restaurant | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    instagram: "",
    image_url: "",
    cuisine_type: "",
    price_range: "",
    opening_hours: createEmptySchedule(),
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      toast.error("Error al cargar los restaurantes");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (restaurant?: Restaurant) => {
    if (restaurant) {
      setEditingRestaurant(restaurant);
      setFormData({
        name: restaurant.name,
        description: restaurant.description || "",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        website: restaurant.website || "",
        instagram: restaurant.instagram || "",
        image_url: restaurant.image_url || "",
        cuisine_type: restaurant.cuisine_type || "",
        price_range: restaurant.price_range || "",
        opening_hours: parseScheduleFromString(restaurant.opening_hours),
        is_active: restaurant.is_active,
      });
    } else {
      setEditingRestaurant(null);
      setFormData({
        name: "",
        description: "",
        address: "",
        phone: "",
        email: "",
        website: "",
        instagram: "",
        image_url: "",
        cuisine_type: "",
        price_range: "",
        opening_hours: createEmptySchedule(),
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleImageUploaded = async (imageUrl: string) => {
    setFormData({ ...formData, image_url: imageUrl });
    
    // Actualizar automáticamente en la base de datos si estamos editando
    if (editingRestaurant) {
      try {
        const { error } = await supabase
          .from("restaurants")
          .update({ image_url: imageUrl })
          .eq("id", editingRestaurant.id);
        
        if (error) throw error;
        // Actualizar el estado local
        setEditingRestaurant({ ...editingRestaurant, image_url: imageUrl });
      } catch (error) {
        console.error("Error updating image in database:", error);
        toast.error("Error al actualizar la imagen en la base de datos");
      }
    }
  };

  const handleImageRemoved = async () => {
    setFormData({ ...formData, image_url: "" });
    
    // Actualizar automáticamente en la base de datos si estamos editando
    if (editingRestaurant) {
      try {
        const { error } = await supabase
          .from("restaurants")
          .update({ image_url: null })
          .eq("id", editingRestaurant.id);
        
        if (error) throw error;
        // Actualizar el estado local
        setEditingRestaurant({ ...editingRestaurant, image_url: undefined });
      } catch (error) {
        console.error("Error removing image from database:", error);
        toast.error("Error al eliminar la imagen de la base de datos");
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

      if (editingRestaurant) {
        const { error } = await supabase
          .from("restaurants")
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            address: formData.address.trim() || null,
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null,
            website: formData.website.trim() || null,
            instagram: formData.instagram.trim() || null,
            image_url: formData.image_url.trim() || null,
            cuisine_type: formData.cuisine_type || null,
            price_range: formData.price_range || null,
            opening_hours: formData.opening_hours,
            is_active: formData.is_active,
          })
          .eq("id", editingRestaurant.id);

        if (error) throw error;
        toast.success("Restaurante actualizado exitosamente");
        setIsFormOpen(false);
        fetchRestaurants();
      } else {
        const { data: newRestaurant, error } = await supabase
          .from("restaurants")
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            address: formData.address.trim() || null,
            phone: formData.phone.trim() || null,
            email: formData.email.trim() || null,
            website: formData.website.trim() || null,
            instagram: formData.instagram.trim() || null,
            image_url: formData.image_url.trim() || null,
            cuisine_type: formData.cuisine_type || null,
            price_range: formData.price_range || null,
            opening_hours: formData.opening_hours,
            is_active: formData.is_active,
          })
          .select()
          .single();

        if (error) throw error;
        toast.success("Restaurante creado exitosamente");
        
        // Si se creó exitosamente, abrir el formulario en modo edición para permitir subir imagen
        if (newRestaurant) {
          setEditingRestaurant(newRestaurant);
          setFormData(prev => ({ ...prev, image_url: newRestaurant.image_url || "" }));
          // No cerrar el formulario, mantenerlo abierto para que puedan subir la imagen
          fetchRestaurants();
        } else {
          setIsFormOpen(false);
          fetchRestaurants();
        }
      }
    } catch (error) {
      console.error("Error saving restaurant:", error);
      toast.error("Error al guardar el restaurante");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase
        .from("restaurants")
        .delete()
        .eq("id", deletingId);

      if (error) throw error;
      toast.success("Restaurante eliminado exitosamente");
      setIsDeleteOpen(false);
      setDeletingId(null);
      fetchRestaurants();
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      toast.error("Error al eliminar el restaurante");
    }
  };

  const filteredRestaurants = restaurants.filter((restaurant) =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.cuisine_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Restaurantes</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona los restaurantes de la plataforma
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Restaurante
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
              placeholder="Buscar restaurantes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Restaurants Grid */}
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
        ) : filteredRestaurants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UtensilsCrossed className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay restaurantes</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? "No se encontraron resultados" : "Comienza agregando un restaurante"}
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Restaurante
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {restaurant.image_url && (
                  <div className="relative w-full h-48 bg-muted">
                    <Image
                      src={restaurant.image_url}
                      alt={restaurant.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <CardHeader className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{restaurant.name}</CardTitle>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                          {restaurant.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                        {restaurant.cuisine_type && (
                          <Badge variant="outline">
                            {CUISINE_TYPES.find(c => c.value === restaurant.cuisine_type)?.label || restaurant.cuisine_type}
                          </Badge>
                        )}
                        {restaurant.price_range && (
                          <Badge variant="outline">{restaurant.price_range}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 py-4">
                  {restaurant.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground line-clamp-2">{restaurant.address}</span>
                    </div>
                  )}
                  {restaurant.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">{restaurant.phone}</span>
                    </div>
                  )}
                  {restaurant.opening_hours && (
                    <div className="flex items-start gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground whitespace-pre-line">
                        {formatScheduleForDisplay(parseScheduleFromString(restaurant.opening_hours))}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setViewingRestaurant(restaurant);
                        setIsViewOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenForm(restaurant)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeletingId(restaurant.id);
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRestaurant ? "Editar Restaurante" : "Nuevo Restaurante"}
            </DialogTitle>
            <DialogDescription>
              {editingRestaurant
                ? "Modifica la información del restaurante"
                : "Agrega un nuevo restaurante a la plataforma"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del restaurante"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del restaurante"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cuisine_type">Tipo de cocina</Label>
                <Select
                  value={formData.cuisine_type}
                  onValueChange={(value) => setFormData({ ...formData, cuisine_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUISINE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_range">Rango de precio</Label>
                <Select
                  value={formData.price_range}
                  onValueChange={(value) => setFormData({ ...formData, price_range: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rango" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_RANGES.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  placeholder="contacto@restaurante.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Calle, número, colonia, ciudad"
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
                  placeholder="https://www.restaurante.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  placeholder="@nombre_del_restaurante"
                />
              </div>
            </div>

            {editingRestaurant ? (
              <RestaurantCenterImageUploader
                entityId={editingRestaurant.id}
                bucketName="restaurants"
                onImageUploaded={handleImageUploaded}
                currentImageUrl={formData.image_url || undefined}
                onImageRemoved={handleImageRemoved}
                entityName={formData.name || "restaurante"}
              />
            ) : (
              <div className="space-y-2">
                <Label>Imagen principal</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Guarda el restaurante primero, luego podrás subir una imagen editándolo
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
              <Label htmlFor="is_active">Restaurante activo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingRestaurant ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingRestaurant?.name}</DialogTitle>
            <DialogDescription>Detalles del restaurante</DialogDescription>
          </DialogHeader>
          {viewingRestaurant && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant={viewingRestaurant.is_active ? "default" : "secondary"}>
                  {viewingRestaurant.is_active ? "Activo" : "Inactivo"}
                </Badge>
                {viewingRestaurant.cuisine_type && (
                  <Badge variant="outline">
                    {CUISINE_TYPES.find(c => c.value === viewingRestaurant.cuisine_type)?.label || viewingRestaurant.cuisine_type}
                  </Badge>
                )}
                {viewingRestaurant.price_range && (
                  <Badge variant="outline">{viewingRestaurant.price_range}</Badge>
                )}
              </div>

              {viewingRestaurant.description && (
                <div>
                  <Label className="text-muted-foreground">Descripción</Label>
                  <p className="mt-1 text-sm">{viewingRestaurant.description}</p>
                </div>
              )}

              {viewingRestaurant.address && (
                <div>
                  <Label className="text-muted-foreground">Dirección</Label>
                  <p className="mt-1 text-sm flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    {viewingRestaurant.address}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {viewingRestaurant.phone && (
                  <div>
                    <Label className="text-muted-foreground">Teléfono</Label>
                    <p className="mt-1 text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {viewingRestaurant.phone}
                    </p>
                  </div>
                )}

                {viewingRestaurant.email && (
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="mt-1 text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {viewingRestaurant.email}
                    </p>
                  </div>
                )}
              </div>

              {viewingRestaurant.website && (
                <div>
                  <Label className="text-muted-foreground">Sitio web</Label>
                  <p className="mt-1 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a
                      href={viewingRestaurant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {viewingRestaurant.website}
                    </a>
                  </p>
                </div>
              )}

              {viewingRestaurant.instagram && (
                <div>
                  <Label className="text-muted-foreground">Instagram</Label>
                  <p className="mt-1 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a
                      href={`https://instagram.com/${viewingRestaurant.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {viewingRestaurant.instagram}
                    </a>
                  </p>
                </div>
              )}

              {viewingRestaurant.opening_hours && (
                <div>
                  <Label className="text-muted-foreground">Horarios de atención</Label>
                  <div className="mt-1 text-sm whitespace-pre-line">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-0.5" />
                      <span>{formatScheduleForDisplay(parseScheduleFromString(viewingRestaurant.opening_hours))}</span>
                    </div>
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
        title="Eliminar Restaurante"
        description="¿Estás seguro de que quieres eliminar este restaurante? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={handleDelete}
      />
    </div>
  );
}
