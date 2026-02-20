"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Mail,
  MessageCircle,
  Link2,
  Receipt,
  UserX,
  CreditCard,
  HelpCircle,
  Send,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Stethoscope,
  Users,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { FAQ_PROFESSIONALS, FAQ_PATIENTS } from "./faq-data";

const SUPPORT_TOPICS = [
  {
    id: "no_link",
    title: "No me llegó el enlace",
    shortDescription: "No recibí el enlace de la videollamada o de la cita.",
    icon: Link2,
    steps: [
      "Revisa tu bandeja de spam o correo no deseado.",
      "En la app, entra a la cita y revisa si hay enlace de reunión en los detalles.",
      "Si sigue sin aparecer, envía una solicitud indicando nombre del profesional, fecha y hora de la cita.",
    ],
    subjectForForm: "No me llegó el enlace de la cita/evento",
  },
  {
    id: "refund",
    title: "Quiero solicitar un reembolso",
    shortDescription: "Necesito solicitar la devolución de un pago.",
    icon: Receipt,
    steps: [
      "Según nuestros términos, las cancelaciones con más de 24 h de anticipación pueden evaluar excepciones con el profesional.",
      "Indica en tu mensaje: cita o evento, fecha y motivo. Revisaremos tu caso y te responderemos en 24-48 h hábiles.",
    ],
    subjectForForm: "Solicitud de reembolso",
  },
  {
    id: "professional_no_show",
    title: "El profesional no se presentó",
    shortDescription: "Tuve la cita agendada pero el profesional no asistió.",
    icon: UserX,
    steps: [
      "Lamentamos que haya ocurrido esto. En la página de la cita puedes marcar «El profesional no asistió» para dejar registro.",
      "Envía además una solicitud con la fecha, hora y nombre del profesional para que podamos dar seguimiento y, si aplica, evaluar reembolso.",
    ],
    subjectForForm: "El profesional no se presentó a la cita",
  },
  {
    id: "payment_issue",
    title: "Problema con mi pago",
    shortDescription: "El pago falló, se cobró dos veces o no veo mi comprobante.",
    icon: CreditCard,
    steps: [
      "Si el pago falló, verifica que tu tarjeta tenga fondos y que los datos sean correctos. Puedes intentar de nuevo.",
      "Si se realizó un cobro duplicado o no ves tu comprobante, envía tu solicitud con fecha aproximada y correo con el que pagaste. Revisaremos con el equipo de pagos.",
    ],
    subjectForForm: "Problema con mi pago",
  },
  {
    id: "account_access",
    title: "No puedo acceder a mi cuenta",
    shortDescription: "Problemas para iniciar sesión, recuperar contraseña o verificar mi correo.",
    icon: Lock,
    steps: [
      "Ve a la pantalla de inicio de sesión y usa «¿Olvidaste tu contraseña?» para recibir un enlace de recuperación por correo.",
      "Revisa tu carpeta de spam si no recibes el correo de recuperación.",
      "Si tu cuenta está bloqueada o tienes otro problema de acceso, envía una solicitud con tu correo registrado.",
    ],
    subjectForForm: "Problema de acceso a la cuenta",
  },
  {
    id: "other",
    title: "Otro tema",
    shortDescription: "Otra consulta o incidencia.",
    icon: HelpCircle,
    steps: ["Describe tu situación en el mensaje y te responderemos en 24-48 h hábiles."],
    subjectForForm: "Consulta general / Otro tema",
  },
] as const;

const RESPONSE_EXPECTATION = "Respondemos en 24-48 horas hábiles.";

