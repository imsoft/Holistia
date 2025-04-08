"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Sparkles, LogIn } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

// Definir el esquema de validación con Zod
const signInSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(1, { message: "La contraseña es requerida" }),
  rememberMe: z.boolean().optional(),
})

// Tipo derivado del esquema
type SignInFormValues = z.infer<typeof signInSchema>

export const SignInForm = () => {
  const [showPassword, setShowPassword] = useState(false)

  // Configurar useForm con el resolver de Zod
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  })

  // Función para manejar el envío del formulario
  function onSubmit(data: SignInFormValues) {
    // Aquí iría la lógica para enviar el formulario
    console.log("Inicio de sesión:", data)
    // Mostrar mensaje de éxito o redireccionar
  }

  const handleGoogleSignIn = () => {
    // Aquí iría la lógica para iniciar sesión con Google
    console.log("Iniciando sesión con Google")
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
      {/* Estilos para el gradiente animado */}
      <style jsx global>{`
        .animated-gradient-text {
          background: linear-gradient(
            to right,
            #ffffff,
            #ac89ff,
            #83c7fd,
            #aff344,
            #ffe5be,
            #ac89ff,
            #83c7fd,
            #ffffff
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: flow 10s linear infinite;
        }

        @keyframes flow {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>

      {/* Gradient blobs */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#AC89FF]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#83C7FD]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#AFF344]/5 rounded-full blur-[120px] -z-10"></div>

      <div className="container mx-auto px-4 py-12 flex flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-[#AC89FF]/20 to-[#83C7FD]/20 text-[#AC89FF] text-sm font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              <span>Bienvenido a Holistia</span>
            </div>

            <h1 className="text-3xl font-bold mb-2 animated-gradient-text">Iniciar sesión</h1>

            <p className="text-white/70">Continúa tu viaje hacia el bienestar integral</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-xl">
            {/* Botón de Google */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-md border border-gray-300 transition-colors duration-300 mb-6"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>

            {/* Separador */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0D0D0D]/80 backdrop-blur-sm px-2 text-white/50">
                  O inicia sesión con tu correo
                </span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/90">Correo electrónico</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="tu@email.com"
                          className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white placeholder:text-white/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-white/90">Contraseña</FormLabel>
                        <Link href="/forgot-password" className="text-xs text-[#AC89FF] hover:underline">
                          ¿Olvidaste tu contraseña?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Tu contraseña"
                            className="bg-white/10 border-white/20 focus:border-[#AC89FF] text-white placeholder:text-white/50 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-2 pt-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="bg-white/10 border-white/20 data-[state=checked]:bg-[#AC89FF] data-[state=checked]:border-[#AC89FF]"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium text-white/80">Recordar mi sesión</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 hover:shadow-lg hover:shadow-[#AC89FF]/20 relative overflow-hidden group mt-2"
                >
                  <span className="relative z-10 flex items-center">
                    Iniciar sesión
                    <LogIn className="ml-2 h-4 w-4" />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-white/70 text-sm">
                ¿No tienes una cuenta?{" "}
                <Link href="/signup" className="text-[#AC89FF] hover:underline font-medium">
                  Regístrate
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-white/50">
              &copy; {new Date().getFullYear()} Holistia. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
