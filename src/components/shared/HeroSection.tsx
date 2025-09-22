import Image from "next/image";
import Link from "next/link";
import { Navbar } from "./Navbar";

const HeroSection = () => {
  return (
    <>
      <Navbar />
      <div className="bg-background">
        <div className="relative isolate overflow-hidden pt-14">
          <Image
            alt=""
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2830&q=80&blend=111827&sat=-100&exp=15&blend-mode=multiply"
            className="absolute inset-0 -z-10 size-full object-cover not-dark:hidden"
            width={1000}
            height={1000}
            priority
          />
          <Image    
            alt=""
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2830&q=80&blend=fff&sat=-100&exp=15&blend-mode=overlay"
            className="absolute inset-0 -z-10 size-full object-cover opacity-10 dark:hidden"
            width={1000}
            height={1000}
            priority
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-gradient-to-tr from-primary/20 to-secondary/20 opacity-20 sm:left-[calc(50%-30rem)] sm:w-288.75"
            />
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
              <div className="hidden sm:mb-8 sm:flex sm:justify-center">
                 <div className="relative rounded-full px-3 py-1 text-sm/6 text-muted-foreground ring-1 ring-border hover:ring-ring">
                  Conecta con profesionales de la salud.{" "}
                  <Link
                    href="#"
                    className="font-semibold text-primary"
                  >
                    <span aria-hidden="true" className="absolute inset-0" />
                    Descubre más <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-5xl font-semibold tracking-tight text-balance text-foreground sm:text-7xl">
                  Tu bienestar integral está aquí
                </h1>
                <p className="mt-8 text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">
                  Conecta con psicólogos, nutricionistas, entrenadores y otros profesionales 
                  de la salud que te ayudarán a alcanzar tu mejor versión.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    href="/my-space"
                    className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Comenzar ahora
                  </Link>
                  <Link
                    href="#"
                    className="text-sm/6 font-semibold text-foreground"
                  >
                    Conoce más <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-gradient-to-tr from-primary/20 to-secondary/20 opacity-20 sm:left-[calc(50%+36rem)] sm:w-288.75"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
