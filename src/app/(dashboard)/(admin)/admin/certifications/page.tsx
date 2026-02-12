"use client";

import { useState, useEffect, useMemo } from "react";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
import {
  Mail,
  Search,
  Send,
  CheckCircle,
  XCircle,
  User,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profession: string;
  status: string;
  created_at: string;
}

interface EmailData {
  professional_email: string;
  professional_name: string;
  profession: string;
  message: string;
  admin_name: string;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_id: string;
  email_type: string;
  subject: string;
  sent_at: string;
  status: string;
  metadata: {
    professional_id: string;
    professional_name: string;
    profession: string;
    admin_name: string;
    resend_id: string;
  };
}

export default function CertificationsPage() {
  useUserStoreInit();
  const adminId = useUserId();
  const { profile } = useProfile();
  const supabase = createClient();
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [professionFilter, setProfessionFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");

  // Calculate stats
  const stats = useMemo(() => {
    const totalProfessionals = professionals.length;
    const sentEmails = emailLogs.filter(log => log.status === 'sent').length;
    const failedEmails = emailLogs.filter(log => log.status !== 'sent').length;
    
    // Professionals who received certification email
    const professionalsWithEmail = new Set(emailLogs.map(log => log.recipient_email));
    const pendingProfessionals = professionals.filter(p => !professionalsWithEmail.has(p.email)).length;
    
    // Calculate recent trends (last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const recentEmails = emailLogs.filter(log => new Date(log.sent_at) >= sevenDaysAgo);
    const previousEmails = emailLogs.filter(log => {
      const date = new Date(log.sent_at);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    });
    
    const recentCount = recentEmails.length;
    const previousCount = previousEmails.length;
    const trend = previousCount > 0 ? ((recentCount - previousCount) / previousCount * 100).toFixed(0) : recentCount > 0 ? 100 : 0;
    
    return { totalProfessionals, sentEmails, pendingProfessionals, failedEmails, recentCount, trend: Number(trend) };
  }, [professionals, emailLogs]);

  // Get unique professions for filter
  const professions = useMemo(() => {
    const uniqueProfessions = [...new Set(professionals.map(p => p.profession))];
    return uniqueProfessions.sort();
  }, [professionals]);

  // Cargar profesionales aprobados
  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('professional_applications')
          .select('id, first_name, last_name, email, profession, status, created_at')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching professionals:', error);
          toast.error('Error al cargar profesionales');
          return;
        }

        setProfessionals(data || []);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error inesperado');
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, [supabase]);

  // Cargar logs de correos de certificación
  useEffect(() => {
    const fetchEmailLogs = async () => {
      try {
        setLoadingLogs(true);
        
        const { data, error } = await supabase
          .from('email_logs')
          .select('*')
          .eq('email_type', 'certification_confirmation')
          .order('sent_at', { ascending: false });

        if (error) {
          console.error('Error fetching email logs:', error);
          return;
        }

        setEmailLogs(data || []);
      } catch (error) {
        console.error('Error fetching email logs:', error);
      } finally {
        setLoadingLogs(false);
      }
    };

    fetchEmailLogs();
  }, [supabase]);

  // Set of professionals who received email
  const professionalsWithEmail = useMemo(() => {
    return new Set(emailLogs.map(log => log.recipient_email));
  }, [emailLogs]);

  // Filtrar profesionales por término de búsqueda y filtros
  const filteredProfessionals = professionals.filter(prof => {
    // Search filter
    const matchesSearch = 
      prof.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${prof.first_name} ${prof.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.profession.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const hasReceivedEmail = professionalsWithEmail.has(prof.email);
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "sent" && hasReceivedEmail) ||
      (statusFilter === "pending" && !hasReceivedEmail);
    
    // Profession filter
    const matchesProfession = professionFilter === "all" || prof.profession === professionFilter;
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRangeFilter !== "all") {
      const createdDate = new Date(prof.created_at);
      const now = new Date();
      
      switch (dateRangeFilter) {
        case "today":
          matchesDateRange = createdDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDateRange = createdDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDateRange = createdDate >= monthAgo;
          break;
        case "quarter":
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          matchesDateRange = createdDate >= quarterAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesProfession && matchesDateRange;
  });

  // Mensaje por defecto
  const defaultMessage = `Estimado/a ${selectedProfessional?.first_name || '[Nombre]'},

Nos complace informarle que hemos recibido exitosamente sus documentos de certificaciones profesionales.

Sus credenciales han sido verificadas y están en orden. Esto significa que su perfil profesional en Holistia está completamente actualizado y listo para recibir pacientes.

Si tiene alguna pregunta o necesita asistencia adicional, no dude en contactarnos.

¡Gracias por ser parte de la comunidad Holistia!

Atentamente,
El equipo de Holistia`;

  // Enviar email de certificaciones
  const handleSendEmail = async () => {
    if (!selectedProfessional) {
      toast.error('Por favor selecciona un profesional');
      return;
    }

    try {
      setSending(true);

      const emailData: EmailData = {
        professional_email: selectedProfessional.email,
        professional_name: `${selectedProfessional.first_name} ${selectedProfessional.last_name}`,
        profession: selectedProfessional.profession,
        message: customMessage || defaultMessage,
        admin_name: profile?.first_name ? `${profile.first_name} ${profile.last_name}` : 'Administrador',
      };

      const response = await fetch('/api/admin/send-certification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Email enviado exitosamente');
        setEmailSent(true);
        setCustomMessage("");
        setSelectedProfessional(null);
        
        // Refrescar los logs de correos
        const { data: newLogs, error: logsError } = await supabase
          .from('email_logs')
          .select('*')
          .eq('email_type', 'certification_confirmation')
          .order('sent_at', { ascending: false });

        if (!logsError && newLogs) {
          setEmailLogs(newLogs);
        }
      } else {
        toast.error(result.error || 'Error al enviar el email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error al enviar el email');
    } finally {
      setSending(false);
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
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Certificaciones</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Enviar confirmación de certificaciones recibidas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          {/* Total Profesionales */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Profesionales</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Aprobados
                </Badge>
              </div>
              <div className="text-3xl font-bold">{stats.totalProfessionals}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">Profesionales activos</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Disponibles para certificación
              </p>
            </CardContent>
          </Card>

          {/* Certificaciones Enviadas */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Enviadas</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completadas
                </Badge>
              </div>
              <div className="text-3xl font-bold">{stats.sentEmails}</div>
              <div className="flex items-center gap-1 mt-1">
                {stats.trend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${stats.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.trend >= 0 ? '+' : ''}{stats.trend}%
                </span>
                <span className="text-sm text-muted-foreground">vs semana anterior</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.recentCount} enviadas esta semana
              </p>
            </CardContent>
          </Card>

          {/* Pendientes */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pendientes</span>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Por enviar
                </Badge>
              </div>
              <div className="text-3xl font-bold">{stats.pendingProfessionals}</div>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">Requieren atención</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalProfessionals > 0 ? ((stats.pendingProfessionals / stats.totalProfessionals) * 100).toFixed(0) : 0}% del total
              </p>
            </CardContent>
          </Card>

          {/* Fallidas */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Fallidas</span>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <XCircle className="h-3 w-3 mr-1" />
                  Error
                </Badge>
              </div>
              <div className="text-3xl font-bold">{stats.failedEmails}</div>
              <div className="flex items-center gap-1 mt-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">No enviadas</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.sentEmails > 0 ? ((stats.failedEmails / (stats.sentEmails + stats.failedEmails)) * 100).toFixed(0) : 0}% tasa de error
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o profesión..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="sent">Certificación enviada</SelectItem>
              <SelectItem value="pending">Pendiente de envío</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el tiempo</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="quarter">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={professionFilter} onValueChange={setProfessionFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Profesión" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las profesiones</SelectItem>
              {professions.map((profession) => (
                <SelectItem key={profession} value={profession}>
                  {profession}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selección de Profesional */}
        <Card className="py-4 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Seleccionar Profesional
            </CardTitle>
            <CardDescription>
              Busca y selecciona el profesional al que deseas enviar la confirmación
              {filteredProfessionals.length > 0 && (
                <span className="ml-2 text-primary font-medium">
                  ({filteredProfessionals.length})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista de Profesionales */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {loading ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <span className="inline-block h-4 w-36 bg-muted rounded animate-pulse" />
                </div>
              ) : filteredProfessionals.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  {searchTerm ? 'No se encontraron profesionales' : 'No hay profesionales aprobados'}
                </div>
              ) : (
                filteredProfessionals.map((professional) => (
                  <div
                    key={professional.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProfessional?.id === professional.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedProfessional(professional)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {professional.first_name} {professional.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {professional.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {professional.profession}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {new Date(professional.created_at).toLocaleDateString('es-MX')}
                          </Badge>
                          {professionalsWithEmail.has(professional.email) ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Enviada
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendiente
                            </Badge>
                          )}
                        </div>
                      </div>
                      {selectedProfessional?.id === professional.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulario de Email */}
        {selectedProfessional && (
          <Card className="py-4 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Confirmación de Certificaciones
              </CardTitle>
              <CardDescription>
                Enviar confirmación a {selectedProfessional.first_name} {selectedProfessional.last_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Información del Profesional */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Profesional Seleccionado:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nombre:</span>
                    <span className="ml-2 font-medium">
                      {selectedProfessional.first_name} {selectedProfessional.last_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-2 font-medium">{selectedProfessional.email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Profesión:</span>
                    <span className="ml-2 font-medium">{selectedProfessional.profession}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant="outline" className="ml-2">
                      {selectedProfessional.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Mensaje Personalizado */}
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje (opcional)</Label>
                <Textarea
                  id="message"
                  placeholder="Personaliza el mensaje o deja vacío para usar el mensaje por defecto"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Si no personalizas el mensaje, se enviará el mensaje estándar de confirmación.
                </p>
              </div>

              {/* Vista Previa del Mensaje */}
              <div className="space-y-2">
                <Label>Vista Previa del Mensaje:</Label>
                <div className="bg-muted/50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {customMessage || defaultMessage}
                </div>
              </div>

              {/* Botón de Envío */}
              <div className="flex items-center gap-2 pt-4">
                <Button
                  onClick={handleSendEmail}
                  disabled={sending}
                  className="flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Confirmación
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProfessional(null);
                    setCustomMessage("");
                    setEmailSent(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>

              {emailSent && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Email enviado exitosamente a {selectedProfessional.email}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Historial de Correos Enviados */}
        <Card className="py-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Historial de Correos Enviados
            </CardTitle>
            <CardDescription>
              Lista de profesionales que ya recibieron confirmación de certificaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingLogs ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <span className="inline-block h-4 w-28 bg-muted rounded animate-pulse" />
              </div>
            ) : emailLogs.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No se han enviado correos de certificación aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-sm">
                            {log.metadata?.professional_name || 'Nombre no disponible'}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {log.metadata?.profession || 'Profesión no disponible'}
                          </Badge>
                          <Badge 
                            variant={log.status === 'sent' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {log.status === 'sent' ? 'Enviado' : log.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          📧 {log.recipient_email}
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          📅 Enviado el {new Date(log.sent_at).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {log.metadata?.admin_name && (
                          <p className="text-xs text-muted-foreground">
                            👤 Enviado por: {log.metadata.admin_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
