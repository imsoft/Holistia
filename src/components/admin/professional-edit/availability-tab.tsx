"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AvailabilityTabProps {
  professionalId: string;
}

export function AvailabilityTab({ professionalId }: AvailabilityTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Disponibilidad</CardTitle>
        <CardDescription>Gestiona los horarios disponibles del profesional</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground py-8">
          Funcionalidad de disponibilidad en desarrollo
        </p>
      </CardContent>
    </Card>
  );
}
