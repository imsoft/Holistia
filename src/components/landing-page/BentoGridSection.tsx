import Image from "next/image";

export const BentoGridSection = () => {
  return (
    <>
      <div className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <h2 className="text-center text-base/7 font-semibold text-blue-600">
            Holistia
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-balance text-center text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
            Descubre cómo Holistia transforma tu bienestar
          </p>
          <div className="mt-10 h-[90vh] grid gap-4 sm:mt-16 lg:grid-cols-3 lg:grid-rows-2">
            <div className="relative lg:row-span-2">
              <div className="absolute inset-px rounded-lg bg-white lg:rounded-l-[2rem]"></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-l-[calc(2rem+1px)]">
                <div className="px-8 pb-3 pt-8 sm:px-10 sm:pb-0 sm:pt-10">
                  <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">
                    Planificación Simplificada
                  </p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                    Organiza tus metas y crea hábitos saludables con nuestra
                    plataforma intuitiva.
                  </p>
                </div>

                <div className="relative min-h-[30rem] w-full grow">
                  <div className="absolute bottom-0 left-0 right-10 top-10 overflow-hidden rounded-tr-xl bg-gray-900 shadow-2xl">
                    <Image
                      className="size-full object-cover object-top"
                      src="https://res.cloudinary.com/dwibt7nyu/image/upload/v1731953201/bento-grid-1_xetvdd.webp"
                      alt=""
                      width={800}
                      height={800}
                    />
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 lg:rounded-l-[2rem]"></div>
            </div>

            <div className="relative max-lg:row-start-1">
              <div className="absolute inset-px rounded-lg bg-white max-lg:rounded-t-[2rem]"></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]">
                <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                  <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">
                    Seguimiento Inteligente
                  </p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                    Monitorea tu progreso con métricas claras y en tiempo real.
                    Celebra cada logro.
                  </p>
                </div>
                <div className="flex flex-1 items-center justify-center max-lg:-pb-1 max-lg:pt-7 lg:pt-10">
                  <Image
                    // className="w-full max-lg:max-w-xs"
                    className="object-cover object-center pt-6 w-full h-auto max-lg:rounded-lg"
                    src="https://res.cloudinary.com/dwibt7nyu/image/upload/v1731953199/bento-grid-2_viqeaa.webp"
                    alt=""
                    width={800}
                    height={800}
                  />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-t-[2rem]"></div>
            </div>
            
            <div className="relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2">
              <div className="absolute inset-px rounded-lg bg-white"></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                  <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">
                    Comunidad Activa
                  </p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                    Conecta con personas que comparten tus objetivos. Avanza
                    acompañado y motivado.
                  </p>
                </div>
                <div className="flex flex-1 items-center justify-center max-lg:py-6 lg:pt-10">
                  <Image
                    className="h-full w-full object-cover object-center"
                    src="https://res.cloudinary.com/dwibt7nyu/image/upload/v1731953200/bento-grid-3_qmaovj.webp"
                    alt="Comunidad Activa"
                    width={800}
                    height={800}
                  />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5"></div>
            </div>
            <div className="relative lg:row-span-2">
              <div className="absolute inset-px rounded-lg bg-white max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]"></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-r-[calc(2rem+1px)]">
                <div className="px-8 pb-3 pt-8 sm:px-10 sm:pb-0 sm:pt-10">
                  <p className="mt-2 text-lg font-medium tracking-tight text-gray-950 max-lg:text-center">
                    Inspiración Diaria
                  </p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-600 max-lg:text-center">
                    Mensajes motivadores y retos diarios que te mantendrán
                    enfocado y motivado.
                  </p>
                </div>
                <div className="relative min-h-[30rem] w-full grow">
                  <div className="absolute bottom-0 left-10 right-0 top-10 overflow-hidden rounded-tl-xl bg-gray-900 shadow-2xl">
                    <Image
                      className="size-full object-cover object-top"
                      src="https://res.cloudinary.com/dwibt7nyu/image/upload/v1731953199/bento-grid-4_fu1q1f.webp"
                      alt=""
                      width={800}
                      height={800}
                    />
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
