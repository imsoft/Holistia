"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Download, 
  Filter, 
  User, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Mail
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";

interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  registration_date: string;
  confirmation_code: string | null;
  notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  special_requirements: string | null;
  events_workshops: {
    name: string;
    event_date: string;
    event_time: string;
    location: string;
    category: string;
    price: number;
    is_free: boolean;
  };
  user: {
    email: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
  };
  payment: {
    amount: number;
    status: string;
    paid_at: string | null;
  } | null;
}

export default function EventRegistrationsPage() {
  const supabase = createClient();
  
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [events, setEvents] = useState<Array<{id: string, name: string}>>([]);

  // Fetch registrations data
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('event_registrations')
          .select(`
            *,
            events_workshops (
              name,
              event_date,
              event_time,
              location,
              category,
              price,
              is_free
            )
          `)
          .order('registration_date', { ascending: false });

        if (error) {
          console.error('Error fetching registrations:', error);
          toast.error('Error al cargar los registros');
          return;
        }

        if (!data || data.length === 0) {
          setRegistrations([]);
          setLoading(false);
          return;
        }

        // OPTIMIZACIÓN: Batch queries en lugar de N+1 queries individuales
        const userIds = [...new Set(data.map(reg => reg.user_id))];
        const registrationIds = data.map(reg => reg.id);

        // Obtener todos los datos en batch (solo 2 queries en total en lugar de 1 + N)
        const [
          profilesResult,
          allPaymentsResult
        ] = await Promise.allSettled([
          // Todos los perfiles de todos los usuarios
          supabase
            .from('profiles')
            .select('id, email, first_name, last_name')
            .in('id', userIds),
          // Todos los payments de todos los registros
          supabase
            .from('payments')
            .select('event_registration_id, amount, status, paid_at')
            .in('event_registration_id', registrationIds)
            .eq('status', 'succeeded')
        ]);

        // Procesar resultados de batch queries
        const profiles = profilesResult.status === 'fulfilled' ? (profilesResult.value.data || []) : [];
        const allPayments = allPaymentsResult.status === 'fulfilled' ? (allPaymentsResult.value.data || []) : [];

        // Create profiles map
        const profilesMap = new Map(
          (profiles || []).map(p => [
            p.id,
            {
              email: p.email,
              first_name: p.first_name,
              last_name: p.last_name,
              full_name: p.first_name && p.last_name
                ? `${p.first_name} ${p.last_name}`.trim()
                : undefined
            }
          ])
        );

        // Create payments map (puede haber solo un payment por registration)
        const paymentsMap = new Map<string, any>();
        allPayments.forEach((payment: any) => {
          paymentsMap.set(payment.event_registration_id, payment);
        });

        // Transformar registros con datos ya cargados (ya no necesitamos Promise.all, todo está en memoria)
        const registrationsWithUsers = data.map((registration) => {
          const profile = profilesMap.get(registration.user_id);
          const paymentData = paymentsMap.get(registration.id) || null;

          return {
            ...registration,
            user: profile || null,
            payment: paymentData ? {
              amount: paymentData.amount,
              status: paymentData.status,
              paid_at: paymentData.paid_at
            } : null
          };
        });

        setRegistrations(registrationsWithUsers.filter(r => r.user));

        // Get unique events for filter - include all events, not just those with registrations
        const { data: allEvents, error: eventsError } = await supabase
          .from('events_workshops')
          .select('id, name')
          .order('name');

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
        } else {
          setEvents(allEvents || []);
        }

      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [supabase]);

  // Filter registrations
  useEffect(() => {
    let filtered = registrations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(reg => 
        reg.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.events_workshops.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.confirmation_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(reg => reg.status === statusFilter);
    }

    // Event filter
    if (eventFilter !== "all") {
      filtered = filtered.filter(reg => reg.event_id === eventFilter);
    }

    setFilteredRegistrations(filtered);
  }, [registrations, searchTerm, statusFilter, eventFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "secondary" as const, icon: Clock },
      confirmed: { label: "Confirmado", variant: "default" as const, icon: CheckCircle },
      cancelled: { label: "Cancelado", variant: "destructive" as const, icon: XCircle },
      completed: { label: "Completado", variant: "outline" as const, icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categoryLabels = {
      espiritualidad: "Espiritualidad",
      salud_mental: "Salud Mental",
      salud_fisica: "Salud Física",
      alimentacion: "Alimentación",
      social: "Social"
    };
    return categoryLabels[category as keyof typeof categoryLabels] || category;
  };

  const exportToCSV = () => {
    const headers = [
      'ID de Registro',
      'Usuario',
      'Email',
      'Evento',
      'Fecha del Evento',
      'Estado',
      'Código de Confirmación',
      'Fecha de Registro',
      'Monto Pagado',
      'Contacto de Emergencia',
      'Teléfono de Emergencia',
      'Notas'
    ];

    const csvData = filteredRegistrations.map(reg => [
      reg.id,
      reg.user?.full_name || `${reg.user?.first_name || ''} ${reg.user?.last_name || ''}`.trim() || 'N/A',
      reg.user?.email || 'N/A',
      reg.events_workshops.name,
      new Date(reg.events_workshops.event_date).toLocaleDateString('es-ES'),
      reg.status,
      reg.confirmation_code || 'N/A',
      new Date(reg.registration_date).toLocaleDateString('es-ES'),
      reg.payment?.amount || 0,
      reg.emergency_contact_name || 'N/A',
      reg.emergency_contact_phone || 'N/A',
      reg.notes || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `registros-eventos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4 w-full max-w-4xl mx-auto">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Registros de Eventos</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gestiona todos los registros de eventos y códigos de confirmación
              </p>
            </div>
          </div>
          <Button onClick={exportToCSV} className="flex items-center gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="py-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registrations.length}</div>
          </CardContent>
        </Card>
        <Card className="py-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {registrations.filter(r => r.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card className="py-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {registrations.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card className="py-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {registrations.filter(r => r.status === 'cancelled').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="py-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2 lg:col-span-1">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuario, evento o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-1">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-1">
              <label className="text-sm font-medium">Evento</label>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los eventos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los eventos</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card className="py-6">
        <CardHeader>
          <CardTitle>Registros ({filteredRegistrations.length})</CardTitle>
          <CardDescription>
            Lista de todos los registros de eventos con información detallada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="rounded-md border min-w-[800px]">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Fecha del Evento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {registration.user?.full_name || 
                           `${registration.user?.first_name || ''} ${registration.user?.last_name || ''}`.trim() || 
                           'Usuario'}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {registration.user?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{registration.events_workshops.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(registration.events_workshops.category)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {new Date(registration.events_workshops.event_date).toLocaleDateString('es-ES')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {registration.events_workshops.event_time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(registration.status)}
                    </TableCell>
                    <TableCell>
                      {registration.confirmation_code ? (
                        <Badge variant="outline" className="font-mono">
                          {registration.confirmation_code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sin código</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {registration.payment ? (
                        <div className="space-y-1">
                          <div className="font-medium">
                            ${registration.payment.amount.toFixed(2)} MXN
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {registration.payment.paid_at ? 
                              new Date(registration.payment.paid_at).toLocaleDateString('es-ES') : 
                              'Pendiente'
                            }
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          {registration.events_workshops.is_free ? 'Gratuito' : 'Sin pago'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(registration.registration_date).toLocaleDateString('es-ES')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(registration.registration_date).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="flex items-center gap-1 whitespace-nowrap">
                        <Eye className="h-3 w-3" />
                        <span className="hidden sm:inline">Ver</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          </div>
          
          {filteredRegistrations.length === 0 && (
            <div className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No se encontraron registros</h3>
                  <p className="text-muted-foreground">
                    {registrations.length === 0 
                      ? "Aún no hay registros de eventos. Los registros aparecerán aquí cuando los usuarios se inscriban a eventos."
                      : "No hay registros que coincidan con los filtros aplicados. Intenta ajustar los filtros de búsqueda."
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
