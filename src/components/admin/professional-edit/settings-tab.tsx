"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Shield, ShieldCheck, Eye, EyeOff, Ban, CreditCard, CheckCircle2, XCircle, Clock, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Professional {
  id: string;
  status: string;
  is_active: boolean;
  is_verified: boolean;
  registration_fee_paid?: boolean;
  registration_fee_amount?: number;
  registration_fee_currency?: string;
  registration_fee_paid_at?: string;
  registration_fee_expires_at?: string;
  stripe_account_id?: string;
  stripe_account_status?: string;
  stripe_onboarding_completed?: boolean;
  stripe_charges_enabled?: boolean;
  stripe_payouts_enabled?: boolean;
  stripe_connected_at?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  terms_accepted?: boolean;
  privacy_accepted?: boolean;
}

interface SettingsTabProps {
  professional: Professional;
  onUpdate: (professional: Partial<Professional>) => void;
}

export function SettingsTab({ professional, onUpdate }: SettingsTabProps) {
  const supabase = createClient();
  const [formData, setFormData] = useState(professional);
  const [reviewNotes, setReviewNotes] = useState(professional.review_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  const handleToggle = async (field: 'is_active' | 'is_verified', value: boolean) => {
    try {
      const updates = { [field]: value };

      const { error } = await supabase
        .from('professional_applications')
        .update(updates)
        .eq('id', professional.id);

      if (error) throw error;

      const updated = { ...formData, [field]: value };
      setFormData(updated);
      onUpdate(updated);

      const messages = {
        is_active: value ? 'Profesional visible en listados' : 'Profesional oculto de listados',
        is_verified: value ? 'Profesional verificado' : 'Verificación removida'
      };
      toast.success(messages[field]);
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Error al actualizar la configuración');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('professional_applications')
        .update({ status: newStatus })
        .eq('id', professional.id);

      if (error) throw error;

      const updated = { ...formData, status: newStatus };
      setFormData(updated);
      onUpdate(updated);
      toast.success('Estado actualizado exitosamente');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Estado de la Cuenta</CardTitle>
          <CardDescription>Controla el estado general del profesional en la plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="status">Estado de Aplicación</Label>
            <Select
              value={formData.status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.status === 'pending' && 'La aplicación está pendiente de revisión'}
              {formData.status === 'approved' && 'El profesional puede acceder a la plataforma'}
              {formData.status === 'rejected' && 'La aplicación fue rechazada'}
              {formData.status === 'suspended' && 'La cuenta está temporalmente suspendida'}
            </p>
          </div>

          <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Visibilidad Pública
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Controla si el profesional aparece en los listados públicos y búsquedas
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleToggle('is_active', checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <Label htmlFor="is_verified" className="cursor-pointer">
                  Profesional Verificado
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Muestra la insignia de verificación en el perfil del profesional
              </p>
            </div>
            <Switch
              id="is_verified"
              checked={formData.is_verified}
              onCheckedChange={(checked) => handleToggle('is_verified', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Status Summary */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Resumen de Estado Actual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estado de Aplicación:</span>
            <Badge
              variant={
                formData.status === 'approved'
                  ? 'default'
                  : formData.status === 'pending'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {formData.status === 'approved' && 'Aprobado'}
              {formData.status === 'pending' && 'Pendiente'}
              {formData.status === 'rejected' && 'Rechazado'}
              {formData.status === 'suspended' && 'Suspendido'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Visibilidad:</span>
            <Badge variant={formData.is_active ? 'default' : 'secondary'}>
              {formData.is_active ? 'Visible' : 'Oculto'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Verificación:</span>
            <Badge variant={formData.is_verified ? 'default' : 'secondary'}>
              {formData.is_verified ? 'Verificado' : 'No Verificado'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Registration Fee */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Pago de Inscripción</CardTitle>
          <CardDescription>Información sobre el pago de inscripción del profesional</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estado del Pago:</span>
            <Badge variant={formData.registration_fee_paid ? 'default' : 'secondary'}>
              {formData.registration_fee_paid ? (
                <><CheckCircle2 className="mr-1 h-3 w-3" /> Pagado</>
              ) : (
                <><XCircle className="mr-1 h-3 w-3" /> Pendiente</>
              )}
            </Badge>
          </div>
          {formData.registration_fee_paid && formData.registration_fee_amount && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Monto:</span>
                <span className="text-sm">
                  ${formData.registration_fee_amount} {formData.registration_fee_currency?.toUpperCase() || 'MXN'}
                </span>
              </div>
              {formData.registration_fee_paid_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fecha de Pago:</span>
                  <span className="text-sm">
                    {new Date(formData.registration_fee_paid_at).toLocaleDateString('es-MX')}
                  </span>
                </div>
              )}
              {formData.registration_fee_expires_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Expira:</span>
                  <span className="text-sm">
                    {new Date(formData.registration_fee_expires_at).toLocaleDateString('es-MX')}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Stripe Connect */}
      {formData.stripe_account_id && (
        <Card className="py-4">
          <CardHeader>
            <CardTitle>Stripe Connect</CardTitle>
            <CardDescription>Estado de la integración con Stripe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estado:</span>
              <Badge variant={
                formData.stripe_account_status === 'connected' ? 'default' :
                formData.stripe_account_status === 'pending' ? 'secondary' : 'destructive'
              }>
                {formData.stripe_account_status === 'connected' && 'Conectado'}
                {formData.stripe_account_status === 'pending' && 'Pendiente'}
                {formData.stripe_account_status === 'not_connected' && 'No Conectado'}
                {formData.stripe_account_status === 'restricted' && 'Restringido'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account ID:</span>
              <span className="text-xs font-mono text-muted-foreground">
                {formData.stripe_account_id}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Onboarding:</span>
              <Badge variant={formData.stripe_onboarding_completed ? 'default' : 'secondary'}>
                {formData.stripe_onboarding_completed ? 'Completado' : 'Pendiente'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Puede Recibir Pagos:</span>
              <Badge variant={formData.stripe_charges_enabled ? 'default' : 'secondary'}>
                {formData.stripe_charges_enabled ? 'Sí' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Puede Recibir Transferencias:</span>
              <Badge variant={formData.stripe_payouts_enabled ? 'default' : 'secondary'}>
                {formData.stripe_payouts_enabled ? 'Sí' : 'No'}
              </Badge>
            </div>
            {formData.stripe_connected_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Conectado el:</span>
                <span className="text-sm">
                  {new Date(formData.stripe_connected_at).toLocaleDateString('es-MX')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review Information */}
      <Card className="py-4">
        <CardHeader>
          <CardTitle>Información de Revisión</CardTitle>
          <CardDescription>Detalles sobre la revisión de la aplicación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.submitted_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enviado el:</span>
              <span className="text-sm">
                {new Date(formData.submitted_at).toLocaleDateString('es-MX')}
              </span>
            </div>
          )}
          {formData.reviewed_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Revisado el:</span>
              <span className="text-sm">
                {new Date(formData.reviewed_at).toLocaleDateString('es-MX')}
              </span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="review_notes">Notas de Revisión</Label>
            <Textarea
              id="review_notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Agregar o editar notas sobre la revisión del profesional..."
              rows={4}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  setSavingNotes(true);
                  const { error } = await supabase
                    .from('professional_applications')
                    .update({ review_notes: reviewNotes })
                    .eq('id', professional.id);

                  if (error) throw error;

                  const updated = { ...formData, review_notes: reviewNotes };
                  setFormData(updated);
                  onUpdate(updated);
                  toast.success('Notas de revisión guardadas');
                } catch (error) {
                  console.error('Error saving review notes:', error);
                  toast.error('Error al guardar las notas');
                } finally {
                  setSavingNotes(false);
                }
              }}
              disabled={savingNotes}
            >
              {savingNotes ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Notas
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Términos Aceptados:</span>
            <Badge variant={formData.terms_accepted ? 'default' : 'secondary'}>
              {formData.terms_accepted ? 'Sí' : 'No'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Privacidad Aceptada:</span>
            <Badge variant={formData.privacy_accepted ? 'default' : 'secondary'}>
              {formData.privacy_accepted ? 'Sí' : 'No'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive py-4">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
          <CardDescription>Acciones irreversibles o de alto impacto</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full" disabled>
            <Ban className="mr-2 h-4 w-4" />
            Eliminar Cuenta Permanentemente
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Esta funcionalidad requiere confirmación adicional
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
