'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { syncAllAppointmentsToGoogleCalendar } from '@/actions/google-calendar';
import { syncAllEventsToGoogleCalendar } from '@/actions/google-calendar/events';
import {
  syncGoogleCalendarEvents,
  subscribeToCalendarNotifications,
  unsubscribeFromCalendarNotifications,
} from '@/actions/google-calendar/sync';

interface GoogleCalendarStatus {
  connected: boolean;
  tokenExpired?: boolean;
  hasAccess?: boolean;
  expiresAt?: string;
}

export function GoogleCalendarIntegration({ userId }: { userId: string }) {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncingFromGoogle, setSyncingFromGoogle] = useState(false);

  // Cargar el estado inicial
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/google-calendar/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
      toast.error('Error al verificar el estado de Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await fetch('/api/google-calendar/auth');
      const data = await response.json();

      if (data.success && data.authUrl) {
        // Redirigir a la página de autorización de Google
        window.location.href = data.authUrl;
      } else {
        toast.error('Error al generar URL de autorización');
      }
    } catch (error) {
      console.error('Error connecting:', error);
      toast.error('Error al conectar con Google Calendar');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        '¿Estás seguro de que deseas desconectar tu cuenta de Google Calendar? Esto eliminará la sincronización automática de tus eventos.'
      )
    ) {
      return;
    }

    setDisconnecting(true);
    try {
      const response = await fetch('/api/google-calendar/disconnect', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details || data.error || 'Error desconocido';
        console.error('Error al desconectar:', errorMessage);
        toast.error(`Error al desconectar Google Calendar: ${errorMessage}`);
        return;
      }

      if (data.success) {
        toast.success('Google Calendar desconectado exitosamente');
        setStatus({ connected: false });
        // Recargar el estado después de desconectar
        fetchStatus();
      } else {
        const errorMessage = data.details || data.error || 'Error desconocido';
        toast.error(`Error al desconectar Google Calendar: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Error al desconectar');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Sincronizar citas
      const appointmentsResult =
        await syncAllAppointmentsToGoogleCalendar(userId);

      // Sincronizar eventos
      const eventsResult = await syncAllEventsToGoogleCalendar(userId);

      const appointmentsSynced = appointmentsResult.syncedCount || 0;
      const eventsSynced = eventsResult.syncedCount || 0;
      const totalSynced = appointmentsSynced + eventsSynced;

      // Construir mensajes de error específicos
      const errors: string[] = [];
      if (!appointmentsResult.success) {
        const errorMsg = 'error' in appointmentsResult ? appointmentsResult.error : 'Error desconocido al sincronizar citas';
        errors.push(`Citas: ${errorMsg}`);
      }
      if (!eventsResult.success) {
        const errorMsg = 'error' in eventsResult ? eventsResult.error : 'Error desconocido al sincronizar eventos';
        errors.push(`Eventos: ${errorMsg}`);
      }

      // Mostrar resultados
      if (totalSynced > 0) {
        if (errors.length > 0) {
          // Algunas se sincronizaron pero hubo errores
          toast.success(
            `Se sincronizaron ${totalSynced} eventos con Google Calendar`,
            {
              description: errors.join('. '),
              duration: 5000,
            }
          );
        } else {
          // Todo salió bien
          toast.success(
            `Se sincronizaron ${totalSynced} eventos con Google Calendar`
          );
        }
      } else {
        if (errors.length > 0) {
          // Hubo errores y no se sincronizó nada
          toast.error('Error al sincronizar eventos', {
            description: errors.join('. '),
            duration: 5000,
          });
        } else {
          // No hay nada para sincronizar
          toast.info('No hay eventos nuevos para sincronizar');
        }
      }
    } catch (error) {
      console.error('Error syncing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al sincronizar eventos', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncFromGoogle = async () => {
    setSyncingFromGoogle(true);
    try {
      // Sincronizar eventos desde Google Calendar a Holistia (crear bloques)
      const result = await syncGoogleCalendarEvents(userId);

      if (result.success) {
        const created = result.created || 0;
        const deleted = result.deleted || 0;

        if (created > 0 || deleted > 0) {
          toast.success(
            `Sincronización completada`,
            {
              description: `${created} eventos bloqueados, ${deleted} eventos eliminados`,
              duration: 5000,
            }
          );
        } else {
          toast.info('No hay eventos nuevos en Google Calendar para sincronizar');
        }

        // Activar suscripción automática si no está activa
        await subscribeToCalendarNotifications(userId);
      } else {
        const errorMsg = 'error' in result ? result.error : 'Error desconocido';
        toast.error('Error al sincronizar desde Google Calendar', {
          description: errorMsg,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error syncing from Google:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al sincronizar desde Google Calendar', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setSyncingFromGoogle(false);
    }
  };

  if (loading) {
    return (
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Integración con Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Integración con Google Calendar
        </CardTitle>
        <CardDescription>
          Sincroniza automáticamente tus citas y eventos con Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de conexión */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {status?.connected ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Conectado</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-muted-foreground">
                    No conectado
                  </span>
                </>
              )}
            </div>
            {status?.connected && status?.expiresAt && (
              <p className="text-sm text-muted-foreground mt-1">
                Token expira:{' '}
                {new Date(status.expiresAt).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>

        {/* Alertas */}
        {status?.connected && status?.tokenExpired && (
          <Alert variant="destructive">
            <AlertDescription>
              Tu token de acceso ha expirado. Por favor, reconecta tu cuenta de
              Google Calendar.
            </AlertDescription>
          </Alert>
        )}

        {status?.connected && !status?.hasAccess && (
          <Alert>
            <AlertDescription>
              No se pudo verificar el acceso a Google Calendar. Intenta
              sincronizar tus eventos.
            </AlertDescription>
          </Alert>
        )}

        {/* Información */}
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <h4 className="font-medium text-sm">¿Qué se sincroniza?</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Holistia → Google: Tus citas y eventos se crean en Google Calendar</li>
            <li>Google → Holistia: Eventos externos se bloquean en tu disponibilidad</li>
            <li>Actualizaciones automáticas cuando cambies una cita</li>
            <li>Eliminación cuando canceles una cita o evento</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {!status?.connected ? (
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full"
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Conectar Google Calendar
              </>
            )}
          </Button>
        ) : (
          <>
            <div className="flex gap-2 w-full">
              <Button
                onClick={handleSync}
                disabled={syncing || status?.tokenExpired}
                variant="default"
                className="flex-1"
              >
                {syncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Enviar a Google
                  </>
                )}
              </Button>
              <Button
                onClick={handleSyncFromGoogle}
                disabled={syncingFromGoogle || status?.tokenExpired}
                variant="secondary"
                className="flex-1"
              >
                {syncingFromGoogle ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Importar de Google
                  </>
                )}
              </Button>
            </div>
            <Button
              onClick={handleDisconnect}
              disabled={disconnecting}
              variant="outline"
              className="w-full"
            >
              {disconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desconectando...
                </>
              ) : (
                'Desconectar'
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
