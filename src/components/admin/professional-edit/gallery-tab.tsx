"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GalleryTabProps {
  professionalId: string;
}

export function GalleryTab({ professionalId }: GalleryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Galería</CardTitle>
        <CardDescription>Gestiona las imágenes de la galería del profesional</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground py-8">
          Funcionalidad de galería en desarrollo
        </p>
      </CardContent>
    </Card>
  );
}
