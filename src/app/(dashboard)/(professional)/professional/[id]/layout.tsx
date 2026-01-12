"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, User, LogOut, Briefcase } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { NotificationsDropdown } from "@/components/ui/notifications-dropdown";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ProfessionalSidebar } from "@/components/professional-sidebar";

// Función para generar navegación profesional (URLs limpias)
const getProfessionalNavigation = () => {
  return [
    { name: "Dashboard", href: `/dashboard` },
    { name: "Servicios", href: `/services` },
    { name: "Citas", href: `/appointments` },
    { name: "Pacientes", href: `/patients` },
    { name: "Mensajes", href: `/messages` },
    { name: "Retos", href: `/challenges` },
    { name: "Finanzas", href: `/finances` },
  ];
};

// Función para generar navegación de usuario
const getUserNavigation = () => {
  return [
    { name: "Mi perfil", href: `/profile`, icon: User },
    { name: "Vista de usuario", href: `/explore`, icon: Briefcase },
    { name: "Cerrar sesión", href: "#", icon: LogOut },
  ];
};

export default function ProfessionalIdLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPathname, setCurrentPathname] = useState("");
  const { profile, loading } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname]);

  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        return;
      }
      
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navigation = getProfessionalNavigation();
  const userNavigation = getUserNavigation();

  // Función para determinar si un item está activo
  const isActive = (href: string) => {
    if (!currentPathname) return false;
    // Manejar rutas profesionales con IDs en la URL
    if (currentPathname.startsWith('/professional/')) {
      const pathWithoutId = currentPathname.replace(/^\/professional\/[^/]+/, '');
      if (href === '/dashboard') {
        return pathWithoutId === '/dashboard' || pathWithoutId === '';
      }
      return pathWithoutId.startsWith(href);
    }
    // Para rutas limpias sin ID
    if (href === `/dashboard`) {
      return currentPathname === `/dashboard`;
    }
    return currentPathname.startsWith(href);
  };

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

  const userName = profile.first_name && profile.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile.email?.split('@')[0] || 'Usuario';

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        {/* Navigation Header - Mismo estilo que paciente */}
        <nav className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex shrink-0 items-center">
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2"
                  >
                    <Image
                      src="/logos/holistia-black.png"
                      alt="Holistia"
                      width={32}
                      height={32}
                      className="h-auto w-auto"
                    />
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                        isActive(item.href)
                          ? "border-sidebar-primary text-sidebar-foreground"
                          : "border-transparent text-sidebar-foreground/70 hover:border-sidebar-border hover:text-sidebar-foreground"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="hidden sm:ml-6 sm:flex sm:items-center gap-2">
                {/* Notifications */}
                <NotificationsDropdown />

                {/* Profile dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative flex max-w-xs items-center rounded-full p-1 hover:bg-accent transition-colors focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
                    >
                      <span className="sr-only">Abrir menú de usuario</span>
                      <div className="relative">
                        <Image
                          src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 aspect-square rounded-full object-cover shadow-sm hover:shadow-md transition-all duration-200"
                        />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-64 max-w-80">
                    <div className="flex items-start gap-3 p-3">
                      <div className="relative shrink-0">
                        <Image
                          src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 aspect-square rounded-full object-cover border-2 border-primary/20"
                        />
                      </div>
                      <div className="flex flex-col space-y-1 leading-tight min-w-0 flex-1">
                        <p className="font-medium text-foreground wrap-break-word leading-tight">
                          {userName}
                        </p>
                        <p className="text-sm text-muted-foreground break-all">
                          {profile.email}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-border" />
                    {userNavigation.map((item) =>
                      item.name === "Cerrar sesión" ? (
                        <DropdownMenuItem key={item.name} onClick={handleSignOut}>
                          <div className="flex items-center gap-2 cursor-pointer">
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </div>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem key={item.name} asChild>
                          <Link
                            href={item.href}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile menu button */}
              <div className="sm:hidden flex items-center">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Abrir menú</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetTitle className="sr-only">Navegación</SheetTitle>
                    <div className="flex flex-col space-y-4 mt-6">
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <Image
                          src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 aspect-square rounded-full object-cover"
                        />
                        <div className="flex flex-col">
                          <p className="font-medium text-foreground">{userName}</p>
                          <p className="text-sm text-muted-foreground">{profile.email}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {navigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block rounded-lg px-3 py-3 text-base font-semibold transition-colors ${
                              isActive(item.href)
                                ? "bg-accent text-accent-foreground"
                                : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                            }`}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t pt-4 space-y-1">
                        {userNavigation.map((item) =>
                          item.name === "Cerrar sesión" ? (
                            <button
                              key={item.name}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                handleSignOut();
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-base font-semibold text-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </button>
                          ) : (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-semibold text-foreground/70 hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex">
          <ProfessionalSidebar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
