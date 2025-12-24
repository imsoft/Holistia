"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  price: number;
  currency: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  sales_count?: number;
  created_at?: string;
  professional_first_name?: string;
  professional_last_name?: string;
  professional_photo?: string;
  professional_profession?: string;
  professional_is_verified?: boolean;
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
  { value: 'price_low', label: 'Precio: menor a mayor' },
  { value: 'price_high', label: 'Precio: mayor a menor' },
  { value: 'popular', label: 'Más populares' },
];

export default function ChallengesPage() {
  const params = useParams();
  const userId = params.id as string;
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
        .from('challenges_with_professional')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching challenges:", error);
        return;
      }

      setChallenges(challengesData || []);
      setFilteredChallenges(challengesData || []);

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
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        filtered.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
        break;
    }

    setFilteredChallenges(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-8 w-8 text-primary" />
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Retos Disponibles
            </h1>
          </div>
          <p className="text-muted-foreground">
            Descubre retos diseñados por profesionales para ayudarte a alcanzar tus metas
          </p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <Input
                placeholder="Buscar retos por nombre, descripción, categoría o profesional..."
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
                : 'Los profesionales aún no han creado retos'}
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
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
