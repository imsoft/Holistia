"use client";

import React, { useState, useEffect } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Target, Loader2, Brain, Sparkles, Activity, Apple, Users } from "lucide-react";
import { ChallengeCard } from "@/components/ui/challenge-card";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Challenge {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  wellness_areas?: string[];
  created_at?: string;
  professional_first_name?: string;
  professional_last_name?: string;
  professional_photo?: string;
  professional_profession?: string;
  professional_is_verified?: boolean;
  linked_patient_id?: string | null;
  linked_professional_id?: string | null;
}

const categories = [
  { id: "professionals", name: "Salud mental", icon: Brain, description: "Expertos en salud mental" },
  { id: "spirituality", name: "Espiritualidad", icon: Sparkles, description: "Guías espirituales y terapeutas holísticos" },
  { id: "physical-activity", name: "Actividad física", icon: Activity, description: "Entrenadores y terapeutas físicos" },
  { id: "social", name: "Social", icon: Users, description: "Especialistas en desarrollo social" },
  { id: "nutrition", name: "Alimentación", icon: Apple, description: "Nutriólogos y especialistas en alimentación" },
];

const categoryToWellnessAreas: Record<string, string[]> = {
  professionals: ["Salud mental"],
  spirituality: ["Espiritualidad"],
  "physical-activity": ["Actividad física"],
  social: ["Social"],
  nutrition: ["Alimentación"],
};

export default function ChallengesPage() {
  useUserStoreInit();
  const userId = useUserId();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchChallenges();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedCategories, challenges]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);

      // Obtener retos sin join para evitar problemas de RLS/relación
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select('id, slug, title, description, short_description, cover_image_url, duration_days, difficulty_level, category, wellness_areas, created_at, professional_id, linked_professional_id')
        .eq('is_active', true)
        .eq('is_public', true)
        .in('created_by_type', ['professional', 'admin'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching challenges:", error);
        setChallenges([]);
        setFilteredChallenges([]);
        return;
      }

      const challengesList = challengesData || [];
      const professionalIds = challengesList
        .map((c: { professional_id?: string; linked_professional_id?: string }) => c.professional_id || c.linked_professional_id)
        .filter((id): id is string => !!id);
      const uniqueProfessionalIds = [...new Set(professionalIds)];

      let professionalsMap = new Map<string, { first_name: string; last_name: string; profile_photo?: string; profession?: string; is_verified?: boolean; wellness_areas?: string[] }>();
      if (uniqueProfessionalIds.length > 0) {
        const { data: prosData } = await supabase
          .from('professional_applications')
          .select('id, first_name, last_name, profile_photo, profession, is_verified, wellness_areas')
          .in('id', uniqueProfessionalIds);
        (prosData || []).forEach((p: { id: string; first_name: string; last_name: string; profile_photo?: string; profession?: string; is_verified?: boolean; wellness_areas?: string[] }) => {
          professionalsMap.set(p.id, p);
        });
      }

      const transformedChallenges = challengesList.map((challenge: any) => {
        const profId = challenge.professional_id || challenge.linked_professional_id;
        const professional = profId ? professionalsMap.get(profId) : null;
        const challengeWellnessAreas = challenge.wellness_areas && Array.isArray(challenge.wellness_areas) && challenge.wellness_areas.length > 0
          ? challenge.wellness_areas
          : professional?.wellness_areas || [];
        return {
          ...challenge,
          wellness_areas: challengeWellnessAreas,
          professional_first_name: professional?.first_name,
          professional_last_name: professional?.last_name,
          professional_photo: professional?.profile_photo,
          professional_profession: professional?.profession,
          professional_is_verified: professional?.is_verified,
        };
      });

      setChallenges(transformedChallenges);
      setFilteredChallenges(transformedChallenges);

    } catch (error) {
      console.error("Error fetching challenges:", error);
      setChallenges([]);
      setFilteredChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const applyFilters = () => {
    let filtered = [...challenges];

    // Filtrar por categorías de bienestar (wellness_areas)
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((challenge) => {
        const challengeWellnessAreas = challenge.wellness_areas || [];
        if (challengeWellnessAreas.length === 0) return false;
        return selectedCategories.some((categoryId) => {
          const mappedAreas = categoryToWellnessAreas[categoryId] || [];
          return mappedAreas.length > 0 && challengeWellnessAreas.some((area) => mappedAreas.includes(area));
        });
      });
    }

    // Ordenar por más recientes
    filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    setFilteredChallenges(filtered);
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header - mismo estilo que Programas */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Retos
          </h1>
          <p className="text-muted-foreground">
            Descubre retos diseñados por expertos para ayudarte a alcanzar tus metas
          </p>
        </div>

        {/* Categories Filter - mismo diseño que Programas */}
        <div className="mb-6 sm:mb-8">
          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              Filtrar por categorías
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Selecciona una categoría para filtrar retos
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

        {/* Lista de retos */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={`challenge-skeleton-${i}`} className="h-[480px] flex flex-col">
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
        ) : filteredChallenges.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {challenges.length === 0
                ? "No hay retos disponibles"
                : "No se encontraron retos que coincidan con los filtros aplicados."}
            </h3>
            <p className="text-muted-foreground">
              {challenges.length === 0
                ? "Los expertos aún no han creado retos."
                : "Intenta seleccionar otras categorías para ver más resultados."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} userId={userId || undefined} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
