"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Download,
  ShoppingBag,
  Clock,
  FileText,
  Tag,
  Sparkles,
  BookOpen,
  Headphones,
  Video,
  FileCheck,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { VerifiedBadge } from "@/components/ui/verified-badge";

interface PurchasedProduct {
  id: string;
  product_id: string;
  purchased_at: string;
  download_count: number;
  last_accessed_at?: string;
  // Datos del producto
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  cover_image_url?: string;
  file_url?: string;
  duration_minutes?: number;
  pages_count?: number;
  // Datos del profesional
  professional_id: string;
  professional_first_name: string;
  professional_last_name: string;
  professional_photo?: string;
  professional_is_verified: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
  meditation: Sparkles,
  ebook: BookOpen,
  manual: FileText,
  course: Video,
  guide: FileCheck,
  audio: Headphones,
  video: Video,
  other: Tag,
};

const CATEGORY_LABELS: Record<string, string> = {
  meditation: "Meditación",
  ebook: "eBook",
  manual: "Manual",
  course: "Curso",
  guide: "Guía",
  audio: "Audio",
  video: "Video",
  other: "Otro",
};

export default function MyProducts({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [products, setProducts] = useState<PurchasedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchPurchasedProducts();
  }, []);

  const fetchPurchasedProducts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Debes iniciar sesión");
        return;
      }

      // Consulta combinando compras con productos y profesionales
      const { data: purchasesData, error } = await supabase
        .from("digital_product_purchases")
        .select(`
          id,
          product_id,
          purchased_at,
          download_count,
          last_accessed_at,
          digital_products!inner (
            id,
            title,
            description,
            category,
            price,
            currency,
            cover_image_url,
            file_url,
            duration_minutes,
            pages_count,
            professional_applications!inner (
              id,
              first_name,
              last_name,
              profile_photo,
              is_verified
            )
          )
        `)
        .eq("buyer_id", user.id)
        .eq("payment_status", "succeeded")
        .order("purchased_at", { ascending: false });

      if (error) throw error;

      // Transformar los datos
      const transformedProducts: PurchasedProduct[] = purchasesData?.map((purchase: any) => ({
        id: purchase.id,
        product_id: purchase.product_id,
        purchased_at: purchase.purchased_at,
        download_count: purchase.download_count,
        last_accessed_at: purchase.last_accessed_at,
        title: purchase.digital_products.title,
        description: purchase.digital_products.description,
        category: purchase.digital_products.category,
        price: purchase.digital_products.price,
        currency: purchase.digital_products.currency,
        cover_image_url: purchase.digital_products.cover_image_url,
        file_url: purchase.digital_products.file_url,
        duration_minutes: purchase.digital_products.duration_minutes,
        pages_count: purchase.digital_products.pages_count,
        professional_id: purchase.digital_products.professional_applications.id,
        professional_first_name: purchase.digital_products.professional_applications.first_name,
        professional_last_name: purchase.digital_products.professional_applications.last_name,
        professional_photo: purchase.digital_products.professional_applications.profile_photo,
        professional_is_verified: purchase.digital_products.professional_applications.is_verified,
      })) || [];

      setProducts(transformedProducts);

    } catch (error) {
      console.error("Error fetching purchased products:", error);
      toast.error("Error al cargar tus productos");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (product: PurchasedProduct) => {
    if (!product.file_url) {
      toast.error("No hay archivo disponible para descargar");
      return;
    }

    try {
      setDownloading(product.id);

      // Incrementar contador de descargas
      await supabase.rpc("increment_download_count", {
        p_product_id: product.product_id,
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
      });

      // Abrir el archivo en nueva pestaña
      window.open(product.file_url, "_blank");
      toast.success("Descargando producto...");

      // Actualizar contador localmente
      setProducts(prev =>
        prev.map(p =>
          p.id === product.id
            ? { ...p, download_count: p.download_count + 1, last_accessed_at: new Date().toISOString() }
            : p
        )
      );

    } catch (error) {
      console.error("Error downloading product:", error);
      toast.error("Error al descargar el producto");
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando tus productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mis Productos</h1>
              <p className="text-sm text-muted-foreground">
                Productos digitales que has comprado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Productos
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">{products.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Descargado
              </CardTitle>
              <Download className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                {products.reduce((sum, p) => sum + p.download_count, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inversión Total
              </CardTitle>
              <Tag className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                ${products.reduce((sum, p) => sum + p.price, 0).toLocaleString('es-MX')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        {products.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No has comprado productos aún</h3>
              <p className="text-muted-foreground text-center mb-4">
                Explora los perfiles de profesionales verificados para descubrir meditaciones, ebooks y más
              </p>
              <Button asChild>
                <a href={`/patient/${id}/explore`}>
                  Explorar Profesionales
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const CategoryIcon = CATEGORY_ICONS[product.category] || Tag;

              return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5">
                    {product.cover_image_url ? (
                      <Image
                        src={product.cover_image_url}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <CategoryIcon className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge variant="default">
                        <CategoryIcon className="h-3 w-3 mr-1" />
                        {CATEGORY_LABELS[product.category] || product.category}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="px-6 pt-6 pb-3">
                    <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                  </CardHeader>

                  <CardContent className="px-6 pb-6 space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {product.duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {product.duration_minutes} min
                        </div>
                      )}
                      {product.pages_count && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {product.pages_count} páginas
                        </div>
                      )}
                    </div>

                    {/* Professional Info */}
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      {product.professional_photo ? (
                        <Image
                          src={product.professional_photo}
                          alt=""
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium flex items-center gap-1">
                          {product.professional_first_name} {product.professional_last_name}
                          {product.professional_is_verified && <VerifiedBadge size={12} />}
                        </p>
                        <p className="text-xs text-muted-foreground">Profesional</p>
                      </div>
                    </div>

                    {/* Purchase Info */}
                    <div className="space-y-2 pt-2 border-t text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Comprado: {formatDate(product.purchased_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        Descargado {product.download_count} {product.download_count === 1 ? 'vez' : 'veces'}
                      </div>
                      {product.last_accessed_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Último acceso: {formatDate(product.last_accessed_at)}
                        </div>
                      )}
                    </div>

                    {/* Download Button */}
                    <Button
                      className="w-full"
                      onClick={() => handleDownload(product)}
                      disabled={downloading === product.id}
                    >
                      {downloading === product.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Descargando...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Descargar Archivo
                        </>
                      )}
                    </Button>

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
