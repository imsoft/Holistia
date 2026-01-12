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

interface UserState {
  user: UserProfile | null;
  professional: ProfessionalData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setProfessional: (professional: ProfessionalData | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      professional: null,
      isLoading: true,
      isAuthenticated: false,

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

      clearUser: () => {
        set({
          user: null,
          professional: null,
          isAuthenticated: false,
          isLoading: false,
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
