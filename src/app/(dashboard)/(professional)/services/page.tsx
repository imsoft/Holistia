"use client";

import { useState, useEffect } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { ServiceManager } from "@/components/ui/service-manager";
import { AdminStatCard } from "@/components/ui/admin-stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  Package,
  ArrowLeft,
  Plus,
  Search,
} from "lucide-react";

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  profession: string;
  status: string;
}

export default function ProfessionalServicesPage() {
  useUserStoreInit();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceStats, setServiceStats] = useState({ total: 0, active: 0, session: 0, program: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "session" | "program">("all");
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const userId = useUserId();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verificar usuario autenticado
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/login");
          return;
        }

        setCurrentUser({ id: user.id });

        // Obtener información del profesional
        const { data: professionalData, error: professionalError } =
          await supabase
            .from("professional_applications")
            .select("id, first_name, last_name, profession, status")
            .eq("user_id", user.id)
            .single();

        if (professionalError) {
          console.error("Error fetching professional:", professionalError);
          console.error("User ID:", user.id);
          
          // Si no existe la aplicación profesional, mostrar mensaje apropiado
          if (professionalError.code === 'PGRST116') {
            console.log("No professional application found for user");
            // No redirigir, mostrar mensaje de que necesita aplicar primero
            setProfessional(null);
            return;
          }
          
          router.push("/");
          return;
        }

        if (!professionalData) {
          console.log("No professional data found for user:", user.id);
          setProfessional(null);
          return;
        }

        setProfessional(professionalData);

        // Estadísticas de servicios del profesional
        const { data: servicesData } = await supabase
          .from("professional_services")
          .select("id, isactive, type")
          .eq("professional_id", professionalData.id);
        const total = servicesData?.length ?? 0;
        const active = servicesData?.filter((s) => s.isactive).length ?? 0;
        const session = servicesData?.filter((s) => s.type === "session").length ?? 0;
        const program = servicesData?.filter((s) => s.type === "program").length ?? 0;
        setServiceStats({ total, active, session, program });
      } catch (error) {
        console.error("Error:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, router, supabase]);

  if (loading) {
    return (
      <div className="professional-page-content">
        <div className="space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-8 bg-muted animate-pulse rounded" />
          <div className="h-48 sm:h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="professional-page-content">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 px-4">
            <Package className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Acceso no autorizado</h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-4">
              No tienes permisos para acceder a esta página
            </p>
            <Button onClick={() => router.push("/")} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="professional-page-content">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 px-4">
            <Package className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">Aplicación profesional requerida</h3>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-md">
              Necesitas tener una aplicación profesional aprobada para gestionar servicios
            </p>
            <Button onClick={() => router.push("/patient/" + currentUser.id + "/explore/become-professional")} className="w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Aplicar como profesional
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case "under_review":
        return <Badge className="bg-blue-100 text-blue-800">En Revisión</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rechazado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="professional-page-shell">
      {/* Header */}
      <div className="professional-page-header">
        <div className="professional-page-header-inner professional-page-header-inner-row">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestión de Servicios</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Administra los servicios que ofreces a tus pacientes
              </p>
            </div>
          </div>
          {professional.status === "approved" && (
            <Button onClick={() => router.push("/services/new")} className="w-full sm:w-auto shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Servicio
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="professional-page-content w-full">
        <div className="space-y-6">
          {professional.status === "approved" && (
            <>
              {/* Cards de estadísticas (4 cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <AdminStatCard
                  title="Total Servicios"
                  value={String(serviceStats.total)}
                  trend={serviceStats.total > 0 ? { value: `${serviceStats.active} activos`, positive: true } : undefined}
                  secondaryText={serviceStats.total > 0 ? "Servicios publicados" : "Sin servicios aún"}
                  tertiaryText="Servicios que ofreces"
                />
                <AdminStatCard
                  title="Servicios Activos"
                  value={String(serviceStats.active)}
                  trend={
                    serviceStats.total > 0
                      ? {
                          value: `${Math.round((serviceStats.active / serviceStats.total) * 100)}%`,
                          positive: serviceStats.active > 0,
                        }
                      : undefined
                  }
                  secondaryText={serviceStats.active > 0 ? "Visibles para pacientes" : "Ninguno activo"}
                  tertiaryText="Del total de servicios"
                />
                <AdminStatCard
                  title="Sesiones"
                  value={String(serviceStats.session)}
                  secondaryText="Servicios tipo sesión"
                  tertiaryText="Sesiones individuales"
                />
                <AdminStatCard
                  title="Programas"
                  value={String(serviceStats.program)}
                  secondaryText="Servicios tipo programa"
                  tertiaryText="Programas de atención"
                />
              </div>

              {/* Filtros (máximo 4) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar servicio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | "session" | "program")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="session">Sesión</SelectItem>
                    <SelectItem value="program">Programa</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as "recent" | "name")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Más recientes</SelectItem>
                    <SelectItem value="name">Por nombre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Services Management */}
          {professional.status === "approved" ? (
            <ServiceManager
              professionalId={professional.id}
              userId={currentUser.id}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              sortBy={sortBy}
            />
          ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 px-4">
              <Package className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">
                Aplicación en proceso
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground text-center mb-4 max-w-md">
                Tu aplicación profesional está{" "}
                {professional.status === "pending"
                  ? "pendiente de revisión"
                  : "en proceso de revisión"}
                . Una vez aprobada, podrás gestionar tus servicios.
              </p>
              <div className="flex items-center gap-2">
                {getStatusBadge(professional.status)}
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
