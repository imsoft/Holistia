import Link from "next/link";
import Image from "next/image";

export const LogoClouds = () => {
  return (
    <div className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-x-8 gap-y-16 lg:grid-cols-2">
          <div className="mx-auto w-full max-w-xl lg:mx-0">
            <h2 className="text-4xl font-semibold tracking-tight text-pretty text-foreground sm:text-5xl">
              Ellos ya están transformando vidas, tú también puedes
            </h2>
            <p className="mt-6 text-lg/8 text-muted-foreground">
              Forma parte de Holistia: conecta, colabora y transforma junto a
              nuestra comunidad de expertos y personas que buscan crecer. Juntos
              hacemos que cada experiencia cuente.
            </p>
            <div className="mt-8 flex items-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Crear cuenta
              </Link>
              <Link
                href="https://wa.me/523331733702?text=¡Hola!%20Me%20gustaría%20conocer%20más%20sobre%20Holistia%20y%20sus%20servicios%20de%20salud%20integral.%20¿Podrían%20ayudarme%20con%20más%20información?"
                className="text-sm font-semibold text-foreground hover:text-muted-foreground"
              >
                Contáctanos <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
          <div className="mx-auto grid w-full max-w-xl grid-cols-3 items-center gap-x-8 gap-y-12 sm:gap-y-14 lg:mx-0 lg:max-w-none lg:pl-8">
            {/* Vercel */}
            <div className="col-span-1 flex justify-center">
              <Image
                alt="Vercel"
                src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Vercel_logo_black.svg"
                width={120}
                height={48}
                className="max-h-12 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>

            {/* Supabase */}
            <div className="col-span-1 flex justify-center">
              <Image
                alt="Supabase"
                src="https://supabase.com/images/brand/supabase-logo-wordmark--dark.svg"
                width={120}
                height={48}
                className="max-h-12 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>

            {/* Next.js */}
            <div className="col-span-1 flex justify-center">
              <Image
                alt="Next.js"
                src="https://upload.wikimedia.org/wikipedia/commons/8/8e/Nextjs-logo.svg"
                width={120}
                height={48}
                className="max-h-12 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>

            {/* Stripe */}
            <div className="col-span-1 flex justify-center">
              <Image
                alt="Stripe"
                src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
                width={120}
                height={48}
                className="max-h-12 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>

            {/* Tailwind */}
            <div className="col-span-1 flex justify-center">
              <Image
                alt="Tailwind CSS"
                src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg"
                width={120}
                height={48}
                className="max-h-12 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>

            {/* TypeScript */}
            <div className="col-span-1 flex justify-center">
              <Image
                alt="TypeScript"
                src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg"
                width={120}
                height={48}
                className="max-h-12 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
