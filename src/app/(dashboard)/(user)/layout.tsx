"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Bell, 
  Menu, 
  X, 
  Heart, 
  Home,
  Star,
  Calendar,
  History,
  User,
  Settings,
  LogOut,
  Stethoscope
} from "lucide-react";

const user = {
  name: 'Usuario Holistia',
  email: 'usuario@holistia.com',
  imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
};

const navigation = [
  { name: 'Mi Espacio', href: '/user/my-space', icon: Home },
  { name: 'Favoritos', href: '/user/favorites', icon: Star },
  { name: 'Citas', href: '/user/my-appointments', icon: Calendar },
  { name: 'Historial', href: '/user/historical', icon: History },
];

const userNavigation = [
  { name: 'Mi perfil', href: '/user/my-profile', icon: User },
  { name: 'Configuración', href: '/user/settings', icon: Settings },
  { name: 'Únete como Profesional', href: '/user/join-to-holistia', icon: Stethoscope },
  { name: 'Cerrar sesión', href: '/', icon: LogOut },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-full">
      {/* Navigation */}
      <nav className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex shrink-0 items-center">
                <Link href="/user/my-space" className="flex items-center gap-2">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-lg font-bold text-green-900">Holistia</span>
                    <p className="text-xs text-green-600">Mi Espacio</p>
                  </div>
                </Link>
              </div>
              <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        isActive
                          ? 'border-green-600 text-green-600'
                          : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                        'inline-flex items-center gap-2 border-b-2 px-1 pt-1 text-sm font-medium transition-colors',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <Button
                variant="ghost"
                size="sm"
                className="relative text-muted-foreground hover:text-foreground"
              >
                <span className="absolute -inset-1.5" />
                <span className="sr-only">Ver notificaciones</span>
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full text-xs text-white flex items-center justify-center">2</span>
              </Button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex max-w-xs items-center rounded-full ml-3">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Abrir menú de usuario</span>
                    <Image
                      alt=""
                      src={user.imageUrl}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover border-2 border-green-200"
                    />
                    <div className="ml-3 hidden lg:block text-left">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">Usuario</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  {userNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link href={item.href} className="flex items-center">
                          <Icon className="mr-2 h-4 w-4" />
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              {/* Mobile menu button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative inline-flex items-center justify-center rounded-md p-2"
                  >
                    <span className="absolute -inset-0.5" />
                    <span className="sr-only">Abrir menú principal</span>
                    {mobileMenuOpen ? (
                      <X className="block h-6 w-6" />
                    ) : (
                      <Menu className="block h-6 w-6" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <Heart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-bold text-green-900">Holistia</span>
                        <p className="text-xs text-green-600">Mi Espacio</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 flex-1">
                      {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={classNames(
                              isActive
                                ? 'border-green-600 bg-green-50 text-green-700'
                                : 'border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground',
                              'flex items-center gap-3 border-l-4 py-2 pr-4 pl-3 text-base font-medium transition-colors',
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                    
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center px-4 mb-4">
                        <div className="shrink-0">
                          <Image
                            alt=""
                            src={user.imageUrl}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover border-2 border-green-200"
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-base font-medium text-foreground">{user.name}</div>
                          <div className="text-sm font-medium text-muted-foreground">{user.email}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="relative ml-auto shrink-0 rounded-full p-1"
                        >
                          <span className="absolute -inset-1.5" />
                          <span className="sr-only">Ver notificaciones</span>
                          <Bell className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {userNavigation.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                            >
                              <Icon className="h-5 w-5" />
                              {item.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <main>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
