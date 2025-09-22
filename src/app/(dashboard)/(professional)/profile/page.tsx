"use client";

import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

const PerfilPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mi Perfil Profesional</h1>
        <p className="text-muted-foreground">Gestiona tu información profesional y credenciales</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Página de Perfil
            </h3>
            <p className="text-muted-foreground">
              Esta página está en desarrollo. Aquí podrás editar tu perfil profesional.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerfilPage;
