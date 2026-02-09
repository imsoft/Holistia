"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getBookingErrorMessage, BOOKING_MESSAGES } from "@/lib/error-messages";

interface PaymentButtonProps {
  appointmentId?: string;
  serviceAmount: number;
  professionalId: string;
  description?: string;
  // Nuevos campos opcionales para crear la cita
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentType?: string;
  notes?: string;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function PaymentButton({
  appointmentId,
  serviceAmount,
  professionalId,
  description,
  appointmentDate,
  appointmentTime,
  appointmentType,
  notes,
  onError,
  className,
  disabled = false,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Create checkout session
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointment_id: appointmentId,
          service_amount: serviceAmount,
          professional_id: professionalId,
          description,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          appointment_type: appointmentType,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear sesión de pago");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        // No llamar onSuccess aquí - solo redirigir a Stripe
        // El éxito se manejará después del pago exitoso mediante webhook
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió URL de pago");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      const rawMessage = error instanceof Error ? error.message : "Error al procesar el pago";
      const friendlyMessage = getBookingErrorMessage(rawMessage);

      onError?.(friendlyMessage);
      toast.error(friendlyMessage, {
        description:
          friendlyMessage === BOOKING_MESSAGES.PAYMENT_FAILED
            ? "Si el cargo aparece en tu estado de cuenta, no vuelvas a pagar; contacta a soporte."
            : "Revisa la información o elige otro horario e intenta de nuevo.",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Precio de la consulta:</span>
          <span className="text-2xl font-bold text-primary">${serviceAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Paga de forma segura con tarjeta de crédito o débito
          </p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Cancelación con 24 h de anticipación. No hay reembolsos una vez confirmado el pago.
          </p>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        disabled={loading || disabled}
        className={`w-full ${className}`}
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Pagar ${serviceAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </>
        )}
      </Button>
    </div>
  );
}

