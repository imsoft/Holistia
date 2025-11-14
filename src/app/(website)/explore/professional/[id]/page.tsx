"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ProfessionalRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const professionalId = params.id as string;

  useEffect(() => {
    const redirectToProfessional = async () => {
      try {
        // Verificar si el usuario está autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Si está autenticado, redirigir a la ruta con su userId
          router.replace(`/patient/${user.id}/explore/professional/${professionalId}`);
        } else {
          // Si no está autenticado, redirigir al login con el return URL
          const returnUrl = encodeURIComponent(`/explore/professional/${professionalId}`);
          router.replace(`/login?returnUrl=${returnUrl}`);
        }
      } catch (error) {
        console.error("Error redirecting to professional:", error);
        // En caso de error, redirigir al login
        router.replace("/login");
      }
    };

    redirectToProfessional();
  }, [professionalId, router, supabase]);

  // Mostrar un mensaje de carga mientras redirige
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
}

