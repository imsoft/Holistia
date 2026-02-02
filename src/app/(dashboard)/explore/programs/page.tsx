"use client";

import React, { useState, useEffect } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { ShoppingBag, Brain, Sparkles, Activity, Apple, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DigitalProductCard } from "@/components/ui/digital-product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/ui/layout-skeleton";

interface DigitalProduct {
  id: string;
  slug?: string;
  professional_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  cover_image_url?: string;
  file_url?: string;
  duration_minutes?: number;
  pages_count?: number;
  is_active: boolean;
  sales_count: number;
  created_at: string;
  wellness_areas?: string[];
  professional_applications?: {
    first_name: string;
    last_name: string;
    profile_photo?: string;
    is_verified?: boolean;
    wellness_areas?: string[];
  };
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
};

export default function ProgramsPage() {
  useUserStoreInit();
  const userId = useUserId();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<DigitalProduct[]>([]);
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

  useEffect(() => {
    const getProducts = async () => {
      try {
        setLoading(true);

        const { data: productsData, error: productsError } = await supabase
          .from("digital_products")
          .select(`
            *,
            professional_applications!digital_products_professional_id_fkey(
              first_name,
              last_name,
              profile_photo,
              is_verified,
              wellness_areas
            )
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (productsError) {
          console.error("Error fetching products:", productsError);
        } else {
          const transformedProducts = (productsData || []).map((product: any) => ({
            ...product,
            professional_applications: Array.isArray(product.professional_applications) && product.professional_applications.length > 0
              ? product.professional_applications[0]
              : undefined,
            professional_first_name: product.professional_applications?.[0]?.first_name,
            professional_last_name: product.professional_applications?.[0]?.last_name,
            professional_photo: product.professional_applications?.[0]?.profile_photo,
            professional_is_verified: product.professional_applications?.[0]?.is_verified,
          }));
          setProducts(transformedProducts);
          setFilteredProducts(transformedProducts);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    getProducts();
  }, [supabase]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  useEffect(() => {
    let filtered = [...products];

    // Filtrar por categorías de bienestar (wellness_areas)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) => {
        // Priorizar wellness_areas del programa si existe y no está vacío
        let productWellnessAreas: string[] = [];
        
        if (product.wellness_areas && Array.isArray(product.wellness_areas) && product.wellness_areas.length > 0) {
          productWellnessAreas = product.wellness_areas;
        } else {
          // Fallback: usar wellness_areas del profesional asociado
          const professional = product.professional_applications;
          if (professional && professional.wellness_areas && Array.isArray(professional.wellness_areas)) {
            productWellnessAreas = professional.wellness_areas;
          }
        }
        
        // Si no tiene wellness_areas, ocultar cuando hay filtros activos
        if (productWellnessAreas.length === 0) {
          return false;
        }
        
        // Verificar si alguna de las áreas de bienestar coincide con las categorías seleccionadas
        return selectedCategories.some((categoryId) => {
          const mappedAreas = categoryToWellnessAreas[categoryId] || [];
          return mappedAreas.length > 0 && productWellnessAreas.some((area) => mappedAreas.includes(area));
        });
      });
    }

    setFilteredProducts(filtered);
  }, [selectedCategories, products]);

  const renderProgramsContent = () => (
    <div className="min-h-screen bg-background">
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Programas Digitales
          </h1>
          <p className="text-muted-foreground">
            Descubre meditaciones, workbooks, guías y más recursos para tu bienestar
          </p>
        </div>

        {/* Categories Filter */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              Filtrar por categorías
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Selecciona una categoría para filtrar programas
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
            {/* Lista de productos */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={`program-skeleton-${i}`} className="h-[480px] flex flex-col">
                <Skeleton className="w-full h-48 shrink-0 rounded-t-lg" />
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
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No hay programas disponibles
            </h3>
            <p className="text-muted-foreground">
              {products.length === 0
                ? "Próximamente habrá programas digitales disponibles."
                : "No se encontraron programas que coincidan con los filtros aplicados."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <DigitalProductCard
                key={product.id}
                product={{
                  id: product.id,
                  title: product.title,
                  description: product.description,
                  category: product.category,
                  price: product.price,
                  currency: product.currency,
                  cover_image_url: product.cover_image_url,
                  duration_minutes: product.duration_minutes,
                  pages_count: product.pages_count,
                  sales_count: product.sales_count,
                  professional_first_name: product.professional_applications?.first_name,
                  professional_last_name: product.professional_applications?.last_name,
                  professional_photo: product.professional_applications?.profile_photo,
                  professional_is_verified: product.professional_applications?.is_verified,
                }}
                showProfessional={true}
              />
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
        {renderProgramsContent()}
      </div>
    );
  }

  // Si está autenticado, mostrar con layout normal (navbar del dashboard)
  return renderProgramsContent();
}
