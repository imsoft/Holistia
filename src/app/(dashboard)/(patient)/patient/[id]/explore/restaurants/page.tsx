"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { UtensilsCrossed, MapPin, Brain, Sparkles, Activity, Apple, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StableImage } from "@/components/ui/stable-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  image_url?: string;
  cuisine_type?: string;
  price_range?: string;
  wellness_areas?: string[];
  is_active: boolean;
  created_at: string;
}

const CUISINE_TYPES = [
  "Mexicana",
  "Italiana",
  "Japonesa",
  "China",
  "Americana",
  "Mediterránea",
  "Vegana",
  "Vegetariana",
  "Mariscos",
  "Parrilla",
  "Comida Rápida",
  "Postres",
  "Cafetería",
  "Internacional",
  "Fusión",
  "Orgánica",
];

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

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

export default function RestaurantsPage() {
  const params = useParams();
  const userId = params.id as string;
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuisine, setSelectedCuisine] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const supabase = createClient();

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  useEffect(() => {
    const getRestaurants = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("restaurants")
          .select("*, wellness_areas")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching restaurants:", error);
        } else {
          setRestaurants(data || []);
          setFilteredRestaurants(data || []);
        }
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    getRestaurants();
  }, [supabase]);

  useEffect(() => {
    let filtered = restaurants;

    // Filtrar por categorías de bienestar
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((restaurant) => {
        const restaurantWellnessAreas = restaurant.wellness_areas || [];
        if (restaurantWellnessAreas.length === 0) {
          return false;
        }
        return selectedCategories.some((categoryId) => {
          const mappedAreas = categoryToWellnessAreas[categoryId] || [];
          return mappedAreas.length > 0 && restaurantWellnessAreas.some((area) => mappedAreas.includes(area));
        });
      });
    }

    // Filtrar por tipo de cocina
    if (selectedCuisine !== "all") {
      filtered = filtered.filter(
        (restaurant) => restaurant.cuisine_type === selectedCuisine
      );
    }

    // Filtrar por rango de precio
    if (selectedPriceRange !== "all") {
      filtered = filtered.filter(
        (restaurant) => restaurant.price_range === selectedPriceRange
      );
    }

    setFilteredRestaurants(filtered);
  }, [selectedCategories, selectedCuisine, selectedPriceRange, restaurants]);

  // Componente de skeleton
  const RestaurantCardSkeleton = () => (
    <Card className="h-full flex flex-col">
      <Skeleton className="w-full h-64 shrink-0 rounded-t-lg" />
      <CardHeader className="pb-1.5 px-4 pt-3">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <div className="flex gap-1.5 mt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 pb-3 flex flex-col grow">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-4" />
        <Skeleton className="h-9 w-full mt-auto" />
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-8 text-center">
            <Skeleton className="h-10 w-64 mx-auto mb-2" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="lg:grid lg:grid-cols-3 lg:gap-x-8">
            <aside className="lg:col-span-1 mb-6 lg:mb-0">
              <Skeleton className="h-96 w-full" />
            </aside>
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <RestaurantCardSkeleton key={`restaurant-skeleton-${i}`} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Restaurantes
          </h1>
          <p className="text-muted-foreground">
            Descubre deliciosas opciones gastronómicas
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

        <div className="lg:grid lg:grid-cols-3 lg:gap-x-8">
          {/* Sidebar con filtros */}
          <aside className="lg:col-span-1 mb-6 lg:mb-0">
            <div className="hidden lg:block">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-foreground">Filtros</h2>
              </div>
              <form className="divide-y divide-border">

                {/* Tipo de cocina */}
                <div className="py-8 first:pt-0 last:pb-0">
                  <fieldset>
                    <legend className="block text-sm font-medium text-foreground mb-6">
                      Tipo de cocina
                    </legend>
                    <div className="space-y-4">
                      {[
                        { value: "all", label: "Todos los tipos" },
                        ...CUISINE_TYPES.map((type) => ({ value: type, label: type }))
                      ].map((option, optionIdx) => (
                        <div key={option.value} className="flex gap-3">
                          <div className="flex h-5 shrink-0 items-center">
                            <div className="group grid size-4 grid-cols-1">
                              <input
                                checked={selectedCuisine === option.value}
                                onChange={() => setSelectedCuisine(option.value)}
                                id={`cuisine-${optionIdx}`}
                                name="cuisine"
                                type="radio"
                                className="col-start-1 row-start-1 appearance-none rounded-sm border border-border bg-background checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:border-border disabled:bg-muted disabled:checked:bg-muted"
                              />
                              <svg
                                fill="none"
                                viewBox="0 0 14 14"
                                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-primary-foreground group-has-disabled:stroke-muted-foreground"
                              >
                                <circle
                                  cx="7"
                                  cy="7"
                                  r="3"
                                  className="opacity-0 group-has-checked:opacity-100"
                                />
                              </svg>
                            </div>
                          </div>
                          <label htmlFor={`cuisine-${optionIdx}`} className="text-sm text-muted-foreground cursor-pointer">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {/* Rango de precio */}
                <div className="py-8 first:pt-0 last:pb-0">
                  <fieldset>
                    <legend className="block text-sm font-medium text-foreground mb-6">
                      Rango de precio
                    </legend>
                    <div className="space-y-4">
                      {[
                        { value: "all", label: "Todos los precios" },
                        ...PRICE_RANGES.map((range) => ({ value: range, label: range }))
                      ].map((option, optionIdx) => (
                        <div key={option.value} className="flex gap-3">
                          <div className="flex h-5 shrink-0 items-center">
                            <div className="group grid size-4 grid-cols-1">
                              <input
                                checked={selectedPriceRange === option.value}
                                onChange={() => setSelectedPriceRange(option.value)}
                                id={`price-${optionIdx}`}
                                name="price"
                                type="radio"
                                className="col-start-1 row-start-1 appearance-none rounded-sm border border-border bg-background checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:border-border disabled:bg-muted disabled:checked:bg-muted"
                              />
                              <svg
                                fill="none"
                                viewBox="0 0 14 14"
                                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-primary-foreground group-has-disabled:stroke-muted-foreground"
                              >
                                <circle
                                  cx="7"
                                  cy="7"
                                  r="3"
                                  className="opacity-0 group-has-checked:opacity-100"
                                />
                              </svg>
                            </div>
                          </div>
                          <label htmlFor={`price-${optionIdx}`} className="text-sm text-muted-foreground cursor-pointer">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </form>
            </div>

            {/* Mobile filters - Botón para abrir filtros en móvil */}
            <div className="lg:hidden mb-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                    <SelectTrigger>
                    <SelectValue placeholder="Tipo de cocina" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                    {CUISINE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Precio" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                    {PRICE_RANGES.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>
          </aside>

          {/* Contenido principal */}
          <div className="lg:col-span-2">
            {filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <UtensilsCrossed className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No se encontraron restaurantes
            </h3>
            <p className="text-muted-foreground">
              Intenta ajustar tus filtros de búsqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/patient/${userId}/explore/restaurant/${restaurant.id}`}
              >
                <Card className="hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                  <div className="relative w-full h-48">
                    {restaurant.image_url ? (
                      <StableImage
                        src={restaurant.image_url}
                        alt={restaurant.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <UtensilsCrossed className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{restaurant.name}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      {restaurant.cuisine_type && (
                        <Badge variant="secondary">{restaurant.cuisine_type}</Badge>
                      )}
                      {restaurant.price_range && (
                        <Badge variant="outline">{restaurant.price_range}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-6">
                    {restaurant.description && (
                      <div 
                        className="text-sm text-muted-foreground line-clamp-3 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: restaurant.description }}
                      />
                    )}
                    {restaurant.address && (
                      <div className="flex items-start gap-2 mt-3 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{restaurant.address}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
          </div>
        </div>
      </main>
    </div>
  );
}
