# Ejemplos de Uso - Google Calendar Integration

Este documento muestra ejemplos prácticos de cómo usar la integración de Google Calendar en Holistia.

---

## 1. Agregar el Componente a la Página de Settings

### Ubicación sugerida
`src/app/(dashboard)/professional/settings/page.tsx`

```tsx
import { GoogleCalendarIntegration } from '@/components/google-calendar-integration';
import { createServerClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfessionalSettingsPage() {
  const supabase = await createServerClient();

  // Verificar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Configuración</h1>

      {/* Otros componentes de configuración */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Perfil</h2>
        {/* Configuración de perfil */}
      </section>

      {/* Google Calendar Integration */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Integraciones</h2>
        <GoogleCalendarIntegration userId={user.id} />
      </section>

      {/* Otras secciones */}
    </div>
  );
}
```

---

## 2. Usar Server Actions Directamente

### Crear evento manualmente

```tsx
'use client';

import { useState } from 'react';
import { createAppointmentInGoogleCalendar } from '@/actions/google-calendar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ManualSyncButton({
  appointmentId,
  userId
}: {
  appointmentId: string;
  userId: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await createAppointmentInGoogleCalendar(
        appointmentId,
        userId
      );

      if (result.success) {
        toast.success('Evento creado en Google Calendar');
      } else {
        toast.error(result.error || 'Error al crear evento');
      }
    } catch (error) {
      toast.error('Error al sincronizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSync} disabled={loading}>
      {loading ? 'Sincronizando...' : 'Sincronizar con Google Calendar'}
    </Button>
  );
}
```

---

## 3. Verificar Estado de Conexión

### Mostrar badge de estado

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';

export function GoogleCalendarStatusBadge() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/google-calendar/status');
        const data = await response.json();
        setConnected(data.connected && data.hasAccess);
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (loading) {
    return <Badge variant="outline">Verificando...</Badge>;
  }

  if (connected) {
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Google Calendar conectado
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <XCircle className="h-3 w-3" />
      No conectado
    </Badge>
  );
}
```

---

## 4. Sincronización Automática en Formulario de Cita

### Ejemplo con checkbox opcional

```tsx
'use client';

import { useState } from 'react';
import { createAppointmentInGoogleCalendar } from '@/actions/google-calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export function AppointmentForm({ userId }: { userId: string }) {
  const [syncToGoogle, setSyncToGoogle] = useState(true);

  const handleSubmit = async (appointmentId: string) => {
    // Crear la cita primero...

    // Si el checkbox está marcado, sincronizar
    if (syncToGoogle) {
      try {
        await createAppointmentInGoogleCalendar(appointmentId, userId);
        console.log('Sincronizado con Google Calendar');
      } catch (error) {
        console.error('Error al sincronizar:', error);
        // No fallar el proceso principal
      }
    }
  };

  return (
    <form>
      {/* Campos del formulario */}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="sync-google"
          checked={syncToGoogle}
          onCheckedChange={(checked) => setSyncToGoogle(checked as boolean)}
        />
        <Label htmlFor="sync-google">
          Sincronizar con Google Calendar
        </Label>
      </div>

      {/* Botón submit */}
    </form>
  );
}
```

---

## 5. Dashboard con Eventos de Google Calendar

### Mostrar próximos eventos

```tsx
'use client';

