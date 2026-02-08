"use client";

import { useState, useEffect } from "react";
import {
  CalendarCheck,
  Search,
  Eye,
  Clock,
  Loader2,
  Video,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { formatPrice } from "@/lib/price-utils";

interface Appointment {
  id: string;
  patient_id: string;
  professional_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: string;
  status: string;
  cost: number;
  location: string | null;
  notes: string | null;
  created_at: string;
  patient_name: string;
  patient_email: string;
  professional_name: string;
  professional_profession: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "outline" },
  confirmed: { label: "Confirmada", variant: "default" },
  paid: { label: "Pagada", variant: "default" },
  completed: { label: "Completada", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  patient_no_show: { label: "Inasistencia paciente", variant: "destructive" },
  professional_no_show: { label: "Inasistencia profesional", variant: "destructive" },
};

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      // Obtener citas con info de paciente y profesional
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          id, patient_id, professional_id, appointment_date, appointment_time,
          duration_minutes, appointment_type, status, cost, location, notes, created_at
        `)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false })
        .limit(500);

      if (appointmentsError) {
        console.error("Error fetching appointments:", appointmentsError);
        return;
      }

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([]);
        return;
      }

      // Obtener IDs únicos de pacientes y profesionales
      const patientIds = [...new Set(appointmentsData.map(a => a.patient_id))];
      const professionalIds = [...new Set(appointmentsData.map(a => a.professional_id))];

      // Cargar perfiles de pacientes
      const { data: patients } = await supabase
        .from("profiles")
        .select("id, full_name, first_name, last_name, email")
        .in("id", patientIds);

      // Cargar profesionales
      const { data: professionals } = await supabase
        .from("professional_applications")
        .select("id, first_name, last_name, profession")
        .in("id", professionalIds);

      const patientMap = new Map(
        (patients || []).map(p => [
          p.id,
          {
            name: p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Paciente",
            email: p.email || "",
          },
        ])
      );

      const professionalMap = new Map(
        (professionals || []).map(p => [
          p.id,
          {
            name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Profesional",
            profession: p.profession || "",
          },
        ])
      );

      const enriched: Appointment[] = appointmentsData.map(a => ({
        ...a,
        patient_name: patientMap.get(a.patient_id)?.name || "Paciente",
        patient_email: patientMap.get(a.patient_id)?.email || "",
        professional_name: professionalMap.get(a.professional_id)?.name || "Profesional",
        professional_profession: professionalMap.get(a.professional_id)?.profession || "",
      }));

      setAppointments(enriched);

      // Calcular stats
      setStats({
        total: enriched.length,
        pending: enriched.filter(a => a.status === "pending").length,
        confirmed: enriched.filter(a => ["confirmed", "paid"].includes(a.status)).length,
        completed: enriched.filter(a => a.status === "completed").length,
      });
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar citas
  const filtered = appointments.filter(a => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (typeFilter !== "all" && a.appointment_type !== typeFilter) return false;
    if (dateFrom && a.appointment_date < dateFrom) return false;
    if (dateTo && a.appointment_date > dateTo) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        a.patient_name.toLowerCase().includes(q) ||
        a.professional_name.toLowerCase().includes(q) ||
        a.patient_email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Formatear fecha — parseo manual para evitar UTC shift
  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr?.substring(0, 5) || "";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-4 border-b p-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Citas</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Confirmadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Completadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente o profesional..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="paid">Pagada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Desde"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Hasta"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabla de citas */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando citas...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No se encontraron citas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Paciente</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Profesional</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Fecha</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Hora</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Tipo</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-3 text-xs font-medium text-muted-foreground">Costo</th>
                      <th className="text-center p-3 text-xs font-medium text-muted-foreground">Ver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((apt) => {
                      const statusCfg = STATUS_CONFIG[apt.status] || { label: apt.status, variant: "outline" as const };
                      return (
                        <tr key={apt.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div>
                              <p className="text-sm font-medium">{apt.patient_name}</p>
                              <p className="text-xs text-muted-foreground">{apt.patient_email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="text-sm font-medium">{apt.professional_name}</p>
                              <p className="text-xs text-muted-foreground">{apt.professional_profession}</p>
                            </div>
                          </td>
                          <td className="p-3 text-sm">{formatDate(apt.appointment_date)}</td>
                          <td className="p-3 text-sm">{formatTime(apt.appointment_time)}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-sm">
                              {apt.appointment_type === "online" ? (
                                <Video className="h-3 w-3" />
                              ) : (
                                <MapPin className="h-3 w-3" />
                              )}
                              <span>{apt.appointment_type === "online" ? "Online" : "Presencial"}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                          </td>
                          <td className="p-3 text-right text-sm font-medium">
                            {formatPrice(apt.cost, "MXN")}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && filtered.length > 0 && (
              <div className="p-3 border-t text-xs text-muted-foreground">
                Mostrando {filtered.length} de {appointments.length} citas
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de detalle */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Detalle de Cita
            </DialogTitle>
            <DialogDescription>
              Informacion completa de la cita seleccionada
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Paciente</p>
                  <p className="text-sm font-medium">{selectedAppointment.patient_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedAppointment.patient_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Profesional</p>
                  <p className="text-sm font-medium">{selectedAppointment.professional_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedAppointment.professional_profession}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="text-sm font-medium">{formatDate(selectedAppointment.appointment_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hora</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(selectedAppointment.appointment_time)}
                    <span className="text-muted-foreground">({selectedAppointment.duration_minutes} min)</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    {selectedAppointment.appointment_type === "online" ? (
                      <Video className="h-3 w-3" />
                    ) : (
                      <MapPin className="h-3 w-3" />
                    )}
                    {selectedAppointment.appointment_type === "online" ? "Online" : "Presencial"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={STATUS_CONFIG[selectedAppointment.status]?.variant || "outline"}>
                    {STATUS_CONFIG[selectedAppointment.status]?.label || selectedAppointment.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Costo</p>
                  <p className="text-sm font-bold">{formatPrice(selectedAppointment.cost, "MXN")}</p>
                </div>
                {selectedAppointment.location && (
                  <div>
                    <p className="text-xs text-muted-foreground">Ubicacion</p>
                    <p className="text-sm">{selectedAppointment.location}</p>
                  </div>
                )}
              </div>

              {selectedAppointment.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Notas</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedAppointment.notes}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">Creada</p>
                <p className="text-xs">
                  {new Date(selectedAppointment.created_at).toLocaleString("es-MX")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
