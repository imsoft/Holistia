"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { ProfessionalSidebar } from "@/components/professional-sidebar";

export default function ProfessionalIdLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  return (
    <SidebarProvider>
      <ProfessionalSidebar />
      <main className="flex-1">
        {children}
      </main>
    </SidebarProvider>
  );
}