import { useEffect, useState } from 'react';
import { listUserGoogleCalendarEvents } from '@/actions/google-calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function GoogleCalendarEventsList({ userId }: { userId: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const result = await listUserGoogleCalendarEvents(userId);
        if (result.success) {
          setEvents(result.events || []);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [userId]);

  if (loading) {
    return <div>Cargando eventos...</div>;
  }

  if (events.length === 0) {
    return <div>No hay eventos próximos</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Próximos Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="border-l-4 border-blue-500 pl-4 py-2"
            >
              <h3 className="font-medium">{event.summary}</h3>
              {event.start?.dateTime && (
                <p className="text-sm text-muted-foreground">
                  {format(
                    new Date(event.start.dateTime),
                    "EEEE, d 'de' MMMM 'a las' HH:mm",
                    { locale: es }
                  )}
                </p>
              )}
              {event.location && (
                <p className="text-sm text-muted-foreground">
                  📍 {event.location}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 6. Notificación de Conexión Requerida

### Mostrar alerta si no está conectado

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function GoogleCalendarRequiredAlert({
  userConnected
}: {
  userConnected: boolean
}) {
  if (userConnected) {
    return null;
  }

  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Google Calendar no conectado</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>
          Conecta tu cuenta de Google Calendar para sincronizar automáticamente
          tus citas y eventos.
        </p>
        <Button asChild size="sm" variant="default">
          <Link href="/dashboard/professional/settings">
            <Calendar className="mr-2 h-4 w-4" />
            Conectar ahora
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

---

## 7. Hook Personalizado para Estado de Conexión

### Custom hook reutilizable

```tsx
// src/hooks/use-google-calendar.ts
'use client';

import { useEffect, useState } from 'react';

interface GoogleCalendarStatus {
  connected: boolean;
  tokenExpired?: boolean;
  hasAccess?: boolean;
  expiresAt?: string;
  loading: boolean;
}

export function useGoogleCalendar() {
  const [status, setStatus] = useState<GoogleCalendarStatus>({
    connected: false,
    loading: true,
  });

  const fetchStatus = async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch('/api/google-calendar/status');
      const data = await response.json();
      setStatus({
        ...data,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching Google Calendar status:', error);
      setStatus({
        connected: false,
        loading: false,
      });
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    ...status,
    refetch: fetchStatus,
  };
}

// Uso:
// const { connected, loading, refetch } = useGoogleCalendar();
```

---

## 8. Página Completa de Settings del Profesional

### Ejemplo completo con tabs

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GoogleCalendarIntegration } from '@/components/google-calendar-integration';
import { createServerClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfessionalSettingsPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Configuración</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {/* Configuración de perfil */}
        </TabsContent>

        <TabsContent value="availability">
          {/* Configuración de disponibilidad */}
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Google Calendar</h2>
            <GoogleCalendarIntegration userId={user.id} />
          </div>

          {/* Otras integraciones futuras */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Zoom</h2>
            <p className="text-muted-foreground">Próximamente...</p>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          {/* Configuración de notificaciones */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 9. Sincronización Batch de Eventos

### Sincronizar todos los eventos de un profesional

```tsx
'use client';

import { useState } from 'react';
import {
  syncAllAppointmentsToGoogleCalendar,
  syncAllEventsToGoogleCalendar
} from '@/actions/google-calendar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export function BatchSyncButton({ userId }: { userId: string }) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Sincronizar citas
      const appointmentsResult = await syncAllAppointmentsToGoogleCalendar(userId);

      // Sincronizar eventos/talleres
      const eventsResult = await syncAllEventsToGoogleCalendar(userId);

      const totalSynced =
        (appointmentsResult.syncedCount || 0) +
        (eventsResult.syncedCount || 0);

      if (totalSynced > 0) {
        toast.success(
          `Se sincronizaron ${totalSynced} eventos con Google Calendar`
        );
      } else {
        toast.info('No hay eventos nuevos para sincronizar');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Error al sincronizar eventos');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={syncing}
      variant="outline"
      className="w-full"
    >
      {syncing ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Sincronizando...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sincronizar Todo
        </>
      )}
    </Button>
  );
}
```

---

## 10. Middleware para Verificar Conexión

### Verificar antes de operaciones críticas

```tsx
// src/lib/google-calendar-middleware.ts
import { createServerClient } from '@/utils/supabase/server';

export async function requireGoogleCalendar(userId: string): Promise<boolean> {
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('google_calendar_connected')
    .eq('id', userId)
    .single();

  return profile?.google_calendar_connected || false;
}

// Uso en una API route:
export async function POST(request: Request) {
  const { userId } = await request.json();

  const hasGoogleCalendar = await requireGoogleCalendar(userId);

  if (!hasGoogleCalendar) {
    return NextResponse.json(
      { error: 'Google Calendar no está conectado' },
      { status: 400 }
    );
  }

  // Continuar con la operación...
}
```

---

## Notas Finales

- Todos estos ejemplos son **opcionales** y pueden adaptarse según tus necesidades
- La sincronización automática ya está integrada en las rutas de citas
- El componente `GoogleCalendarIntegration` es plug-and-play
- Puedes personalizar los estilos usando Tailwind CSS

Para más información, consulta:
- `docs/GOOGLE_CALENDAR_SETUP.md` - Guía de configuración
- `docs/GOOGLE_CALENDAR_SUMMARY.md` - Resumen completo
- `src/lib/google-calendar.ts` - Código fuente de utilidades
