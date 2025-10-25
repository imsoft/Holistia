"use client";

import { useState, useEffect } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
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

// Función para generar navegación basada en el ID del usuario
const getNavigation = (userId: string, hasEvents: boolean = false) => {
  const nav = [
    { name: "Explorar", href: `/patient/${userId}/explore` },
    { name: "Favoritos", href: `/patient/${userId}/explore/favorites` },
    { name: "Citas", href: `/patient/${userId}/explore/appointments` },
  ];

  // Agregar "Mis eventos" solo si el usuario tiene eventos asignados
  if (hasEvents) {
    nav.push({ name: "Mis eventos", href: `/patient/${userId}/my-events` });
  }

  return nav;
};

// Función para generar navegación dinámica basada en el estado del usuario
const getUserNavigation = (userId: string, isProfessional: boolean = false) => {
  const baseNavigation = [
    { name: "Mi perfil", href: `/patient/${userId}/explore/profile`, icon: User },
  ];

  // Agregar enlace profesional basado en el estado
  if (isProfessional) {
    baseNavigation.push({
      name: "Dashboard Profesional",
      href: `/professional/${userId}/dashboard`,
      icon: Briefcase,
    });
  } else {
    baseNavigation.push({
      name: "Volverme profesional",
      href: `/patient/${userId}/explore/become-professional`,
      icon: Briefcase,
    });
  }

  baseNavigation.push({ name: "Cerrar sesión", href: "#", icon: LogOut });
  
  return baseNavigation;
};

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPathname, setCurrentPathname] = useState("");
  const [hasEvents, setHasEvents] = useState(false);
  const [isProfessional, setIsProfessional] = useState(false);
  const { profile, loading } = useProfile();
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  // Obtener el ID del usuario de los parámetros de la URL
  const userId = params.id as string;

  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname]);

  // Verificar si es profesional y tiene eventos
  useEffect(() => {
    if (!profile) return;

    const checkProfessionalAndEvents = async () => {
      // Verificar si el usuario es profesional (tiene aplicación aprobada)
      const { data: professionalApp } = await supabase
        .from('professional_applications')
        .select('status')
        .eq('user_id', profile.id)
        .eq('status', 'approved')
        .single();
      
      setIsProfessional(!!professionalApp);

      // Verificar si el usuario tiene eventos asignados
      const { data: events, error: eventsError } = await supabase
        .from('events_workshops')
        .select('id')
        .eq('owner_id', profile.id)
        .eq('owner_type', 'patient')
        .limit(1);

      if (!eventsError && events && events.length > 0) {
        setHasEvents(true);
      }
    };

    checkProfessionalAndEvents();
  }, [profile, supabase]);

  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        return;
      }
      
      // Redirigir al login después de cerrar sesión
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Generar navegación dinámica basada en el estado del usuario
  const navigation = getNavigation(userId, hasEvents);
  const userNavigation = profile ? getUserNavigation(userId, isProfessional) : [];

  // Función para determinar si un item está activo
  const isActive = (href: string) => {
    if (!currentPathname) return false;
    if (href === `/patient/${userId}/explore`) {
      return currentPathname === `/patient/${userId}/explore`;
    }
    return currentPathname.startsWith(href);
  };

  // Mostrar loading mientras se cargan los datos
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

  // Si no hay perfil, mostrar error
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex shrink-0 items-center">
                <Link
                  href={`/patient/${userId}/explore`}
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
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:items-center">
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
                    <div className="relative flex-shrink-0">
                      <Image
                        src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 aspect-square rounded-full object-cover border-2 border-primary/20"
                      />
                    </div>
                    <div className="flex flex-col space-y-1 leading-tight min-w-0 flex-1">
                      <p className="font-medium text-foreground break-words leading-tight">
                        {userName}
                      </p>
                      <p className="text-sm text-muted-foreground break-all">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-border" />
                  {userNavigation.map((item) => (
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
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center sm:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground"
                  >
                    <span className="sr-only">Abrir menú principal</span>
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-sm p-6">
                  <SheetTitle className="sr-only">
                    Menú de navegación
                  </SheetTitle>
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/patient/${userId}/explore`}
                      className="flex items-center space-x-2"
                    >
                      <Image
                        src="/logos/holistia-black.png"
                        alt="Holistia"
                        width={32}
                        height={32}
                        className="h-auto w-auto"
                      />
                      <span className="text-xl font-bold text-foreground">
                        Holistia
                      </span>
                    </Link>
                  </div>

                  <div className="mt-8 space-y-2">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`block rounded-lg px-3 py-3 text-base font-semibold transition-colors ${
                          isActive(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-accent"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-8 border-t border-border pt-8">
                    <div className="flex items-center space-x-4">
                      <Image
                        src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 aspect-square rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
                      />
                      <div>
                        <div className="text-base font-medium text-foreground">
                          {userName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {profile.email}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      {userNavigation.map((item) => (
                        item.name === "Cerrar sesión" ? (
                          <button
                            key={item.name}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              handleSignOut();
                            }}
                            className="flex items-center space-x-2 rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-accent transition-colors w-full text-left"
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </button>
                        ) : (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center space-x-2 rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-accent transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </Link>
                        )
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
