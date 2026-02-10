"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

function GoogleCalendarSuccessContent() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"professional" | "admin">("professional");
  const [countdown, setCountdown] = useState(5);

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

  useEffect(() => {
    if (countdown === 0 && userId) {
      handleRedirect();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, userId]);

  const handleRedirect = () => {
    if (!userId) return;

    if (accountType === "admin") {
      router.push(`/admin/${userId}/dashboard`);
    } else {
      router.push(`/appointments`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Ícono de éxito */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>

            {/* Título y mensaje */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                ¡Conexión Exitosa!
              </h1>
              <p className="text-muted-foreground">
                Tu cuenta de Google Calendar ha sido conectada correctamente.
              </p>
            </div>

            {/* Información adicional */}
            <div className="w-full p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Ahora tus citas se sincronizarán automáticamente con tu calendario de Google.
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={handleRedirect}
                className="flex-1"
                size="lg"
              >
                Ir a Mis Citas
              </Button>
            </div>

            {/* Countdown */}
            <p className="text-xs text-muted-foreground">
              Serás redirigido automáticamente en {countdown} segundos...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GoogleCalendarSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <GoogleCalendarSuccessContent />
    </Suspense>
  );
}
