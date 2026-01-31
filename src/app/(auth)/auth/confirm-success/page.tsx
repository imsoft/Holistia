import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ConfirmSuccessPage() {
  return (
    <>
      <main className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              ¡Email confirmado!
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Tu cuenta ha sido activada exitosamente. Ya puedes acceder a todos los servicios de Holistia.
            </p>
          </div>

          {/* Action */}
          <div className="space-y-4">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Explorar Holistia
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
