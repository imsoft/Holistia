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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Upload, X, Loader2, Tag, Star, Package } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFUploader } from "@/components/ui/pdf-uploader";

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
  images?: ProductImage[];
}

interface ProductImage {
  id: string;
  image_url: string;
  image_order: number;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  discount_price: string;
  stock: string;
  sku: string;
  category: string;
  is_featured: boolean;
  is_active: boolean;
}

interface ShopProductsManagerProps {
  shopId: string;
  shopName: string;
  catalogPdfUrl?: string | null;
  onPdfUpdated?: (pdfUrl: string | null) => void;
}

export function ShopProductsManager({
  shopId,
  shopName,
  catalogPdfUrl,
  onPdfUpdated
}: ShopProductsManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    discount_price: "",
    stock: "0",
    sku: "",
    category: "",
    is_featured: false,
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchProducts();
  }, [shopId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data: productsData, error: productsError } = await supabase
        .from("shop_products")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      // Fetch images for each product
      const productsWithImages = await Promise.all(
        (productsData || []).map(async (product) => {
          const { data: imagesData } = await supabase
            .from("shop_product_images")
            .select("*")
            .eq("product_id", product.id)
            .order("image_order");

          return {
            ...product,
            images: imagesData || [],
          };
        })
      );

      setProducts(productsWithImages);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price?.toString() || "",
        discount_price: product.discount_price?.toString() || "",
        stock: product.stock.toString(),
        sku: product.sku || "",
        category: product.category || "",
        is_featured: product.is_featured,
        is_active: product.is_active,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        discount_price: "",
        stock: "0",
        sku: "",
        category: "",
        is_featured: false,
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

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

      if (editingProduct) {
        const { error } = await supabase
          .from("shop_products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Producto actualizado exitosamente");
      } else {
        const { error } = await supabase
          .from("shop_products")
          .insert(productData);

        if (error) throw error;
        toast.success("Producto creado exitosamente");
      }

      setIsFormOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Error al guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      const { error } = await supabase
        .from("shop_products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
      toast.success("Producto eliminado");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar el producto");
    }
  };

  const handleImageUpload = async (productId: string, file: File, imageOrder: number) => {
    try {
      setUploadingImages(true);

      const fileExt = file.name.split(".").pop();
      const product = products.find(p => p.id === productId);
      const productName = product?.name.toLowerCase().replace(/\s+/g, "-") || "product";
      const filePath = `${shopId}/products/${productName}/image-${imageOrder}.${fileExt}`;

      // Subir al storage
      const { error: uploadError } = await supabase.storage
        .from("shops")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from("shops")
        .getPublicUrl(filePath);

      // Guardar en BD
      const { error: dbError } = await supabase
        .from("shop_product_images")
        .upsert({
          product_id: productId,
          image_url: urlData.publicUrl,
          image_order: imageOrder,
        }, {
          onConflict: "product_id,image_order",
        });

      if (dbError) throw dbError;

      toast.success("Imagen subida exitosamente");
      fetchProducts();
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!confirm("¿Eliminar esta imagen?")) return;

    try {
      // Eliminar del storage
      const filePath = imageUrl.split("/shops/")[1];
      await supabase.storage.from("shops").remove([filePath]);

      // Eliminar de BD
      const { error } = await supabase
        .from("shop_product_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;
      toast.success("Imagen eliminada");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Error al eliminar la imagen");
    }
  };

  return (
    <div className="space-y-4">
      <CardTitle className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5" />
        Catálogo del Comercio
      </CardTitle>

      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pdf">Catálogo en PDF</TabsTrigger>
          <TabsTrigger value="individual">Productos Individuales</TabsTrigger>
        </TabsList>

        <TabsContent value="pdf" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <PDFUploader
                entityType="shop"
                entityId={shopId}
                entityName={shopName}
                currentPdfUrl={catalogPdfUrl}
                onPdfUpdated={(url) => onPdfUpdated?.(url)}
                label="Catálogo Completo en PDF"
                description="Sube tu catálogo completo en formato PDF (máximo 10MB). Esta es la forma más rápida de mostrar tus productos."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Agrega productos individuales con imágenes y descripciones
            </p>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producto
            </Button>
          </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            No hay productos registrados aún
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {product.is_featured && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                      {product.price && (
                        <Badge variant="outline">
                          {product.discount_price ? (
                            <>
                              <span className="line-through text-muted-foreground mr-1">
                                ${product.price.toFixed(2)}
                              </span>
                              ${product.discount_price.toFixed(2)}
                            </>
                          ) : (
                            `$${product.price.toFixed(2)}`
                          )}
                        </Badge>
                      )}
                      {product.category && (
                        <Badge variant="outline">
                          <Tag className="w-3 h-3 mr-1" />
                          {product.category}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        Stock: {product.stock}
                      </Badge>
                      {product.sku && (
                        <Badge variant="outline" className="font-mono text-xs">
                          SKU: {product.sku}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenForm(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.description && (
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                )}

                {/* Images Section */}
                <div>
                  <Label className="text-sm font-medium">Imágenes (máx. 6)</Label>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {[0, 1, 2, 3, 4, 5].map((order) => {
                      const image = product.images?.find((img) => img.image_order === order);
                      return (
                        <div key={order} className="relative aspect-square border-2 border-dashed rounded-lg overflow-hidden">
                          {image ? (
                            <>
                              <Image
                                src={image.image_url}
                                alt={`${product.name} - imagen ${order + 1}`}
                                fill
                                className="object-cover"
                              />
                              <button
                                onClick={() => handleDeleteImage(image.id, image.image_url)}
                                className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <label className="flex items-center justify-center w-full h-full cursor-pointer hover:bg-muted/50">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(product.id, file, order);
                                }}
                                disabled={uploadingImages}
                                className="hidden"
                              />
                              <Upload className="w-4 h-4 text-muted-foreground" />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Modifica la información del producto" : "Agrega un nuevo producto al catálogo"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="0.00 (opcional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock/Inventario</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU/Código</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="COL-001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ej: Joyería, Accesorios"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_featured" className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                Producto destacado
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">Producto activo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingProduct ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
