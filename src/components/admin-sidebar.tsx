"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  UserPlus,
  LogOut,
  Home,
  FileText,
  Calendar,
  ClipboardList,
  CalendarCheck,
  BarChart3,
  DollarSign,
  Award,
  Building2,
  UtensilsCrossed,
  Sparkles,
  Store,
  Ticket,
  Wrench,
  RefreshCw,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { AdminNavItem } from "@/types";

// Interfaces para los datos dinámicos
interface AdminUser {
  name: string;
  email: string;
  imageUrl?: string;
  role: string;
}

export function AdminSidebar() {
  const { profile } = useProfile();
  const [currentPathname, setCurrentPathname] = useState("");
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [hasEvents, setHasEvents] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Obtener datos del administrador actual
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        if (!profile) {
          return;
        }

        // Verificar que el usuario sea admin
        if (profile.type !== 'admin') {
          console.error('User is not an admin');
          return;
        }

        const adminData: AdminUser = {
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email?.split('@')[0] || 'Administrador',
          email: profile.email || '',
          imageUrl: profile.avatar_url || undefined,
          role: 'Administrador',
        };

        setAdmin(adminData);
        setUserId(profile.id);

        // Verificar si el admin tiene eventos asignados
        const { data: events, error: eventsError } = await supabase
          .from('events_workshops')
          .select('id')
          .eq('owner_id', profile.id)
          .eq('owner_type', 'admin')
          .limit(1);

        if (!eventsError && events && events.length > 0) {
          setHasEvents(true);
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [profile, supabase]);

  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname]);

  // Generar items de navegación dinámicamente
  const navItems: AdminNavItem[] = [
    {
      title: "Dashboard",
      url: `/admin/${userId}/dashboard`,
      icon: Home,
    },
    {
      title: "Analíticas",
      url: `/admin/${userId}/analytics`,
      icon: BarChart3,
    },
    {
      title: "Finanzas",
      url: `/admin/${userId}/finances`,
      icon: DollarSign,
    },
    {
      title: "Blog",
      url: `/admin/${userId}/blog`,
      icon: FileText,
    },
    {
      title: "Eventos",
      url: `/admin/${userId}/events`,
      icon: Calendar,
    },
    {
      title: "Registros de Eventos",
      url: `/admin/${userId}/event-registrations`,
      icon: ClipboardList,
    },
    {
      title: "Profesionales",
      url: `/admin/${userId}/professionals`,
      icon: UserCheck,
    },
    {
      title: "Usuarios",
      url: `/admin/${userId}/users`,
      icon: Users,
    },
    {
      title: "Solicitudes",
      url: `/admin/${userId}/applications`,
      icon: UserPlus,
    },
    {
      title: "Certificaciones",
      url: `/admin/${userId}/certifications`,
      icon: Award,
    },
    {
      title: "Centros Holísticos",
      url: `/admin/${userId}/holistic-centers`,
      icon: Building2,
    },
    {
      title: "Restaurantes",
      url: `/admin/${userId}/restaurants`,
      icon: UtensilsCrossed,
    },
    {
      title: "Comercios",
      url: `/admin/${userId}/shops`,
      icon: Store,
    },
    {
      title: "Tickets de Soporte",
      url: `/admin/${userId}/tickets`,
      icon: Ticket,
    },
    {
      title: "Servicios y Costos",
      url: `/admin/${userId}/services-costs`,
      icon: Wrench,
    },
    {
      title: "Sincronización Google Calendar",
      url: `/admin/${userId}/sync-tools`,
      icon: RefreshCw,
    },
    {
      title: "Agente IA (Alpha)",
      url: `/admin/${userId}/ai-agent`,
      icon: Sparkles,
    },
  ];

  // Agregar "Mis eventos" solo si el admin tiene eventos asignados
  if (hasEvents) {
    navItems.push({
      title: "Mis eventos",
      url: `/admin/${userId}/my-events`,
      icon: CalendarCheck,
    });
  }

  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (href: string) => {
    if (!currentPathname) return false;
    return currentPathname === href || currentPathname.startsWith(href);
  };

  if (loading) {
    return (
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarHeader className="border-b border-border group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <Image
              src="/logos/holistia-black.png"
              alt="Holistia"
                width={32}
                height={32}
                className="h-6 w-6"
            />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  if (!admin) {
    return (
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarHeader className="border-b border-border group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <Image
              src="/logos/holistia-black.png"
              alt="Holistia"
                width={32}
                height={32}
                className="h-6 w-auto"
            />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="flex items-center justify-center p-4">
            <p className="text-sm text-muted-foreground">Error cargando datos</p>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          <Image
            src="/logos/holistia-black.png"
            alt="Holistia"
            width={32}
            height={32}
            className="h-6 w-auto"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navegación principal */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative cursor-pointer">
                <Image
                  src={admin.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=random`}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 aspect-square rounded-full object-cover border-2 border-primary/20 hover:border-primary/40 transition-colors"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-64 max-w-80">
              <div className="flex items-start gap-3 p-3">
                <div className="relative flex-shrink-0">
                  <Image
                    src={admin.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=random`}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 aspect-square rounded-full object-cover border-2 border-primary/20"
                  />
                </div>
                <div className="flex flex-col space-y-1 leading-tight min-w-0 flex-1">
                  <p className="font-medium text-foreground break-words leading-tight">
                    {admin.name}
                  </p>
                  <p className="text-sm text-muted-foreground break-all">
                    {admin.email}
                  </p>
                </div>
              </div>
              <div className="border-t border-border" />
              <DropdownMenuItem 
                className="flex items-center gap-2 text-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground break-words leading-tight">
              {admin.name}
            </p>
            <p className="text-xs text-muted-foreground break-words leading-tight">
              {admin.role}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
