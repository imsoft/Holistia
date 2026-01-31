"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ProductForm } from "@/components/shops/product-form";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

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

export default function EditShopProductPage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const adminId = useUserId();
  const shopId = params.shopId as string;
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("shop_products")
          .select("*")
          .eq("id", productId)
          .single();

        if (error) throw error;

        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Error al cargar el producto");
        router.push(`/admin/shops`);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, adminId, router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/admin/shops`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Editar Producto</h1>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <ProductForm
            shopId={shopId}
            product={product}
            redirectPath={`/admin/shops`}
          />
        </div>
      </div>
    </div>
  );
}
