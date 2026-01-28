"use client";

import React, { useState, useEffect } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { Target, Loader2, Filter } from "lucide-react";
import { ChallengeCard } from "@/components/ui/challenge-card";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Challenge {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  created_at?: string;
  professional_first_name?: string;
  professional_last_name?: string;
  professional_photo?: string;
  professional_profession?: string;
  professional_is_verified?: boolean;
  linked_patient_id?: string | null;
  linked_professional_id?: string | null;
}

const difficultyOptions = [
  { value: 'all', label: 'Todos los niveles' },
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
  { value: 'expert', label: 'Experto' },
];

const sortOptions = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'oldest', label: 'Más antiguos' },
  { value: 'title_asc', label: 'Título: A-Z' },
  { value: 'title_desc', label: 'Título: Z-A' },
];

export default function ChallengesPage() {
  useUserStoreInit();
  const userId = useUserId();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedSort, setSelectedSort] = useState<string>('newest');
  const supabase = createClient();

  useEffect(() => {
    fetchChallenges();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedDifficulty, selectedSort, challenges]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);

      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select(`
          *,
          professional_applications(
            first_name,
            last_name,
            profile_photo,
            profession,
            is_verified,
            status,
            is_active
          )
        `)
        .eq('is_active', true)
        // En exploración solo deben mostrarse retos públicos de profesionales
        .eq('is_public', true)
        .eq('created_by_type', 'professional')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching challenges:", error);
        return;
      }

      // Transformar datos para incluir información del profesional
      const transformedChallenges = (challengesData || []).map((challenge: any) => ({
        ...challenge,
        professional_first_name: challenge.professional_applications?.first_name,
        professional_last_name: challenge.professional_applications?.last_name,
        professional_photo: challenge.professional_applications?.profile_photo,
        professional_profession: challenge.professional_applications?.profession,
        professional_is_verified: challenge.professional_applications?.is_verified,
      }));

      setChallenges(transformedChallenges);
      setFilteredChallenges(transformedChallenges);

    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...challenges];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(challenge =>
        challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.short_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${challenge.professional_first_name} ${challenge.professional_last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por dificultad
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(challenge => challenge.difficulty_level === selectedDifficulty);
    }

    // Ordenar
    switch (selectedSort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
        break;
      case 'title_asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title_desc':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    setFilteredChallenges(filtered);
  };

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header integrado */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Retos Disponibles
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Descubre retos diseñados por expertos para ayudarte a alcanzar tus metas
          </p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <Input
                placeholder="Buscar retos por nombre, descripción, categoría o experto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filtro de dificultad */}
            <div className="w-full sm:w-48">
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Nivel de dificultad" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ordenar */}
            <div className="w-full sm:w-48">
              <Select value={selectedSort} onValueChange={setSelectedSort}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resultados */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredChallenges.length} {filteredChallenges.length === 1 ? 'reto encontrado' : 'retos encontrados'}
            </span>
            {(searchTerm || selectedDifficulty !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDifficulty('all');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Lista de retos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm || selectedDifficulty !== 'all'
                ? 'No se encontraron retos'
                : 'No hay retos disponibles'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || selectedDifficulty !== 'all'
                ? 'Intenta con otros términos de búsqueda o ajusta los filtros'
                : 'Los expertos aún no han creado retos'}
            </p>
            {(searchTerm || selectedDifficulty !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDifficulty('all');
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((challenge) => (
               <ChallengeCard key={challenge.id} challenge={challenge} userId={userId || undefined} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
