import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ProfessionalProfileClient } from "./profile-client";

export default async function ProfessionalProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Verificar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Obtener datos del profesional
  const { data: professionalApp, error: professionalError } = await supabase
    .from('professional_applications')
    .select('id, first_name, last_name, profile_photo, user_id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single();

  if (professionalError || !professionalApp) {
    redirect('/patient/' + user.id + '/explore');
  }

  // Obtener el username actual del perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  return (
    <ProfessionalProfileClient
      userId={user.id}
      professionalName={`${professionalApp.first_name} ${professionalApp.last_name}`}
      firstName={professionalApp.first_name}
      lastName={professionalApp.last_name}
      profilePhoto={professionalApp.profile_photo || ''}
      currentUsername={profile?.username}
    />
  );
}

