"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Calendar,
  Users,
  DollarSign,
  Sparkles,
  Megaphone,
  ShieldCheck,
  Ticket,
  BarChart3,
  Heart,
  CheckCircle2,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

const BENEFITS = [
  {
    icon: Users,
    title: "Llega a más personas",
    description: "Los eventos aparecen en la plataforma y pueden ser descubiertos por miles de usuarios interesados en bienestar.",
  },
  {
    icon: DollarSign,
    title: "Genera ingresos extra",
    description: "Cobra por talleres, retiros o sesiones grupales. Recibe los pagos de forma segura con Stripe.",
  },
  {
    icon: Megaphone,
    title: "Visibilidad y promoción",
    description: "Tu evento se muestra en el explorador de Holistia y puede incluirse en comunicaciones de la plataforma.",
  },
  {
    icon: BarChart3,
    title: "Gestiona inscripciones",
    description: "Controla el cupo, revisa asistentes y confirma registros desde un solo lugar.",
  },
];

const FEATURES = [
  { icon: Ticket, text: "Página pública del evento con toda la información" },
  { icon: ShieldCheck, text: "Pagos seguros y cobro de inscripciones" },
  { icon: Mail, text: "Confirmaciones y recordatorios por email" },
  { icon: CheckCircle2, text: "Códigos de confirmación para el check-in" },
];

export default function MyEventsPage() {
  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header */}
      <div className="border-b border-border bg-card w-full">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0 w-full">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                Mis Eventos
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Crea talleres, retiros y sesiones grupales
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full py-8 px-4 sm:px-6 space-y-8 sm:space-y-12 max-w-4xl mx-auto">
        {/* CTA principal */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="py-8 sm:py-10 px-6 sm:px-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              ¿Quieres crear un evento o taller?
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-6 max-w-lg mx-auto">
              Talleres, retiros, círculos y sesiones grupales tienen cabida en Holistia. 
              Cuéntanos tu idea y te ayudamos a publicarlo y vender entradas.
            </p>
            <Button asChild size="lg" className="gap-2">
              <a href="mailto:hola@holistia.io?subject=Quiero crear un evento en Holistia">
                <Mail className="h-4 w-4" />
                Contactar a Holistia
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Escríbenos a{" "}
              <a href="mailto:hola@holistia.io" className="text-primary hover:underline font-medium">
                hola@holistia.io
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Beneficios */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Beneficios de crear eventos en Holistia
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex gap-3">
                      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Qué incluye */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Qué incluye cuando publicas un evento
          </h3>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <ul className="space-y-3">
                {FEATURES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.text} className="flex items-center gap-3 text-sm sm:text-base">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{item.text}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* CTA final */}
        <Card className="bg-muted/50">
          <CardContent className="py-6 px-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              ¿Tienes una idea de taller, retiro o evento? El equipo de Holistia te acompaña en todo el proceso.
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:hola@holistia.io?subject=Propuesta de evento para Holistia">
                <Mail className="h-4 w-4 mr-2" />
                Enviar propuesta
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
