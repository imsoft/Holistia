"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminRedirect } from "@/components/admin-redirect";
import { useUserStoreInit } from "@/hooks/use-user-store-init";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inicializar Zustand (userId, tipo, etc) también en admin.
  // Sin esto, algunas páginas (ej. /admin/dashboard) pueden quedarse en "Cargando..."
  // esperando un userId que nunca llega.
  useUserStoreInit();

  return (
    <SidebarProvider>
      <AdminRedirect />
      <div className="flex min-h-dvh w-full">
        <AdminSidebar />
        <main className="admin-dashboard-main flex-1">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
