"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Send, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

type TemplateName =
  | "confirmacion_cita_holistia"
  | "confirmacion_cita_botones_holistia"
  | "recordatorio_cita_holistia"
  | "recordatorio_evento_holistia";

interface TemplateConfig {
  label: string;
  type: "cita" | "evento";
  variables: { key: string; label: string; placeholder: string }[];
}

const TEMPLATES: Record<TemplateName, TemplateConfig> = {
  confirmacion_cita_holistia: {
    label: "Confirmación de cita (texto)",
    type: "cita",
    variables: [
      { key: "1", label: "Nombre del paciente", placeholder: "Ej: Juan Pérez" },
      { key: "2", label: "Fecha", placeholder: "Ej: 25 de febrero de 2026" },
      { key: "3", label: "Hora", placeholder: "Ej: 10:00 AM" },
      { key: "4", label: "Nombre del profesional", placeholder: "Ej: Dra. García" },
    ],
  },
  confirmacion_cita_botones_holistia: {
    label: "Confirmación de cita (con botones)",
    type: "cita",
    variables: [
      { key: "1", label: "Nombre del paciente", placeholder: "Ej: Juan Pérez" },
      { key: "2", label: "Fecha", placeholder: "Ej: 25 de febrero de 2026" },
      { key: "3", label: "Hora", placeholder: "Ej: 10:00 AM" },
      { key: "4", label: "Nombre del profesional", placeholder: "Ej: Dra. García" },
    ],
  },
  recordatorio_cita_holistia: {
    label: "Recordatorio de cita",
    type: "cita",
    variables: [
      { key: "1", label: "Nombre del paciente", placeholder: "Ej: Juan Pérez" },
      { key: "2", label: "Fecha", placeholder: "Ej: 25 de febrero de 2026" },
      { key: "3", label: "Hora", placeholder: "Ej: 10:00 AM" },
      { key: "4", label: "Nombre del profesional", placeholder: "Ej: Dra. García" },
    ],
  },
  recordatorio_evento_holistia: {
    label: "Recordatorio de evento",
    type: "evento",
    variables: [
      { key: "1", label: "Nombre del participante", placeholder: "Ej: María López" },
      { key: "2", label: "Nombre del evento", placeholder: "Ej: Taller de Meditación" },
      { key: "3", label: "Fecha", placeholder: "Ej: 28 de febrero de 2026" },
      { key: "4", label: "Hora", placeholder: "Ej: 4:00 PM" },
      { key: "5", label: "Lugar", placeholder: "Ej: Centro Holístico Holistia / Online" },
    ],
  },
};

interface SendResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

export default function WhatsAppTestPage() {
  const [phone, setPhone] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateName | "">("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  const templateConfig = selectedTemplate ? TEMPLATES[selectedTemplate] : null;

  const handleTemplateChange = (value: TemplateName) => {
    setSelectedTemplate(value);
    setVariables({});
    setResult(null);
  };

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  const handleSend = async () => {
    if (!phone.trim()) {
      toast.error("Ingresa un número de teléfono");
      return;
    }
    if (!selectedTemplate) {
      toast.error("Selecciona un template");
      return;
    }
    if (!templateConfig) return;

    const missingVars = templateConfig.variables.filter((v) => !variables[v.key]?.trim());
    if (missingVars.length > 0) {
      toast.error(`Completa todos los campos: ${missingVars.map((v) => v.label).join(", ")}`);
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch("/api/admin/test-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, template: selectedTemplate, variables }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({ success: false, error: data.error || "Error desconocido" });
        toast.error(data.error || "Error al enviar el mensaje");
      } else {
        setResult({ success: true, messageSid: data.messageSid });
        toast.success("Mensaje enviado correctamente");
      }
    } catch {
      setResult({ success: false, error: "Error de conexión" });
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-xl font-semibold">Prueba de WhatsApp</h1>
            <p className="text-sm text-muted-foreground">
              Envía mensajes de prueba con los templates aprobados de Twilio
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Enviar mensaje de prueba
            </CardTitle>
            <CardDescription>
              Solo para pruebas internas. Los mensajes se envían a través de Twilio WhatsApp Business.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Número de teléfono */}
            <div className="space-y-2">
              <Label htmlFor="phone">Número de teléfono destino</Label>
              <Input
                id="phone"
                placeholder="Ej: 3312345678 o +523312345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                10 dígitos (México). Se normaliza automáticamente a formato E.164.
              </p>
            </div>

            {/* Selector de template */}
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un template..." />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(TEMPLATES) as [TemplateName, TemplateConfig][]).map(
                    ([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              config.type === "cita"
                                ? "border-blue-300 text-blue-700"
                                : "border-purple-300 text-purple-700"
                            }
                          >
                            {config.type}
                          </Badge>
                          {config.label}
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Variables dinámicas */}
            {templateConfig && (
              <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                <p className="text-sm font-medium">Variables del template</p>
                {templateConfig.variables.map((v) => (
                  <div key={v.key} className="space-y-1.5">
                    <Label htmlFor={`var-${v.key}`} className="text-sm">
                      {"{{"}{v.key}{"}}"}  {v.label}
                    </Label>
                    <Input
                      id={`var-${v.key}`}
                      placeholder={v.placeholder}
                      value={variables[v.key] ?? ""}
                      onChange={(e) => handleVariableChange(v.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Botón enviar */}
            <Button
              onClick={handleSend}
              disabled={loading || !selectedTemplate || !phone}
              className="w-full"
            >
              {loading ? (
                <>Enviando...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar mensaje de prueba
                </>
              )}
            </Button>

            {/* Resultado */}
            {result && (
              <div
                className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
                  result.success
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                )}
                <div>
                  {result.success ? (
                    <>
                      <p className="font-medium">Mensaje enviado</p>
                      {result.messageSid && (
                        <p className="text-xs mt-1 font-mono opacity-70">{result.messageSid}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Error al enviar</p>
                      <p className="mt-1 opacity-80">{result.error}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
