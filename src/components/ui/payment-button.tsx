"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  onSuccess?: () => void;
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
  onSuccess,
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
        window.location.href = data.url;
        onSuccess?.();
      } else {
        throw new Error("No se recibió URL de pago");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al procesar el pago";
      
      // Hacer el mensaje más amigable
      let friendlyMessage = errorMessage;
      if (errorMessage.includes("configurado su cuenta de pagos")) {
        friendlyMessage = "El profesional aún no ha configurado su cuenta para recibir pagos. Por favor, contacta al profesional o intenta con otro experto.";
      } else if (errorMessage.includes("completamente configurada")) {
        friendlyMessage = "La cuenta de pagos del profesional está en proceso de configuración. Por favor, intenta más tarde o contacta al profesional.";
      } else if (errorMessage.includes("ya tiene un pago confirmado")) {
        friendlyMessage = "Esta cita ya tiene un pago confirmado. No es necesario pagar nuevamente.";
      } else if (errorMessage.includes("cita reservada en este horario")) {
        friendlyMessage = "Ya tienes una cita reservada en este horario con este profesional. Por favor, selecciona otro horario disponible.";
      }
      
      onError?.(friendlyMessage);
      toast.error(friendlyMessage, {
        description: "Por favor, revisa la información e intenta nuevamente.",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate commission (15%)
  const commissionAmount = Math.round(serviceAmount * 0.15 * 100) / 100;

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Costo de la consulta:</span>
          <span className="font-medium">${serviceAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Apartado (15%):</span>
          <span className="font-semibold text-primary">${commissionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Solo pagarás la comisión de reserva ahora. El monto total de la consulta (${serviceAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}) lo pagarás directamente al profesional.
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
            Pagar Reserva (${commissionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })})
          </>
        )}
      </Button>
    </div>
  );
}

