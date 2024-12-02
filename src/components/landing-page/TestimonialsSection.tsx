import { cn } from "@/lib/utils";
import Image from "next/image";

const featuredTestimonial = {
  body: "Hola Monse, buenas tardes. ¿Cómo estás? Subí hoy mi foto a IG. Creo que el próximo lunes ya comienzo de nuevo con el ejercicio 🥴. No era dengue lo que tenía, sino fiebre tifoidea 🙃, por andar comiendo en la calle 😆. Me gustó mucho volver a comer verduras y llevar una alimentación saludable en casa, no sabes cuánto me ayudó 🫶🏻. Muchas gracias por invitarme al reto y, sobre todo, muchas gracias por ayudarme a cambiar mis hábitos para sentirme mejor. 🙏",
  author: {
    name: "Carolina",
    imageUrl:
      "https://res.cloudinary.com/dwibt7nyu/image/upload/v1731971061/carolina_qgozyl.webp",
    logoUrl: "https://res.cloudinary.com/dwibt7nyu/image/upload/v1726956022/H_Negro_ja7utg.svg",
  },
};

const testimonials = [
  [
    [
      {
        body: "Vamos por un día más, gracias a Dios. Día #9, ¡con todo, compañero @Santiago, sin parar! 🫡🏃‍♂️",
        author: {
          name: "Armando",
          imageUrl:
            "https://res.cloudinary.com/dwibt7nyu/image/upload/v1731971061/armando_pn3rh2.webp",
        },
      },
      {
        body: "Quiero compartirles algo. Yo elegí ejercicio y, junto a mi compañera, que es muy linda, estamos poniendo nuestro mayor esfuerzo. Ahí vamos, haciendo acuerdos y logrando nuestras metas. Estoy muy contenta, y se siente bonito que alguien te anime. Gracias, @Karla Perez. Vamos con todo, sé que sí lo vamos a lograr. Gracias por este grupo. Me puse sensible… jajaja.",
        author: {
          name: "Fernanda",
          imageUrl:
            "https://res.cloudinary.com/dwibt7nyu/image/upload/v1731971393/fernanda_i28tnq.tiff",
        },
      },
    ],
    // [
    //   {
    //     body: "Hola Monse buenas tardes como estás? ... Subí hoy mi foto a lg !! Yo creo que él próximo lunes ya comienzo de nuevo con el ejercicio ... No era dengue lo que tenía si no Fiebre tifoidea por andar comiendo en la calle !!! Me gustó mucho comenzar de nuevo a comer verduras y saludable en casa, no sabes cómo me ayudó Muchas gracias por invitarme al reto y sobre todo muchas gracias por permitirme cambiarlo por no sentirme al 100",
    //     author: {
    //       name: "Carolina",
    //       imageUrl:
    //         "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    //     },
    //   },
    // ],
  ],
  [
    // [
    //   {
    //     body: "Voluptas quos itaque ipsam in voluptatem est. Iste eos blanditiis repudiandae. Earum deserunt enim molestiae ipsum perferendis recusandae saepe corrupti.",
    //     author: {
    //       name: "Tom Cook",
    //       imageUrl:
    //         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    //     },
    //   },
    // ],
    [
      {
        body: "¡Es una experiencia increíble, más momentos como estos! Gracias por compartir sus mejores momentos y logros. Son una gran familia; les mando un mega abrazo 🫂 súper fuerte. ¡Vamos por más metas, amig@s!",
        author: {
          name: "Santiago",
          imageUrl:
            "https://res.cloudinary.com/dwibt7nyu/image/upload/v1731971061/santiago_iaiewi.webp",
        },
      },
      {
        body: "¡Muchas gracias por sus felicitaciones! Qué bonito grupo hemos construido. Sigamos así para que cada vez sea más fácil lograr nuestros hábitos 💪💥😉🤩👏",
        author: {
          name: "Cristina",
          imageUrl:
            "https://res.cloudinary.com/dwibt7nyu/image/upload/v1731971060/cristina_gdddy0.webp",
        },
      },
    ],
  ],
];

export const TestimonialsSection = () => {
  return (
    <>
      <div className="relative isolate bg-white pb-16 pt-12 sm:pt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-base/7 font-semibold text-holistia-600">
              Testimonios
            </h2>
            <p className="mt-2 text-balance text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
              Historias que Inspiran
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 grid-rows-1 gap-8 text-sm/6 text-gray-900 sm:mt-20 sm:grid-cols-2 xl:mx-0 xl:max-w-none xl:grid-flow-col xl:grid-cols-4">
            <figure className="rounded-2xl bg-white shadow-lg ring-1 ring-gray-900/5 sm:col-span-2 xl:col-start-2 xl:row-end-1">
              <blockquote className="p-6 text-lg font-semibold tracking-tight text-gray-900 sm:p-12 sm:text-xl/8">
                <p>{`“${featuredTestimonial.body}”`}</p>
              </blockquote>
              <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-4 border-t border-gray-900/10 px-6 py-4 sm:flex-nowrap">
                <Image
                  alt=""
                  src={featuredTestimonial.author.imageUrl}
                  className="size-10 flex-none rounded-full bg-gray-50"
                  width={40}
                  height={40}
                />
                <div className="flex-auto">
                  <div className="font-semibold">
                    {featuredTestimonial.author.name}
                  </div>
                </div>
                <Image
                  alt=""
                  src={featuredTestimonial.author.logoUrl}
                  className="h-10 w-auto flex-none"
                  width={40}
                  height={40}
                />
              </figcaption>
            </figure>
            {testimonials.map((columnGroup, columnGroupIdx) => (
              <div
                key={columnGroupIdx}
                className="space-y-8 xl:contents xl:space-y-0"
              >
                {columnGroup.map((column, columnIdx) => (
                  <div
                    key={columnIdx}
                    className={cn(
                      (columnGroupIdx === 0 && columnIdx === 0) ||
                        (columnGroupIdx === testimonials.length - 1 &&
                          columnIdx === columnGroup.length - 1)
                        ? "xl:row-span-2"
                        : "xl:row-start-1",
                      "space-y-8"
                    )}
                  >
                    {column.map((testimonial) => (
                      <figure
                        key={testimonial.author.name}
                        className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-900/5"
                      >
                        <blockquote className="text-gray-900">
                          <p>{`“${testimonial.body}”`}</p>
                        </blockquote>
                        <figcaption className="mt-6 flex items-center gap-x-4">
                          <Image
                            alt=""
                            src={testimonial.author.imageUrl}
                            className="size-10 rounded-full object-cover bg-gray-50"
                            width={40}
                            height={40}
                          />
                          <div>
                            <div className="font-semibold">
                              {testimonial.author.name}
                            </div>
                          </div>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
