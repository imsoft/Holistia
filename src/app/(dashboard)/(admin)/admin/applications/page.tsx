"use client";

import { useState, useEffect, useMemo } from "react";
// import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Phone,
  Mail,
  Search,
  Download,
  Instagram,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { formatPhone } from "@/utils/phone-utils";

interface ProfessionalApplication {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  instagram?: string;
  profession: string;
  specializations: string[];
  experience: string;
  certifications: string[];
  services: Record<string, unknown>;
  address: string;
  city: string;
  state: string;
  country: string;
  biography?: string;
  profile_photo?: string;
  gallery?: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  created_at: string;
  updated_at: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ProfessionalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [professionFilter, setProfessionFilter] = useState("all");
  const supabase = createClient();

  // Calculate stats
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(app => app.status === 'pending' || app.status === 'under_review').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    
    // Calculate recent trends (last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const recentApplications = applications.filter(app => new Date(app.submitted_at) >= sevenDaysAgo);
    const previousApplications = applications.filter(app => {
      const date = new Date(app.submitted_at);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    });
    
    const recentCount = recentApplications.length;
    const previousCount = previousApplications.length;
    const trend = previousCount > 0 ? ((recentCount - previousCount) / previousCount * 100).toFixed(0) : recentCount > 0 ? 100 : 0;
    
