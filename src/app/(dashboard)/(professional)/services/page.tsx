"use client";

import { useState, useEffect } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import { ServiceManager } from "@/components/ui/service-manager";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  Package,
  ArrowLeft,
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
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-8 bg-muted animate-pulse rounded" />
          <div className="h-48 sm:h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestión de Servicios</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Administra los servicios que ofreces a tus pacientes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="space-y-4 sm:space-y-6">

        {/* Services Management */}
        {professional.status === "approved" ? (
          <ServiceManager
            professionalId={professional.id}
            userId={currentUser.id}
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
