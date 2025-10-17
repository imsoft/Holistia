import Image from "next/image";

const testimonials = [
  {
    body: "Holistia me permitió encontrar la opción perfecta de terapia para mi proceso de desarrollo, en mi etapa y con mis necesidades actuales.",
    author: {
      name: "María González",
      handle: "maria_gonzalez",
      imageUrl: "/testimonials/testimonial_1.jpeg",
    },
  },
  {
    body: "Como experto, Holistia me ha permitido llegar a más pacientes y ofrecer mis servicios de manera más eficiente. La plataforma es intuitiva y el sistema de pagos funciona perfectamente.",
    author: {
      name: "Dr. Carlos Mendoza",
      handle: "dr_carlos_mendoza",
      imageUrl: "/testimonials/testimonial_2.jpeg",
    },
  },
  {
    body: "La terapia online a través de Holistia fue exactamente lo que necesitaba. Pude tener sesiones desde la comodidad de mi hogar y mi terapeuta fue muy profesional y empática.",
    author: {
      name: "Ana Rodríguez",
      handle: "ana_rodriguez",
      imageUrl: "/testimonials/testimonial_3.jpeg",
    },
  },
];

export const TestimonialsSection = () => {
  return (
    <div className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base/7 font-semibold text-primary">
            Testimonios
          </h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
            Miles de personas han transformado su bienestar con Holistia
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-6xl sm:mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.author.handle}>
                <figure className="rounded-2xl bg-card p-8 text-sm/6 h-full flex flex-col">
                  <blockquote className="text-card-foreground flex-grow">
                    <p>{`"${testimonial.body}"`}</p>
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-x-4">
                    <Image
                      alt=""
                      src={testimonial.author.imageUrl}
                      className="size-10 rounded-full bg-muted"
                      width={40}
                      height={40}
                    />
                    <div>
                      <div className="font-semibold text-foreground">
                        {testimonial.author.name}
                      </div>
                      <div className="text-muted-foreground">{`@${testimonial.author.handle}`}</div>
                    </div>
                  </figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
