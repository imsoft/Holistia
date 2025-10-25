import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Profile, ProfileUpdate } from '@/types/profile';

/**
 * Hook para manejar el perfil de usuario desde public.profiles
 * Reemplaza el uso de auth.users.user_metadata
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
  const supabase = createClient();

  /**
   * Cargar perfil del usuario autenticado
   */
  const loadProfile = async () => {
    try {
      setLoading(true);
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
        } else {
          throw profileError;
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to load profile'));
      setProfile(null);
    } finally {
      setLoading(false);
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
      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      return null;
    }
  };

  /**
   * Refrescar perfil manualmente
   */
  const refreshProfile = () => {
    loadProfile();
  };

  // Cargar perfil al montar el componente
  useEffect(() => {
    loadProfile();
  }, []);

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

