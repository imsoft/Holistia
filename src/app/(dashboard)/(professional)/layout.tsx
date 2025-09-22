"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  Stethoscope, 
  BarChart3,
  Calendar,
  Users,
  Clock,
  DollarSign,
  User,
  Settings,
  LogOut
} from "lucide-react";

const professional = {
  name: 'Dr. María García',
  email: 'maria.garcia@holistia.com',
  specialty: 'Psicología Clínica',
  imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
};

const navigation = [
  { name: 'Dashboard', href: '/professional/dashboard', icon: BarChart3 },
  { name: 'Citas', href: '/professional/appointments', icon: Calendar },
  { name: 'Pacientes', href: '/professional/patients', icon: Users },
  { name: 'Horarios', href: '/professional/schedules', icon: Clock },
  { name: 'Ingresos', href: '/professional/incomes', icon: DollarSign },
];

const userNavigation = [
  { name: 'Mi perfil', href: '/professional/profile', icon: User },
  { name: 'Configuración', href: '/professional/settings', icon: Settings },
  { name: 'Cerrar sesión', href: '/', icon: LogOut },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ProfessionalLayout({
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
                <Link href="/professional/dashboard" className="flex items-center gap-2">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Stethoscope className="h-5 w-5 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-lg font-bold text-blue-900">Holistia Pro</span>
                    <p className="text-xs text-blue-600">Panel Profesional</p>
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
                          ? 'border-blue-600 text-blue-600'
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
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
              </Button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex max-w-xs items-center rounded-full ml-3">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Abrir menú de usuario</span>
                    <img
                      alt=""
                      src={professional.imageUrl}
                      className="h-8 w-8 rounded-full object-cover border-2 border-blue-200"
                    />
                    <div className="ml-3 hidden lg:block text-left">
                      <p className="text-sm font-medium text-foreground">{professional.name}</p>
                      <p className="text-xs text-muted-foreground">{professional.specialty}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground">{professional.name}</p>
                    <p className="text-sm text-muted-foreground">{professional.email}</p>
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
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <Stethoscope className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-bold text-blue-900">Holistia Pro</span>
                        <p className="text-xs text-blue-600">Panel Profesional</p>
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
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
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
                          <img
                            alt=""
                            src={professional.imageUrl}
                            className="h-10 w-10 rounded-full object-cover border-2 border-blue-200"
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-base font-medium text-foreground">{professional.name}</div>
                          <div className="text-sm font-medium text-muted-foreground">{professional.email}</div>
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
