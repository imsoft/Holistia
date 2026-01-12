"use client";

import { useEffect } from 'react';
import { useProfile } from './use-profile';
import { useUserStore } from '@/stores/user-store';
import { createClient } from '@/utils/supabase/client';

/**
 * Hook para inicializar el store de Zustand con los datos del usuario
 * Debe usarse en un componente cliente al inicio de la app
 */
export function useUserStoreInit() {
  const { profile, loading } = useProfile();
  const { setUser, setProfessional, setLoading } = useUserStore();
  const supabase = createClient();

  useEffect(() => {
    if (loading) {
      setLoading(true);
      return;
    }

    if (!profile) {
      setUser(null);
      setProfessional(null);
      setLoading(false);
      return;
    }

    // Actualizar usuario en el store
    setUser({
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      type: profile.type,
      avatar_url: profile.avatar_url,
      account_active: profile.account_active,
    });

    // Si es profesional, cargar datos adicionales
    if (profile.type === 'professional') {
      const loadProfessionalData = async () => {
        try {
          const { data: professionalApp } = await supabase
            .from('professional_applications')
            .select('id, stripe_account_id, stripe_account_status')
            .eq('user_id', profile.id)
            .eq('status', 'approved')
            .maybeSingle();

          if (professionalApp) {
            setProfessional({
              professional_id: professionalApp.id,
              stripe_account_id: professionalApp.stripe_account_id,
              stripe_account_status: professionalApp.stripe_account_status,
            });
          }
        } catch (error) {
          console.error('Error loading professional data:', error);
        }
      };

      loadProfessionalData();
    } else {
      setProfessional(null);
    }

    setLoading(false);
  }, [profile, loading, setUser, setProfessional, setLoading, supabase]);
}
