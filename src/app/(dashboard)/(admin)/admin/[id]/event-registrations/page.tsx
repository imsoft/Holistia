"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
    user_metadata: {
      first_name?: string;
      last_name?: string;
      full_name?: string;
    };
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

        // Get user details for each registration
        const registrationsWithUsers = await Promise.all(
          data.map(async (registration) => {
            const { data: userData } = await supabase.auth.admin.getUserById(registration.user_id);
            
            // Get payment details
            const { data: paymentData } = await supabase
              .from('payments')
              .select('amount, status, paid_at')
              .eq('event_registration_id', registration.id)
              .eq('status', 'succeeded')
              .single();

            return {
              ...registration,
              user: userData?.user || null,
              payment: paymentData || null
            };
          })
        );

        setRegistrations(registrationsWithUsers.filter(r => r.user));

        // Get unique events for filter
        const uniqueEvents = Array.from(
          new Set(registrationsWithUsers.map(r => r.events_workshops.name))
        ).map(name => ({
          id: registrationsWithUsers.find(r => r.events_workshops.name === name)?.event_id || '',
          name
        }));
        setEvents(uniqueEvents);

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
        reg.user?.user_metadata?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.user?.user_metadata?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.user?.user_metadata?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      reg.user?.user_metadata?.full_name || `${reg.user?.user_metadata?.first_name || ''} ${reg.user?.user_metadata?.last_name || ''}`.trim() || 'N/A',
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
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Registros de Eventos</h1>
          <p className="text-muted-foreground">
            Gestiona todos los registros de eventos y códigos de confirmación
          </p>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registrations.length}</div>
          </CardContent>
        </Card>
        <Card>
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
        <Card>
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
        <Card>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Evento</label>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger>
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
      <Card>
        <CardHeader>
          <CardTitle>Registros ({filteredRegistrations.length})</CardTitle>
          <CardDescription>
            Lista de todos los registros de eventos con información detallada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
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
                          {registration.user?.user_metadata?.full_name || 
                           `${registration.user?.user_metadata?.first_name || ''} ${registration.user?.user_metadata?.last_name || ''}`.trim() || 
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
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredRegistrations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron registros</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
