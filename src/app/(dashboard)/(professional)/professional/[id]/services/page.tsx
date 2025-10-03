"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ServiceManager } from "@/components/ui/service-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const professionalId = params.id as string;
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
            .eq("id", professionalId)
            .eq("user_id", user.id)
            .single();

        if (professionalError) {
          console.error("Error fetching professional:", professionalError);
          router.push("/");
          return;
        }

        if (!professionalData) {
          router.push("/");
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
  }, [professionalId, router, supabase]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!professional || !currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acceso no autorizado</h3>
            <p className="text-muted-foreground text-center mb-4">
              No tienes permisos para acceder a esta página
            </p>
            <Button onClick={() => router.push("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
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
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold text-foreground">
              Gestión de Servicios
            </h1>
            <p className="text-muted-foreground">
              Administra los servicios que ofreces a tus pacientes
            </p>
          </div>
        </div>

        {/* Professional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Package className="w-6 h-6" />
              Información del Profesional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  {professional.first_name} {professional.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {professional.profession}
                </p>
              </div>
              <div className="flex items-center">
                {getStatusBadge(professional.status)}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Estado de la aplicación</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Management */}
        {professional.status === "approved" ? (
          <ServiceManager
            professionalId={professional.id}
            userId={currentUser.id}
          />
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aplicación en proceso
              </h3>
              <p className="text-muted-foreground text-center mb-4">
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
  );
}
