"use client";

import { useState } from "react";
import {
  DollarSign,
  Calendar,
  CalendarDays,
  CreditCard,
  Info,
  CheckCircle,
  Calculator,
  TrendingUp,
  Shield,
  Zap,
  Users,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ProfessionalPricingPage() {
  const [exampleAmount, setExampleAmount] = useState(1000);

  // Calcular ejemplo para citas
  const calculateAppointmentExample = (amount: number) => {
    const platformFee = amount * 0.15; // 15% comisión
    const professionalReceives = amount - platformFee;
    const stripeBase = (amount * 0.036) + 3; // Stripe fee base
    const stripeTax = stripeBase * 0.16; // IVA
    const stripeTotal = stripeBase + stripeTax;
    const platformNet = platformFee - stripeTotal;

    return {
      total: amount,
      platformFee: Math.round(platformFee * 100) / 100,
      professionalReceives: Math.round(professionalReceives * 100) / 100,
      stripeTotal: Math.round(stripeTotal * 100) / 100,
      platformNet: Math.round(platformNet * 100) / 100,
    };
  };

  // Calcular ejemplo para eventos
  const calculateEventExample = (amount: number) => {
    const platformFee = amount * 0.20; // 20% comisión
    const professionalReceives = amount - platformFee;
    const stripeBase = (amount * 0.036) + 3; // Stripe fee base
    const stripeTax = stripeBase * 0.16; // IVA
    const stripeTotal = stripeBase + stripeTax;
    const platformNet = platformFee - stripeTotal;

    return {
      total: amount,
      platformFee: Math.round(platformFee * 100) / 100,
      professionalReceives: Math.round(professionalReceives * 100) / 100,
      stripeTotal: Math.round(stripeTotal * 100) / 100,
      platformNet: Math.round(platformNet * 100) / 100,
    };
  };

  const appointmentExample = calculateAppointmentExample(exampleAmount);
  const eventExample = calculateEventExample(exampleAmount);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:h-16 sm:items-center justify-between px-4 sm:px-6 py-4 sm:py-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Tarifas y Comisiones
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Entiende cómo funcionan los pagos en Holistia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
        {/* Introducción */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle>¿Cómo funcionan los pagos en Holistia?</CardTitle>
            </div>
            <CardDescription>
              Holistia utiliza un modelo de comisiones transparente para mantener la plataforma
              funcionando y ofrecerte las mejores herramientas para gestionar tu práctica profesional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nuestro sistema de pagos está diseñado para ser justo y transparente. Solo pagas
                cuando generas ingresos, y las comisiones nos permiten mantener y mejorar continuamente
                la plataforma para beneficio de todos los profesionales.
              </p>
              <div className="grid gap-4 sm:grid-cols-3 pt-4">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Transparencia Total</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Todos los costos están claramente definidos antes de cada transacción
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Pagos Automáticos</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recibes tus pagos directamente en tu cuenta de Stripe
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Sin Costos Ocultos</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      No hay tarifas mensuales ocultas ni cargos sorpresa
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tipos de Pagos */}
        <Tabs defaultValue="fixed" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fixed">Pagos Fijos</TabsTrigger>
            <TabsTrigger value="variable">Pagos Variables</TabsTrigger>
          </TabsList>

          {/* Pagos Fijos */}
          <TabsContent value="fixed" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <CardTitle>Cuota de Inscripción Anual</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    $299 MXN
                  </Badge>
                </div>
                <CardDescription>
                  Pago único anual para mantener tu cuenta activa en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">¿Qué incluye?</p>
                      <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                        <li>Acceso completo al dashboard profesional</li>
                        <li>Gestión de citas y calendario</li>
                        <li>Sistema de pagos integrado con Stripe</li>
                        <li>Perfil público en la plataforma</li>
                        <li>Soporte técnico y atención al cliente</li>
                        <li>Herramientas de marketing y visibilidad</li>
                        <li>Gestión de pacientes y historial</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <Info className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">¿Por qué existe esta cuota?</p>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        La cuota de inscripción anual nos permite mantener la infraestructura de la
                        plataforma, desarrollar nuevas funcionalidades, y ofrecer soporte de calidad
                        a todos los profesionales. Es un pago único al año que garantiza el acceso
                        continuo a todas las herramientas y servicios de Holistia.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">Frecuencia de Pago</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Anual:</strong> Se cobra una vez al año. Tu cuenta permanece activa
                        durante 12 meses desde el pago. Recibirás recordatorios antes de que expire
                        tu suscripción para que puedas renovarla sin interrupciones.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pagos Variables */}
          <TabsContent value="variable" className="space-y-6">
            {/* Comisión por Citas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <CardTitle>Comisión por Citas</CardTitle>
                  </div>
                  <Badge className="bg-blue-600 text-white">15%</Badge>
                </div>
                <CardDescription>
                  Comisión aplicada sobre cada cita que realices a través de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">¿Cómo funciona?</p>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        Por cada cita que un paciente reserva y paga a través de Holistia, la
                        plataforma retiene el 15% del monto total como comisión. El 85% restante
                        se transfiere automáticamente a tu cuenta de Stripe Connect.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">¿Por qué el 15%?</p>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        Esta comisión cubre los costos de procesamiento de pagos (Stripe Connect),
                        mantenimiento de la plataforma, desarrollo de nuevas funcionalidades,
                        marketing y visibilidad de tu perfil, soporte técnico, y la infraestructura
                        necesaria para que puedas gestionar tu práctica de manera eficiente.
                      </p>
                    </div>
                  </div>

                  {/* Calculadora de Ejemplo */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Calculator className="h-4 w-4 text-primary" />
                      <p className="font-medium text-sm">Ejemplo de Cálculo</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">
                          Monto de la cita (MXN)
                        </label>
                        <input
                          type="number"
                          value={exampleAmount}
                          onChange={(e) => setExampleAmount(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                          min="0"
                          step="100"
                        />
                      </div>
                      <div className="grid gap-2 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Monto total de la cita:</span>
                          <span className="font-medium">
                            ${appointmentExample.total.toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Comisión Holistia (15%):</span>
                          <span className="font-medium text-blue-600">
                            -${appointmentExample.platformFee.toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Costos de Stripe (3.6% + $3 + IVA):</span>
                          <span className="font-medium text-orange-600">
                            -${appointmentExample.stripeTotal.toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="border-t border-border pt-2 mt-2">
                          <div className="flex justify-between text-sm font-bold">
                            <span>Tu recibes:</span>
                            <span className="text-green-600">
                              ${appointmentExample.professionalReceives.toLocaleString('es-MX', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comisión por Eventos */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-purple-600" />
                    <CardTitle>Comisión por Eventos</CardTitle>
                  </div>
                  <Badge className="bg-purple-600 text-white">20%</Badge>
                </div>
                <CardDescription>
                  Comisión aplicada sobre cada evento o taller que organices a través de la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <Info className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">¿Cómo funciona?</p>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        Por cada evento o taller que organices y que los participantes paguen a través
                        de Holistia, la plataforma retiene el 20% del monto total como comisión. El
                        80% restante se transfiere automáticamente a tu cuenta de Stripe Connect.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <Users className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">¿Por qué el 20%?</p>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        Los eventos requieren funcionalidades adicionales como gestión de registros,
                        códigos de confirmación, manejo de múltiples participantes, y herramientas
                        de marketing más especializadas. La comisión del 20% refleja estos servicios
                        adicionales y el mayor valor que proporcionamos para eventos y talleres.
                      </p>
                    </div>
                  </div>

                  {/* Calculadora de Ejemplo */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Calculator className="h-4 w-4 text-primary" />
                      <p className="font-medium text-sm">Ejemplo de Cálculo</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-2 block">
                          Monto del evento (MXN)
                        </label>
                        <input
                          type="number"
                          value={exampleAmount}
                          onChange={(e) => setExampleAmount(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                          min="0"
                          step="100"
                        />
                      </div>
                      <div className="grid gap-2 pt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Monto total del evento:</span>
                          <span className="font-medium">
                            ${eventExample.total.toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Comisión Holistia (20%):</span>
                          <span className="font-medium text-purple-600">
                            -${eventExample.platformFee.toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Costos de Stripe (3.6% + $3 + IVA):</span>
                          <span className="font-medium text-orange-600">
                            -${eventExample.stripeTotal.toLocaleString('es-MX', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="border-t border-border pt-2 mt-2">
                          <div className="flex justify-between text-sm font-bold">
                            <span>Tu recibes:</span>
                            <span className="text-green-600">
                              ${eventExample.professionalReceives.toLocaleString('es-MX', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preguntas Frecuentes */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Preguntas Frecuentes</CardTitle>
            </div>
            <CardDescription>
              Resolvemos las dudas más comunes sobre nuestros pagos y comisiones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  ¿Cuándo se cobra la comisión?
                </AccordionTrigger>
                <AccordionContent>
                  La comisión se calcula y se retiene automáticamente cuando un paciente completa
                  el pago de una cita o evento. El monto restante se transfiere directamente a tu
                  cuenta de Stripe Connect, generalmente en 2-7 días hábiles.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>
                  ¿Qué pasa si un paciente cancela o no se presenta?
                </AccordionTrigger>
                <AccordionContent>
                  Si un paciente cancela antes de la cita o evento, y se procesa un reembolso, la
                  comisión no se cobra. Si el paciente no se presenta sin cancelar, la política de
                  reembolsos depende de tu configuración y las políticas que hayas establecido.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>
                  ¿Hay algún costo adicional además de las comisiones?
                </AccordionTrigger>
                <AccordionContent>
                  Además de la cuota de inscripción anual y las comisiones por transacciones, Stripe
                  cobra sus propias tarifas de procesamiento (3.6% + $3 MXN + IVA por transacción).
                  Estas tarifas son estándar de la industria y se deducen automáticamente antes de
                  que recibas el pago. No hay otros costos ocultos.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>
                  ¿Puedo cambiar mis tarifas después de registrarme?
                </AccordionTrigger>
                <AccordionContent>
                  Sí, puedes actualizar los precios de tus servicios y eventos en cualquier momento
                  desde tu dashboard. Los cambios se aplicarán a las nuevas reservas. Las reservas
                  ya confirmadas mantendrán el precio original.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>
                  ¿Cómo puedo ver un desglose detallado de mis pagos?
                </AccordionTrigger>
                <AccordionContent>
                  Puedes ver un desglose completo de todos tus ingresos, comisiones y transferencias
                  en la sección de "Finanzas" de tu dashboard. Allí encontrarás información detallada
                  de cada transacción, incluyendo montos, fechas y estados de pago.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>
                  ¿Qué pasa si no renuevo mi cuota anual?
                </AccordionTrigger>
                <AccordionContent>
                  Si no renuevas tu cuota anual antes de que expire, tu cuenta se desactivará y no
                  podrás recibir nuevas reservas. Sin embargo, podrás acceder a tu dashboard para
                  ver información histórica y renovar tu suscripción en cualquier momento.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Resumen Final */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Resumen de Tarifas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <p className="font-medium text-sm">Inscripción</p>
                </div>
                <p className="text-2xl font-bold">$299</p>
                <p className="text-xs text-muted-foreground">MXN / año</p>
              </div>
              <div className="p-4 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <p className="font-medium text-sm">Citas</p>
                </div>
                <p className="text-2xl font-bold">15%</p>
                <p className="text-xs text-muted-foreground">por transacción</p>
              </div>
              <div className="p-4 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="h-4 w-4 text-purple-600" />
                  <p className="font-medium text-sm">Eventos</p>
                </div>
                <p className="text-2xl font-bold">20%</p>
                <p className="text-xs text-muted-foreground">por transacción</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Nota:</strong> Todas las tarifas están en pesos mexicanos (MXN). Los pagos
                se procesan a través de Stripe Connect, que cobra tarifas adicionales de procesamiento
                estándar de la industria (3.6% + $3 MXN + IVA por transacción). Estas tarifas de Stripe
                se deducen automáticamente antes de que recibas el pago en tu cuenta.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

