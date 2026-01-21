import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@/types/profile';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  type: 'patient' | 'professional' | 'admin';
  avatar_url?: string | null;
  account_active: boolean;
}

interface ProfessionalData {
  professional_id?: string;
  stripe_account_id?: string | null;
  stripe_account_status?: string | null;
}

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

interface UserState {
  user: UserProfile | null;
  professional: ProfessionalData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Cache del perfil completo
  profileCache: Profile | null;
  profileCacheTimestamp: number | null;
  
  // Cache de datos del profesional
  professionalCache: ProfessionalApplicationCache | null;
  professionalCacheTimestamp: number | null;
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setProfessional: (professional: ProfessionalData | null) => void;
  setLoading: (loading: boolean) => void;
  setProfileCache: (profile: Profile | null) => void;
  setProfessionalCache: (professional: ProfessionalApplicationCache | null) => void;
  clearUser: () => void;
  clearProfileCache: () => void;
  clearProfessionalCache: () => void;
  
  // Helper para verificar si el caché es válido (menos de 5 minutos)
  isProfileCacheValid: () => boolean;
  isProfessionalCacheValid: () => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      professional: null,
      isLoading: true,
      isAuthenticated: false,
      
      // Cache del perfil completo
      profileCache: null,
      profileCacheTimestamp: null,
      
      // Cache de datos del profesional
      professionalCache: null,
      professionalCacheTimestamp: null,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        });
      },

      setProfessional: (professional) => {
        set({ professional });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },
      
      setProfileCache: (profile) => {
        set({
          profileCache: profile,
          profileCacheTimestamp: Date.now(),
        });
      },
      
      clearProfileCache: () => {
        set({
          profileCache: null,
          profileCacheTimestamp: null,
        });
      },
      
      setProfessionalCache: (professional) => {
        set({
          professionalCache: professional,
          professionalCacheTimestamp: Date.now(),
        });
      },
      
      clearProfessionalCache: () => {
        set({
          professionalCache: null,
          professionalCacheTimestamp: null,
        });
      },
      
      isProfileCacheValid: () => {
        const state = get();
        if (!state.profileCache || !state.profileCacheTimestamp) {
          return false;
        }
        // Cache válido por 5 minutos (300000 ms)
        const CACHE_DURATION = 5 * 60 * 1000;
        return Date.now() - state.profileCacheTimestamp < CACHE_DURATION;
      },
      
      isProfessionalCacheValid: () => {
        const state = get();
        if (!state.professionalCache || !state.professionalCacheTimestamp) {
          return false;
        }
        // Cache válido por 5 minutos (300000 ms)
        const CACHE_DURATION = 5 * 60 * 1000;
        return Date.now() - state.professionalCacheTimestamp < CACHE_DURATION;
      },

      clearUser: () => {
        set({
          user: null,
          professional: null,
          isAuthenticated: false,
          isLoading: false,
          profileCache: null,
          profileCacheTimestamp: null,
          professionalCache: null,
          professionalCacheTimestamp: null,
        });
      },
    }),
    {
      name: 'holistia-user-store',
      partialize: (state) => ({
        // Solo persistir datos básicos, no datos sensibles
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          first_name: state.user.first_name,
          last_name: state.user.last_name,
          type: state.user.type,
          avatar_url: state.user.avatar_url,
          account_active: state.user.account_active,
        } : null,
        professional: state.professional,
        // Persistir caché del perfil también (útil para reutilizar entre sesiones)
        profileCache: state.profileCache,
        profileCacheTimestamp: state.profileCacheTimestamp,
        // Persistir caché del profesional también
        professionalCache: state.professionalCache,
        professionalCacheTimestamp: state.professionalCacheTimestamp,
      }),
    }
  )
);

// Helper hooks para facilitar el uso
export const useUserId = () => useUserStore((state) => state.user?.id || null);
export const useUserType = () => useUserStore((state) => state.user?.type || null);
export const useIsAuthenticated = () => useUserStore((state) => state.isAuthenticated);
export const useUserProfile = () => useUserStore((state) => state.user);
export const useProfessionalData = () => useUserStore((state) => state.professional);
export const useProfileCache = () => useUserStore((state) => state.profileCache);
export const useIsProfileCacheValid = () => useUserStore((state) => state.isProfileCacheValid());
export const useProfessionalCache = () => useUserStore((state) => state.professionalCache);
export const useIsProfessionalCacheValid = () => useUserStore((state) => state.isProfessionalCacheValid());
export const useSetProfessionalCache = () => useUserStore((state) => state.setProfessionalCache);
export const useClearProfessionalCache = () => useUserStore((state) => state.clearProfessionalCache);
