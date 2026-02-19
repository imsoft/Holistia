"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { PatientOnboardingButton } from "@/components/shared/patient-onboarding-checklist";
import { useUserId, useUserStore } from "@/stores/user-store";
import { useLoadFavorites } from "@/stores/favorites-store";
import { LayoutSkeleton } from "@/components/ui/layout-skeleton";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { EmailConfirmationBanner } from "@/components/ui/email-confirmation-banner";

// Páginas de explore accesibles sin autenticación
const publicDetailPages = [
  '/explore/program/',
  '/explore/event/',
  '/explore/challenge/',
  '/explore/professional/',
  '/explore/holistic-center/',
  '/explore/shop/',
  '/explore/restaurant/',
];

const publicListingPages = [
  '/explore/programs',
  '/explore/events',
  '/explore/professionals',
  '/explore/holistic-centers',
  '/explore/shops',
  '/explore/restaurants',
  '/explore/challenges',
];

// Función para generar navegación (URLs limpias sin IDs)
const getNavigation = (isProfessional: boolean = false) => {
  const nav = [
    { name: "Inicio", href: `/?home=true` },
    { name: "Explorar", href: `/explore` },
    { name: "Feed", href: `/feed` },
    { name: "Favoritos", href: `/explore/favorites` },
    { name: "Mensajes", href: `/messages` },
    { name: "Citas", href: `/explore/appointments` },
    { name: "Programas", href: `/my-products` },
    { name: "Retos", href: `/my-challenges` },
    { name: "Eventos", href: `/my-registrations` },
    { name: "Blogs", href: `/patient/blog` },
  ];

  if (isProfessional) {
    nav.push({ name: "Dashboard", href: `/dashboard` });
  }

  return nav;
};

// Función para generar navegación del dropdown de usuario
const getUserNavigation = (isProfessional: boolean = false) => {
  const baseNavigation = [
    { name: "Mi perfil", href: `/explore/profile`, icon: User },
  ];

  if (!isProfessional) {
    baseNavigation.push({
      name: "Volverme profesional",
      href: `/explore/become-professional`,
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
  const [isProfessional, setIsProfessional] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { profile, loading } = useProfile();
  const userId = useUserId();
  const loadFavorites = useLoadFavorites();
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const supabase = useMemo(() => createClient(), []);
  const professionalCheckRef = useRef<string | null>(null);

  // Cargar favoritos cuando el userId esté disponible
  useEffect(() => {
    if (userId) {
      loadFavorites(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname]);

  // Verificar auth una sola vez al montar (persistir estado en el store)
  useEffect(() => {
    if (isAuthenticated) {
      setAuthChecked(true);
      return;
    }
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        useUserStore.getState().setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          first_name: data.session.user.user_metadata?.first_name || null,
          last_name: data.session.user.user_metadata?.last_name || null,
          type: data.session.user.user_metadata?.type || 'patient',
          avatar_url: data.session.user.user_metadata?.avatar_url || null,
          account_active: true,
        });
      }
      setAuthChecked(true);
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Verificar si es profesional (con ref para evitar múltiples checks)
  useEffect(() => {
    if (!profile) return;
    if (professionalCheckRef.current === profile.id) return;
    professionalCheckRef.current = profile.id;

    const checkProfessional = async () => {
      const { data: professionalApp } = await supabase
        .from('professional_applications')
        .select('status')
        .eq('user_id', profile.id)
        .eq('status', 'approved')
        .maybeSingle();
      setIsProfessional(!!professionalApp);
    };
    checkProfessional();
  }, [profile, supabase]);

  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error("Error signing out:", error);
        return;
      }
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navigation = getNavigation(isProfessional);
  const userNavigation = profile ? getUserNavigation(isProfessional) : [];

  const isActive = (href: string) => {
    if (!currentPathname) return false;
    if (href === `/explore`) {
      return currentPathname === `/explore`;
    }
    if (href === `/patient/blog`) {
      return currentPathname.startsWith(`/patient/blog`);
    }
    return currentPathname.startsWith(href);
  };

  // Detectar si es una página pública de explore (accesible sin login)
  const isPublicPage = pathname && (
    publicDetailPages.some(page => pathname.startsWith(page)) ||
    publicListingPages.some(page => pathname === page || pathname.startsWith(page + '/'))
  );

  // Página pública sin autenticación → mostrar navbar público
  if (isAuthenticated === false && isPublicPage) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background">
          {children}
        </div>
        <Footer />
      </>
    );
  }

  // Primera carga sin datos en caché
  if (!authChecked && !isAuthenticated && loading) {
    return <LayoutSkeleton />;
  }

  // Cargando perfil
  if (loading) {
    return <LayoutSkeleton />;
  }

  // Sin perfil en página privada → redirigir al login
  if (!profile && !isPublicPage) {
    router.replace("/login");
    return null;
  }

  const userName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.email?.split('@')[0] || 'Usuario';

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex shrink-0 items-center">
                <Link
                  href="/explore"
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
              {/* Onboarding */}
              <PatientOnboardingButton />

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
                        src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
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
                        src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
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
                        {profile?.email}
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

            <div className="flex items-center gap-1 sm:hidden">
              <PatientOnboardingButton />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} modal={false}>
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
                <SheetContent side="right" className="w-full sm:max-w-sm p-6 flex flex-col h-full max-h-screen overflow-hidden">
                  <SheetTitle className="sr-only">
                    Menú de navegación
                  </SheetTitle>
                  <div className="flex items-center justify-between shrink-0">
                    <Link
                      href="/explore"
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

                  <div className="mt-8 space-y-2 overflow-y-auto flex-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`block rounded-lg px-3 py-3 text-base font-semibold transition-colors ${
                          isActive(item.href)
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-8 border-t border-sidebar-border pt-8">
                    <div className="flex items-center space-x-4">
                      <Image
                        src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 aspect-square rounded-full object-cover border-2 border-primary/20 flex-shrink-0"
                      />
                      <div>
                        <div className="text-base font-medium text-sidebar-foreground">
                          {userName}
                        </div>
                        <div className="text-sm text-sidebar-foreground/70">
                          {profile?.email}
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
                            className="flex items-center space-x-2 rounded-lg px-3 py-3 text-base font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full text-left"
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </button>
                        ) : (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center space-x-2 rounded-lg px-3 py-3 text-base font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
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

      {/* Email confirmation banner */}
      <EmailConfirmationBanner />

      {/* Main content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
