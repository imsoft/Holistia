'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarDays, Clock, Edit, LayoutList, Trash2, Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { formatDate } from '@/lib/date-utils';
import type { AvailabilityBlock } from '@/types/availability';
import { deleteBlockFromGoogleCalendar, syncAllBlocksToGoogleCalendar } from '@/actions/google-calendar';
import { syncGoogleCalendarEvents } from '@/actions/google-calendar/sync';
import { BlocksWeekCalendar } from '@/components/ui/blocks-week-calendar';

interface BlocksCalendarViewProps {
  professionalId: string;
  userId?: string;
  onEditBlock?: (block: AvailabilityBlock) => void;
  onDeleteBlock?: (blockId: string) => void;
  onCreateBlock?: () => void;
}

export function BlocksCalendarView({
  professionalId,
  userId,
  onEditBlock,
  onDeleteBlock,
  onCreateBlock
}: BlocksCalendarViewProps) {
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [workingHours, setWorkingHours] = useState({ startTime: '09:00', endTime: '18:00', days: [1, 2, 3, 4, 5] });
  const didAutoSyncRef = useRef(false);

  // Cargar bloqueos
  const fetchBlocks = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('availability_blocks')
        .select('*')
        .eq('professional_id', professionalId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      toast.error('Error al cargar los bloqueos');
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // Cargar horarios de trabajo del profesional para la vista calendario
  useEffect(() => {
    const fetchWorkingHours = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('professional_applications')
          .select('working_start_time, working_end_time, working_days')
          .eq('id', professionalId)
          .single();

        if (!error && data) {
          setWorkingHours({
            startTime: data.working_start_time || '09:00',
            endTime: data.working_end_time || '18:00',
            days: data.working_days || [1, 2, 3, 4, 5],
          });
        }
      } catch {
        // Usar defaults
      }
    };
    fetchWorkingHours();
  }, [professionalId]);

  // Auto-import suave: traer eventos de Google al abrir /availability (una vez por montaje)
  useEffect(() => {
    if (!userId) return;
    if (didAutoSyncRef.current) return;
    didAutoSyncRef.current = true;

    syncGoogleCalendarEvents(userId)
      .then((result) => {
        if (result.success) {
          fetchBlocks();
        }
      })
      .catch((err) => {
        console.warn('⚠️ No se pudo importar desde Google Calendar:', err);
      });
  }, [userId, fetchBlocks]);

  // Listener para recargar cuando se cree/actualice un bloqueo
  useEffect(() => {
    const handleReload = () => {
      fetchBlocks();
    };

    window.addEventListener('reload-calendar', handleReload);
    return () => window.removeEventListener('reload-calendar', handleReload);
  }, [fetchBlocks]);

  // Sincronización bidireccional: importar desde Google y luego enviar bloqueos a Google
  const handleSyncWithGoogle = async () => {
    if (!userId) {
      toast.error('No se pudo identificar el usuario');
      return;
    }

    setSyncing(true);
    try {
      const importResult = await syncGoogleCalendarEvents(userId);
      if (importResult.success) {
        fetchBlocks();
      }

      const syncResult = await syncAllBlocksToGoogleCalendar(userId);
      if (syncResult.success) {
        if (syncResult.syncedCount && syncResult.syncedCount > 0) {
          toast.success(`Sincronizado con Google Calendar (${syncResult.syncedCount} bloqueo(s) enviados)`);
          fetchBlocks();
        } else if (importResult.success) {
          toast.success(importResult.message || 'Sincronización con Google completada');
        } else {
          toast.info('No hay cambios pendientes de sincronizar');
        }
      } else {
        const errorMsg = 'error' in syncResult ? syncResult.error : 'Error desconocido';
        toast.error(`Error al sincronizar: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error syncing with Google:', error);
      toast.error('Error al sincronizar con Google Calendar');
    } finally {
      setSyncing(false);
    }
  };

  // Eliminar bloqueo
  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este bloqueo?')) {
      return;
    }

    try {
      const supabase = createClient();

      // Intentar sincronizar eliminación con Google Calendar (si tiene userId)
      if (userId) {
        deleteBlockFromGoogleCalendar(blockId, userId)
          .then((result) => {
            if (result.success) {
              console.log('Bloqueo eliminado de Google Calendar');
            } else {
              const errorMsg = 'error' in result ? result.error : ('message' in result ? result.message : 'Error desconocido');
              console.warn('No se pudo eliminar de Google Calendar:', errorMsg);
            }
          })
          .catch((err) => {
            console.error('Error al eliminar de Google Calendar:', err);
          });
      }

      // Eliminar de la base de datos
      const { error } = await supabase
        .from('availability_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast.success('Bloqueo eliminado correctamente');

      // Emitir evento para recargar el calendario
      window.dispatchEvent(new Event('reload-calendar'));

      fetchBlocks();
      onDeleteBlock?.(blockId);
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Error al eliminar el bloqueo');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 py-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 inline-block h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Blocks List */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle>Todos los Bloqueos</CardTitle>
              <div className="flex items-center border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon-xs"
                  onClick={() => setViewMode('list')}
                  title="Vista lista"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="icon-xs"
                  onClick={() => setViewMode('calendar')}
                  title="Vista calendario"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {userId && (
                <Button
                  variant="outline"
                  onClick={handleSyncWithGoogle}
                  disabled={syncing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar con Google'}
                </Button>
              )}
              <Button onClick={onCreateBlock}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Bloqueo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          {blocks.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay bloqueos configurados</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer bloqueo para días u horarios cuando no estés disponible
              </p>
              <Button onClick={onCreateBlock}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Bloqueo
              </Button>
            </div>
          ) : viewMode === 'calendar' ? (
            <BlocksWeekCalendar
              blocks={blocks}
              workingStartTime={workingHours.startTime}
              workingEndTime={workingHours.endTime}
              workingDays={workingHours.days}
              onClickBlock={(block) => onEditBlock?.(block)}
            />
          ) : (
            <div className="space-y-4">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-4 py-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      (block.block_type === 'full_day' || block.block_type === 'weekly_day')
                        ? "bg-red-100 text-red-600"
                        : "bg-orange-100 text-orange-600"
                    )}>
                      {(block.block_type === 'full_day' || block.block_type === 'weekly_day') ? (
                        <Calendar className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium">{block.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {block.block_type === 'weekly_day' && block.day_of_week ? (
                          <span>
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][block.day_of_week - 1]}
                          </span>
                        ) : (
                          <span>
                            {formatDate(block.start_date)}
                            {block.end_date && block.end_date !== block.start_date &&
                              ` - ${formatDate(block.end_date)}`}
                          </span>
                        )}
                        {(block.block_type === 'time_range' || block.block_type === 'weekly_range') && block.start_time && block.end_time && (
                          <span>{block.start_time} - {block.end_time}</span>
                        )}
                        {block.is_recurring && (
                          <Badge variant="secondary" className="text-xs">
                            Recurrente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditBlock?.(block)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteBlock(block.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
