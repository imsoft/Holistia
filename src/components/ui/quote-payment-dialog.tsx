"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Service } from "@/types/service";

interface QuotePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
  conversationId: string;
  patientId: string;
  professionalId: string;
  onPaymentLinkCreated?: (url: string) => void;
}

export function QuotePaymentDialog({
  open,
  onOpenChange,
  service,
  conversationId,
  patientId,
  professionalId,
  onPaymentLinkCreated,
}: QuotePaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    const amountValue = parseFloat(amount);
    
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }

    if (amountValue < 1) {
      toast.error("El monto mínimo es $1.00 MXN");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/stripe/quote-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: service.id,
          amount: amountValue,
          conversation_id: conversationId,
          patient_id: patientId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al generar enlace de pago");
      }

      setPaymentUrl(data.url);
      toast.success("Enlace de pago generado correctamente");
      
      if (onPaymentLinkCreated) {
        onPaymentLinkCreated(data.url);
      }
    } catch (error) {
      console.error("Error generating payment link:", error);
      toast.error(error instanceof Error ? error.message : "Error al generar enlace de pago");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!paymentUrl) return;

    try {
      await navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
      toast.error("Error al copiar enlace");
    }
  };

  const handleOpenLink = () => {
    if (paymentUrl) {
      window.open(paymentUrl, "_blank");
    }
  };

  const handleClose = () => {
    setAmount("");
    setPaymentUrl(null);
    setCopied(false);
    onOpenChange(false);
  };

  // Calcular comisiones para mostrar al profesional
  const amountValue = parseFloat(amount) || 0;
  const platformFee = amountValue * 0.15;
  const professionalAmount = amountValue * 0.85;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generar Enlace de Pago</DialogTitle>
          <DialogDescription>
            Crea un enlace de pago para el servicio: <strong>{service.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!paymentUrl ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="amount">Monto Acordado (MXN) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-9"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ingresa el monto acordado con el paciente
                </p>
              </div>

              {amountValue > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto total:</span>
                    <span className="font-semibold">${amountValue.toFixed(2)} MXN</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Comisión Holistia (15%):</span>
                    <span className="text-muted-foreground">-${platformFee.toFixed(2)} MXN</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Tu recibirás:</span>
                    <span className="font-semibold text-primary">${professionalAmount.toFixed(2)} MXN</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleGenerateLink}
                  disabled={loading || !amount || amountValue <= 0}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    "Generar Enlace"
                  )}
                </Button>
                <Button variant="outline" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3">
                <div>
                  <Label className="text-sm font-medium">Enlace de pago generado</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Comparte este enlace con el paciente para que realice el pago
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={paymentUrl}
                    readOnly
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    title="Copiar enlace"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleOpenLink} className="flex-1">
                    Abrir enlace
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Cerrar
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monto total:</span>
                  <span className="font-semibold">${amountValue.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comisión Holistia (15%):</span>
                  <span className="text-muted-foreground">-${platformFee.toFixed(2)} MXN</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Tu recibirás:</span>
                  <span className="font-semibold text-primary">${professionalAmount.toFixed(2)} MXN</span>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
