import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const HistoryEmptyState = () => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No se encontraron citas
        </h3>
        <p className="text-muted-foreground">
          No hay citas que coincidan con tus filtros de búsqueda.
        </p>
      </CardContent>
    </Card>
  );
};

export default HistoryEmptyState;
