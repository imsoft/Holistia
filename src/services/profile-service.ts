import type { User } from "@supabase/supabase-js";
import type {
  Appointment,
  FavoriteCenterResponse,
  FavoriteProfessionalResponse,
  Profile,
  UserPreference,
} from "@/types/database.types";
import { createServerClientWithCookies } from "@/lib/supabaseServer";

export async function getCurrentUser(): Promise<User | null> {
  const serverClient = await createServerClientWithCookies();

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
  const serverClient = await createServerClientWithCookies();

  // Get user
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  // Get appointments
  const { data: appointments } = await serverClient
    .from("appointments")
    .select("*")
    .eq("user_id", userId);

  // Get favorite professionals
  const { data: favoriteProfessionals } = await serverClient
    .from("favorite_professionals")
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
    .eq("user_id", userId);

  // Get favorite wellness centers
  const { data: favoriteCenters } = await serverClient
    .from("favorite_wellness_centers")
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
    .eq("user_id", userId);

  // Get user preferences
  const { data: preferences } = await serverClient
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
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
          type: wellnessCenter?.type || "", // recuerda traer 'type' en tu select
          logo_url: wellnessCenter?.profile_image || null,
          location: wellnessCenter?.location || null,
          rating: wellnessCenter?.rating || null,
        },
      };
    }),

    preferences,
  };
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserPreference>
): Promise<{
  success: boolean;
  error?: string;
}> {
  const serverClient = await createServerClientWithCookies();

  const { error } = await serverClient.from("user_preferences").upsert({
    user_id: userId,
    ...data,
  });

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

export async function getUserPreferences(userId: string) {
  const serverClient = await createServerClientWithCookies();

  const { data, error } = await serverClient
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
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
  const serverClient = await createServerClientWithCookies();

  const { data, error } = await serverClient
    .from("user_preferences")
    .update(preferences)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export async function createUserProfile(profile: Profile) {
  const serverClient = await createServerClientWithCookies();

  const { data, error } = await serverClient
    .from("profiles")
    .insert(profile)
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}
