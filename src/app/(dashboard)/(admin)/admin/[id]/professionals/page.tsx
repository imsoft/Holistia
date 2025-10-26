"use client";

import { useState, useEffect } from "react";
// import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  UserCheck,
  Search,
  Filter,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  ShieldCheck,
  Instagram,
  Edit3,
  X,
  CheckCircle,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

// Interfaces para los datos dinámicos
interface Professional {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  instagram?: string;  // Campo privado, solo visible para administradores
  profession: string;
  specializations: string[];
  wellness_areas?: string[]; // Áreas de bienestar
  city: string;
  state: string;
  profile_photo?: string;
  status: 'active' | 'inactive' | 'suspended';
  is_active: boolean; // Campo de BD para controlar visibilidad en listado público
  submitted_at: string;
  reviewed_at?: string;
  patients?: number;
  monthly_patients?: number; // Pacientes del mes actual
  registration_fee_paid?: boolean;
  registration_fee_amount?: number;
  registration_fee_currency?: string;
  registration_fee_paid_at?: string;
  registration_fee_expires_at?: string;
}

export default function AdminProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statsData, setStatsData] = useState({
    totalThisMonth: 0,
    lastMonth: 0,
    totalPatients: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    totalExpiringSoon: 0
  });
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isEditWellnessDialogOpen, setIsEditWellnessDialogOpen] = useState(false);
  const [editingWellnessAreas, setEditingWellnessAreas] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();

  // Opciones de áreas de bienestar
  const wellnessAreaOptions = [
    "Salud mental",
    "Espiritualidad",
    "Actividad física",
    "Social",
    "Alimentación"
  ];

  // Obtener profesionales de la base de datos
  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        setLoading(true);

        // Fechas para comparaciones
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Obtener profesionales aprobados de la base de datos y datos comparativos
        const [
          { data: professionalsData, error: professionalsError },
          { data: lastMonthProfessionals }
        ] = await Promise.all([
          supabase
            .from('professional_applications')
            .select('*')
            .eq('status', 'approved')
            .order('reviewed_at', { ascending: false }),
          supabase
            .from('professional_applications')
            .select('*')
            .eq('status', 'approved')
            .gte('reviewed_at', lastMonthStart.toISOString())
            .lte('reviewed_at', lastMonthEnd.toISOString())
        ]);

        if (professionalsError) {
          console.error('Error fetching professionals:', professionalsError);
          return;
        }

        // Transformar datos y obtener número de pacientes para cada profesional
        const transformedProfessionals: Professional[] = await Promise.all(
          professionalsData.map(async (prof) => {
            // Obtener número de pacientes únicos para este profesional
            // professional_id en appointments corresponde al id del profesional en professional_applications
            const [
              { data: appointmentsData },
              { data: monthlyAppointmentsData }
            ] = await Promise.all([
              // Todos los pacientes (histórico)
              supabase
                .from('appointments')
                .select('patient_id, created_at')
                .eq('professional_id', prof.id),
              // Pacientes del mes actual
              supabase
                .from('appointments')
                .select('patient_id')
                .eq('professional_id', prof.id)
                .gte('created_at', currentMonthStart.toISOString())
            ]);

            // Contar pacientes únicos totales
            const uniquePatients = new Set(appointmentsData?.map(apt => apt.patient_id) || []);
            const patientsCount = uniquePatients.size;

            // Contar pacientes únicos del mes
            const monthlyUniquePatients = new Set(monthlyAppointmentsData?.map(apt => apt.patient_id) || []);
            const monthlyPatientsCount = monthlyUniquePatients.size;

            // Determinar el estado basado en la fecha de revisión
            const reviewedAt = prof.reviewed_at ? new Date(prof.reviewed_at) : new Date(prof.submitted_at);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            let status: 'active' | 'inactive' | 'suspended' = 'active';
            if (reviewedAt < thirtyDaysAgo) {
              status = 'inactive';
            }

            return {
              id: prof.id,
              user_id: prof.user_id,
              first_name: prof.first_name,
              last_name: prof.last_name,
              email: prof.email,
              phone: prof.phone,
              instagram: prof.instagram,
              profession: prof.profession,
              specializations: prof.specializations,
              city: prof.city,
              state: prof.state,
              profile_photo: prof.profile_photo,
              status,
              is_active: prof.is_active ?? true, // Por defecto true si no existe
              submitted_at: prof.submitted_at,
              reviewed_at: prof.reviewed_at,
              patients: patientsCount || 0,
              monthly_patients: monthlyPatientsCount || 0,
              registration_fee_paid: prof.registration_fee_paid ?? false,
              registration_fee_amount: prof.registration_fee_amount,
              registration_fee_currency: prof.registration_fee_currency,
              registration_fee_paid_at: prof.registration_fee_paid_at,
              registration_fee_expires_at: prof.registration_fee_expires_at,
            };
          })
        );

        setProfessionals(transformedProfessionals);

        // Calcular estadísticas para el dashboard
        const thisMonthProfessionals = professionalsData?.filter(prof => {
          const reviewedAt = prof.reviewed_at ? new Date(prof.reviewed_at) : new Date(prof.submitted_at);
          return reviewedAt >= currentMonthStart;
        }).length || 0;

        const totalPatients = transformedProfessionals.reduce((acc, prof) => acc + (prof.patients || 0), 0);

        // Calcular estadísticas de pago
        const nowForPayments = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(nowForPayments.getDate() + 30);

        const totalPaid = transformedProfessionals.filter(prof => 
          prof.registration_fee_paid && 
          prof.registration_fee_expires_at && 
          new Date(prof.registration_fee_expires_at) > nowForPayments
        ).length;

        const totalUnpaid = transformedProfessionals.filter(prof => 
          !prof.registration_fee_paid || 
          (prof.registration_fee_expires_at && new Date(prof.registration_fee_expires_at) <= nowForPayments)
        ).length;

        const totalExpiringSoon = transformedProfessionals.filter(prof => 
          prof.registration_fee_paid && 
          prof.registration_fee_expires_at && 
          new Date(prof.registration_fee_expires_at) > nowForPayments &&
          new Date(prof.registration_fee_expires_at) <= thirtyDaysFromNow
        ).length;

        setStatsData({
          totalThisMonth: thisMonthProfessionals,
          lastMonth: lastMonthProfessionals?.length || 0,
          totalPatients,
          totalPaid,
          totalUnpaid,
          totalExpiringSoon
        });

      } catch (error) {
        console.error('Error fetching professionals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionals();
  }, [supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo";
      case "inactive":
        return "Inactivo";
      case "suspended":
        return "Suspendido";
      default:
        return status;
    }
  };

  // Función para calcular porcentaje de cambio
  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${Math.round(change)}%`;
  };

  // Función para verificar documentos pendientes
  const handleVerifyDocuments = () => {
    // Filtrar profesionales que no han sido verificados
    const unverifiedProfessionals = professionals.filter(p => !p.reviewed_at);
    if (unverifiedProfessionals.length === 0) {
      toast.error('No hay documentos pendientes de verificación');
      return;
    }
    toast.error(`Hay ${unverifiedProfessionals.length} profesionales con documentos pendientes de verificación`);
  };

  // Función para exportar la lista de profesionales
  const handleExportProfessionals = () => {
    const csvContent = [
      ['Nombre', 'Email', 'Teléfono', 'Profesión', 'Especialidades', 'Ciudad', 'Estado', 'Estado', 'Fecha de Registro', 'Fecha de Verificación', 'Pacientes'],
      ...filteredProfessionals.map(professional => [
        `${professional.first_name} ${professional.last_name}`,
        professional.email,
        professional.phone || 'N/A',
        professional.profession,
        professional.specializations.join('; '),
        professional.city,
        professional.state,
        professional.status === 'active' ? 'Activo' : professional.status === 'inactive' ? 'Inactivo' : 'Suspendido',
        new Date(professional.submitted_at).toLocaleDateString('es-ES'),
        professional.reviewed_at ? new Date(professional.reviewed_at).toLocaleDateString('es-ES') : 'No verificado',
        (professional.patients || 0).toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `profesionales_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para ver el perfil del profesional
  const handleViewProfile = (professional: Professional) => {
    setSelectedProfessional(professional);
    setIsViewDialogOpen(true);
  };

  // Función para verificar un profesional
  const handleVerifyProfessional = async (professionalId: string) => {
    try {
      setActionLoading(professionalId);

      // Aquí actualizarías el estado del profesional en la base de datos
      // Por ahora solo actualizamos el estado local
      setProfessionals(prev =>
        prev.map(prof =>
          prof.id === professionalId
            ? { ...prof, reviewed_at: new Date().toISOString() }
            : prof
        )
      );

      console.log('Profesional verificado:', professionalId);
      setIsVerifyDialogOpen(false);
    } catch (error) {
      console.error('Error al verificar profesional:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Función para activar/desactivar un profesional
  const handleToggleActiveStatus = async (professionalId: string, currentStatus: boolean) => {
    try {
      setActionLoading(professionalId);

      const response = await fetch('/api/admin/toggle-professional-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          professionalId,
          isActive: !currentStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Error al cambiar el estado del profesional');
        return;
      }

      // Actualizar el estado local
      setProfessionals(prev =>
        prev.map(prof =>
          prof.id === professionalId
            ? { ...prof, is_active: !currentStatus }
            : prof
        )
      );

      toast.success(data.message || `Profesional ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
    } catch (error) {
      console.error('Error al cambiar estado del profesional:', error);
      toast.error('Error al cambiar el estado del profesional');
    } finally {
      setActionLoading(null);
    }
  };

  // Función para abrir el diálogo de edición de wellness areas
  const handleOpenEditWellnessAreas = (professional: Professional) => {
    setSelectedProfessional(professional);
    setEditingWellnessAreas(professional.wellness_areas || []);
    setIsEditWellnessDialogOpen(true);
  };

  // Función para alternar un área de bienestar
  const handleToggleWellnessArea = (area: string) => {
    setEditingWellnessAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  // Función para guardar las áreas de bienestar
  const handleSaveWellnessAreas = async () => {
    if (!selectedProfessional) return;

    try {
      setActionLoading(selectedProfessional.id);

      const { error } = await supabase
        .from('professional_applications')
        .update({ wellness_areas: editingWellnessAreas })
        .eq('id', selectedProfessional.id);

      if (error) throw error;

      // Actualizar el estado local
      setProfessionals(prev =>
        prev.map(prof =>
          prof.id === selectedProfessional.id
            ? { ...prof, wellness_areas: editingWellnessAreas }
            : prof
        )
      );

      // Actualizar el profesional seleccionado
      setSelectedProfessional(prev =>
        prev ? { ...prev, wellness_areas: editingWellnessAreas } : null
      );

      toast.success('Áreas de bienestar actualizadas exitosamente');
      setIsEditWellnessDialogOpen(false);
    } catch (error) {
      console.error('Error al actualizar áreas de bienestar:', error);
      toast.error('Error al actualizar las áreas de bienestar');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProfessionals = professionals.filter((professional) => {
    const fullName = `${professional.first_name} ${professional.last_name}`;
    const matchesSearch = fullName
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      professional.profession
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      professional.email
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || professional.status === statusFilter;
    
    // Filtro de pago
    const nowForFilter = new Date();
    const thirtyDaysFromNowForFilter = new Date();
    thirtyDaysFromNowForFilter.setDate(nowForFilter.getDate() + 30);
    
    let matchesPayment = true;
    if (paymentFilter === "paid") {
      matchesPayment = !!(professional.registration_fee_paid && 
        professional.registration_fee_expires_at && 
        new Date(professional.registration_fee_expires_at) > nowForFilter);
    } else if (paymentFilter === "unpaid") {
      matchesPayment = !!(!professional.registration_fee_paid || 
        (professional.registration_fee_expires_at && new Date(professional.registration_fee_expires_at) <= nowForFilter));
    } else if (paymentFilter === "expiring_soon") {
      matchesPayment = !!(professional.registration_fee_paid && 
        professional.registration_fee_expires_at && 
        new Date(professional.registration_fee_expires_at) > nowForFilter &&
        new Date(professional.registration_fee_expires_at) <= thirtyDaysFromNowForFilter);
    }
    const matchesVerification = verificationFilter === "all" || 
      (verificationFilter === "verified" && professional.reviewed_at) ||
      (verificationFilter === "unverified" && !professional.reviewed_at);

    return matchesSearch && matchesStatus && matchesVerification && matchesPayment;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando profesionales...</p>
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
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Profesionales</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Gestiona todos los profesionales de la plataforma
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline"
              size="sm"
              className="sm:size-default w-full sm:w-auto"
              onClick={handleVerifyDocuments}
            >
              <Shield className="h-4 w-4 mr-2" />
              <span>Verificar Documentos</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Profesionales
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                {professionals.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {calculatePercentageChange(statsData.totalThisMonth, statsData.lastMonth)} vs mes anterior
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Activos
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                {professionals.filter(p => p.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {professionals.length > 0 ? Math.round((professionals.filter(p => p.status === "active").length / professionals.length) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verificados
              </CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                {professionals.filter(p => p.reviewed_at).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {professionals.length > 0 ? Math.round((professionals.filter(p => p.reviewed_at).length / professionals.length) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pacientes
              </CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-foreground">
                {statsData.totalPatients}
              </div>
              <p className="text-xs text-muted-foreground">En toda la plataforma</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-green-900">
                ✅ Inscripciones Pagadas
              </CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-green-900">
                {statsData.totalPaid}
              </div>
              <p className="text-xs text-green-700">
                {professionals.length > 0 ? Math.round((statsData.totalPaid / professionals.length) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-red-900">
                ❌ Sin Pagar / Expirados
              </CardTitle>
              <Shield className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-red-900">
                {statsData.totalUnpaid}
              </div>
              <p className="text-xs text-red-700">
                {professionals.length > 0 ? Math.round((statsData.totalUnpaid / professionals.length) * 100) : 0}% del total
              </p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
              <CardTitle className="text-sm font-medium text-yellow-900">
                ⚠️ Expiran Pronto (30 días)
              </CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-2xl font-bold text-yellow-900">
                {statsData.totalExpiringSoon}
              </div>
              <p className="text-xs text-yellow-700">
                Requieren renovación pronto
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar profesional..."
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
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Verificación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="verified">Verificados</SelectItem>
                  <SelectItem value="unverified">No verificados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Estado de Pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los pagos</SelectItem>
                  <SelectItem value="paid">✅ Pagado y Vigente</SelectItem>
                  <SelectItem value="unpaid">❌ Sin Pagar / Expirado</SelectItem>
                  <SelectItem value="expiring_soon">⚠️ Expira Pronto</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleExportProfessionals}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Exportar Lista
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Professionals List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProfessionals.map((professional) => (
            <Card key={professional.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
              <CardContent className="px-6 py-6 flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative flex-shrink-0">
                    <Image
                      src={professional.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${professional.first_name} ${professional.last_name}`)}&background=random`}
                      alt={`${professional.first_name} ${professional.last_name}`}
                      width={60}
                      height={60}
                      className="h-15 w-15 aspect-square rounded-full object-cover border-2 border-border"
                    />
                    {professional.reviewed_at && (
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                        <ShieldCheck className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-semibold text-foreground line-clamp-1">
                        {professional.first_name} {professional.last_name}
                      </h3>
                      <Badge className={getStatusColor(professional.status)}>
                        {getStatusText(professional.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {professional.profession}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {professional.specializations.slice(0, 2).join(', ')}
                      {professional.specializations.length > 2 && ` +${professional.specializations.length - 2} más`}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4 flex-grow">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{professional.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{professional.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{professional.city}, {professional.state}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserCheck className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium text-foreground">{professional.patients || 0} pacientes totales</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                      <span>{professional.monthly_patients || 0} este mes</span>
                    </div>
                  </div>
                  
                  {/* Estado de pago */}
                  <div className="pt-2 border-t border-border">
                    {professional.registration_fee_paid && professional.registration_fee_expires_at && new Date(professional.registration_fee_expires_at) > new Date() ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                          ✅ Pagado
                        </Badge>
                        {new Date(professional.registration_fee_expires_at) <= new Date(new Date().setDate(new Date().getDate() + 30)) && (
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">
                            ⚠️ Expira pronto
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">
                        ❌ Sin pagar
                      </Badge>
                    )}
                    {professional.registration_fee_expires_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expira: {new Date(professional.registration_fee_expires_at).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Control de activación/desactivación */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-4">
                  <Label htmlFor={`active-${professional.id}`} className="text-sm font-medium cursor-pointer">
                    {professional.is_active ? 'Visible en listado' : 'Oculto del listado'}
                  </Label>
                  <Switch
                    id={`active-${professional.id}`}
                    checked={professional.is_active}
                    onCheckedChange={() => handleToggleActiveStatus(professional.id, professional.is_active)}
                    disabled={actionLoading === professional.id}
                  />
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewProfile(professional)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Perfil
                  </Button>
                  {!professional.reviewed_at && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedProfessional(professional);
                        setIsVerifyDialogOpen(true);
                      }}
                      disabled={actionLoading === professional.id}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {actionLoading === professional.id ? 'Verificando...' : 'Verificar'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProfessionals.length === 0 && (
          <Card>
            <CardContent className="px-8 py-12 text-center">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No se encontraron profesionales
              </h3>
              <p className="text-muted-foreground">
                No hay profesionales que coincidan con los filtros seleccionados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal para ver perfil del profesional */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil del Profesional</DialogTitle>
            <DialogDescription>
              Información completa del profesional seleccionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedProfessional && (
            <div className="space-y-6">
              {/* Información personal */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserCheck className="h-4 w-4" />
                      <span>Nombre</span>
                    </div>
                    <span className="text-base font-medium pl-6">{selectedProfessional.first_name} {selectedProfessional.last_name}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Profesión</span>
                    <span className="text-base font-medium">{selectedProfessional.profession}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Estado</span>
                    <Badge className={getStatusColor(selectedProfessional.status)}>
                      {getStatusText(selectedProfessional.status)}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Pacientes</span>
                    <span className="text-base font-medium">{selectedProfessional.patients || 0}</span>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <span className="text-base font-medium pl-6 break-all">{selectedProfessional.email}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>Teléfono</span>
                    </div>
                    <span className="text-base font-medium pl-6">{selectedProfessional.phone || 'No disponible'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Ubicación</span>
                    </div>
                    <span className="text-base font-medium pl-6">{selectedProfessional.city}, {selectedProfessional.state}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Instagram className="h-4 w-4" />
                      <span>Instagram</span>
                    </div>
                    <div className="pl-6">
                      {selectedProfessional.instagram ? (
                        <a
                          href={`https://instagram.com/${selectedProfessional.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-medium text-primary hover:underline"
                        >
                          @{selectedProfessional.instagram}
                        </a>
                      ) : (
                        <span className="text-base font-medium text-muted-foreground">No disponible</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Especialidades */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProfessional.specializations.map((specialization, index) => (
                    <Badge key={index} variant="secondary">
                      {specialization}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Áreas de bienestar */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Áreas de bienestar</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditWellnessAreas(selectedProfessional)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProfessional.wellness_areas && selectedProfessional.wellness_areas.length > 0 ? (
                    selectedProfessional.wellness_areas.map((area, index) => (
                      <Badge key={index} variant="secondary">
                        {area}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay áreas de bienestar asignadas</p>
                  )}
                </div>
              </div>

              {/* Información de pago de inscripción */}
              <div className={`rounded-lg p-4 border-2 ${
                selectedProfessional.registration_fee_paid && 
                selectedProfessional.registration_fee_expires_at && 
                new Date(selectedProfessional.registration_fee_expires_at) > new Date()
                  ? 'bg-green-50 border-green-200' 
                  : selectedProfessional.registration_fee_paid && 
                    selectedProfessional.registration_fee_expires_at && 
                    new Date(selectedProfessional.registration_fee_expires_at) <= new Date()
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
              }`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>Cuota de Inscripción Anual</span>
                  {selectedProfessional.registration_fee_paid && 
                   selectedProfessional.registration_fee_expires_at && 
                   new Date(selectedProfessional.registration_fee_expires_at) > new Date() ? (
                    <Badge className="bg-green-600">Vigente</Badge>
                  ) : selectedProfessional.registration_fee_paid && 
                     selectedProfessional.registration_fee_expires_at && 
                     new Date(selectedProfessional.registration_fee_expires_at) <= new Date() ? (
                    <Badge variant="destructive">Expirado</Badge>
                  ) : (
                    <Badge variant="destructive">Pendiente</Badge>
                  )}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Monto</span>
                    <span className="text-base font-medium">
                      ${selectedProfessional.registration_fee_amount?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '1,000.00'} {selectedProfessional.registration_fee_currency?.toUpperCase() || 'MXN'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">Estado</span>
                    <span className="text-base font-medium">
                      {selectedProfessional.registration_fee_paid ? (
                        selectedProfessional.registration_fee_expires_at && 
                        new Date(selectedProfessional.registration_fee_expires_at) > new Date()
                          ? 'Pagado y vigente'
                          : 'Pagado pero expirado'
                      ) : 'Pendiente de pago'}
                    </span>
                  </div>
                  {selectedProfessional.registration_fee_paid && selectedProfessional.registration_fee_paid_at && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Fecha de pago</span>
                      <span className="text-base font-medium">
                        {new Date(selectedProfessional.registration_fee_paid_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                  {selectedProfessional.registration_fee_expires_at && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Fecha de expiración</span>
                      <span className={`text-base font-medium ${
                        new Date(selectedProfessional.registration_fee_expires_at) <= new Date()
                          ? 'text-red-600 font-bold'
                          : new Date(selectedProfessional.registration_fee_expires_at).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000
                            ? 'text-yellow-600 font-bold'
                            : ''
                      }`}>
                        {new Date(selectedProfessional.registration_fee_expires_at).toLocaleDateString('es-ES')}
                        {new Date(selectedProfessional.registration_fee_expires_at) <= new Date() && ' (EXPIRADO)'}
                        {new Date(selectedProfessional.registration_fee_expires_at) > new Date() && 
                         new Date(selectedProfessional.registration_fee_expires_at).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000 && 
                         ' (Próximo a vencer)'}
                      </span>
                    </div>
                  )}
                </div>
                {!selectedProfessional.registration_fee_paid && (
                  <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                    <p className="text-sm text-yellow-800">
                      ⚠️ El profesional debe pagar la cuota de inscripción anual para poder aparecer en la plataforma, 
                      incluso si ya fue aprobado.
                    </p>
                  </div>
                )}
                {selectedProfessional.registration_fee_paid && 
                 selectedProfessional.registration_fee_expires_at && 
                 new Date(selectedProfessional.registration_fee_expires_at) <= new Date() && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md">
                    <p className="text-sm text-red-800">
                      ❌ La inscripción de este profesional ha expirado. Debe renovar su pago para volver a aparecer en la plataforma.
                    </p>
                  </div>
                )}
              </div>

              {/* Información de verificación */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Información de Verificación</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Fecha de registro</span>
                    </div>
                    <span className="text-base font-medium pl-6">{new Date(selectedProfessional.submitted_at).toLocaleDateString('es-ES')}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Verificado</span>
                    </div>
                    <span className="text-base font-medium pl-6">{selectedProfessional.reviewed_at ? new Date(selectedProfessional.reviewed_at).toLocaleDateString('es-ES') : 'No verificado'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para verificar profesional */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verificar Profesional</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres verificar a {selectedProfessional?.first_name} {selectedProfessional?.last_name}?
            </DialogDescription>
          </DialogHeader>

          {selectedProfessional && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Profesional:</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedProfessional.first_name} {selectedProfessional.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedProfessional.profession}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsVerifyDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleVerifyProfessional(selectedProfessional.id)}
                  disabled={actionLoading === selectedProfessional.id}
                >
                  {actionLoading === selectedProfessional.id ? 'Verificando...' : 'Verificar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para editar áreas de bienestar */}
      <Dialog open={isEditWellnessDialogOpen} onOpenChange={setIsEditWellnessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Áreas de Bienestar</DialogTitle>
            <DialogDescription>
              Selecciona las áreas de bienestar para {selectedProfessional?.first_name} {selectedProfessional?.last_name}
            </DialogDescription>
          </DialogHeader>

          {selectedProfessional && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Profesional:</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedProfessional.first_name} {selectedProfessional.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedProfessional.profession}
                </p>
              </div>

              <div className="space-y-3">
                <Label>Selecciona las áreas de bienestar:</Label>
                <div className="grid grid-cols-1 gap-2">
                  {wellnessAreaOptions.map((area) => (
                    <button
                      key={area}
                      onClick={() => handleToggleWellnessArea(area)}
                      className={`p-3 text-left text-sm rounded-lg border-2 transition-colors ${
                        editingWellnessAreas.includes(area)
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{area}</span>
                        {editingWellnessAreas.includes(area) && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Seleccionadas: {editingWellnessAreas.length} de {wellnessAreaOptions.length}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditWellnessDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveWellnessAreas}
                  disabled={actionLoading === selectedProfessional.id}
                >
                  {actionLoading === selectedProfessional.id ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
