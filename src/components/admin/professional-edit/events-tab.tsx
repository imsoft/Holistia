"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EventsTabProps {
  professionalId: string;
}

export function EventsTab({ professionalId }: EventsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos y Talleres</CardTitle>
        <CardDescription>Gestiona los eventos organizados por este profesional</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground py-8">
          Funcionalidad de eventos en desarrollo
        </p>
      </CardContent>
    </Card>
  );
}
