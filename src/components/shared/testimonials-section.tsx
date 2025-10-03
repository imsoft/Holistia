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
  {
    body: "El proceso de reserva de citas es súper sencillo. En pocos minutos pude agendar mi consulta y el profesional llegó puntual. La experiencia fue excelente desde el inicio hasta el final.",
    author: {
      name: "Roberto Silva",
      handle: "roberto_silva",
      imageUrl:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
  },
  {
    body: "Holistia me ayudó a encontrar el apoyo que necesitaba durante un momento difícil. La variedad de profesionales disponibles y la facilidad para conectarme con ellos fue increíble.",
    author: {
      name: "Laura Martínez",
      handle: "laura_martinez",
      imageUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
  },
  {
    body: "Como terapeuta, Holistia me ha permitido expandir mi práctica y ayudar a más personas. La plataforma es confiable y el soporte técnico siempre está disponible cuando lo necesito.",
    author: {
      name: "Lic. Patricia López",
      handle: "lic_patricia_lopez",
      imageUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
  },
  {
    body: "La privacidad y seguridad de mis datos personales fue una de las cosas que más me convenció de usar Holistia. Además, los profesionales están muy bien seleccionados y certificados.",
    author: {
      name: "Fernando Herrera",
      handle: "fernando_herrera",
      imageUrl:
        "https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
  },
  {
    body: "Holistia me conectó con un nutricionista que transformó completamente mi relación con la comida. El seguimiento y la atención personalizada fueron excepcionales.",
    author: {
      name: "Sofía Ramírez",
      handle: "sofia_ramirez",
      imageUrl:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
  },
  {
    body: "La flexibilidad de horarios y la posibilidad de tener consultas virtuales o presenciales según mi conveniencia es lo que más me gusta de Holistia. Siempre encuentro un horario que se adapta a mi agenda.",
    author: {
      name: "Miguel Torres",
      handle: "miguel_torres",
      imageUrl:
        "https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
  },
];

export const TestimonialsSection = () => {
  return (
    <div className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base/7 font-semibold text-primary">
            Testimonios
          </h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
            Miles de personas han transformado su bienestar con Holistia
          </p>
        </div>
        <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="-mt-8 sm:-mx-4 sm:columns-2 sm:text-[0] lg:columns-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author.handle}
                className="pt-8 sm:inline-block sm:w-full sm:px-4"
              >
                <figure className="rounded-2xl bg-card p-8 text-sm/6">
                  <blockquote className="text-card-foreground">
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
