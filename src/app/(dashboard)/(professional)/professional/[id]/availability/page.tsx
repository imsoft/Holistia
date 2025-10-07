'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { User } from 'lucide-react';
import { WorkingHoursManager } from '@/components/ui/working-hours-manager';

interface ProfessionalApplication {
  id: string;
  first_name: string;
  last_name: string;
  profession: string;
  status: string;
}

export default function AvailabilityPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [professional, setProfessional] = useState<ProfessionalApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingStartTime, setWorkingStartTime] = useState<string>("09:00");
  const [workingEndTime, setWorkingEndTime] = useState<string>("18:00");
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
    };
    getUser();
  }, [supabase, router]);

  useEffect(() => {
    const getProfessionalData = async () => {
      if (!user) return;

      try {
        const { data: professionalData, error } = await supabase
          .from('professional_applications')
          .select('*, working_start_time, working_end_time, working_days')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No professional application found
            setProfessional(null);
          } else {
            console.error('Error fetching professional data:', error);
          }
        } else {
          setProfessional(professionalData);
          setWorkingStartTime(professionalData.working_start_time || '09:00');
          setWorkingEndTime(professionalData.working_end_time || '18:00');
          setWorkingDays(professionalData.working_days || [1, 2, 3, 4, 5]);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    getProfessionalData();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">Cargando...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!professional) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Bloqueos de Disponibilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No eres un profesional registrado</h3>
              <p className="text-muted-foreground mb-6">
                Para gestionar bloqueos de disponibilidad, primero debes aplicar para ser un profesional.
              </p>
              <Button onClick={() => router.push(`/patient/${user.id}/explore/become-professional`)}>
                Convertirse en Profesional
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (professional.status !== 'approved') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Bloqueos de Disponibilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aplicación en revisión</h3>
              <p className="text-muted-foreground mb-6">
                Tu aplicación como profesional está siendo revisada. 
                Una vez aprobada, podrás gestionar tus bloqueos de disponibilidad.
              </p>
              <div className="text-sm text-muted-foreground">
                Estado actual: <span className="font-medium">{professional.status}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Horarios de Trabajo</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Configura tus días y horarios laborales
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <WorkingHoursManager
          professionalId={professional.id}
          userId={user.id}
          currentStartTime={workingStartTime}
          currentEndTime={workingEndTime}
          currentWorkingDays={workingDays}
        />
      </div>
    </div>
  );
}
