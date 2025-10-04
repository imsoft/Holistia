"use client";

import { useState, useEffect } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  Settings,
  LogOut,
  User,
  Home,
  Image as ImageIcon,
  Package,
  Clock,
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
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ProfessionalNavItem } from "@/types";
import { createClient } from "@/utils/supabase/client";

interface UserData {
  name: string;
  email: string;
  imageUrl: string;
  profession: string;
}

// Función para generar URLs con ID dinámico
const getNavItems = (id: string): { mainNavItems: ProfessionalNavItem[] } => ({
  mainNavItems: [
    {
      title: "Dashboard",
      url: `/professional/${id}/dashboard`,
      icon: Home,
    },
    {
      title: "Servicios",
      url: `/professional/${id}/services`,
      icon: Package,
    },
    {
      title: "Disponibilidad",
      url: `/professional/${id}/availability`,
      icon: Clock,
    },
    {
      title: "Citas",
      url: `/professional/${id}/appointments`,
      icon: Calendar,
    },
    {
      title: "Pacientes",
      url: `/professional/${id}/patients`,
      icon: Users,
    },
    {
      title: "Galería",
      url: `/professional/${id}/gallery`,
      icon: ImageIcon,
    },
  ],
});

export function ProfessionalSidebar() {
  const [currentPathname, setCurrentPathname] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    setCurrentPathname(pathname);
  }, [pathname]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Obtener usuario autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.error('Error obteniendo usuario:', authError);
          router.push('/login');
          return;
        }

        // Obtener datos de la aplicación profesional
        const { data: application, error: appError } = await supabase
          .from('professional_applications')
          .select('first_name, last_name, email, profession, profile_photo')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .single();

        if (appError) {
          console.error('Error obteniendo aplicación profesional:', appError);
          setUserData({
            name: user.user_metadata?.first_name && user.user_metadata?.last_name 
              ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
              : user.email?.split('@')[0] || 'Usuario',
            email: user.email || '',
            imageUrl: user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
            profession: 'Profesional',
          });
        } else if (application) {
          // Priorizar avatar_url del usuario, luego profile_photo de la aplicación
          const avatarUrl = user.user_metadata?.avatar_url || application.profile_photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80';
          
          setUserData({
            name: `${application.first_name} ${application.last_name}`,
            email: application.email,
            imageUrl: avatarUrl,
            profession: application.profession,
          });
        }
      } catch (error) {
        console.error('Error inesperado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = getNavItems(id);

  const isActive = (href: string) => {
    if (!currentPathname) return false;
    return currentPathname === href || currentPathname.startsWith(href);
  };

  if (loading || !userData) {
    return (
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarHeader className="border-b border-border group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <Image
              src="/logos/holistia-black.png"
              alt="Holistia"
              width={24}
              height={24}
              className="h-6 w-auto"
            />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Cargando...</div>
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
            width={24}
            height={24}
            className="h-6 w-auto"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navegación principal */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.mainNavItems.map((item) => (
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
                  src={userData.imageUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover border-2 border-primary/20 hover:border-primary/40 transition-colors"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-3 p-3">
                <div className="relative">
                  <Image
                    src={userData.imageUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                  />
                </div>
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-foreground">{userData.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {userData.email}
                  </p>
                </div>
              </div>
              <div className="border-t border-border" />
              <DropdownMenuItem asChild>
                <Link href={`/patient/${id}/explore`} className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Vista de paciente</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2 text-red-600 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {userData.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {userData.profession}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="sr-only">Abrir menú de usuario</span>
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-3 p-3">
                <div className="relative">
                  <Image
                    src={userData.imageUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                  />
                </div>
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-foreground">{userData.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {userData.email}
                  </p>
                </div>
              </div>
              <div className="border-t border-border" />
              <DropdownMenuItem asChild>
                <Link href={`/patient/${id}/explore`} className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Vista de paciente</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center gap-2 text-red-600 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
