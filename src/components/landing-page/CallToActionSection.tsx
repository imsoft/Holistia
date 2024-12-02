import Link from "next/link";

export const CallToActionSection = () => {
  return (
    <>
      <div className="bg-white">
        <div className="mt-10 px-6 py-32 sm:px-6 sm:py-40 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              Cambia tu vida, comienza hoy
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg/8 text-gray-600">
              Empieza a alcanzar tus metas con Holistia. <br /> Únete a una
              comunidad que te impulsa a dar lo mejor de ti.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="https://wa.me/+523339550061?text=Hola,%20me%20interesa%20saber%20sobre%20Holistia%20🧘‍♀️"
                className="rounded-md bg-holistia-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-holistia-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-holistia-600"
              >
                Comienza hoy
              </Link>
              <Link
                href="https://www.instagram.com/holistia_io/"
                className="text-sm/6 font-semibold text-gray-900"
              >
                Conoce Más <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
