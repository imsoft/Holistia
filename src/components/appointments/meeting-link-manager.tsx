'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Video, Edit, Copy, Check, ExternalLink } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface MeetingLinkManagerProps {
  appointmentId: string;
  appointmentType: string;
  meetingLink?: string | null;
  patientEmail: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  onLinkUpdated?: (newLink: string) => void;
  viewMode?: 'professional' | 'patient';
}

export function MeetingLinkManager({
  appointmentId,
  appointmentType,
  meetingLink,
  patientEmail,
  patientName,
  appointmentDate,
  appointmentTime,
  onLinkUpdated,
  viewMode = 'professional',
}: MeetingLinkManagerProps) {
  const supabase = createClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [linkValue, setLinkValue] = useState(meetingLink || '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Solo mostrar para citas online
  if (appointmentType !== 'online' && appointmentType !== 'Online') {
    return null;
  }

  const handleSaveLink = async () => {
    if (!linkValue.trim()) {
      toast.error('Por favor ingresa un enlace válido');
      return;
    }

    // Validar que sea una URL válida
    try {
      new URL(linkValue);
    } catch {
      toast.error('Por favor ingresa una URL válida');
      return;
    }

    setSaving(true);

    try {
      // Actualizar el enlace en la base de datos
      const { error } = await supabase
        .from('appointments')
        .update({ meeting_link: linkValue })
        .eq('id', appointmentId);

      if (error) throw error;

      // Enviar email al paciente con el enlace
      const response = await fetch('/api/appointments/send-meeting-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          patientEmail,
          patientName,
          meetingLink: linkValue,
          appointmentDate,
          appointmentTime,
        }),
      });

      if (!response.ok) {
        console.error('Error enviando email, pero el enlace se guardó');
      }

      toast.success('Enlace guardado y enviado por email al paciente');
      setIsEditDialogOpen(false);
      onLinkUpdated?.(linkValue);
    } catch (error) {
      console.error('Error guardando enlace:', error);
      toast.error('Error al guardar el enlace');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    if (meetingLink) {
      navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Vista para el profesional
  if (viewMode === 'professional') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <Video className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              Enlace de Reunión Virtual
            </h4>
            {meetingLink ? (
              <div className="space-y-2">
                <a
                  href={meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 break-all"
                >
                  {meetingLink}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="text-xs h-7"
                  >
                    {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(true)}
                    className="text-xs h-7"
                    aria-label="Editar enlace de reunión"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-blue-700">
                  No has agregado un enlace de reunión aún. Agrégalo para que el paciente pueda unirse.
                </p>
                <Button
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="text-xs h-7"
                >
                  <Video className="h-3 w-3 mr-1" />
                  Agregar Enlace
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Dialog para editar/agregar enlace */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {meetingLink ? 'Editar' : 'Agregar'} Enlace de Reunión
              </DialogTitle>
              <DialogDescription>
                Ingresa el enlace de Zoom, Google Meet, Teams u otra plataforma.
                Se enviará automáticamente por email al paciente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meeting-link">Enlace de reunión</Label>
                <Input
                  id="meeting-link"
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Asegúrate de que el enlace sea válido y funcional
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveLink} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar y Enviar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Vista para el paciente
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
      <div className="flex items-start gap-2">
        <Video className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">
            Reunión Virtual
          </h4>
          {meetingLink ? (
            <div className="space-y-2">
              <p className="text-xs text-blue-700">
                Tu cita es virtual. Únete a la reunión usando el siguiente enlace:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  asChild
                  size="sm"
                  className="flex-1"
                >
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Video className="h-3 w-3 mr-1" />
                    Unirse a la Reunión
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                >
                  {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copied ? 'Copiado' : 'Copiar Enlace'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-blue-700">
              El profesional aún no ha compartido el enlace de la reunión.
              Te llegará un email cuando lo agregue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
