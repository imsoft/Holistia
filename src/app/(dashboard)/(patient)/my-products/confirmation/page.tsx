"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Download, ShoppingBag, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PurchaseConfirmationPage() {
  useUserStoreInit();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useUserId();
  const purchaseId = searchParams.get("purchase_id");
  const [productTitle, setProductTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!purchaseId);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!purchaseId) {
      setLoading(false);
      setError(true);
      return;
    }

    const fetchPurchase = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: purchase, error: fetchError } = await supabase
        .from("digital_product_purchases")
        .select(`
          id,
          digital_products ( title )
        `)
        .eq("id", purchaseId)
        .eq("buyer_id", user.id)
        .maybeSingle();

      if (fetchError || !purchase) {
        setError(true);
        setProductTitle(null);
      } else {
        const raw = purchase as { digital_products?: { title: string } | Array<{ title: string }> };
        const product = Array.isArray(raw.digital_products) ? raw.digital_products[0] : raw.digital_products;
        setProductTitle(product?.title ?? "Tu programa");
      }
      setLoading(false);
    };

    fetchPurchase();
  }, [purchaseId, router]);

  const myProductsUrl = "/my-products" + (purchaseId ? `#purchase-${purchaseId}` : "");

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <Card>
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !purchaseId) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-muted-foreground mb-4">
              No encontramos esta compra o el enlace no es válido.
            </p>
            <Button asChild>
              <Link href="/my-products">Ir a Mis programas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl">
      <Card className="overflow-hidden">
        <div className="bg-primary/10 px-6 py-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            ¡Gracias por tu compra!
          </h1>
          <p className="text-muted-foreground">
            Tu pago se ha procesado correctamente.
          </p>
        </div>
        <CardContent className="pt-8 pb-8 space-y-6">
          {productTitle && (
            <p className="text-center text-foreground font-medium">
              <span className="text-muted-foreground">Programa: </span>
              {productTitle}
            </p>
          )}
          <p className="text-center text-sm text-muted-foreground">
            Ya tienes acceso al contenido. Descárgalo desde Mis programas o explora más recursos.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link href={myProductsUrl}>
                <Download className="h-4 w-4" />
                Ir a Mis programas y descargar
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/explore/programs">
                <ShoppingBag className="h-4 w-4" />
                Ver más programas
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
