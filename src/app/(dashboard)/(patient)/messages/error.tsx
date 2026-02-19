"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, RefreshCw } from "lucide-react";

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en /messages:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 pb-6 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Algo salió mal</h2>
          <p className="text-sm text-muted-foreground mb-4">
            No se pudo cargar la página de mensajes. Prueba de nuevo o recarga la página.
          </p>
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
