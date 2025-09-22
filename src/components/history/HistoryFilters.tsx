import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Search, CalendarDays, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface HistoryFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const HistoryFilters = ({ filter, setFilter, searchTerm, setSearchTerm }: HistoryFiltersProps) => {
  const filterOptions = [
    { value: "todas", label: "Todas", icon: CalendarDays },
    { value: "completada", label: "Completadas", icon: CheckCircle },
    { value: "pendiente", label: "Pendientes", icon: AlertCircle },
    { value: "cancelada", label: "Canceladas", icon: XCircle }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros y Búsqueda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por profesional o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Filtros de estado */}
          <div className="flex gap-2">
            {filterOptions.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={filter === value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(value)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HistoryFilters;
