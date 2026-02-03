import Link from "next/link";
import Image from "next/image";

export const LogoClouds = () => {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
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
            {/* Mistika */}
            <div className="col-span-1 flex justify-center">
              <Image
                alt="Mistika"
                src="/sponsors/mistika.png"
                width={500}
                height={200}
                className="max-h-40 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>

            {/* Munar */}
            <div className="col-span-1 flex justify-center">
              <Image
                alt="Munar"
                src="/sponsors/munar.png"
                width={500}
                height={200}
                className="max-h-40 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>

            {/* Primitiva */}
            <div className="col-span-1 flex justify-center">
              <Image
                alt="Primitiva"
                src="/sponsors/primitiva.png"
                width={500}
                height={200}
                className="max-h-40 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>

            {/* Casa Rosa */}
            <div className="col-span-1 flex justify-center">
              <Image
                alt="Casa Rosa"
                src="/sponsors/casa-rosa.png"
                width={500}
                height={200}
                className="max-h-40 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>

            {/* Hycore */}
            <div className="col-span-1 flex justify-center">
              <Image
                alt="Hycore"
                src="/sponsors/hycore.png"
                width={500}
                height={200}
                className="max-h-40 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
