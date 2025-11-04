import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { GoogleCalendarIntegration } from '@/components/google-calendar-integration';
import { Settings as SettingsIcon, Calendar } from 'lucide-react';

export default async function ProfessionalSettingsPage({
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

  // Verificar que el usuario es un profesional aprobado
  const { data: professional, error: professionalError } = await supabase
    .from('professional_applications')
    .select('id, first_name, last_name, user_id')
    .eq('user_id', user.id)
    .eq('status', 'approved')
    .single();

  if (professionalError || !professional) {
    redirect('/patient/' + user.id + '/explore');
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b pb-4">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Configuración</h1>
            <p className="text-muted-foreground">
              Administra tus integraciones y preferencias
            </p>
          </div>
        </div>

        {/* Sección de Integraciones */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Integraciones</h2>
          </div>

          {/* Google Calendar Integration */}
          <GoogleCalendarIntegration userId={user.id} />
        </div>

        {/* Puedes agregar más secciones aquí */}
        {/* Ejemplo: Notificaciones, Preferencias de Email, etc. */}
      </div>
    </div>
  );
}
