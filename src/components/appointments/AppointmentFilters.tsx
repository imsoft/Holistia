import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface AppointmentFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
}

const AppointmentFilters = ({ filter, setFilter }: AppointmentFiltersProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "todas" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("todas")}
          >
            Todas
          </Button>
          <Button
            variant={filter === "pendiente" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pendiente")}
          >
            Pendientes
          </Button>
          <Button
            variant={filter === "confirmada" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("confirmada")}
          >
            Confirmadas
          </Button>
          <Button
            variant={filter === "cancelada" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("cancelada")}
          >
            Canceladas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentFilters;
