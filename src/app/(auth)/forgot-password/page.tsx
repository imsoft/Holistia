"use client";

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
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { resetPassword } from "@/actions/auth/reset-password";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

const formSchema = z.object({
  email: z.email("Ingresa un correo electrónico válido"),
});

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("email", values.email);

      const result = await resetPassword(formData);
      
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Ocurrió un error inesperado. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
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
            Email enviado
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="bg-card px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 border border-border text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              ¡Email enviado exitosamente!
            </h3>
            <p className="text-muted-foreground mb-6">
              Te hemos enviado un enlace para restablecer tu contraseña. 
              Revisa tu correo electrónico y haz clic en el enlace para continuar.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          ¿Olvidaste tu contraseña?
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-card px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 border border-border">
          {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo electrónico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
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
                {isLoading ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;