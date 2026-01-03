"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

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
  const supabase = createClient();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('Error al cargar los productos digitales');
    } finally {
      setLoading(false);
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Programas y Productos Digitales</CardTitle>
              <CardDescription>Gestiona los productos digitales que vende este profesional</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
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
                        ${product.price} {product.currency}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {product.sales_count} ventas
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
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
    </div>
  );
}
