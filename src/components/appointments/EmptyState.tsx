import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";

interface EmptyStateProps {
  filter: string;
  getStatusText: (status: string) => string;
}

const EmptyState = ({ filter, getStatusText }: EmptyStateProps) => {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No se encontraron citas
        </h3>
        <p className="text-muted-foreground mb-4">
          {filter === "todas" 
            ? "Aún no tienes citas programadas." 
            : `No tienes citas ${getStatusText(filter).toLowerCase()}.`}
        </p>
        <Button asChild>
          <Link href="/my-space">
            <Plus className="h-4 w-4 mr-2" />
            Agendar Primera Cita
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