export function HelpPageClient() {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const selectedTopic = SUPPORT_TOPICS.find((t) => t.id === selectedTopicId);
  const subject = selectedTopic?.subjectForForm ?? "Consulta general";

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopicId(topicId);
    setError(null);
    scrollToForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !message.trim()) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          subject,
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al enviar el mensaje");
      }
      setSuccess(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setSelectedTopicId(null);
      toast.success("Solicitud enviada. Te responderemos en 24-48 h hábiles.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al enviar. Intenta de nuevo.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <Card className="border-primary/20 bg-card py-4">
          <CardContent className="pt-8 pb-8 px-6 sm:px-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
              <CheckCircle className="h-8 w-8" aria-hidden />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Solicitud enviada
            </h2>
            <p className="text-muted-foreground mb-6">
              Hemos recibido tu mensaje. <strong>{RESPONSE_EXPECTATION}</strong> Revisa tu correo;
              si no ves nuestra respuesta, revisa la carpeta de spam.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => setSuccess(false)}>
                Enviar otra solicitud
              </Button>
              <Button asChild>
                <Link href="/">Volver al inicio</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <div className="bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10 lg:py-12 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LifeBuoy className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
                Centro de Ayuda
              </h1>
              <p className="mt-2 text-base sm:text-lg text-muted-foreground max-w-2xl">
                Revisa las preguntas frecuentes abajo; si no encuentras respuesta, elige un tema y envía tu solicitud.{" "}
                <strong className="text-foreground">{RESPONSE_EXPECTATION}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preguntas frecuentes */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-8 sm:pb-10">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          Preguntas frecuentes
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mb-6">
          Respuestas rápidas para profesionales y pacientes. Si no encuentras lo que buscas, envía tu solicitud más abajo.
        </p>
        <Tabs defaultValue="patients" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11 sm:h-12 rounded-lg p-1 bg-muted/80">
            <TabsTrigger
              value="patients"
              className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">Pacientes</span>
            </TabsTrigger>
            <TabsTrigger
              value="professionals"
              className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Stethoscope className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">Profesionales</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="patients" className="mt-6 focus-visible:outline-none">
            <Accordion type="single" collapsible className="w-full space-y-0">
              {FAQ_PATIENTS.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`patients-${index}`}
                  className="border border-border rounded-lg px-4 sm:px-5 mb-3 last:mb-0 overflow-hidden data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4 sm:py-5 [&[data-state=open]]:pb-2">
                    <span className="pr-4 font-medium text-foreground">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 sm:pb-5 pt-0 text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
          <TabsContent value="professionals" className="mt-6 focus-visible:outline-none">
            <Accordion type="single" collapsible className="w-full space-y-0">
              {FAQ_PROFESSIONALS.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`professionals-${index}`}
                  className="border border-border rounded-lg px-4 sm:px-5 mb-3 last:mb-0 overflow-hidden data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4 sm:py-5 [&[data-state=open]]:pb-2">
                    <span className="pr-4 font-medium text-foreground">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 sm:pb-5 pt-0 text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>

      {/* Topics */}
      <div className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <h2 className="text-lg font-semibold text-foreground mb-4 sm:mb-6">
          ¿En qué podemos ayudarte?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {SUPPORT_TOPICS.map((topic) => {
            const Icon = topic.icon;
            return (
              <Card
                key={topic.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md hover:border-primary/30 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 py-4 flex flex-col",
                  selectedTopicId === topic.id && "ring-2 ring-primary border-primary/40"
                )}
              >
                <CardHeader className="pb-2 pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
                  </div>
                  <CardTitle className="text-base sm:text-lg font-semibold text-foreground mt-2">
                    {topic.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-normal line-clamp-2">
                    {topic.shortDescription}
                  </p>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col flex-1">
                  <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside flex-1">
                    {topic.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => handleSelectTopic(topic.id)}
                    >
                      Enviar solicitud
                      <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      </div>

      {/* Form */}
      <div ref={formRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <Card className="max-w-2xl py-4">
          <CardHeader className="">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" aria-hidden />
              Enviar solicitud de soporte
            </CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              {selectedTopic
                ? `Tema: ${selectedTopic.title}. Completa tus datos y el mensaje.`
                : "Elige un tema arriba o completa el formulario con tu consulta."}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {selectedTopic && (
                <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm text-muted-foreground">
                  Asunto: <span className="font-medium text-foreground">{subject}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="help-firstName">Nombre *</Label>
                  <Input
                    id="help-firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Tu nombre"
                    required
                    disabled={loading}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="help-lastName">Apellido *</Label>
                  <Input
                    id="help-lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Tu apellido"
                    required
                    disabled={loading}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="help-email">Email *</Label>
                <Input
                  id="help-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  disabled={loading}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="help-phone">Teléfono (opcional)</Label>
                <Input
                  id="help-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 33 1234 5678"
                  disabled={loading}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="help-message">Mensaje *</Label>
                <Textarea
                  id="help-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe tu situación o consulta con el mayor detalle posible (fecha de la cita, nombre del profesional, etc.)."
                  required
                  disabled={loading}
                  rows={4}
                  className="mt-1.5 resize-y min-h-[120px]"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                  <p>{error}</p>
                </div>
              )}
              <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={loading}>
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" aria-hidden />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" aria-hidden />
                    Enviar solicitud
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Prefiero contactar directo:</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:hola@holistia.io?subject=Consulta%20Holistia">
                    <Mail className="h-4 w-4 mr-2" aria-hidden />
                    hola@holistia.io
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://wa.me/523331733702?text=Hola%2C%20necesito%20ayuda%20con%20un%20tema%20en%20Holistia."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" aria-hidden />
                    WhatsApp
                  </a>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/contact">Ver página de contacto</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
