"use client";

import { useEffect, useMemo } from 'react';
import { useProfile } from './use-profile';
import { useUserStore } from '@/stores/user-store';
import { createClient } from '@/utils/supabase/client';

/**
 * Hook para inicializar el store de Zustand con los datos del usuario
 * Debe usarse en un componente cliente al inicio de la app
 * 
 * OPTIMIZACIÓN: Usa getState() para las actions - evita re-renders cuando el store actualiza.
 * Solo suscribirse a profile y loading de useProfile (datos esenciales).
 */
export function useUserStoreInit() {
  const { profile, loading } = useProfile();
  // Evitar recrear el cliente en cada render (dispara effects innecesarios).
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const { setUser, setProfessional, setLoading, professional: cachedProfessional } = useUserStore.getState();

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

    // Si es profesional, cargar datos adicionales (solo si no están en caché)
    if (profile.type === 'professional') {
      // Solo cargar si no hay datos profesionales en caché
      if (!cachedProfessional) {
        const loadProfessionalData = async () => {
          try {
            const { data: professionalApp } = await supabase
              .from('professional_applications')
              .select('id, stripe_account_id, stripe_account_status')
              .eq('user_id', profile.id)
              .eq('status', 'approved')
              .maybeSingle();

            const { setProfessional } = useUserStore.getState();
            if (professionalApp) {
              setProfessional({
                professional_id: professionalApp.id,
                stripe_account_id: professionalApp.stripe_account_id,
                stripe_account_status: professionalApp.stripe_account_status,
              });
            } else {
              setProfessional(null);
            }
          } catch (error) {
            console.error('Error loading professional data:', error);
          }
        };

        loadProfessionalData();
      }
    } else {
      setProfessional(null);
    }

    setLoading(false);
  }, [profile, loading, supabase]);
}
