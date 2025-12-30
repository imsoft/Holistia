"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ExternalLink, CheckCircle, AlertCircle, Clock, Unplug } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StripeConnectButtonProps {
  professionalId: string;
  initialStatus?: {
    stripe_account_id: string | null;
    stripe_account_status: string | null;
    stripe_charges_enabled: boolean | null;
    stripe_payouts_enabled: boolean | null;
  };
}

export function StripeConnectButton({ professionalId, initialStatus }: StripeConnectButtonProps) {
  const [loading, setLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState(initialStatus);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const checkAccountStatus = useCallback(async () => {
    try {
      setCheckingStatus(true);
      const response = await fetch('/api/stripe/connect/account-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professional_id: professionalId }),
      });

      const data = await response.json();

      if (response.ok && data.connected) {
        setAccountStatus({
          stripe_account_id: data.accountId,
          stripe_account_status: data.charges_enabled && data.payouts_enabled ? 'connected' : 'pending',
          stripe_charges_enabled: data.charges_enabled,
          stripe_payouts_enabled: data.payouts_enabled,
        });
      }
    } catch (error) {
      console.error('Error checking account status:', error);
    } finally {
      setCheckingStatus(false);
    }
  }, [professionalId]);

  // Check account status on mount if already connected
  useEffect(() => {
    if (accountStatus?.stripe_account_id) {
      checkAccountStatus();
    }
  }, [accountStatus?.stripe_account_id, checkAccountStatus]);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/connect/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional_id: professionalId,
          entity_type: 'professional',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to Stripe onboarding
        window.location.href = data.onboardingUrl;
      } else {
        toast.error(data.error || 'Error al conectar con Stripe');
      }
    } catch (error) {
      console.error('Error connecting to Stripe:', error);
      toast.error('Error al conectar con Stripe');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/connect/dashboard-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professional_id: professionalId }),
      });

      const data = await response.json();

      if (response.ok) {
        window.open(data.url, '_blank');
      } else {
        toast.error(data.error || 'Error al abrir dashboard de Stripe');
      }
    } catch (error) {
      console.error('Error opening Stripe dashboard:', error);
      toast.error('Error al abrir dashboard de Stripe');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      const response = await fetch('/api/stripe/connect/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professional_id: professionalId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Cuenta de Stripe desconectada exitosamente');
        setAccountStatus({
          stripe_account_id: null,
          stripe_account_status: null,
          stripe_charges_enabled: null,
          stripe_payouts_enabled: null,
        });
        setShowDisconnectDialog(false);
      } else {
        toast.error(data.error || 'Error al desconectar cuenta de Stripe');
      }
    } catch (error) {
      console.error('Error disconnecting Stripe account:', error);
      toast.error('Error al desconectar cuenta de Stripe');
    } finally {
      setDisconnecting(false);
    }
  };

  const getStatusBadge = () => {
    if (!accountStatus?.stripe_account_id) {
      return <Badge variant="secondary">No conectado</Badge>;
    }

    if (accountStatus.stripe_charges_enabled && accountStatus.stripe_payouts_enabled) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Conectado
        </Badge>
      );
    }

    if (accountStatus.stripe_account_status === 'pending') {
      return (
        <Badge variant="secondary" className="bg-yellow-500">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <AlertCircle className="w-3 h-3 mr-1" />
        Restringido
      </Badge>
    );
  };

  const isFullyConnected = accountStatus?.stripe_charges_enabled && accountStatus?.stripe_payouts_enabled;

  return (
    <Card className="py-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <CardTitle>Configuración de Pagos</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Conecta tu cuenta de Stripe para recibir pagos directamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {!accountStatus?.stripe_account_id ? (
              <>
                Para poder recibir pagos por tus servicios, necesitas conectar una cuenta de Stripe.
                Los pagos se procesarán de forma segura y se transferirán automáticamente a tu cuenta bancaria.
              </>
            ) : isFullyConnected ? (
              <>
                Tu cuenta de Stripe está conectada y activa. Ya puedes recibir pagos por tus servicios.
                Los pagos se transferirán automáticamente a tu cuenta bancaria.
              </>
            ) : (
              <>
                Tu cuenta de Stripe está en proceso de configuración. Por favor, completa el proceso
                de verificación para poder recibir pagos.
              </>
            )}
          </p>

          {isFullyConnected && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Cuenta verificada
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Los pagos se transferirán automáticamente a tu cuenta después de cada reserva
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!accountStatus?.stripe_account_id ? (
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="w-full"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? 'Conectando...' : 'Conectar con Stripe'}
            </Button>
          ) : (
            <>
              {!isFullyConnected && (
                <Button
                  onClick={handleConnect}
                  disabled={loading}
                  variant="default"
                  className="flex-1"
                >
                  {loading ? 'Cargando...' : 'Completar configuración'}
                </Button>
              )}
              <Button
                onClick={handleOpenDashboard}
                disabled={loading}
                variant={isFullyConnected ? "default" : "outline"}
                className={isFullyConnected ? "flex-1" : "flex-1"}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Dashboard de Stripe
              </Button>
              <Button
                onClick={checkAccountStatus}
                disabled={checkingStatus}
                variant="outline"
                size="icon"
              >
                {checkingStatus ? '...' : '↻'}
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p>• Pagos procesados de forma segura con Stripe</p>
          <p>• Transferencias automáticas a tu cuenta bancaria</p>
          <p>• Gestiona tus pagos desde el dashboard de Stripe</p>
          <p>• Sin costos ocultos ni cargos adicionales</p>
        </div>

        {accountStatus?.stripe_account_id && (
          <div className="pt-4 border-t">
            <Button
              onClick={() => setShowDisconnectDialog(true)}
              disabled={disconnecting || loading}
              variant="outline"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Unplug className="w-4 h-4 mr-2" />
              Desconectar cuenta de Stripe
            </Button>
          </div>
        )}
      </CardContent>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desconectar cuenta de Stripe?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Esta acción desconectará tu cuenta de Stripe de Holistia.
              </p>
              <p className="font-medium text-foreground">
                Esto significa que:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>No podrás recibir nuevos pagos a través de Holistia</li>
                <li>Los pagos pendientes se procesarán normalmente</li>
                <li>Podrás volver a conectar tu cuenta en cualquier momento</li>
                <li>Tu cuenta de Stripe no será eliminada, solo desvinculada</li>
              </ul>
              <p className="text-destructive font-medium pt-2">
                ¿Estás seguro de que deseas continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnecting ? 'Desconectando...' : 'Sí, desconectar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

