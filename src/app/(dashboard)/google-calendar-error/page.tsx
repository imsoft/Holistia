"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Calendar, RefreshCw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

function GoogleCalendarErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"professional" | "admin">("professional");
  const errorMessage = searchParams.get("message") || "No se pudo conectar con Google Calendar";

  useEffect(() => {
    async function getUserInfo() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);

        // Verificar si es admin
        const { data: adminData } = await supabase
          .from("admin_users")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (adminData) {
          setAccountType("admin");
        }
      }
    }

    getUserInfo();
  }, []);

  const handleRetry = () => {
    if (!userId) return;

    if (accountType === "admin") {
      router.push(`/admin/${userId}/settings`);
    } else {
      router.push(`/professional/${userId}/settings`);
    }
  };

  const handleGoBack = () => {
    if (!userId) return;

    if (accountType === "admin") {
      router.push(`/admin/${userId}/dashboard`);
    } else {
      router.push(`/professional/${userId}/dashboard`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Ícono de error */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            {/* Título y mensaje */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Error de Conexión
              </h1>
              <p className="text-muted-foreground">
                {errorMessage}
              </p>
            </div>

            {/* Información adicional */}
            <div className="w-full p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium text-foreground">
                Posibles causas:
              </p>
              <ul className="text-xs text-muted-foreground text-left space-y-1 list-disc list-inside">
                <li>No se otorgaron los permisos necesarios</li>
                <li>La cuenta de Google no es válida</li>
                <li>Hubo un problema de conexión</li>
                <li>La sesión expiró durante el proceso</li>
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={handleRetry}
                className="flex-1"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Intentar de Nuevo
              </Button>
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Volver al Inicio
              </Button>
            </div>

            {/* Ayuda adicional */}
            <p className="text-xs text-muted-foreground">
              Si el problema persiste, por favor contacta a soporte técnico.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GoogleCalendarErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <GoogleCalendarErrorContent />
    </Suspense>
  );
}
