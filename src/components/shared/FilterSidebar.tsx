import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Brain, MapPin, Users, Heart, Dumbbell, Stethoscope, LucideIcon } from "lucide-react";

interface Especialidad {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface FilterSidebarProps {
  specialty: string;
  setSpecialty: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  totalResults: number;
}

const specialties: Especialidad[] = [
  { value: "todas", label: "Todas las especialidades", icon: Users },
  { value: "psicologia", label: "Psicología", icon: Brain },
  { value: "nutricion", label: "Nutrición", icon: Heart },
  { value: "fitness", label: "Fitness", icon: Dumbbell },
  { value: "medicina", label: "Medicina General", icon: Stethoscope },
];

const FilterSidebar = ({ 
  specialty, 
  setSpecialty, 
  location, 
  setLocation, 
  totalResults 
}: FilterSidebarProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Especialidad
          </label>
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona especialidad" />
            </SelectTrigger>
            <SelectContent className="w-[--radix-select-trigger-width]">
              {specialties.map((spec) => {
                const Icon = spec.icon;
                return (
                  <SelectItem key={spec.value} value={spec.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {spec.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Ubicación
          </label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona ubicación" />
            </SelectTrigger>
            <SelectContent className="w-[--radix-select-trigger-width]">
              <SelectItem value="todas">Todas las ubicaciones</SelectItem>
              <SelectItem value="ciudad de méxico">Ciudad de México</SelectItem>
              <SelectItem value="guadalajara">Guadalajara</SelectItem>
              <SelectItem value="monterrey">Monterrey</SelectItem>
              <SelectItem value="puebla">Puebla</SelectItem>
              <SelectItem value="online">Consultas Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {totalResults} profesional{totalResults !== 1 ? 'es' : ''} encontrado{totalResults !== 1 ? 's' : ''}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterSidebar;
