"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function BecomeProfessionalRedirectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Usuario autenticado: redirigir directamente al formulario
          router.replace(`/patient/${user.id}/explore/become-professional`);
        } else {
          // Usuario no autenticado: redirigir a signup con parámetro
          router.replace("/signup?becomeProfessional=true");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        router.replace("/signup?becomeProfessional=true");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndRedirect();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return null;
}

