"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";

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
      onError?.(errorMessage);
      alert(errorMessage);
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

