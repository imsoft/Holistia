"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditDigitalProductPage() {
  const params = useParams();
  const router = useRouter();
  const professionalId = params.id as string;
  const productId = params.productId as string;

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
        router.push(`/professional/${professionalId}/digital-products`);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, professionalId, router, supabase]);

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
            onClick={() => router.push(`/professional/${professionalId}/digital-products`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Editar Programa</h1>
        </div>
      </div>

      <div className="py-4 px-6">
        <div className="max-w-3xl mx-auto">
          <DigitalProductForm
            professionalId={professionalId}
            product={product}
            redirectPath={`/professional/${professionalId}/digital-products`}
          />
        </div>
      </div>
    </div>
  );
}
