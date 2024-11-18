import Image from "next/image";
import Link from "next/link";

export const HeroSection = () => {
  return (
    <>
      <div className="bg-white">
        <div className="relative isolate">
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 pb-16 pt-2 sm:pt-4 lg:px-8 lg:pt-2">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="relative w-full lg:max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <h1 className="text-pretty text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl">
                    Logra tus metas, acompañado
                  </h1>
                  <p className="mt-8 text-pretty text-lg font-medium text-gray-500 sm:max-w-md sm:text-xl/8 lg:max-w-none">
                    Únete a una comunidad que te inspira y te acompaña. Con
                    Holistia, da pasos hacia una mejor versión de ti mismo
                    mientras compartes el camino con personas que comparten tus
                    sueños. ¡Descubre cómo puedes transformar tu rutina en
                    logros reales!
                  </p>
                  <div className="mt-10 flex items-center gap-x-6">
                    <Link
                      href="#"
                      className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Empieza Ahora
                    </Link>
                    <Link
                      href="#"
                      className="text-sm/6 font-semibold text-gray-900"
                    >
                      Conoce Más <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
                <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
                  <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                    <div className="relative">
                      <Image
                        alt=""
                        src="https://res.cloudinary.com/dwibt7nyu/image/upload/v1731952448/hero-section-4_inscuu.webp"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        width={396}
                        height={528}
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                  <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                    <div className="relative">
                      <Image
                        alt=""
                        src="https://res.cloudinary.com/dwibt7nyu/image/upload/v1731952445/hero-section-3_diwv11.webp"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        width={396}
                        height={528}
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                    <div className="relative">
                      <Image
                        alt=""
                        src="https://res.cloudinary.com/dwibt7nyu/image/upload/v1731952444/hero-section-2_dhojcs.webp"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        width={396}
                        height={528}
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                  <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                    <div className="relative">
                      <Image
                        alt=""
                        src="https://res.cloudinary.com/dwibt7nyu/image/upload/v1731952444/hero-section-5_uwkfkp.webp"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        width={396}
                        height={528}
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                    <div className="relative">
                      <Image
                        alt=""
                        src="https://res.cloudinary.com/dwibt7nyu/image/upload/v1731952445/hero-section-1_bloopx.webp"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                        width={396}
                        height={528}
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
