"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DigitalProductForm } from "@/components/digital-products/digital-product-form";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface DigitalProduct {
  id: string;
  professional_id: string;
  title: string;
  description: string;
  category: 'meditation' | 'ebook' | 'manual' | 'guide' | 'audio' | 'video' | 'other';
  price: number;
  currency: string;
  cover_image_url?: string;
  file_url?: string;
  duration_minutes?: number;
  pages_count?: number;
  is_active: boolean;
  wellness_areas?: string[];
}

export default function EditAdminDigitalProductPage() {
  useUserStoreInit();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = useUserId();
  const productId = params.productId as string;
  const professionalId = searchParams.get('professional_id');
  const fromList = searchParams.get('from') === 'list';

  const [product, setProduct] = useState<DigitalProduct | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("digital_products")
          .select("*")
          .eq("id", productId)
          .single();

        if (error) throw error;

        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Error al cargar el programa");
        router.push(professionalId ? `/admin/professionals/${professionalId}` : `/admin/professionals`);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, adminId, professionalId, router, supabase]);

  if (loading) {
    return (
      <div className="admin-page-shell flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="admin-page-shell flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Programa no encontrado</p>
          <Button onClick={() => router.push(professionalId ? `/admin/professionals/${professionalId}` : `/admin/professionals`)}>
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const redirectPath = fromList 
    ? `/admin/digital-products`
    : (professionalId ? `/admin/professionals/${professionalId}` : `/admin/professionals`);

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-inner admin-page-header-inner-row">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(redirectPath)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Editar Programa</h1>
        </div>
      </div>

      <div className="py-4 px-6">
        <div className="max-w-3xl mx-auto">
          <DigitalProductForm
            professionalId={product.professional_id}
            product={product}
            redirectPath={redirectPath}
            isAdminContext={true}
          />
        </div>
      </div>
    </div>
  );
}
