"use client";

import { Suspense } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { useForm } from "react-hook-form";
import { validateResetToken, updatePasswordWithToken } from "@/actions/auth/reset-password";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";

const formSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  confirmPassword: z.string().min(8, "La confirmación de contraseña debe tener al menos 8 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Validar token al cargar la página
  useEffect(() => {
    async function validate() {
      if (!token) {
        setError("No se proporcionó un token válido.");
        setIsValidating(false);
        return;
      }

      const result = await validateResetToken(token);

      if (result.valid) {
        setTokenValid(true);
        setEmail(result.email || null);
      } else {
        setError(result.error || "Token inválido");
      }

      setIsValidating(false);
    }

    validate();
  }, [token]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("password", values.password);

      const result = await updatePasswordWithToken(formData);

      if (result?.error) {
        setError(result.error);
      }
      // Si no hay error, la acción redirige automáticamente al login
    } catch {
      setError("Ocurrió un error inesperado. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Estado de carga inicial
  if (isValidating) {
    return (
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Validando enlace...</p>
        </div>
      </div>
    );
  }

  // Token inválido o expirado
  if (!tokenValid) {
    return (
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="block">
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
          <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-foreground">
            Enlace no válido
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-card px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 border border-border text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {error || "El enlace no es válido"}
            </h3>
            <p className="text-muted-foreground mb-6">
              El enlace ha expirado o ya fue utilizado. Por favor, solicita un nuevo enlace de restablecimiento.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de nueva contraseña
  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="block">
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
        <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-foreground">
          Establecer nueva contraseña
        </h2>
        {email && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            para <span className="font-medium text-foreground">{email}</span>
          </p>
        )}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-card px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 border border-border">
          {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Mínimo 8 caracteres"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar contraseña</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="Confirma tu nueva contraseña"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                className="w-full"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar contraseña"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
