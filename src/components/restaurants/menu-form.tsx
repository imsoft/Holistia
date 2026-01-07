"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MenuImagesUploader } from "@/components/ui/menu-images-uploader";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RestaurantMenu {
  id: string;
  restaurant_id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  images: string[];
  display_order: number;
  is_active: boolean;
}

interface MenuFormProps {
  restaurantId: string;
  menu: RestaurantMenu | null;
  redirectPath: string;
}

export function MenuForm({ restaurantId, menu, redirectPath }: MenuFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [tempMenuId] = useState(crypto.randomUUID());

  const [formData, setFormData] = useState({
    title: menu?.title || "",
    description: menu?.description || "",
    price: menu?.price?.toString() || "",
    images: menu?.images || [] as string[],
    is_active: menu?.is_active ?? true,
  });

  const supabase = createClient();

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

      if (menu) {
        // Actualizar menú existente
        const { error } = await supabase
          .from("restaurant_menus")
          .update(menuData)
          .eq("id", menu.id);

        if (error) throw error;
        toast.success("Menú actualizado exitosamente");
      } else {
        // Crear nuevo menú
        menuData.id = tempMenuId;

        const { error } = await supabase
          .from("restaurant_menus")
          .insert(menuData);

        if (error) throw error;
        toast.success("Menú creado exitosamente");
      }

      router.push(redirectPath);
    } catch (error) {
      console.error("Error saving menu:", error);
      toast.error("Error al guardar el menú");
    } finally {
      setSaving(false);
    }
  };

  const handleImagesUpdated = (images: string[]) => {
    setFormData({ ...formData, images });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        menuId={menu?.id || tempMenuId}
        currentImages={formData.images}
        onImagesUpdated={handleImagesUpdated}
        maxImages={4}
      />

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(redirectPath)}
          disabled={saving}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving
            ? "Guardando..."
            : menu
            ? "Actualizar Menú"
            : "Crear Menú"}
        </Button>
      </div>
    </form>
  );
}
