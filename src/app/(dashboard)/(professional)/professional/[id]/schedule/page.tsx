'use client';

import React, { useState } from 'react';
import { WorkingHoursConfig } from '@/components/ui/working-hours-config';
import AvailabilityBlockManager from '@/components/ui/availability-block-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, AlertCircle } from 'lucide-react';

interface SchedulePageProps {
  params: {
    id: string;
  };
}

export default function SchedulePage({ params }: SchedulePageProps) {
  const professionalId = params.id;
  const [activeTab, setActiveTab] = useState<'working-hours' | 'availability-blocks'>('working-hours');

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
            professionalId={professionalId}
            onSave={() => {
              // Aquí podrías agregar lógica adicional después de guardar
              console.log('Horarios guardados');
            }}
          />
        )}

        {activeTab === 'availability-blocks' && (
          <AvailabilityBlockManager professionalId={professionalId} />
        )}
      </div>

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
