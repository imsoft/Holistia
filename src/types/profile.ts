/**
 * Tipo para el perfil de usuario desde public.profiles
 * Reemplaza el uso de auth.users.user_metadata
 */
export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  username: string | null;
  type: 'admin' | 'patient' | 'professional';
  account_active: boolean;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Datos para actualizar un perfil
 */
export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  username?: string;
  type?: 'admin' | 'patient' | 'professional';
}

/**
 * Estado del hook use-profile
 */
export interface UseProfileState {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
}

