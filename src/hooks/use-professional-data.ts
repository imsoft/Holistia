"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  useProfessionalCache,
  useIsProfessionalCacheValid,
  useSetProfessionalCache,
  useClearProfessionalCache,
  useUserId,
} from "@/stores/user-store";

interface ProfessionalApplicationCache {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
  working_start_time: string | null;
  working_end_time: string | null;
  registration_fee_paid: boolean;
  registration_fee_amount: number | null;
  registration_fee_currency: string | null;
  registration_fee_paid_at: string | null;
  registration_fee_expires_at: string | null;
  is_verified: boolean;
  stripe_account_id: string | null;
  stripe_account_status: string | null;
  stripe_charges_enabled: boolean | null;
  stripe_payouts_enabled: boolean | null;
  email?: string;
}

/**
 * Hook para cargar y cachear datos del profesional
 * Similar a useProfile, pero para datos de professional_applications
 */
export function useProfessionalData() {
  const [professional, setProfessional] = useState<ProfessionalApplicationCache | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const userId = useUserId();
  const professionalCache = useProfessionalCache();
  const isCacheValid = useIsProfessionalCacheValid();
  const setProfessionalCacheFn = useSetProfessionalCache();
  const clearProfessionalCache = useClearProfessionalCache();
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      setProfessional(null);
      setLoading(false);
      return;
    }

    // OPTIMIZACIÓN: Usar cache primero para renderizado inmediato
    if (professionalCache && isCacheValid) {
      setProfessional(professionalCache);
      setLoading(false);
      setError(null);
      // Cargar en segundo plano para actualizar si es necesario
      loadProfessionalData().catch(err => {
        console.error('Error loading professional data in background:', err);
      });
      return;
    }

    // Si no hay cache válido, cargar directamente
    loadProfessionalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadProfessionalData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      // Obtener la aplicación profesional del usuario
      const { data: professionalApp, error: profError } = await supabase
        .from('professional_applications')
        .select('id, user_id, first_name, last_name, profile_photo, working_start_time, working_end_time, registration_fee_paid, registration_fee_amount, registration_fee_currency, registration_fee_paid_at, registration_fee_expires_at, is_verified, stripe_account_id, stripe_account_status, stripe_charges_enabled, stripe_payouts_enabled')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single();

      if (profError) {
        throw new Error(profError.message);
      }

      if (professionalApp) {
        // Obtener email del usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        const professionalData: ProfessionalApplicationCache = {
          id: professionalApp.id,
          user_id: professionalApp.user_id,
          first_name: professionalApp.first_name,
          last_name: professionalApp.last_name,
          profile_photo: professionalApp.profile_photo,
          working_start_time: professionalApp.working_start_time,
          working_end_time: professionalApp.working_end_time,
          registration_fee_paid: professionalApp.registration_fee_paid || false,
          registration_fee_amount: professionalApp.registration_fee_amount,
          registration_fee_currency: professionalApp.registration_fee_currency,
          registration_fee_paid_at: professionalApp.registration_fee_paid_at,
          registration_fee_expires_at: professionalApp.registration_fee_expires_at,
          is_verified: professionalApp.is_verified || false,
          stripe_account_id: professionalApp.stripe_account_id,
          stripe_account_status: professionalApp.stripe_account_status,
          stripe_charges_enabled: professionalApp.stripe_charges_enabled,
          stripe_payouts_enabled: professionalApp.stripe_payouts_enabled,
          email: user?.email,
        };

        setProfessional(professionalData);
        setProfessionalCacheFn(professionalData); // Actualizar cache
      } else {
        setProfessional(null);
        clearProfessionalCache();
      }
    } catch (err) {
      console.error('Error loading professional data:', err);
      setError(err instanceof Error ? err : new Error('Error al cargar datos del profesional'));
      setProfessional(null);
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar datos (limpiar cache y recargar)
  const refresh = () => {
    clearProfessionalCache();
    loadProfessionalData();
  };

  return {
    professional,
    loading,
    error,
    refresh,
  };
}
