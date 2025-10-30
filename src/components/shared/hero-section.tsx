import Image from "next/image";
import { Navbar } from "./navbar";
import Link from "next/link";

export const HeroSection = () => {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center">
        <div className="relative isolate w-full">
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 left-1/2 z-[9999] -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48"
          >
            <div
              style={{
                clipPath:
                  "polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)",
              }}
              className="aspect-801/1036 w-200.25 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
            />
          </div>
          <div className="relative">
            <div className="mx-auto max-w-7xl px-6 py-8 sm:py-12 lg:px-8 lg:py-16">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="relative w-full lg:max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <h1 className="text-5xl font-semibold tracking-tight text-pretty text-foreground sm:text-7xl animate-in slide-in-from-bottom-12 fade-in duration-1200 delay-200 fill-mode-both">
                    Conectamos a personas para transformar vidas
                  </h1>
                  <p className="mt-8 text-lg font-medium text-pretty text-muted-foreground sm:max-w-md sm:text-xl/8 lg:max-w-none animate-in slide-in-from-bottom-12 fade-in duration-1200 delay-500 fill-mode-both">
                    Sabemos que tu bienestar es integral. Por eso reunimos
                    expertos, experiencias y comunidades en un solo espacio,
                    para que cada paso de tu transformación sea acompañado y
                    seguro.
                  </p>
                  <div className="mt-10 flex items-center gap-x-6 animate-in slide-in-from-bottom-12 fade-in duration-1200 delay-800 fill-mode-both">
                    <Link
                      href="/signup"
                      className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      Crear cuenta
                    </Link>
                    <Link
                      href="/signup"
                      className="text-sm/6 font-semibold text-foreground"
                    >
                      Explorar expertos <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
                <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0 -mb-8">
                  <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-0 xl:pt-80">
                    <div className="relative p-2 animate-in slide-in-from-bottom-12 fade-in duration-1200 delay-300 fill-mode-both">
                      <Image
                        alt=""
                        src="/hero/1.png"
                        className="aspect-2/3 w-full rounded-xl bg-muted/5 object-cover shadow-2xl"
                        width={396}
                        height={528}
                      />
                      <div className="pointer-events-none absolute inset-2 rounded-xl ring-1 ring-border/10 ring-inset" />
                    </div>
                  </div>
                  <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                    <div className="relative p-2 animate-in slide-in-from-bottom-12 fade-in duration-1200 delay-600 fill-mode-both">
                      <Image
                        alt=""
                        src="/hero/2.png"
                        className="aspect-2/3 w-full rounded-xl bg-muted/5 object-cover shadow-2xl"
                        width={396}
                        height={528}
                      />
                      <div className="pointer-events-none absolute inset-2 rounded-xl ring-1 ring-border/10 ring-inset" />
                    </div>
                    <div className="relative p-2 animate-in slide-in-from-bottom-12 fade-in duration-1200 delay-900 fill-mode-both">
                      <Image
                        alt=""
                        src="/hero/3.png"
                        className="aspect-2/3 w-full rounded-xl bg-muted/5 object-cover shadow-2xl"
                        width={396}
                        height={528}
                      />
                      <div className="pointer-events-none absolute inset-2 rounded-xl ring-1 ring-border/10 ring-inset" />
                    </div>
                  </div>
                  <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                    <div className="relative p-2 animate-in slide-in-from-bottom-12 fade-in duration-1200 delay-400 fill-mode-both">
                      <Image
                        alt=""
                        src="/hero/4.png"
                        className="aspect-2/3 w-full rounded-xl bg-muted/5 object-cover shadow-2xl"
                        width={400}
                        height={528}
                      />
                      <div className="pointer-events-none absolute inset-2 rounded-xl ring-1 ring-border/10 ring-inset" />
                    </div>
                    <div className="relative p-2 animate-in slide-in-from-bottom-12 fade-in duration-1200 delay-700 fill-mode-both">
                      <Image
                        alt=""
                        src="/hero/5.png"
                        className="aspect-2/3 w-full rounded-xl bg-muted/5 object-cover shadow-2xl"
                        width={400}
                        height={528}
                      />
                      <div className="pointer-events-none absolute inset-2 rounded-xl ring-1 ring-border/10 ring-inset" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
