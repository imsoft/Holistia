"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import UserLayout from "@/app/(dashboard)/(patient)/layout";
import ProfessionalLayout from "@/app/(dashboard)/(professional)/layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile, loading } = useProfile();
  const [isProfessional, setIsProfessional] = useState(false);
  const [checking, setChecking] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUserType = async () => {
      if (!profile) {
        setChecking(false);
        return;
      }

      // Verificar si el usuario es profesional
      const { data: professionalApp } = await supabase
        .from('professional_applications')
        .select('id, status')
        .eq('user_id', profile.id)
        .eq('status', 'approved')
        .maybeSingle();

      setIsProfessional(!!professionalApp);
      setChecking(false);
    };

    if (!loading && profile) {
      checkUserType();
    } else if (!loading && !profile) {
      setChecking(false);
    }
  }, [profile, loading, supabase]);

  // Mostrar loading mientras se verifica
  if (loading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si es profesional, usar el layout profesional
  if (isProfessional) {
    return <ProfessionalLayout>{children}</ProfessionalLayout>;
  }

  // Por defecto, usar el layout de paciente
  return <UserLayout>{children}</UserLayout>;
}
