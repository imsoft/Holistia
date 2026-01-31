"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserId } from "@/stores/user-store";
import { useUserStoreInit } from "@/hooks/use-user-store-init";
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
  CheckCircle,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
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
import { AdminRatingForm } from "@/components/ui/admin-rating-form";
import { getRegistrationFeeStatus } from "@/utils/registration-utils";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { formatPhone } from "@/utils/phone-utils";

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
  is_verified: boolean; // Campo para marcar profesionales verificados con insignia
  submitted_at: string;
  reviewed_at?: string;
  patients?: number;
  monthly_patients?: number; // Pacientes del mes actual
  registration_fee_paid?: boolean;
  registration_fee_amount?: number;
  registration_fee_currency?: string;
  registration_fee_paid_at?: string;
  registration_fee_expires_at?: string;
  stripe_account_id?: string;
  stripe_account_status?: 'not_connected' | 'pending' | 'connected' | 'restricted';
  stripe_onboarding_completed?: boolean;
  stripe_charges_enabled?: boolean;
  stripe_payouts_enabled?: boolean;
}

export default function AdminProfessionals() {
  const router = useRouter();
  useUserStoreInit();
  const adminId = useUserId();
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
  const [adminRating, setAdminRating] = useState<{rating: number; improvement_comments?: string | null; id?: string} | null>(null);
  const [ratingRefreshKey, setRatingRefreshKey] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
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

        console.log('📊 Loaded professionals from DB:', professionalsData.length);
        console.log('🔍 Sample professional data:', professionalsData[0]);

        // OPTIMIZACIÓN: Batch queries en lugar de N+1 queries individuales
        const professionalIds = professionalsData.map(p => p.id);
        
        // Obtener todos los appointments en batch (solo 2 queries en total en lugar de 2 * N)
        const [
          allAppointmentsResult,
          monthlyAppointmentsResult
        ] = await Promise.allSettled([
          // Todos los appointments de todos los profesionales
          supabase
            .from('appointments')
            .select('professional_id, patient_id, created_at')
            .in('professional_id', professionalIds),
          // Appointments del mes actual de todos los profesionales
          supabase
            .from('appointments')
            .select('professional_id, patient_id')
            .in('professional_id', professionalIds)
            .gte('created_at', currentMonthStart.toISOString())
        ]);

        // Procesar resultados de batch queries
        const allAppointments = allAppointmentsResult.status === 'fulfilled' ? (allAppointmentsResult.value.data || []) : [];
        const monthlyAppointments = monthlyAppointmentsResult.status === 'fulfilled' ? (monthlyAppointmentsResult.value.data || []) : [];

        // Crear maps para contar pacientes únicos por professional_id
        const patientsMap = new Map<string, Set<string>>();
        const monthlyPatientsMap = new Map<string, Set<string>>();

        // Agrupar appointments por professional_id
        allAppointments.forEach((apt: any) => {
          const profId = apt.professional_id;
          if (!patientsMap.has(profId)) {
            patientsMap.set(profId, new Set());
          }
          patientsMap.get(profId)!.add(apt.patient_id);
        });

        monthlyAppointments.forEach((apt: any) => {
          const profId = apt.professional_id;
          if (!monthlyPatientsMap.has(profId)) {
            monthlyPatientsMap.set(profId, new Set());
          }
          monthlyPatientsMap.get(profId)!.add(apt.patient_id);
        });

        // Transformar datos y obtener número de pacientes para cada profesional
        const transformedProfessionals: Professional[] = professionalsData.map((prof) => {
          // Obtener pacientes únicos desde los maps
          const uniquePatients = patientsMap.get(prof.id) || new Set();
          const patientsCount = uniquePatients.size;

          const monthlyUniquePatients = monthlyPatientsMap.get(prof.id) || new Set();
          const monthlyPatientsCount = monthlyUniquePatients.size;

            // Determinar el estado basado en:
            // 1. Si está aprobado
            // 2. Si tiene la cuota pagada y no expirada
            // 3. Si is_active está en true
            const now = new Date();
            const registrationExpired = prof.registration_fee_expires_at 
              ? new Date(prof.registration_fee_expires_at) <= now
              : false;
            
            let status: 'active' | 'inactive' | 'suspended' = 'active';
            
            // Si no está aprobado, está inactivo
            if (prof.status !== 'approved') {
              status = 'inactive';
            }
            // Si la cuota de registro expiró o no está pagada, está inactivo
            else if (!prof.registration_fee_paid || registrationExpired) {
              status = 'inactive';
            }
            // Si is_active es false, está inactivo
            else if (!prof.is_active) {
              status = 'inactive';
            }
            // Si está aprobado, tiene cuota pagada y no expirada, y is_active es true, está activo
            else {
              status = 'active';
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
              wellness_areas: prof.wellness_areas || [], // ⭐ IMPORTANTE: Incluir wellness_areas
              city: prof.city,
              state: prof.state,
              profile_photo: prof.profile_photo,
              status,
              is_active: prof.is_active ?? true, // Por defecto true si no existe
              is_verified: prof.is_verified ?? false, // Por defecto false si no existe
              submitted_at: prof.submitted_at,
              reviewed_at: prof.reviewed_at,
              patients: patientsCount || 0,
              monthly_patients: monthlyPatientsCount || 0,
              registration_fee_paid: prof.registration_fee_paid ?? false,
              registration_fee_amount: prof.registration_fee_amount,
              registration_fee_currency: prof.registration_fee_currency,
              registration_fee_paid_at: prof.registration_fee_paid_at,
              registration_fee_expires_at: prof.registration_fee_expires_at,
              stripe_account_id: prof.stripe_account_id,
              stripe_account_status: prof.stripe_account_status || 'not_connected',
              stripe_onboarding_completed: prof.stripe_onboarding_completed ?? false,
              stripe_charges_enabled: prof.stripe_charges_enabled ?? false,
              stripe_payouts_enabled: prof.stripe_payouts_enabled ?? false,
            };
        });

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

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

  const getStripeStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "restricted":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "not_connected":
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStripeStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "restricted":
        return <AlertCircle className="h-3 w-3" />;
      case "not_connected":
      default:
        return <XCircle className="h-3 w-3" />;
    }
  };

  const getStripeStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Stripe conectado";
      case "pending":
        return "Stripe pendiente";
      case "restricted":
        return "Stripe restringido";
      case "not_connected":
      default:
        return "Stripe no conectado";
    }
  };

  // Función para calcular porcentaje de cambio
  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${Math.round(change)}%`;
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

  // Estado para el diálogo de resultados de sincronización
  const [syncResults, setSyncResults] = useState<{
    isOpen: boolean;
    summary: {
      total_professionals: number;
      payments_synced: number;
      payments_found_in_stripe: number;
      stripe_connect_synced: number;
    } | null;
    details: Array<{
      professional_id: string;
      professional_name: string;
      professional_email: string;
      changes_made: string[];
      errors: string[];
    }>;
  }>({
    isOpen: false,
    summary: null,
    details: [],
  });

  // Función unificada para sincronizar TODO de los profesionales
  const handleSyncAll = async () => {
    try {
      setActionLoading('sync-all');

      const response = await fetch('/api/admin/sync-all-professionals', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Error al sincronizar');
        return;
      }

      const { summary, details } = data;

      // Mostrar el diálogo con los resultados
      setSyncResults({
        isOpen: true,
        summary,
        details: details || [],
      });

    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Error al sincronizar');
    } finally {
      setActionLoading(null);
    }
  };

  // Función para cerrar el diálogo y refrescar datos
  const handleCloseSyncResults = () => {
    setSyncResults({ isOpen: false, summary: null, details: [] });
    setRefreshKey(prev => prev + 1);
  };

  // Función para marcar manualmente el pago como completado
  const handleMarkPaymentComplete = async (professionalId: string) => {
    try {
      setActionLoading(`mark-${professionalId}`);

      const response = await fetch('/api/admin/mark-payment-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          professional_application_id: professionalId,
          notes: 'Pago marcado manualmente por administrador desde el panel',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Error al marcar el pago');
        return;
      }

      // Actualizar el estado local
      setProfessionals(prev =>
        prev.map(prof =>
          prof.id === professionalId
            ? {
                ...prof,
                registration_fee_paid: true,
                registration_fee_paid_at: data.registration_fee_paid_at,
                registration_fee_expires_at: data.registration_fee_expires_at,
                status: 'active' as const,
              }
            : prof
        )
      );

      if (data.stripe_payment_found) {
        toast.success(`Pago confirmado y encontrado en Stripe. Expira: ${new Date(data.registration_fee_expires_at).toLocaleDateString('es-ES')}`);
      } else {
        toast.success(`Pago marcado como completado. Expira: ${new Date(data.registration_fee_expires_at).toLocaleDateString('es-ES')}`);
      }
    } catch (error) {
      console.error('Error al marcar pago:', error);
      toast.error('Error al marcar el pago como completado');
    } finally {
      setActionLoading(null);
    }
  };

  // Función para ver el perfil del profesional
  const handleViewProfile = async (professional: Professional) => {
    setSelectedProfessional(professional);
    setIsViewDialogOpen(true);
    
    // Cargar calificación existente del admin actual
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: ratingData, error } = await supabase
          .from("admin_ratings")
          .select("*")
          .eq("professional_id", professional.id)
          .eq("admin_id", user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error("Error loading rating:", error);
        } else if (ratingData) {
          setAdminRating(ratingData);
        } else {
          setAdminRating(null);
        }
      }
    } catch (error) {
      console.error("Error loading rating:", error);
      setAdminRating(null);
    }
  };
  
  // Función para refrescar la calificación después de guardar
  const handleRatingSuccess = () => {
    setRatingRefreshKey(prev => prev + 1);
    if (selectedProfessional) {
      handleViewProfile(selectedProfessional);
    }
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

  // Función para marcar/desmarcar profesional como verificado
  const handleToggleVerifiedStatus = async (professionalId: string, currentStatus: boolean) => {
    try {
      setActionLoading(professionalId);

      const { error } = await supabase
        .from('professional_applications')
        .update({ is_verified: !currentStatus })
        .eq('id', professionalId);

      if (error) {
        console.error('Error updating verified status:', error);
        toast.error('Error al cambiar el estado de verificación');
        return;
      }

      // Actualizar el estado local
      setProfessionals(prev =>
        prev.map(prof =>
          prof.id === professionalId
            ? { ...prof, is_verified: !currentStatus }
            : prof
        )
      );

      toast.success(`Profesional ${!currentStatus ? 'marcado como verificado' : 'desmarcado como verificado'} exitosamente`);
    } catch (error) {
      console.error('Error al cambiar estado de verificación:', error);
      toast.error('Error al cambiar el estado de verificación');
    } finally {
      setActionLoading(null);
    }
  };

  // Función para abrir el diálogo de edición de wellness areas
  const handleOpenEditWellnessAreas = (professional: Professional) => {
    console.log('🔍 Opening wellness areas editor for:', professional.first_name, professional.last_name);
    console.log('📋 Current wellness_areas:', professional.wellness_areas);
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

      console.log('💾 Intentando guardar wellness_areas...');
      console.log('   Professional ID:', selectedProfessional.id);
      console.log('   Wellness areas:', editingWellnessAreas);

      // Verificar usuario actual
      const { data: userData } = await supabase.auth.getUser();
      console.log('   Usuario actual:', userData.user?.email);
      console.log('   Metadata:', userData.user?.user_metadata);

      const { data, error } = await supabase
        .from('professional_applications')
        .update({ wellness_areas: editingWellnessAreas })
        .eq('id', selectedProfessional.id)
        .select();

      if (error) {
        console.error('❌ Error saving:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        console.error('   Error details:', error.details);
        throw error;
      }

      console.log('✅ Saved successfully!');
      console.log('   Updated data:', data);

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
              onClick={handleSyncAll}
              disabled={actionLoading === 'sync-all'}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              <span>{actionLoading === 'sync-all' ? 'Sincronizando...' : 'Sincronizar con Stripe'}</span>
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
                      <h3 className="text-base font-semibold text-foreground line-clamp-1 flex items-center gap-1">
                        {professional.first_name} {professional.last_name}
                        {professional.is_verified && <VerifiedBadge size={16} />}
                      </h3>
                      <Badge className={getStatusColor(professional.status)}>
                        {getStatusText(professional.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge
                        variant="outline"
                        className={`${getStripeStatusColor(professional.stripe_account_status || 'not_connected')} flex items-center gap-1`}
                      >
                        {getStripeStatusIcon(professional.stripe_account_status || 'not_connected')}
                        <span className="text-xs">
                          {professional.stripe_charges_enabled && professional.stripe_payouts_enabled ? 'Vinculado con Stripe' : 'Sin vincular Stripe'}
                        </span>
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
                    <span className="truncate">{formatPhone(professional.phone || '')}</span>
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
                    {professional.registration_fee_paid ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                          ✅ Pagado
                        </Badge>
                        {professional.registration_fee_expires_at && (
                          <>
                            {new Date(professional.registration_fee_expires_at) > new Date() ? (
                              new Date(professional.registration_fee_expires_at) <= new Date(new Date().setDate(new Date().getDate() + 30)) && (
                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">
                                  ⚠️ Expira pronto
                                </Badge>
                              )
                            ) : (
                              <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">
                                ⚠️ Expirado
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">
                          ❌ Sin pagar
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleMarkPaymentComplete(professional.id)}
                          disabled={actionLoading === `mark-${professional.id}`}
                        >
                          {actionLoading === `mark-${professional.id}` ? '...' : '✓ Marcar pagado'}
                        </Button>
                      </div>
                    )}
                    {professional.registration_fee_expires_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expira: {new Date(professional.registration_fee_expires_at).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Control de activación/desactivación */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-3">
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

                {/* Control de verificación */}
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg mb-4 border border-primary/20">
                  <Label htmlFor={`verified-${professional.id}`} className="text-sm font-medium cursor-pointer">
                    {professional.is_verified ? '✓ Profesional verificado' : 'Sin verificar'}
                  </Label>
                  <Switch
                    id={`verified-${professional.id}`}
                    checked={professional.is_verified}
                    onCheckedChange={() => handleToggleVerifiedStatus(professional.id, professional.is_verified)}
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
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/admin/professionals/${professional.id}`)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw]">
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
                    <span className="text-base font-medium pl-6 flex items-center gap-2">
                      {selectedProfessional.first_name} {selectedProfessional.last_name}
                      {selectedProfessional.is_verified && <VerifiedBadge size={18} />}
                    </span>
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
                    <span className="text-base font-medium pl-6 break-all">{selectedProfessional.phone ? formatPhone(selectedProfessional.phone) : 'No disponible'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Ubicación</span>
                    </div>
                    <span className="text-base font-medium pl-6 break-words">{selectedProfessional.city}, {selectedProfessional.state}</span>
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
                          className="text-base font-medium text-primary hover:underline break-all"
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
                    <Badge key={index} variant="secondary" className="max-w-full break-words whitespace-normal">
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
              {(() => {
                const feeStatus = getRegistrationFeeStatus(
                  selectedProfessional.registration_fee_paid,
                  selectedProfessional.registration_fee_expires_at
                );

                return (
                  <div className={`rounded-lg p-4 border-2 ${
                    feeStatus.color === 'green' ? 'bg-green-50 border-green-200' :
                    feeStatus.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                    feeStatus.color === 'red' ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 flex-wrap">
                      <span>Cuota de Inscripción Anual</span>
                      <Badge className={
                        feeStatus.color === 'green' ? 'bg-green-600' :
                        feeStatus.color === 'yellow' ? 'bg-yellow-600' :
                        feeStatus.color === 'red' ? 'bg-red-600' :
                        'bg-gray-600'
                      }>
                        {feeStatus.message}
                      </Badge>
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
                    <span className="text-base font-medium break-words">
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
                      <span className={`text-base font-medium break-words ${
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
                    <p className="text-sm text-yellow-800 break-words">
                      ⚠️ El profesional debe pagar la cuota de inscripción anual para poder aparecer en la plataforma, 
                      incluso si ya fue aprobado.
                    </p>
                  </div>
                )}
                {selectedProfessional.registration_fee_paid && 
                 selectedProfessional.registration_fee_expires_at && 
                 new Date(selectedProfessional.registration_fee_expires_at) <= new Date() && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md">
                    <p className="text-sm text-red-800 break-words">
                      ❌ La inscripción de este profesional ha expirado. Debe renovar su pago para volver a aparecer en la plataforma.
                    </p>
                  </div>
                )}
                  </div>
                );
              })()}

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

              {/* Calificación de administrador */}
              {selectedProfessional.id && (
                <AdminRatingForm
                  key={ratingRefreshKey}
                  professionalId={selectedProfessional.id}
                  professionalName={`${selectedProfessional.first_name} ${selectedProfessional.last_name}`}
                  existingRating={adminRating}
                  onSuccess={handleRatingSuccess}
                />
              )}

              {/* Información de pagos (Stripe) */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Información de Pagos</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>Estado de Stripe</span>
                    </div>
                    <div className="pl-6">
                      <Badge
                        variant="outline"
                        className={`${getStripeStatusColor(selectedProfessional.stripe_account_status || 'not_connected')} flex items-center gap-1 w-fit`}
                      >
                        {getStripeStatusIcon(selectedProfessional.stripe_account_status || 'not_connected')}
                        <span>{getStripeStatusText(selectedProfessional.stripe_account_status || 'not_connected')}</span>
                      </Badge>
                    </div>
                  </div>
                  {selectedProfessional.stripe_account_id && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">ID de cuenta Stripe</span>
                      <span className="text-xs font-mono text-foreground pl-6">{selectedProfessional.stripe_account_id}</span>
                    </div>
                  )}
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
                <p className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                  {selectedProfessional.first_name} {selectedProfessional.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedProfessional.profession}
                </p>
              </div>

              <div className="space-y-3">
                <Label>Selecciona las áreas de bienestar:</Label>
                {(() => {
                  console.log('🎨 Rendering wellness areas. Current editingWellnessAreas:', editingWellnessAreas);
                  return null;
                })()}
                <div className="grid grid-cols-1 gap-2">
                  {wellnessAreaOptions.map((area) => {
                    const isSelected = editingWellnessAreas.includes(area);
                    console.log(`  - ${area}: ${isSelected ? '✅ Selected' : '⬜ Not selected'}`);
                    return (
                      <button
                        key={area}
                        onClick={() => handleToggleWellnessArea(area)}
                        className={`p-3 text-left text-sm rounded-lg border-2 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{area}</span>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </div>
                      </button>
                    );
                  })}
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

      {/* Modal de resultados de sincronización */}
      <Dialog open={syncResults.isOpen} onOpenChange={(open) => !open && handleCloseSyncResults()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Sincronización Completada
            </DialogTitle>
            <DialogDescription>
              Resumen de la sincronización con Stripe
            </DialogDescription>
          </DialogHeader>

          {syncResults.summary && (
            <div className="space-y-4">
              {/* Resumen general */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{syncResults.summary.total_professionals}</p>
                  <p className="text-xs text-muted-foreground">Profesionales revisados</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                  <p className="text-2xl font-bold text-green-700">{syncResults.summary.payments_found_in_stripe}</p>
                  <p className="text-xs text-green-600">Pagos encontrados</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                  <p className="text-2xl font-bold text-blue-700">{syncResults.summary.payments_synced}</p>
                  <p className="text-xs text-blue-600">Pagos sincronizados</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                  <p className="text-2xl font-bold text-purple-700">{syncResults.summary.stripe_connect_synced}</p>
                  <p className="text-xs text-purple-600">Stripe Connect actualizados</p>
                </div>
              </div>

              {/* Detalles de cambios */}
              {syncResults.details.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">Detalles de los cambios:</h4>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {syncResults.details.map((detail, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          detail.errors.length > 0
                            ? 'bg-red-50 border-red-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{detail.professional_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{detail.professional_email}</p>
                          </div>
                          {detail.errors.length > 0 ? (
                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          )}
                        </div>
                        {detail.changes_made.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {detail.changes_made.map((change, i) => (
                              <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                                <span className="shrink-0">✓</span>
                                <span>{change}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {detail.errors.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {detail.errors.map((error, i) => (
                              <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                                <span className="shrink-0">✗</span>
                                <span>{error}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p className="font-medium">Todo está sincronizado</p>
                  <p className="text-sm">No se encontraron cambios pendientes</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={handleCloseSyncResults}>
                  Cerrar y Actualizar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
