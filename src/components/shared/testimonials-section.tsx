import Image from "next/image";

const testimonials = [
  {
    body: "Holistia cambió completamente mi perspectiva sobre el cuidado de la salud. Encontré una psicóloga increíble que me ayudó a superar mi ansiedad. La plataforma es muy fácil de usar y los profesionales son de primera calidad.",
    author: {
      name: "María González",
      handle: "maria_gonzalez",
      imageUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
  },
  {
    body: "Como profesional de la salud, Holistia me ha permitido llegar a más pacientes y ofrecer mis servicios de manera más eficiente. La plataforma es intuitiva y el sistema de pagos funciona perfectamente.",
    author: {
      name: "Dr. Carlos Mendoza",
      handle: "dr_carlos_mendoza",
      imageUrl:
        "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
  },
  {
    body: "La terapia online a través de Holistia fue exactamente lo que necesitaba. Pude tener sesiones desde la comodidad de mi hogar y mi terapeuta fue muy profesional y empática.",
    author: {
      name: "Ana Rodríguez",
      handle: "ana_rodriguez",
      imageUrl:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
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
