"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Clock, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

const RegistroExitosoPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-foreground mb-2">
              ¡Registro Exitoso!
            </CardTitle>
            <p className="text-lg text-muted-foreground">
              Tu solicitud para unirte a Holistia como profesional ha sido enviada correctamente
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Información del proceso */}
            <div className="bg-muted/30 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-foreground mb-4">¿Qué sigue ahora?</h3>
              
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Revisión de documentos</p>
                    <p className="text-sm text-muted-foreground">
                      Nuestro equipo verificará tus credenciales y documentos en un plazo de 24-48 horas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Notificación de aprobación</p>
                    <p className="text-sm text-muted-foreground">
                      Recibirás un email de confirmación una vez que tu perfil sea aprobado.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Acceso a la plataforma</p>
                    <p className="text-sm text-muted-foreground">
                      Podrás comenzar a recibir pacientes y gestionar tu práctica profesional.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">¿Tienes preguntas?</h4>
              <p className="text-sm text-blue-700 mb-3">
                Si tienes alguna duda sobre tu registro o necesitas ayuda, no dudes en contactarnos.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" className="text-blue-700 border-blue-300 hover:bg-blue-100">
                  <Mail className="h-4 w-4 mr-2" />
                  soporte@holistia.com
                </Button>
                <Button variant="outline" size="sm" className="text-blue-700 border-blue-300 hover:bg-blue-100">
                  <Clock className="h-4 w-4 mr-2" />
                  +52 55 1234 5678
                </Button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1">
                <Link href="/my-space">
                  Explorar Plataforma
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/">
                  Volver al Inicio
                </Link>
              </Button>
            </div>

            {/* Información adicional */}
            <div className="text-center pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Número de solicitud: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Guarda este número para futuras referencias
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistroExitosoPage;
