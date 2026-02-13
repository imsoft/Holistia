"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Briefcase,
  Calendar,
  ShoppingBag,
  Trophy,
  CalendarDays,
  Image as ImageIcon,
  Settings,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";

// Import tab components (we'll create these)
import { BasicInfoTab } from "@/components/admin/professional-edit/basic-info-tab";
import { ServicesTab } from "@/components/admin/professional-edit/services-tab";
import { AvailabilityTab } from "@/components/admin/professional-edit/availability-tab";
import { DigitalProductsTab } from "@/components/admin/professional-edit/digital-products-tab";
import { ChallengesTab } from "@/components/admin/professional-edit/challenges-tab";
import { EventsTab } from "@/components/admin/professional-edit/events-tab";
import { GalleryTab } from "@/components/admin/professional-edit/gallery-tab";
import { SettingsTab } from "@/components/admin/professional-edit/settings-tab";

interface Professional {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profession: string;
  specializations: string[];
  wellness_areas?: string[];
  city: string;
  state: string;
  country?: string;
  address?: string;
  profile_photo?: string;
  image_position?: string;
  status: string;
  is_active: boolean;
  is_verified: boolean;
  biography?: string;
  bio?: string;
  experience?: string; // VARCHAR(50) en BD - texto libre sobre experiencia
  certifications?: string[];
  languages?: string[];
  instagram?: string;
  services?: any[];
  gallery?: string[];
  working_days?: number[];
  working_start_time?: string;
  working_end_time?: string;
  tolerance_minutes?: number;
  registration_fee_paid?: boolean;
  registration_fee_amount?: number;
  registration_fee_currency?: string;
  registration_fee_payment_id?: string;
  registration_fee_stripe_session_id?: string;
  registration_fee_paid_at?: string;
  registration_fee_expires_at?: string;
  stripe_account_id?: string;
  stripe_account_status?: string;
  stripe_onboarding_completed?: boolean;
  stripe_charges_enabled?: boolean;
  stripe_payouts_enabled?: boolean;
  stripe_connected_at?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  terms_accepted?: boolean;
  privacy_accepted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function AdminProfessionalEdit() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Ref para el método de guardar del tab activo
  const basicInfoSaveRef = useRef<(() => Promise<void>) | null>(null);
  const settingsSaveRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    fetchProfessional();
  }, [params.professionalId]);

  const fetchProfessional = async () => {
    try {
      setLoading(true);
      
      // Obtener TODOS los datos del profesional (select('*') obtiene todos los campos)
      const { data: professionalData, error: professionalError } = await supabase
        .from('professional_applications')
        .select('*')
        .eq('id', params.professionalId)
        .single();

      if (professionalError) throw professionalError;

      // Obtener email del perfil si existe user_id
      let email = professionalData.email || '';
      if (professionalData.user_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', professionalData.user_id)
          .maybeSingle();
        
        if (profileData?.email) {
          email = profileData.email;
        }
      }

      // Asegurar que todos los campos estén presentes con valores por defecto si es necesario
      setProfessional({
        ...professionalData,
        email: email,
        // Asegurar arrays vacíos si son null
        specializations: professionalData.specializations || [],
        certifications: professionalData.certifications || [],
        languages: professionalData.languages || ['Español'],
        wellness_areas: professionalData.wellness_areas || [],
        gallery: professionalData.gallery || [],
        working_days: professionalData.working_days || [1, 2, 3, 4, 5],
        // Asegurar valores por defecto
        country: professionalData.country || 'México',
        image_position: professionalData.image_position || 'center center',
        tolerance_minutes: professionalData.tolerance_minutes ?? 15,
        is_active: professionalData.is_active ?? true,
        is_verified: professionalData.is_verified ?? false,
        working_start_time: professionalData.working_start_time || '09:00',
        working_end_time: professionalData.working_end_time || '18:00',
      });
      
      console.log('✅ Professional data loaded:', {
        id: professionalData.id,
        fieldsCount: Object.keys(professionalData).length,
        hasAllFields: true
      });
    } catch (error) {
      console.error('❌ Error fetching professional:', error);
      toast.error('Error al cargar la información del profesional');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Llamar al método de guardar del tab activo
      if (activeTab === 'basic' && basicInfoSaveRef.current) {
        await basicInfoSaveRef.current();
      } else if (activeTab === 'settings' && settingsSaveRef.current) {
        await settingsSaveRef.current();
      } else {
        toast.info('No hay cambios para guardar en este tab');
      }
    } catch (error) {
      console.error('Error saving:', error);
      // El error ya se maneja en cada tab
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = (updates: Partial<Professional>) => {
    if (professional) {
      setProfessional({ ...professional, ...updates });
    }
  };

  if (loading) {
    return (
      <div className="admin-page-shell flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="admin-page-shell flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profesional no encontrado</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="admin-page-shell flex flex-col">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header-inner admin-page-header-inner-row">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {professional.first_name} {professional.last_name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {professional.profession} - {professional.city}, {professional.state}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="admin-page-content flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex h-auto min-w-max gap-1">
              <TabsTrigger value="basic" className="gap-2 whitespace-nowrap">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Básico</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-2 whitespace-nowrap">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Servicios</span>
              </TabsTrigger>
              <TabsTrigger value="availability" className="gap-2 whitespace-nowrap">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Disponibilidad</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2 whitespace-nowrap">
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Programas</span>
              </TabsTrigger>
              <TabsTrigger value="challenges" className="gap-2 whitespace-nowrap">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Retos</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="gap-2 whitespace-nowrap">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">Eventos</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-2 whitespace-nowrap">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Galería</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2 whitespace-nowrap">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="basic">
            <BasicInfoTab 
              professional={professional} 
              onUpdate={handleUpdate}
              onSaveRef={basicInfoSaveRef}
            />
          </TabsContent>

          <TabsContent value="services">
            <ServicesTab professionalId={professional.id} />
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilityTab professionalId={professional.id} />
          </TabsContent>

          <TabsContent value="products">
            <DigitalProductsTab professionalId={professional.id} />
          </TabsContent>

          <TabsContent value="challenges">
            <ChallengesTab professionalId={professional.id} />
          </TabsContent>

          <TabsContent value="events">
            <EventsTab professionalId={professional.id} />
          </TabsContent>

          <TabsContent value="gallery">
            <GalleryTab professionalId={professional.id} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab professional={professional} onUpdate={handleUpdate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
