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
import { AdminNavItem } from "@/types";

// Interfaces para los datos dinámicos
interface AdminUser {
  name: string;
  email: string;
  imageUrl?: string;
  role: string;
}

export function AdminSidebar() {
  const [currentPathname, setCurrentPathname] = useState("");
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Obtener datos del administrador actual
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.error('Error getting admin user:', error);
          return;
        }

        // Verificar que el usuario sea admin
        const userType = user.user_metadata?.user_type;
        if (userType !== 'admin') {
          console.error('User is not an admin');
          return;
        }

        const adminData: AdminUser = {
          name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Administrador',
          email: user.email || '',
          imageUrl: user.user_metadata?.avatar_url,
          role: 'Administrador',
        };

        setAdmin(adminData);
        setUserId(user.id);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [supabase]);

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
  ];

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
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-3 p-3">
                <div className="relative">
                  <Image
                    src={admin.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name)}&background=random`}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 aspect-square rounded-full object-cover border-2 border-primary/20"
                  />
                </div>
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-foreground">{admin.name}</p>
                  <p className="text-sm text-muted-foreground">
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
            <p className="text-sm font-medium text-foreground truncate">
              {admin.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {admin.role}
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
