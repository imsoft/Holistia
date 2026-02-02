"use client";

import { useState, useEffect } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import Link from "next/link";
import Image from "next/image";
import { Store, MapPin, Brain, Sparkles, Activity, Apple, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/ui/layout-skeleton";

interface Shop {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  image_url?: string;
  category?: string;
  wellness_areas?: string[];
  is_active: boolean;
  created_at: string;
}

const categories = [
  {
    id: "professionals",
    name: "Salud mental",
    icon: Brain,
    description: "Expertos en salud mental",
  },
  {
    id: "spirituality",
    name: "Espiritualidad",
    icon: Sparkles,
    description: "Guías espirituales y terapeutas holísticos",
  },
  {
    id: "physical-activity",
    name: "Actividad física",
    icon: Activity,
    description: "Entrenadores y terapeutas físicos",
  },
  {
    id: "social",
    name: "Social",
    icon: Users,
    description: "Especialistas en desarrollo social",
  },
  {
    id: "nutrition",
    name: "Alimentación",
    icon: Apple,
    description: "Nutriólogos y especialistas en alimentación",
  },
];

// Mapeo de categorías de bienestar
const categoryToWellnessAreas: Record<string, string[]> = {
  professionals: ["Salud mental"],
  spirituality: ["Espiritualidad"],
  "physical-activity": ["Actividad física"],
  social: ["Social"],
  nutrition: ["Alimentación"],
} as const;

export default function ShopsPage() {
  useUserStoreInit();
  const userId = useUserId();
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const supabase = createClient();

  // Verificar autenticación
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
  }, [supabase]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  useEffect(() => {
    const getShops = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("shops")
          .select("*, wellness_areas")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching shops:", error);
        } else {
          setShops(data || []);
          setFilteredShops(data || []);
        }
      } catch (error) {
        console.error("Error fetching shops:", error);
      } finally {
        setLoading(false);
      }
    };

    getShops();
  }, [supabase]);

  useEffect(() => {
    let filtered = shops;

    // Filtrar por categorías de bienestar
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((shop) => {
        const shopWellnessAreas = shop.wellness_areas || [];
        if (shopWellnessAreas.length === 0) {
          return false;
        }
        return selectedCategories.some((categoryId) => {
          const mappedAreas = categoryToWellnessAreas[categoryId] || [];
          return mappedAreas.length > 0 && shopWellnessAreas.some((area) => mappedAreas.includes(area));
        });
      });
    }

    setFilteredShops(filtered);
  }, [selectedCategories, shops]);

  // Componente de skeleton
  const ShopCardSkeleton = () => (
    <Card className="h-[480px] flex flex-col">
      <Skeleton className="w-full h-64 shrink-0 rounded-t-lg" />
      <CardHeader className="pb-1.5 px-4 pt-3 shrink-0">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <div className="flex gap-1.5 mt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-3 flex flex-col grow min-h-0">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-4" />
        <Skeleton className="h-9 w-full mt-auto" />
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-8 text-center">
            <Skeleton className="h-10 w-64 mx-auto mb-2" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ShopCardSkeleton key={`shop-skeleton-${i}`} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const renderShopsContent = () => (
    <div className="min-h-screen bg-background">
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Comercios
          </h1>
          <p className="text-muted-foreground">
            Explora una variedad de productos y servicios locales
          </p>
        </div>

        {/* Categories Filter */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              Filtrar por categorías
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Selecciona una categoría para filtrar expertos, programas, eventos, restaurantes y comercios
            </p>
          </div>
          <div className="flex gap-3 sm:gap-4 justify-center overflow-x-auto pb-2">
            {categories.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`group flex flex-col items-center p-3 sm:p-4 rounded-xl border transition-all duration-200 min-w-[120px] sm:min-w-[140px] shrink-0 cursor-pointer ${
                    selectedCategories.includes(category.id)
                      ? "bg-white text-primary border-primary shadow-md"
                      : "bg-primary text-white border-primary/20 hover:border-primary hover:shadow-md"
                  }`}
                >
                  <div className="mb-1 sm:mb-2">
                    <CategoryIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`} />
                  </div>
                  <span className={`text-sm sm:text-base font-medium text-center ${selectedCategories.includes(category.id) ? "text-primary" : "text-white"}`}>
                    {category.name}
                  </span>
                  <span className={`text-[10px] sm:text-xs mt-1 text-center leading-tight ${selectedCategories.includes(category.id) ? "text-primary/80" : "text-white/80"}`}>
                    {category.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
            {filteredShops.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No se encontraron comercios
            </h3>
            <p className="text-muted-foreground">
              Intenta ajustar tus filtros de búsqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredShops.map((shop) => (
              <Link
                key={shop.id}
                href={`/explore/shop/${shop.slug || shop.id}`}
              >
                <Card className="group hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-[480px] flex flex-col">
                  <div className="relative w-full h-48 bg-linear-to-br from-primary/20 to-primary/10 shrink-0">
                    {shop.image_url && shop.image_url.trim() !== "" ? (
                      <Image
                        src={shop.image_url}
                        alt={shop.name}
                        fill
                        className="object-cover"
                        unoptimized={shop.image_url.includes('supabase.co') || shop.image_url.includes('supabase.in')}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/logos/holistia-black.png";
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Store className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="shrink-0">
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">{shop.name}</CardTitle>
                    {shop.category && (
                      <Badge variant="secondary" className="w-fit mt-2">
                        {shop.category}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 pb-6 min-h-0">
                    {shop.description && (
                      <div 
                        className="text-sm text-muted-foreground line-clamp-3 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: shop.description }}
                      />
                    )}
                    {(shop.address || shop.city) && (
                      <div className="flex items-start gap-2 mt-3 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">
                          {shop.address && shop.city ? `${shop.address}, ${shop.city}` : shop.address || shop.city}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );

  // Si aún estamos verificando autenticación, mostrar skeleton
  if (isAuthenticated === null) {
    return <PageSkeleton cards={6} />;
  }

  // El layout del explore se encarga del navbar/footer para usuarios no autenticados
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {renderShopsContent()}
      </div>
    );
  }

  // Si está autenticado, mostrar con layout normal (navbar del dashboard)
  return renderShopsContent();
}
