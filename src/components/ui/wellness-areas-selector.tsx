"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const WELLNESS_AREAS = [
  "Salud mental",
  "Espiritualidad",
  "Actividad física",
  "Social",
  "Alimentación",
] as const;

interface WellnessAreasSelectorProps {
  selectedAreas: string[];
  onAreasChange: (areas: string[]) => void;
  label?: string;
  description?: string;
}

export function WellnessAreasSelector({
  selectedAreas,
  onAreasChange,
  label = "Áreas de Bienestar",
  description,
}: WellnessAreasSelectorProps) {
  const toggleArea = (area: string) => {
    if (selectedAreas.includes(area)) {
      onAreasChange(selectedAreas.filter((a) => a !== area));
    } else {
      onAreasChange([...selectedAreas, area]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {WELLNESS_AREAS.map((area) => {
          const isSelected = selectedAreas.includes(area);
          return (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {area}
            </button>
          );
        })}
      </div>
      {selectedAreas.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedAreas.length} {selectedAreas.length === 1 ? "área seleccionada" : "áreas seleccionadas"}
        </p>
      )}
    </div>
  );
}
