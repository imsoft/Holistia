"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
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
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { MenuImagesUploader } from "@/components/ui/menu-images-uploader";
import { Plus, Edit, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import Image from "next/image";

interface RestaurantMenu {
  id: string;
  restaurant_id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  images: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface RestaurantMenuManagerProps {
  restaurantId: string;
}

export function RestaurantMenuManager({ restaurantId }: RestaurantMenuManagerProps) {
  const [menus, setMenus] = useState<RestaurantMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<RestaurantMenu | null>(null);
  const [deletingMenu, setDeletingMenu] = useState<RestaurantMenu | null>(null);
  const [saving, setSaving] = useState(false);
  const [tempMenuId, setTempMenuId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    images: [] as string[],
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    if (restaurantId) {
      fetchMenus();
    }
  }, [restaurantId]);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("restaurant_menus")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Parsear imágenes desde JSONB
      const menusWithImages = (data || []).map((menu) => ({
        ...menu,
        images: Array.isArray(menu.images) ? menu.images : [],
      }));

      setMenus(menusWithImages);
    } catch (error) {
      console.error("Error fetching menus:", error);
      toast.error("Error al cargar los menús");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (menu?: RestaurantMenu) => {
    if (menu) {
      setEditingMenu(menu);
      setTempMenuId(null);
      setFormData({
        title: menu.title,
        description: menu.description || "",
        price: menu.price?.toString() || "",
        images: menu.images || [],
        is_active: menu.is_active,
      });
    } else {
      const newTempId = crypto.randomUUID();
      setTempMenuId(newTempId);
      setEditingMenu(null);
      setFormData({
        title: "",
        description: "",
        price: "",
        images: [],
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("El título es requerido");
      return;
    }

    setSaving(true);

    try {
      const menuData: {
        restaurant_id: string;
        title: string;
        description: string | null;
        price: number | null;
        images: string[];
        is_active: boolean;
        id?: string;
      } = {
        restaurant_id: restaurantId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        images: formData.images,
        is_active: formData.is_active,
      };

      if (editingMenu) {
        // Actualizar menú existente
        const { error } = await supabase
          .from("restaurant_menus")
          .update(menuData)
          .eq("id", editingMenu.id);

        if (error) throw error;
        toast.success("Menú actualizado exitosamente");
      } else {
        // Crear nuevo menú
        // Si hay tempMenuId, usarlo para mantener consistencia con las imágenes
        if (tempMenuId) {
          menuData.id = tempMenuId;
        }

        const { error } = await supabase
          .from("restaurant_menus")
          .insert(menuData);

        if (error) throw error;
        toast.success("Menú creado exitosamente");
      }

      setIsFormOpen(false);
      fetchMenus();
    } catch (error) {
      console.error("Error saving menu:", error);
      toast.error("Error al guardar el menú");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMenu) return;

    try {
      // Eliminar imágenes del storage primero
      if (deletingMenu.images && deletingMenu.images.length > 0) {
        const filePaths = deletingMenu.images
          .map((url) => {
            const urlParts = url.split('/restaurants/');
            return urlParts.length >= 2 ? urlParts[1] : null;
          })
          .filter((path): path is string => path !== null);

        if (filePaths.length > 0) {
          await supabase.storage
            .from('restaurants')
            .remove(filePaths);
        }
      }

      // Eliminar el menú (esto también eliminará las imágenes por CASCADE si está configurado)
      const { error } = await supabase
        .from("restaurant_menus")
        .delete()
        .eq("id", deletingMenu.id);

      if (error) throw error;
      toast.success("Menú eliminado exitosamente");
      setIsDeleteOpen(false);
      setDeletingMenu(null);
      fetchMenus();
    } catch (error) {
      console.error("Error deleting menu:", error);
      toast.error("Error al eliminar el menú");
    }
  };

  const handleImagesUpdated = (images: string[]) => {
    setFormData({ ...formData, images });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Cargando menús...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5" />
          Menús del Restaurante
        </CardTitle>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Menú
        </Button>
      </div>

      {/* Lista de menús */}
      {menus.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              No hay menús registrados. Agrega el primero.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {menus.map((menu) => (
            <Card key={menu.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Imágenes */}
                  {menu.images && menu.images.length > 0 && (
                    <div className="flex-shrink-0">
                      <div className="grid grid-cols-2 gap-2 w-32">
                        {menu.images.slice(0, 4).map((imageUrl, index) => (
                          <div key={index} className="relative aspect-square rounded overflow-hidden border">
                            <Image
                              src={imageUrl}
                              alt={`Imagen ${index + 1} de ${menu.title}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Información */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{menu.title}</h3>
                        {menu.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {menu.description}
                          </p>
                        )}
                        {menu.price && (
                          <p className="text-lg font-bold text-primary mt-2">
                            ${menu.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenForm(menu)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingMenu(menu);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de formulario */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMenu ? "Editar Menú" : "Nuevo Menú"}
            </DialogTitle>
            <DialogDescription>
              {editingMenu
                ? "Actualiza la información del menú"
                : "Agrega un nuevo elemento al menú del restaurante"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ej: Ensalada César"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe el plato..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="Ej: 250.00"
              />
            </div>

            {/* Uploader de imágenes */}
            <MenuImagesUploader
              restaurantId={restaurantId}
              menuId={editingMenu?.id || tempMenuId || ""}
              currentImages={formData.images}
              onImagesUpdated={handleImagesUpdated}
              maxImages={4}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Guardando..."
                  : editingMenu
                  ? "Actualizar"
                  : "Crear Menú"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Eliminar Menú"
        description={`¿Estás seguro de que quieres eliminar "${deletingMenu?.title}"? Esta acción no se puede deshacer y también eliminará las imágenes asociadas.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
