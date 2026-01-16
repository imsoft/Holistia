"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ProfessionalSidebar } from "@/components/professional-sidebar";
import { createClient } from "@/utils/supabase/client";

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { profile, loading } = useProfile();

  // Si no hay perfil después de cargar, verificar si hay sesión y redirigir al login si es necesario
  useEffect(() => {
    if (!loading && !profile) {
      const checkAuthAndRedirect = async () => {
        const supabase = createClient();
        const currentPath = window.location.pathname;
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // No hay usuario autenticado, redirigir al login
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        } else {
          // Hay usuario pero no perfil, intentar refrescar una vez más
          console.warn('⚠️ User exists but profile not found, attempting final refresh...');
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            // Si no se puede refrescar, redirigir al login
            router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
          }
        }
      };
      
      checkAuthAndRedirect();
    }
  }, [loading, profile, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay perfil, mostrar mensaje mientras se verifica la sesión
  if (!profile && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <ProfessionalSidebar />
        <main className="flex-1 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
