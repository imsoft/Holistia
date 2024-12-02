import Image from "next/image";
import { FaHandsHelping } from "react-icons/fa";
import { GiProgression } from "react-icons/gi";
import { HiClipboardDocumentCheck } from "react-icons/hi2";

const features = [
  {
    name: "Planes personalizados",
    description:
      "Diseña tu camino hacia el bienestar con objetivos que se adapten a tus necesidades.",
    icon: HiClipboardDocumentCheck,
  },
  {
    name: "Seguimiento y Progreso",
    description: "Visualiza tus avances y celebra cada pequeño logro.",
    icon: GiProgression,
  },
  {
    name: "Apoyo constante",
    description:
      "Comparte tu camino con una comunidad que te inspira y motiva.",
    icon: FaHandsHelping,
  },
];

export const FeatureSection = () => {
  return (
    <>
      <div className="overflow-hidden bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <div className="lg:ml-auto lg:pl-4 lg:pt-4">
              <div className="lg:max-w-lg">
                <h2 className="text-base/7 font-semibold text-holistia-600">
                  Holistia
                </h2>
                <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                  Todo para alcanzar tus metas de bienestar
                </p>
                <p className="mt-6 text-lg/8 text-gray-600">
                  Explora herramientas diseñadas para impulsarte, acompañarte y
                  mantenerte enfocado en lo que realmente importa.
                </p>
                <dl className="mt-10 max-w-xl space-y-8 text-base/7 text-gray-600 lg:max-w-none">
                  {features.map((feature) => (
                    <div key={feature.name} className="relative pl-9">
                      <dt className="inline font-semibold text-gray-900">
                        <feature.icon
                          aria-hidden="true"
                          className="absolute left-1 top-1 size-5 text-holistia-600"
                        />
                        {feature.name}
                      </dt>{" "}
                      <dd className="inline">{feature.description}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <div className="flex items-start justify-end lg:order-first">
              <Image
                alt=""
                src="https://res.cloudinary.com/dwibt7nyu/image/upload/v1731952783/feature-section_mwakhe.webp"
                width={2432}
                height={1442}
                className="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[57rem]"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
