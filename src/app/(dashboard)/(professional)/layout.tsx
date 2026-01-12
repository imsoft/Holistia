"use client";

import { useProfile } from "@/hooks/use-profile";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ProfessionalSidebar } from "@/components/professional-sidebar";

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useProfile();

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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Error al cargar datos del usuario</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex">
        <ProfessionalSidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
