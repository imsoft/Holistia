import Link from "next/link";

export const LogoClouds = () => {
  return (
    <div className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-x-8 gap-y-16 lg:grid-cols-2">
          <div className="mx-auto w-full max-w-xl lg:mx-0">
            <h2 className="text-4xl font-semibold tracking-tight text-pretty text-foreground sm:text-5xl">
              Confiado por profesionales de la salud
            </h2>
            <p className="mt-6 text-lg/8 text-muted-foreground">
              Holistia conecta a profesionales certificados con pacientes que buscan 
              cuidado integral de su salud. Nuestra plataforma facilita el acceso a 
              servicios de psicología, terapia, nutrición y medicina preventiva.
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
          <div className="mx-auto grid w-full max-w-xl grid-cols-2 items-center gap-y-12 sm:gap-y-14 lg:mx-0 lg:max-w-none lg:pl-8">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground mb-2">Psicología</div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">🧠</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground mb-2">Terapia</div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">💬</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground mb-2">Nutrición</div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">🥗</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground mb-2">Medicina</div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">⚕️</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground mb-2">Bienestar</div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">🧘</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground mb-2">Salud Mental</div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">❤️</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
