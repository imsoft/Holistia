'use server';
import type { User } from '@supabase/supabase-js';
import type {
  Appointment,
  FavoriteCenterResponse,
  FavoriteProfessionalResponse,
  Profile,
  // Profile,
  UserPreference,
} from '@/types/database.types';
import { createClient } from '@/lib/supabaseServer';
import { supabase } from '@/lib/supabaseClient';

export async function getCurrentUser(): Promise<User | null> {
  const serverClient = await createClient();

  const {
    data: { user },
  } = await serverClient.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string): Promise<{
  user: User | null;
  appointments: Partial<Appointment>[];
  favoriteProfessionals: Partial<FavoriteProfessionalResponse>[];
  favoriteCenters: Partial<FavoriteCenterResponse>[];
  preferences: Partial<UserPreference> | null;
}> {
  const serverClient = await createClient();

  // Get user
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  // Get appointments
  const { data: appointments } = await serverClient
    .from('appointments')
    .select('*')
    .eq('user_id', userId);

  // Get favorite professionals
  const { data: favoriteProfessionals } = await serverClient
    .from('favorite_professionals')
    .select(
      `
      id,
      user_id,
      professional_id,
      created_at,
      professionals (
        id,
        name,
        specialty,
        bio,
        profile_image,
        location,
        rating
      )
    `
    )
    .eq('user_id', userId);

  // Get favorite wellness centers
  const { data: favoriteCenters } = await serverClient
    .from('favorite_wellness_centers')
    .select(
      `
    id,
    user_id,
    wellness_center_id,
    created_at,
    wellness_centers (
      id,
      name,
      type,
      description,
      location,
      services,
      profile_image,
      rating
    )
  `
    )
    .eq('user_id', userId);

  // Get user preferences
  const { data: preferences } = await serverClient
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  return {
    user,
    appointments: appointments || [],
    favoriteProfessionals: (favoriteProfessionals || []).map((fp) => {
      const professional = Array.isArray(fp.professionals)
        ? fp.professionals[0]
        : fp.professionals;

      return {
        user_id: fp.user_id,
        professional_id: fp.professional_id,
        created_at: fp.created_at,
        professionals: {
          id: professional?.id,
          name: professional?.name,
          specialty: professional?.specialty,
          image_url: professional?.profile_image || null,
          location: professional?.location || null,
          rating: professional?.rating || null,
        },
      };
    }),

    favoriteCenters: (favoriteCenters || []).map((fc) => {
      const wellnessCenter = Array.isArray(fc.wellness_centers)
        ? fc.wellness_centers[0]
        : fc.wellness_centers;

      return {
        user_id: fc.user_id,
        center_id: fc.wellness_center_id,
        created_at: fc.created_at,
        wellness_centers: {
          id: wellnessCenter?.id,
          name: wellnessCenter?.name,
          type: wellnessCenter?.type || '', // recuerda traer 'type' en tu select
          logo_url: wellnessCenter?.profile_image || null,
          location: wellnessCenter?.location || null,
          rating: wellnessCenter?.rating || null,
        },
      };
    }),

    preferences,
  };
}

export async function getUserPreferences(userId: string) {
  const serverClient = await createClient();

  const { data, error } = await serverClient
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreference>
) {
  const serverClient = await createClient();

  const { data, error } = await serverClient
    .from('user_preferences')
    .update(preferences)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}
export async function updateUserProfile(
  userId: string,
  data: Partial<Profile>
): Promise<{
  success: boolean;
  error?: string;
}> {
  const serverClient = await createClient();

  const { error } = await serverClient.from('profile').upsert(
    {
      user_id: userId,
      ...data,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
  };
}

type ActionResult = {
  success: boolean;
  message?: string;
};

export async function createUserProfile(
  profile: Profile
): Promise<ActionResult> {
  const serverClient = await createClient();
  const { error } = await serverClient
    .from('profile')
    .insert({
      user_id: profile.user_id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      phone: profile.phone,
      location: profile.location,
      bio: profile.bio,
      cover_image: profile.cover_image,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    })
    .select()
    .single();

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }
  return {
    success: true,
    message: 'Perfil creado correctamente',
  };
}

export async function getProfileHeader(
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profile')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}
