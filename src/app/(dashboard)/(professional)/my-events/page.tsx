"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Mail, Calendar } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function MyEventsPage() {
  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <div className="border-b border-border bg-card w-full">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0 w-full">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                Mis Eventos
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gestiona tus eventos y talleres
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full py-8 px-4 sm:px-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Crear un Evento</h2>
            <p className="text-muted-foreground text-lg">
              Si quieres crear un evento ponte en contacto con el equipo de Holistia,{" "}
              <a 
                href="mailto:hola@holistia.io" 
                className="text-primary hover:underline font-medium"
              >
                hola@holistia.io
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
