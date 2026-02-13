"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ProfessionalSidebar } from "@/components/professional-sidebar";
import { ProfessionalLayoutSkeleton } from "@/components/ui/layout-skeleton";
import { createClient } from "@/utils/supabase/client";

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useProfile();

  const router = useRouter();
  const supabase = createClient();

  // Verificar autenticación y redirigir si no hay usuario
  useEffect(() => {
    const checkAuth = async () => {
      if (!loading) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user && !profile) {
          // Si no hay usuario autenticado, redirigir al login
          router.replace("/login");
        }
      }
    };
    checkAuth();
  }, [loading, profile, supabase, router]);

  if (loading) {
    return <ProfessionalLayoutSkeleton />;
  }

  // Si no hay perfil después de cargar, redirigir (no mostrar error para evitar parpadeo)
  if (!profile) {
    return null; // Retornar null mientras redirige
  }

  return (
    <SidebarProvider>
      <div className="min-h-dvh bg-background flex w-full">
        <ProfessionalSidebar />
        <main className="min-w-0 flex-1 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
