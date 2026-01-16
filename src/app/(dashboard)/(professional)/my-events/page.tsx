"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function MyEventsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
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
  );
}
