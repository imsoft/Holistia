import { Mail, CheckCircle } from "lucide-react";

export default function ConfirmEmailPage() {
  return (
    <>
      <main className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <Mail className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              ¡Revisa tu email!
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Hemos enviado un enlace de confirmación a tu correo electrónico. 
              Haz clic en el enlace para activar tu cuenta.
            </p>
          </div>

          {/* Help Section */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-6 text-left">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
                  ¿No recibiste el email?
                </h3>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Revisa tu carpeta de spam o correo no deseado</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>Verifica que el email esté escrito correctamente</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>El email puede tardar unos minutos en llegar</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}