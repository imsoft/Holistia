"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, User, Settings } from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { useProfile } from "@/hooks/use-profile";
import { createClient } from "@/utils/supabase/client";

const navigation = [
  { name: "Inicio", href: "/" },
  { name: "Explorar", href: "/explore" },
  { name: "Empresas", href: "/companies" },
  { name: "Blog", href: "/blog" },
  { name: "Historia", href: "/history" },
  { name: "Contacto", href: "/contact" },
];

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, loading } = useProfile();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const getUserName = () => {
    if (!profile) return "Usuario";
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile.email?.split("@")[0] || "Usuario";
  };

  const getDashboardPath = () => {
    if (!profile) return "/login";
    if (profile.type === "admin") return `/admin/${profile.id}/dashboard`;
    if (profile.type === "professional") {
      // Necesitamos obtener el professional_application_id
      return `/professional/${profile.id}/dashboard`;
    }
    return `/patient/${profile.id}/explore`;
  };

  const isAuthenticated = !!profile && !loading;

  return (
    <header className="w-full z-50">
      <nav
        aria-label="Global"
        className="flex items-center justify-between p-6 lg:px-8 bg-primary w-full"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Holistia</span>
            <Image
              alt="Holistia Logo"
              src="/logos/holistia-white.png"
              width={32}
              height={32}
            />
          </Link>
        </div>
        <div className="flex lg:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground"
              >
                <span className="sr-only">Open main menu</span>
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-sm p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex items-center justify-between p-6 pb-4">
                <Link href="/" className="-m-1.5 p-1.5">
                  <span className="sr-only">Holistia</span>
                  <Image
                    alt="Holistia Logo"
                    src="/logos/holistia-black.png"
                    width={32}
                    height={32}
                    style={{ width: "auto", height: "auto" }}
                  />
                </Link>
              </div>
              <div className="px-6 pb-6">
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block rounded-lg px-3 py-3 text-base font-semibold text-foreground hover:bg-accent transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-border space-y-1">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 px-3 py-3">
                        <div className="relative">
                          <Image
                            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName())}&background=random`}
                            alt=""
                            width={40}
                            height={40}
                            className="h-10 w-10 aspect-square rounded-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">
                            {getUserName()}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {profile?.email}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={getDashboardPath()}
                        className="block rounded-lg px-3 py-3 text-base font-semibold text-foreground hover:bg-accent transition-colors"
                      >
                        Mi Dashboard
                      </Link>
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar sesión
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/become-professional"
                        className="block rounded-lg px-3 py-3 text-base font-semibold text-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        ¿Eres profesional?
                      </Link>
                      <Link
                        href="/login"
                        className="block rounded-lg px-3 py-3 text-base font-semibold text-foreground hover:bg-accent transition-colors"
                      >
                        Iniciar sesión
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm/6 font-semibold text-primary-foreground"
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative flex items-center rounded-full p-1 hover:bg-primary-foreground/10 transition-colors"
                >
                  <span className="sr-only">Abrir menú de usuario</span>
                  <div className="relative">
                    <Image
                      src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName())}&background=random`}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 aspect-square rounded-full object-cover border-2 border-primary-foreground/20"
                    />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-64 max-w-80">
                <div className="flex items-start gap-3 p-3">
                  <div className="relative flex-shrink-0">
                    <Image
                      src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName())}&background=random`}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 aspect-square rounded-full object-cover border-2 border-primary/20"
                    />
                  </div>
                  <div className="flex flex-col space-y-1 leading-tight min-w-0 flex-1">
                    <p className="font-medium text-foreground break-words leading-tight">
                      {getUserName()}
                    </p>
                    <p className="text-sm text-muted-foreground break-all">
                      {profile?.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={getDashboardPath()} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Mi Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                {profile?.type === "professional" && (
                  <DropdownMenuItem asChild>
                    <Link href={`/professional/${profile.id}/settings`} className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>Configuración</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link 
                href="/become-professional" 
                className="rounded-md bg-primary-foreground px-4 py-2 text-sm font-semibold text-primary shadow-sm hover:bg-primary-foreground/90 transition-colors"
              >
                ¿Eres profesional?
              </Link>
              <Link href="/login" className="text-sm/6 font-semibold text-primary-foreground">
                Iniciar sesión <span aria-hidden="true">&rarr;</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};