    return { total, pending, approved, rejected, recentCount, trend: Number(trend) };
  }, [applications]);

  // Get unique professions for filter
  const professions = useMemo(() => {
    const uniqueProfessions = [...new Set(applications.map(app => app.profession))];
    return uniqueProfessions.sort();
  }, [applications]);

  const getStatusBadge = (status: string) => {
    let statusText, color;
    switch (status) {
      case 'approved':
        statusText = 'Aprobado';
        color = 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
        break;
      case 'pending':
        statusText = 'Pendiente';
        color = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
        break;
      case 'under_review':
        statusText = 'En Revisión';
        color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
        break;
      case 'rejected':
        statusText = 'Rechazado';
        color = 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
        break;
      default:
        statusText = 'Desconocido';
        color = 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }

    return (
      <Badge className={color}>
        {statusText}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    // Crear la fecha usando componentes individuales para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month es 0-indexado
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener el ID del usuario autenticado
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, [supabase]);

  // Obtener solicitudes de profesionales
  useEffect(() => {
    if (!userId) return; // Esperar a que se obtenga el userId
    
    const getApplications = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('professional_applications')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (error) {
          console.error('Error fetching applications:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          toast.error(`Error al cargar las solicitudes: ${error.message}`);
          return;
        }

        console.log('Applications fetched successfully:', data);
        setApplications(data || []);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    getApplications();
  }, [supabase, userId]);

  const handleStatusUpdate = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setUpdating(true);
      
      // Verificar que el usuario actual sea admin
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast.error('Error de autenticación.');
        return;
      }

      // Si se rechaza, eliminar imágenes del storage
      if (newStatus === 'rejected') {
        const application = applications.find(app => app.id === applicationId);
        
        if (application) {
          // Eliminar foto de perfil
          if (application.profile_photo) {
            try {
              const urlParts = application.profile_photo.split('/professional-gallery/');
              if (urlParts.length > 1) {
                const imagePath = urlParts[1];
                await supabase.storage
                  .from('professional-gallery')
                  .remove([imagePath]);
              }
            } catch (imgError) {
              console.error('Error deleting profile photo:', imgError);
            }
          }

          // Eliminar imágenes de galería
          if (application.gallery && application.gallery.length > 0) {
            for (const imageUrl of application.gallery) {
              try {
                const urlParts = imageUrl.split('/professional-gallery/');
                if (urlParts.length > 1) {
                  const imagePath = urlParts[1];
                  await supabase.storage
                    .from('professional-gallery')
                    .remove([imagePath]);
                }
              } catch (imgError) {
                console.error('Error deleting gallery image:', imgError);
              }
            }
          }
        }
      }

      const { error } = await supabase
        .from('professional_applications')
        .update({
          status: newStatus === 'approved' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          review_notes: reviewNotes || null
        })
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating application:', error);
        toast.error('Error al actualizar la solicitud.');
        return;
      }

      // Actualizar el estado local
      setApplications(prev => prev.map(app =>
        app.id === applicationId
          ? {
              ...app,
              status: newStatus === 'approved' ? 'approved' : 'rejected',
              reviewed_at: new Date().toISOString(),
              reviewed_by: user.id,
              review_notes: reviewNotes || undefined
            }
          : app
      ));

      // Enviar email al profesional
      const application = applications.find(app => app.id === applicationId);
      if (application) {
        try {
          const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/patient/${application.user_id}/explore/become-professional`;

          const emailResponse = await fetch('/api/admin/send-application-decision', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: newStatus,
              professional_name: `${application.first_name} ${application.last_name}`,
              professional_email: application.email,
              profession: application.profession,
              review_notes: reviewNotes || undefined,
              dashboard_url: dashboardUrl,
            }),
          });

          if (!emailResponse.ok) {
            console.error('Error sending decision email');
            // No mostramos error al usuario, solo logueamos
          }
        } catch (emailError) {
          console.error('Error sending decision email:', emailError);
          // No mostramos error al usuario, solo logueamos
        }
      }

      setReviewNotes("");
      toast.success(`Solicitud ${newStatus === 'approved' ? 'aprobada' : 'rechazada'} exitosamente. Se ha enviado un email al profesional.`);
      
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Error al actualizar la solicitud.');
    } finally {
      setUpdating(false);
    }
  };

  // Función para exportar las solicitudes
  const handleExportApplications = () => {
    const csvContent = [
      ['Nombre', 'Email', 'Teléfono', 'Profesión', 'Especialidades', 'Ciudad', 'Estado', 'Estado de Solicitud', 'Fecha de Envío', 'Fecha de Revisión', 'Notas de Revisión'],
      ...filteredApplications.map(application => [
        `${application.first_name} ${application.last_name}`,
        application.email,
        application.phone ? formatPhone(application.phone) : 'N/A',
        application.profession,
        application.specializations.join('; '),
        application.city,
        application.state,
        application.status === 'approved' ? 'Aprobado' : 
        application.status === 'pending' ? 'Pendiente' :
        application.status === 'under_review' ? 'En Revisión' : 'Rechazado',
        new Date(application.submitted_at).toLocaleDateString('es-ES'),
        application.reviewed_at ? new Date(application.reviewed_at).toLocaleDateString('es-ES') : 'No revisado',
        application.review_notes || 'Sin notas'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `solicitudes_profesionales_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrar aplicaciones basado en búsqueda y filtros
  const filteredApplications = applications.filter((application) => {
    const fullName = `${application.first_name} ${application.last_name}`;
    const matchesSearch = fullName
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      application.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.profession.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || application.status === statusFilter;
    
    const matchesProfession = professionFilter === "all" || application.profession === professionFilter;
    
    // Date range filter
    let matchesDateRange = true;
    if (dateRangeFilter !== "all") {
      const submittedDate = new Date(application.submitted_at);
      const now = new Date();
      
      switch (dateRangeFilter) {
        case "today":
          matchesDateRange = submittedDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDateRange = submittedDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDateRange = submittedDate >= monthAgo;
          break;
        case "quarter":
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          matchesDateRange = submittedDate >= quarterAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesProfession && matchesDateRange;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="animate-pulse space-y-4 w-full max-w-4xl mx-auto">
            <div className="h-8 bg-muted rounded w-40" />
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
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Solicitudes de Profesionales</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Revisa y gestiona las solicitudes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              size="sm"
              onClick={handleExportApplications}
              className="flex items-center gap-2 w-full sm:w-auto sm:size-default"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 sm:mb-8">
          {/* Total Applications */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Solicitudes</span>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Todas
                </Badge>
              </div>
              <div className="text-3xl font-bold">{stats.total}</div>
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
                {stats.recentCount} nuevas esta semana
              </p>
            </CardContent>
          </Card>

          {/* Pending Applications */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pendientes</span>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Por revisar
                </Badge>
              </div>
              <div className="text-3xl font-bold">{stats.pending}</div>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">Requieren atención</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(0) : 0}% del total
              </p>
            </CardContent>
          </Card>

          {/* Approved Applications */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Aprobadas</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Activas
                </Badge>
              </div>
              <div className="text-3xl font-bold">{stats.approved}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">Profesionales activos</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(0) : 0}% tasa de aprobación
              </p>
            </CardContent>
          </Card>

          {/* Rejected Applications */}
          <Card className="border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Rechazadas</span>
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  <XCircle className="h-3 w-3 mr-1" />
                  Denegadas
                </Badge>
              </div>
              <div className="text-3xl font-bold">{stats.rejected}</div>
              <div className="flex items-center gap-1 mt-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">No aprobadas</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(0) : 0}% del total
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
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="under_review">En Revisión</SelectItem>
              <SelectItem value="approved">Aprobadas</SelectItem>
              <SelectItem value="rejected">Rechazadas</SelectItem>
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

        <div className="grid gap-4 sm:gap-6">
          {filteredApplications.length === 0 ? (
          <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {applications.length === 0 ? 'No hay solicitudes' : 'No se encontraron resultados'}
                </h3>
                <p className="text-muted-foreground text-center">
                  {applications.length === 0 
                    ? 'No se han encontrado solicitudes de profesionales en este momento.'
                    : 'Intenta ajustar los filtros de búsqueda para encontrar lo que buscas.'
                  }
                </p>
            </CardContent>
          </Card>
          ) : (
            filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow p-4 sm:p-6">
                <CardHeader className="pb-4 sm:pb-6 px-0 pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      {application.profile_photo && application.profile_photo.trim() !== '' ? (
                        <Image 
                          src={application.profile_photo} 
                          alt={`${application.first_name} ${application.last_name}`}
                          width={48}
                          height={48}
                          className="w-12 h-12 aspect-square rounded-full object-cover border-2 border-border"
                          onError={(e) => {
                            // Si la imagen falla al cargar, ocultar y mostrar el placeholder
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const placeholder = parent.querySelector('.profile-placeholder') as HTMLElement;
                              if (placeholder) {
                                placeholder.style.display = 'flex';
                              }
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center ${application.profile_photo && application.profile_photo.trim() !== '' ? 'profile-placeholder hidden' : 'profile-placeholder'}`}
                      >
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl">
                          {`${application.first_name} ${application.last_name}`}
                        </CardTitle>
                        <CardDescription className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 mt-1">
                          <span className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {application.email}
                          </span>
                          {application.phone && (
                            <span className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {formatPhone(application.phone)}
                            </span>
                          )}
                          {application.instagram && (
                            <span className="flex items-center">
                              <Instagram className="h-4 w-4 mr-1 text-gray-600" />
                              <a 
                                href={`https://instagram.com/${application.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 underline text-sm"
                              >
                                @{application.instagram.replace('@', '')}
                              </a>
                            </span>
                          )}
                        </CardDescription>
              </div>
              </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {getStatusBadge(application.status)}
                      <span className="text-xs sm:text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">{formatDate(application.submitted_at)}</span>
                        <span className="sm:hidden">{new Date(application.submitted_at).toLocaleDateString('es-ES')}</span>
                      </span>
              </div>
        </div>
          </CardHeader>
                <CardContent className="pt-4 sm:pt-6 px-0 pb-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Profesión</Label>
                      <p className="text-sm text-foreground mt-1">{application.profession}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Especializaciones</Label>
                      <p className="text-sm text-foreground mt-1">
                        {application.specializations?.join(', ') || 'No especificadas'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Ubicación</Label>
                      <p className="text-sm text-foreground flex items-center mt-1">
                        <MapPin className="h-5 w-5 mr-2" />
                        {application.city && application.state 
                          ? `${application.city}, ${application.state}` 
                          : application.address || 'No especificada'}
                      </p>
                    </div>
                  </div>
                      
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t">
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader className="pb-6">
                            <DialogTitle className="text-2xl font-bold">Detalles de la Solicitud</DialogTitle>
                            <div className="flex items-center space-x-3 pt-2">
                              <span className="text-sm text-muted-foreground">Solicitud de:</span>
                              <span className="font-semibold">{`${application.first_name} ${application.last_name}`}</span>
                              {getStatusBadge(application.status)}
                            </div>
                          </DialogHeader>
                          <div className="space-y-8">
                            {/* Información Personal */}
                            <div className="bg-muted/30 rounded-lg p-6">
                              <h3 className="text-2xl font-bold mb-6 flex items-center">
                                <User className="h-6 w-6 mr-3" />
                                Información Personal
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Nombre completo</Label>
                                  <p className="text-base font-medium">{`${application.first_name} ${application.last_name}`}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                                  <p className="text-base">{application.email}</p>
                                </div>
                                {application.phone && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                                    <p className="text-base">{formatPhone(application.phone)}</p>
                                  </div>
                                )}
                                {application.instagram && (
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Instagram</Label>
                                    <p className="text-base flex items-center">
                                      <Instagram className="h-4 w-4 mr-2 text-gray-600" />
                                      <a 
                                        href={`https://instagram.com/${application.instagram.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 underline"
                                      >
                                        @{application.instagram.replace('@', '')}
                                      </a>
                                    </p>
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Ubicación</Label>
                                  <p className="text-base flex items-center">
                                    <MapPin className="h-5 w-5 mr-2" />
                                    {application.address && `${application.address}, `}
                                    {application.city && `${application.city}, `}
                                    {application.state && `${application.state}`}
                                    {!application.address && !application.city && !application.state && 'No especificada'}
                                  </p>
                                </div>
                              </div>
                            </div>
                        
                            {/* Información Profesional */}
                            <div className="bg-muted/30 rounded-lg p-6">
                              <h3 className="text-2xl font-bold mb-6 flex items-center">
                                <FileText className="h-6 w-6 mr-3" />
                                Información Profesional
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Profesión</Label>
                                  <p className="text-base font-medium">{application.profession}</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                                  <div className="flex items-center">
                                    {getStatusBadge(application.status)}
                                  </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Especializaciones</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {application.specializations?.length ? (
                                      application.specializations.map((spec, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {spec}
                                        </Badge>
                                      ))
                                    ) : (
                                      <p className="text-base text-muted-foreground">No especificadas</p>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Experiencia</Label>
                                  <p className="text-base leading-relaxed">{application.experience}</p>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Certificaciones</Label>
                                  <div className="flex flex-wrap gap-2">
                                    {application.certifications?.length ? (
                                      application.certifications.map((cert, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {cert}
                                        </Badge>
                                      ))
                                    ) : (
                                      <p className="text-base text-muted-foreground">No especificadas</p>
                                    )}
                                  </div>
                                </div>
                                {application.biography && (
                                  <div className="space-y-2 md:col-span-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Biografía</Label>
                                    <p className="text-base leading-relaxed bg-background/50 rounded-md p-4 border">
                                      {application.biography}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>


                            {/* Notas de Revisión */}
                            <div className="bg-muted/30 rounded-lg p-6">
                              <h3 className="text-2xl font-bold mb-6 flex items-center">
                                <FileText className="h-6 w-6 mr-3" />
                                Notas de Revisión
                              </h3>
                              <div className="space-y-3">
                                <Label htmlFor="reviewNotes" className="text-sm font-medium text-muted-foreground">
                                  Comentarios sobre la decisión
                                </Label>
                                <Textarea
                                  id="reviewNotes"
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  placeholder="Agrega notas sobre tu decisión de aprobación o rechazo..."
                                  rows={4}
                                  className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Estas notas serán guardadas junto con la decisión y podrán ser consultadas posteriormente.
                                </p>
                              </div>
                            </div>
                      </div>
                        </DialogContent>
                      </Dialog>
                  </div>
                  
                    {(application.status === 'pending' || application.status === 'under_review') && (
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusUpdate(application.id, 'approved')}
                          disabled={updating}
                          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprobar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleStatusUpdate(application.id, 'rejected')}
                          disabled={updating}
                          className="w-full sm:w-auto"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}