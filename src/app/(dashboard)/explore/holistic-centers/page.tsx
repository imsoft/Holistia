"use client";

import { useState, useEffect } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Building2, Brain, Sparkles, Activity, Apple, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HolisticCenterCard, mapApiCenterToCardCenter } from "@/components/ui/holistic-center-card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageSkeleton } from "@/components/ui/layout-skeleton";
interface HolisticCenter {
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
  opening_hours?: any;
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

export default function HolisticCentersPage() {
  useUserStoreInit();
  const userId = useUserId();
  const [centers, setCenters] = useState<HolisticCenter[]>([]);
  const [filteredCenters, setFilteredCenters] = useState<HolisticCenter[]>([]);
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
    const getCenters = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("holistic_centers")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching holistic centers:", error);
        } else {
          setCenters(data || []);
          setFilteredCenters(data || []);
        }
      } catch (error) {
        console.error("Error fetching holistic centers:", error);
      } finally {
        setLoading(false);
      }
    };

    getCenters();
  }, [supabase]);

  useEffect(() => {
    let filtered = centers;

    // Filtrar por categorías de bienestar (si las agregamos en el futuro)
    // Por ahora, mostrar todos los centros sin importar las categorías seleccionadas
    // ya que los centros holísticos no tienen wellness_areas aún
    if (selectedCategories.length > 0) {
      // Si hay categorías seleccionadas, mostrar todos los centros
      // (esto se puede ajustar cuando se agregue wellness_areas a holistic_centers)
      setFilteredCenters(filtered);
    } else {
      setFilteredCenters(filtered);
    }
  }, [selectedCategories, centers]);

  // Componente de skeleton
  const CenterCardSkeleton = () => (
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
              <CenterCardSkeleton key={`center-skeleton-${i}`} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const renderCentersContent = () => (
    <div className="min-h-screen bg-background">
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Centros Holísticos
          </h1>
          <p className="text-muted-foreground">
            Descubre espacios dedicados al bienestar integral
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
            {filteredCenters.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No se encontraron centros holísticos
                </h3>
                <p className="text-muted-foreground">
                  {centers.length === 0
                    ? "Próximamente habrá centros holísticos disponibles."
                    : "Intenta ajustar tus filtros de búsqueda"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCenters.map((center) => (
                  <HolisticCenterCard
                    key={center.id}
                    center={mapApiCenterToCardCenter(center)}
                    showFavoriteButton
                    className="w-full block"
                  />
                ))}
              </div>
            )}
        </div>
      </main>
    </div>
  );

  // Si aún estamos verificando autenticación, mostrar loading
  if (isAuthenticated === null) {
    return <PageSkeleton cards={6} />;
  }

  // El layout del explore se encarga del navbar/footer para usuarios no autenticados
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {renderCentersContent()}
      </div>
    );
  }

  // Si está autenticado, mostrar con layout normal (navbar del dashboard)
  return renderCentersContent();
}