"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  discount_price: number | null;
  stock: number;
  sku: string | null;
  category: string | null;
  is_featured: boolean;
  is_active: boolean;
}

interface ProductFormProps {
  shopId: string;
  product: Product | null;
  redirectPath: string;
}

export function ProductForm({ shopId, product, redirectPath }: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    discount_price: product?.discount_price?.toString() || "",
    stock: product?.stock.toString() || "0",
    sku: product?.sku || "",
    category: product?.category || "",
    is_featured: product?.is_featured ?? false,
    is_active: product?.is_active ?? true,
  });

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (formData.discount_price && formData.price) {
      const price = parseFloat(formData.price);
      const discountPrice = parseFloat(formData.discount_price);
      if (discountPrice >= price) {
        toast.error("El precio con descuento debe ser menor al precio normal");
        return;
      }
    }

    try {
      setSaving(true);

      const productData = {
        shop_id: shopId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
        stock: parseInt(formData.stock) || 0,
        sku: formData.sku.trim() || null,
        category: formData.category.trim() || null,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
      };

      if (product) {
        const { error } = await supabase
          .from("shop_products")
          .update(productData)
          .eq("id", product.id);

        if (error) throw error;
        toast.success("Producto actualizado exitosamente");
      } else {
        const { error } = await supabase
          .from("shop_products")
          .insert(productData);

        if (error) throw error;
        toast.success("Producto creado exitosamente");
      }

      router.push(redirectPath);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Error al guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Producto *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Collar de Plata"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe el producto..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Precio</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_price">Precio con Descuento</Label>
          <Input
            id="discount_price"
            type="number"
            step="0.01"
            value={formData.discount_price}
            onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="SKU-001"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="Ej: Joyería"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_featured"
            checked={formData.is_featured}
            onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked === true })}
          />
          <Label htmlFor="is_featured" className="font-normal cursor-pointer">
            Producto destacado
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked === true })}
          />
          <Label htmlFor="is_active" className="font-normal cursor-pointer">
            Producto activo
          </Label>
        </div>
      </div>

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
            : product
            ? "Actualizar Producto"
            : "Crear Producto"}
        </Button>
      </div>
    </form>
  );
}
