"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, DollarSign, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatPhone } from "@/utils/phone-utils";

interface EventRegistration {
  id: string;
  user_id: string;
  registration_date: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  special_requirements?: string;
  confirmation_code: string;
  user_email?: string;
  user_name?: string;
}

interface EventRegistrationsListProps {
  eventId: string;
}

export function EventRegistrationsList({ eventId }: EventRegistrationsListProps) {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    loadRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const loadRegistrations = async () => {
    try {
      setLoading(true);

      // Cargar registraciones
      const { data: regs, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId)
        .order("registration_date", { ascending: false });

      if (error) throw error;

      // Obtener IDs de usuarios únicos
      const userIds = [...new Set((regs || []).map(reg => reg.user_id))];

      // Cargar perfiles de usuarios
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", userIds);

      // Crear un mapa de perfiles por ID
      const profilesMap = new Map(
        (profiles || []).map(p => [
          p.id, 
          {
            email: p.email,
            name: p.first_name && p.last_name 
              ? `${p.first_name} ${p.last_name}`.trim()
              : p.email
          }
        ])
      );

      // Formatear datos
      const formattedRegs: EventRegistration[] = (regs || []).map((reg) => {
        const profile = profilesMap.get(reg.user_id);
        return {
          id: reg.id,
          user_id: reg.user_id,
          registration_date: reg.registration_date,
          status: reg.status,
          emergency_contact_name: reg.emergency_contact_name,
          emergency_contact_phone: reg.emergency_contact_phone,
          special_requirements: reg.special_requirements,
          confirmation_code: reg.confirmation_code,
          user_email: profile?.email,
          user_name: profile?.name || profile?.email,
        };
      });

      setRegistrations(formattedRegs);

      // Calcular estadísticas
      const confirmed = formattedRegs.filter(r => r.status === "confirmed").length;
      const pending = formattedRegs.filter(r => r.status === "pending").length;
      const cancelled = formattedRegs.filter(r => r.status === "cancelled").length;

      // Obtener información del evento para calcular ingresos
      const { data: event } = await supabase
        .from("events_workshops")
        .select("price, is_free")
        .eq("id", eventId)
        .single();

      const revenue = event && !event.is_free ? confirmed * event.price : 0;

      setStats({
        total: formattedRegs.length,
        confirmed,
        pending,
        cancelled,
        totalRevenue: revenue,
      });
    } catch (error) {
      console.error("Error loading registrations:", error);
      toast.error("Error al cargar las registraciones");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Confirmado
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Cancelado
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completado
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confirmados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Ingresos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de registraciones */}
      <Card>
        <CardHeader>
          <CardTitle>Registraciones ({registrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay registraciones aún
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{reg.user_name}</p>
                      {getStatusBadge(reg.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{reg.user_email}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Registrado:{" "}
                        {new Date(reg.registration_date).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {reg.special_requirements && (
                      <p className="text-xs text-muted-foreground">
                        Requerimientos: {reg.special_requirements}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 md:mt-0 md:text-right space-y-1">
                    <p className="text-xs text-muted-foreground">Código de confirmación</p>
                    <p className="font-mono font-semibold">{reg.confirmation_code}</p>
                    {reg.emergency_contact_name && (
                      <div className="text-xs text-muted-foreground mt-2">
                        <p>Contacto de emergencia:</p>
                        <p>{reg.emergency_contact_name}</p>
                        <p>{formatPhone(reg.emergency_contact_phone || '')}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
