"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX, Mail, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AccountDeactivatedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string>("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Obtener el email del usuario actual
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
      }
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image
              alt="Holistia"
              src="/logos/holistia-black.png"
              className="h-auto w-auto dark:hidden"
              width={48}
              height={48}
            />
            <Image
              alt="Holistia"
              src="/logos/holistia-white.png"
              className="h-auto w-auto hidden dark:block"
              width={48}
              height={48}
            />
          </Link>
        </div>

        <Card className="py-4 border-destructive/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-destructive/10 p-4">
                <UserX className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">
              Cuenta Desactivada
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Tu cuenta de Holistia ha sido desactivada
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Información */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                ¿Qué significa esto?
              </h3>
              <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                  <span>Tu cuenta ha sido desactivada y no tienes acceso a la plataforma</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                  <span>No puedes acceder a citas, eventos, favoritos o tu perfil</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400 mt-1">•</span>
                  <span>Tus datos permanecen guardados de forma segura</span>
                </li>
              </ul>
            </div>

            {/* Email del usuario */}
            {email && (
              <div className="text-center text-sm text-muted-foreground">
                Cuenta: <span className="font-medium text-foreground">{email}</span>
              </div>
            )}

            {/* Opciones de contacto */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                ¿Quieres reactivar tu cuenta?
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                Si deseas volver a activar tu cuenta, contáctanos y te ayudaremos.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  asChild
                >
                  <a href="mailto:hola@holistia.io">
                    <Mail className="h-4 w-4 mr-2" />
                    Contactar Soporte
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  asChild
                >
                  <a href="https://wa.me/521234567890" target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            {/* Información adicional */}
            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              <p>
                Desactivaste tu cuenta el{" "}
                <span className="font-medium text-foreground">
                  {new Date().toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                asChild
              >
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Volver al Inicio
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Si crees que esto es un error, contáctanos en{" "}
          <a
            href="mailto:hola@holistia.io"
            className="font-medium text-primary hover:underline"
          >
            hola@holistia.io
          </a>
        </p>
      </div>
    </div>
  );
}
