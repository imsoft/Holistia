import { UserProfilePage } from '@/components/profile/user-profile-page';
import { getCurrentUser, getUserPreferences } from '@/services/profile-service';
import { supabase } from '@/lib/supabaseClient';
import {
  SupabaseFavoriteCenterResponse,
  SupabaseFavoriteProfessionalResponse,
} from '@/types/database.types';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }
  const [
    appointmentsResult,
    favoriteProfessionalsResult,
    favoriteCentersResult,
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select(
        `
        id, date, time, status,
        services:service_id(name, description, duration, price),
        professionals:professional_id(id, name, specialty, image_url),
        wellness_centers:center_id(id, name, type, logo_url)
      `
      )
      .eq('user_id', user.id)
      .order('date', { ascending: true }),

    supabase
      .from('favorite_professionals')
      .select(
        `
        user_id,
        professional_id,
        created_at,
        professionals:professional_id(id, name, specialty, image_url, location, rating)
      `
      )
      .eq('user_id', user.id),

    supabase
      .from('favorite_centers')
      .select(
        `
        user_id,
        center_id,
        created_at,
        wellness_centers:center_id(id, name, type, logo_url, location, rating)
      `
      )
      .eq('user_id', user.id),
  ]);

  //const preferences = await getUserPreferences(user.id);

  // 🔵 Transformamos citas correctamente
  const appointments = (appointmentsResult.data || []).map((appt) => ({
    id: appt.id,
    date: appt.date,
    time: appt.time,
    status: appt.status,
    services: Array.isArray(appt.services) ? appt.services[0] : appt.services,
    professionals: Array.isArray(appt.professionals)
      ? appt.professionals[0]
      : appt.professionals,
    wellness_centers: Array.isArray(appt.wellness_centers)
      ? appt.wellness_centers[0]
      : appt.wellness_centers,
  }));

  // 🔵 Directamente casteamos
  const favoriteProfessionals: SupabaseFavoriteProfessionalResponse = {
    data: (favoriteProfessionalsResult.data || []).map((fav) => ({
      user_id: fav.user_id,
      professional_id: fav.professional_id,
      created_at: fav.created_at,
      professionals: Array.isArray(fav.professionals)
        ? fav.professionals[0]
        : fav.professionals,
    })),
    error: favoriteProfessionalsResult.error || null,
  };

  const favoriteCenters: SupabaseFavoriteCenterResponse = {
    data: (favoriteCentersResult.data || []).map((fav) => ({
      user_id: fav.user_id,
      center_id: fav.center_id,
      created_at: fav.created_at,
      wellness_centers: Array.isArray(fav.wellness_centers)
        ? fav.wellness_centers[0]
        : fav.wellness_centers,
    })),
    error: favoriteCentersResult.error || null,
  };

  return (
    <UserProfilePage
      user={user}
      appointments={appointments}
      favoriteProfessionals={[favoriteProfessionals]}
      favoriteCenters={[favoriteCenters]}
     // preferences={preferences}
    />
  );
}
