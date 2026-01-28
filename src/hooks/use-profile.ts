import { useMemo, useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Profile, ProfileUpdate } from '@/types/profile';
import { useUserStore } from '@/stores/user-store';

/**
 * Hook para manejar el perfil de usuario desde public.profiles
 * Reemplaza el uso de auth.users.user_metadata
 * 
 * OPTIMIZACIÓN: Usa caché de Zustand para evitar consultas repetidas
 * - Primero verifica el caché (inmediato, no bloquea)
 * - Solo hace consulta a Supabase si no hay caché válido
 * - Actualiza el caché cuando carga el perfil
 * 
 * @example
 * const { profile, loading, updateProfile, refreshProfile } = useProfile();
 * 
 * // Leer datos
 * console.log(profile?.first_name);
 * 
 * // Actualizar datos
 * await updateProfile({ phone: '123456789' });
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Importante: evitar recrear el cliente en cada render.
  const supabase = useMemo(() => createClient(), []);
  
  // Obtener caché del store de Zustand (solo valores, no funciones para evitar re-renders)
  const profileCache = useUserStore((state) => state.profileCache);
  const isProfileCacheValidFn = useUserStore((state) => state.isProfileCacheValid);

  /**
   * Cargar perfil del usuario autenticado
   */
  const loadProfile = async (opts?: { silent?: boolean }) => {
    const silent = Boolean(opts?.silent);
    try {
      // Si ya tenemos UI pintada (por caché), refrescar en background sin parpadeo.
      if (!silent) setLoading(true);
      setError(null);

      // Obtener usuario autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) {
        setProfile(null);
        return;
      }

      // Obtener perfil desde public.profiles
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // Si el perfil no existe (error PGRST116), intentar crearlo automáticamente
        if (profileError.code === 'PGRST116') {
          console.log('📝 Profile not found, creating automatically...');
          console.log('👤 User ID:', user.id);
          console.log('📧 User email:', user.email);
          console.log('📋 User metadata:', user.user_metadata);
          
          // Llamar a la función que crea el perfil
          const { data: createResult, error: createError } = await supabase.rpc('ensure_profile_exists');

          if (createError) {
            console.error('❌ Error calling ensure_profile_exists:', createError);
            
            // Si falla, intentar crear manualmente con los datos disponibles
            console.log('🔄 Attempting manual profile creation...');
            const manualProfile = {
              id: user.id,
              email: user.email || '',
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              phone: user.user_metadata?.phone || null,
              avatar_url: user.user_metadata?.avatar_url || null,
              type: user.user_metadata?.type || 'patient',
              account_active: true,
            };
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert(manualProfile);
            
            if (insertError) {
              console.error('❌ Error creating profile manually:', insertError);
              throw new Error('Failed to create profile automatically');
            }
            
            console.log('✅ Profile created manually');
          } else {
            console.log('✅ Profile created via RPC:', createResult);
          }

          // Intentar cargar el perfil de nuevo
          const { data: newProfile, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (retryError) {
            console.error('❌ Error loading profile after creation:', retryError);
            throw retryError;
          }

          console.log('✅ Profile loaded successfully:', newProfile);
          setProfile(newProfile);
          // Actualizar caché (solo si no es el mismo objeto para evitar loops)
          if (profileCache?.id !== newProfile.id) {
            useUserStore.getState().setProfileCache(newProfile);
          }
        } else {
          throw profileError;
        }
      } else {
        setProfile(data);
        // Actualizar caché (Zustand manejará la comparación internamente)
        useUserStore.getState().setProfileCache(data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      // En refresh silencioso, no “romper” la UI ni mostrar skeleton; mantener el caché.
      if (!silent) {
        setError(err instanceof Error ? err : new Error('Failed to load profile'));
        setProfile(null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /**
   * Actualizar perfil del usuario
   */
  const updateProfile = async (updates: ProfileUpdate): Promise<Profile | null> => {
    try {
      if (!profile) throw new Error('No profile loaded');

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setProfile(data);
      // Actualizar caché cuando se actualiza el perfil
      useUserStore.getState().setProfileCache(data);
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      return null;
    }
  };

  /**
   * Refrescar perfil manualmente
   * Limpia el caché y vuelve a cargar
   */
  const refreshProfile = () => {
    useUserStore.getState().clearProfileCache();
    loadProfile({ silent: false });
  };

  // Flag para evitar loops de carga
  const loadingRef = useRef(false);

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // Si el usuario cerró sesión, limpiar perfil inmediatamente
        loadingRef.current = false;
        setProfile(null);
        setLoading(false);
        setError(null);
        // Usar getState() para evitar dependencias inestables
        useUserStore.getState().clearProfileCache();
      } else if (event === 'SIGNED_IN' && session?.user && !loadingRef.current) {
        // Si el usuario inició sesión, cargar perfil (solo si no está cargando)
        loadingRef.current = true;
        loadProfile({ silent: false }).finally(() => {
          loadingRef.current = false;
        });
      } else if (event === 'USER_UPDATED' && session?.user && !loadingRef.current) {
        // Solo refrescar el perfil cuando el usuario cambió (no en TOKEN_REFRESHED),
        // para evitar "refresh" al cambiar de pestaña/ventana.
        loadingRef.current = true;
        loadProfile({ silent: true }).finally(() => {
          loadingRef.current = false;
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  // Cargar perfil al montar el componente (solo una vez)
  useEffect(() => {
    // Verificar primero si hay usuario autenticado
    const checkAndLoad = async () => {
      // Evitar cargar si ya se está cargando
      if (loadingRef.current) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Si no hay usuario, limpiar perfil y no cargar
        setProfile(null);
        setLoading(false);
        setError(null);
        return;
      }

      // Si el caché fue limpiado explícitamente (null), no cargar desde caché
      if (profileCache === null) {
        // Cargar desde la base de datos
        loadingRef.current = true;
        loadProfile().finally(() => {
          loadingRef.current = false;
        });
        return;
      }

      // Optimización: Si hay caché válido, usarlo inmediatamente sin hacer fetch
      const isCacheValid = isProfileCacheValidFn();
      if (profileCache && isCacheValid) {
        // Cargar inmediatamente desde caché (no bloquea, no hace fetch)
        setProfile(profileCache);
        setLoading(false);
        setError(null);
        // NO hacer fetch en background - el caché es válido por 5 minutos
        return;
      }
      
      // Si no hay caché válido, cargar normalmente
      if (!loadingRef.current) {
        loadingRef.current = true;
        loadProfile({ silent: false }).finally(() => {
          loadingRef.current = false;
        });
      }
    };

    checkAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar, NO cuando cambie profileCache

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
  };
}

/**
 * Hook para obtener el perfil de cualquier usuario por ID
 * Útil para componentes que muestran información de otros usuarios
 * 
 * @param userId - ID del usuario a cargar
 * @example
 * const { profile, loading } = useProfileById(professionalId);
 */
export function useProfileById(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        setProfile(data);
      } catch (err) {
        console.error('Error loading profile by ID:', err);
        setError(err instanceof Error ? err : new Error('Failed to load profile'));
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  return { profile, loading, error };
}

