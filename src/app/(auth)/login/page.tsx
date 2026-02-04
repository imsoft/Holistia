"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { GoogleButton } from "@/components/ui/google-button";
import { useForm } from "react-hook-form";
import { login } from "@/actions/auth/actions";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthPageSkeleton } from "@/components/ui/layout-skeleton";

const formSchema = z.object({
  email: z.email("Ingresa un correo electrónico válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

// Componente interno que maneja los parámetros de búsqueda
function LoginFormWithMessage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Mensajes amigables según el parámetro message de la URL
  const messageLabels: Record<string, string> = {
    password_updated: "Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.",
  };

  // Mostrar mensajes según parámetros de la URL
  useEffect(() => {
    const message = searchParams.get('message');
    const error = searchParams.get('error');
    const deactivated = searchParams.get('deactivated');

    if (message) {
      toast.success(messageLabels[message] ?? message);
    }

    if (error) {
      // No mostrar errores técnicos crudos (ej. session_not_found de Supabase)
      const isTechnicalError =
        error.startsWith('{') ||
        error.includes('session_not_found') ||
        error.includes('JWT') ||
        error.includes('session_id');
      toast.error(
        isTechnicalError
          ? 'Tu sesión ha expirado o no es válida. Inicia sesión de nuevo.'
          : error,
        { duration: 8000 }
      );
    }

    if (deactivated === 'true') {
      toast.error('Tu cuenta ha sido desactivada. Para reactivarla, contacta con nosotros en hola@holistia.io', {
        duration: 8000,
      });
    }
  }, [searchParams]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);

      const result = await login(formData);
      
      if (result?.error) {
        // Mostrar error en toast en lugar de en la UI
        toast.error(result.error);
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result?.redirectTo) {
        // Navegación "dura" para asegurar cookies y evitar quedarse en "/"
        window.location.assign(result.redirectTo);
        return;
      }

      // Fallback defensivo
      router.replace("/explore");
    } catch (error) {
      console.error("Error inesperado en login:", error);
      const errorMessage = "Ocurrió un error inesperado. Por favor, intenta de nuevo.";
      // toast.error(errorMessage);
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex min-h-[calc(100vh-200px)] flex-col justify-center py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/?home=true" className="block">
            <Image
              alt="Holistia"
              src="/logos/holistia-black.png"
              className="mx-auto h-auto w-auto dark:hidden"
              width={40}
              height={40}
            />
            <Image
              alt="Holistia"
              src="/logos/holistia-black.png"
              className="mx-auto h-auto w-auto not-dark:hidden"
              width={40}
              height={40}
            />
          </Link>
          <h2 className="mt-4 sm:mt-6 text-center text-xl sm:text-2xl/9 font-bold tracking-tight text-foreground">
            Inicia sesión en tu cuenta
          </h2>
        </div>

        <div className="mt-6 sm:mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-card px-4 py-6 sm:px-12 sm:py-8 lg:py-12 shadow-sm sm:rounded-lg border border-border">
            {error && (
              <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 sm:space-y-6"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <PasswordInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-end">
                  <div className="text-sm/6">
                    <Link
                      href="/forgot-password"
                      className="font-semibold text-primary hover:text-primary/80"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  type="submit" 
                  disabled={isLoading}
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>
              </form>
            </Form>

            <div>
              <div className="mt-4 sm:mt-6 flex items-center gap-x-4 sm:gap-x-6">
                <div className="w-full flex-1 border-t border-border" />
                <p className="text-xs sm:text-sm/6 font-medium text-nowrap text-foreground">
                  O continúa con
                </p>
                <div className="w-full flex-1 border-t border-border" />
              </div>

              <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-4">
                <GoogleButton text="Continuar con Google" />
              </div>
            </div>
          </div>

          <p className="mt-6 sm:mt-10 text-center text-sm/6 text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link
              href="/signup"
              className="font-semibold text-primary hover:text-primary/80"
            >
              Regístrate ahora
            </Link>
          </p>

          <p className="mt-3 sm:mt-4 text-center text-sm/6 text-muted-foreground">
            <Link
              href="/?home=true"
              className="font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

// Componente principal con Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <LoginFormWithMessage />
    </Suspense>
  );
}
