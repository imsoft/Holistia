"use client";

import { z } from "zod";
import { AuthPageSkeleton } from "@/components/ui/layout-skeleton";
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
import { PasswordInput } from "@/components/ui/password-input";
import { GoogleButton } from "@/components/ui/google-button";
import { useForm } from "react-hook-form";
import { signup } from "@/actions/auth/actions";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeName } from "@/lib/text-utils";
import { toast } from "sonner";

const formSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.email("Ingresa un correo electrónico válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const RegisterPageContent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const becomeProfessional = searchParams.get("becomeProfessional") === "true";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("firstName", normalizeName(values.firstName));
      formData.append("lastName", normalizeName(values.lastName));
      formData.append("email", values.email.toLowerCase());
      formData.append("password", values.password);
      if (becomeProfessional) {
        formData.append("becomeProfessional", "true");
      }

      const result = await signup(formData);

      if (result?.error) {
        toast.error(result.error);
        setError(result.error);
        setIsLoading(false);
      } else if (result?.needsConfirmation) {
        toast.success("¡Cuenta creada! Por favor confirma tu email.");
        setSuccess(true);
        setIsLoading(false);
        router.push("/confirm-email");
      } else if (result?.redirectTo) {
        // Navegación "dura" para asegurar cookies y evitar quedarnos en "/"
        window.location.assign(result.redirectTo);
      } else if (result?.success) {
        // Usuario registrado exitosamente (ya confirmado)
        toast.success("¡Cuenta creada exitosamente!");
        setSuccess(true);
        // No necesitamos redirección aquí porque la acción ya redirige
        // No llamamos setIsLoading(false) aquí para mantener el estado de carga
      }
    } catch (error) {
      console.error("Error inesperado en registro:", error);
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
            Crea tu cuenta
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          onChange={(e) => {
                            const normalized = e.target.value.toLowerCase();
                            field.onChange(normalized);
                          }}
                        />
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
                        <PasswordInput
                          placeholder="Mínimo 8 caracteres"
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
                  disabled={isLoading || success}
                >
                  {isLoading
                    ? "Creando cuenta..."
                    : success
                    ? "Cuenta creada"
                    : "Crear cuenta"}
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
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:text-primary/80"
            >
              Inicia sesión
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
};

const RegisterPage = () => {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <RegisterPageContent />
    </Suspense>
  );
};

export default RegisterPage;
