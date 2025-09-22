import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, CalendarDays } from "lucide-react";

const QuickActions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <CardDescription>Gestiona tus citas de manera eficiente</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button asChild variant="outline" className="h-20 flex-col gap-2">
            <Link href="/my-space">
              <Plus className="h-6 w-6" />
              <span>Agendar Nueva Cita</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-20 flex-col gap-2">
            <Link href="/favorites">
              <Users className="h-6 w-6" />
              <span>Ver Favoritos</span>
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-20 flex-col gap-2">
            <Link href="/historical">
              <CalendarDays className="h-6 w-6" />
              <span>Ver Historial</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
