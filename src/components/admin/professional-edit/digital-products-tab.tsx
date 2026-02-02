"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import { formatPrice } from "@/lib/price-utils";
import Image from "next/image";
import { DeleteConfirmation } from "@/components/ui/confirmation-dialog";

interface DigitalProductsTabProps {
  professionalId: string;
}

interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  cover_image_url?: string;
  is_active: boolean;
  sales_count: number;
}

export function DigitalProductsTab({ professionalId }: DigitalProductsTabProps) {
  const router = useRouter();
  const supabase = createClient();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<DigitalProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [professionalId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('digital_products')
        .select('*')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar los programas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (product: DigitalProduct) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      setDeleting(true);
      const { error } = await supabase
        .from('digital_products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) {
        throw new Error(error.message || 'Error al eliminar el producto');
      }

      toast.success('Programa eliminado exitosamente');
      fetchProducts();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el producto';
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="py-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Programas</CardTitle>
              <CardDescription>Gestiona los programas que vende este profesional</CardDescription>
            </div>
            <Button onClick={() => router.push(`/admin/digital-products/new?professional_id=${professionalId}`)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Programa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay productos digitales registrados
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg overflow-hidden">
                  {product.cover_image_url && (
                    <div className="relative h-40 w-full">
                      <Image
                        src={product.cover_image_url}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                      {product.is_active && (
                        <Badge variant="default" className="shrink-0">Activo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="font-semibold">
                        {formatPrice(product.price, product.currency || "MXN")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {product.sales_count} ventas
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => router.push(`/admin/digital-products/${product.id}/edit?professional_id=${professionalId}`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteClick(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmation
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={productToDelete?.title || 'este programa'}
        loading={deleting}
      />
    </div>
  );
}
