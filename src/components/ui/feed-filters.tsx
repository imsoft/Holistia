"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Filter, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FeedFilterOptions {
  categories: string[];
  difficulties: string[];
  searchQuery: string;
}

interface FeedFiltersProps {
  onFilterChange: (filters: FeedFilterOptions) => void;
}

const CATEGORIES = [
  { value: "health", label: "Salud" },
  { value: "fitness", label: "Fitness" },
  { value: "nutrition", label: "Nutrición" },
  { value: "mindfulness", label: "Mindfulness" },
  { value: "productivity", label: "Productividad" },
  { value: "learning", label: "Aprendizaje" },
  { value: "creativity", label: "Creatividad" },
  { value: "social", label: "Social" },
];

const DIFFICULTIES = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
  { value: "expert", label: "Experto" },
];

export function FeedFilters({ onFilterChange }: FeedFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newCategories);
    onFilterChange({
      categories: newCategories,
      difficulties: selectedDifficulties,
      searchQuery,
    });
  };

  const handleDifficultyToggle = (difficulty: string) => {
    const newDifficulties = selectedDifficulties.includes(difficulty)
      ? selectedDifficulties.filter((d) => d !== difficulty)
      : [...selectedDifficulties, difficulty];

    setSelectedDifficulties(newDifficulties);
    onFilterChange({
      categories: selectedCategories,
      difficulties: newDifficulties,
      searchQuery,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onFilterChange({
      categories: selectedCategories,
      difficulties: selectedDifficulties,
      searchQuery: value,
    });
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedDifficulties([]);
    setSearchQuery("");
    onFilterChange({
      categories: [],
      difficulties: [],
      searchQuery: "",
    });
  };

  const activeFiltersCount = selectedCategories.length + selectedDifficulties.length;
  const hasActiveFilters = activeFiltersCount > 0 || searchQuery.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar en el feed..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filtros avanzados */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel>Categorías</DropdownMenuLabel>
            {CATEGORIES.map((category) => (
              <DropdownMenuCheckboxItem
                key={category.value}
                checked={selectedCategories.includes(category.value)}
                onCheckedChange={() => handleCategoryToggle(category.value)}
              >
                {category.label}
              </DropdownMenuCheckboxItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Dificultad</DropdownMenuLabel>
            {DIFFICULTIES.map((difficulty) => (
              <DropdownMenuCheckboxItem
                key={difficulty.value}
                checked={selectedDifficulties.includes(difficulty.value)}
                onCheckedChange={() => handleDifficultyToggle(difficulty.value)}
              >
                {difficulty.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Chips de filtros activos */}
      {(selectedCategories.length > 0 || selectedDifficulties.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((category) => {
            const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label;
            return (
              <Badge
                key={category}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => handleCategoryToggle(category)}
              >
                {categoryLabel}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
          {selectedDifficulties.map((difficulty) => {
            const difficultyLabel = DIFFICULTIES.find((d) => d.value === difficulty)?.label;
            return (
              <Badge
                key={difficulty}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => handleDifficultyToggle(difficulty)}
              >
                {difficultyLabel}
                <X className="h-3 w-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
