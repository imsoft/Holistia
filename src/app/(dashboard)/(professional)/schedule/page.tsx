'use client';

import React, { useState, useEffect } from 'react';
import { WorkingHoursConfig } from '@/components/ui/working-hours-config';
import AvailabilityBlockManager from '@/components/ui/availability-block-manager';
import { GoogleCalendarIntegration } from '@/components/google-calendar-integration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { useUserId } from '@/stores/user-store';
import { useUserStoreInit } from '@/hooks/use-user-store-init';
import { createClient } from '@/utils/supabase/client';

export default function SchedulePage() {
  useUserStoreInit();
  const userId = useUserId();
  const supabase = createClient();
  const [professionalAppId, setProfessionalAppId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'working-hours' | 'availability-blocks'>('working-hours');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfessionalId = async () => {
      try {
        const { data: professionalApp, error } = await supabase
          .from('professional_applications')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .single();

        if (error || !professionalApp) {
          console.error('Error obteniendo profesional:', error);
          return;
        }

        setProfessionalAppId(professionalApp.id);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfessionalId();
  }, [userId, supabase]);

  if (loading || !professionalAppId) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4 w-full max-w-4xl">
          <div className="h-12 bg-muted rounded" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestión de Horarios</h1>
        <p className="text-muted-foreground mt-2">
          Configura tus horarios de trabajo y bloqueos de disponibilidad
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'working-hours' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('working-hours')}
          className="flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Horarios de Trabajo
        </Button>
        <Button
          variant={activeTab === 'availability-blocks' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('availability-blocks')}
          className="flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Bloqueos de Disponibilidad
        </Button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'working-hours' && (
          <WorkingHoursConfig
            professionalId={professionalAppId}
            onSave={() => {
              // Aquí podrías agregar lógica adicional después de guardar
              console.log('Horarios guardados');
            }}
          />
        )}

        {activeTab === 'availability-blocks' && (
          <AvailabilityBlockManager professionalId={professionalAppId} />
        )}
      </div>

      {/* Google Calendar Integration */}
      {userId && (
        <div className="mt-8">
          <GoogleCalendarIntegration userId={userId} />
        </div>
      )}

      {/* Información adicional */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-5 h-5" />
            Cómo funciona el sistema de horarios
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700">
          <div className="space-y-3">
            <p>
              <strong>Horarios de Trabajo:</strong> Define cuándo estás disponible para recibir citas. 
              Los pacientes solo podrán agendar en estos días y horarios.
            </p>
            <p>
              <strong>Bloqueos de Disponibilidad:</strong> Bloquea días u horarios específicos cuando 
              no estés disponible, incluso si están dentro de tus horarios de trabajo.
            </p>
            <p>
              <strong>Prioridad:</strong> Los bloqueos tienen prioridad sobre los horarios de trabajo. 
              Si tienes un bloqueo en un día, no estarás disponible aunque esté en tus horarios.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
