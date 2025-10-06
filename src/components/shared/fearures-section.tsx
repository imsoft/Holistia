import {
  Users,
  Calendar,
  Shield,
  Heart,
  MessageCircle,
  CreditCard,
} from "lucide-react";

const features = [
  {
    name: "Expertos",
    description:
      "Explora y reserva con expertos en diferentes áreas del bienestar holístico.",
    icon: Users,
  },
  {
    name: "Eventos y talleres",
    description:
      "Explora y reserva experiencias, talleres y eventos diseñados para tu crecimiento y transformación.",
    icon: Calendar,
  },
  {
    name: "Centros",
    description:
      "Descubre centros especializados para explorar y potenciar tu bienestar integral.",
    icon: Shield,
  },
  {
    name: "Restaurantes y comercios",
    description:
      "Descubre opciones de restaurantes y comercios que apoyan tu estilo de vida saludable.",
    icon: Heart,
  },
  {
    name: "Comunidades",
    description:
      "Explora y conecta con diferentes comunidades hasta encontrar la que resuene contigo.",
    icon: MessageCircle,
  },
  {
    name: "Blog",
    description:
      "Explora artículos, consejos y detalles sobre técnicas y herramientas de sanación de nuestros profesionales.",
    icon: CreditCard,
  },
];

export const FeaturesSection = () => {
  return (
    <div className="relative bg-background py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-md px-6 text-center sm:max-w-3xl lg:max-w-7xl lg:px-8">
        <h2 className="text-lg font-semibold text-primary">
          No hay mejor tratamiento que el tiempo que te dedicas
        </h2>
        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          ¿Cómo funciona Holistia?
        </p>
        <p className="mx-auto mt-5 max-w-prose text-xl text-muted-foreground">
          Explora lo que más te interesa: terapias, talleres, comunidades o
          experiencias únicas. Elige lo que resuene contigo, agenda en minutos y
          comienza a transformar tu vida con acompañamiento profesional y
          cercano.
        </p>
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="pt-6 h-full">
                <div className="rounded-lg bg-card px-6 pb-8 h-full flex flex-col">
                  <div className="-mt-6 flex flex-col h-full">
                    <div>
                      <span className="inline-flex items-center justify-center rounded-xl bg-primary p-3 shadow-lg">
                        <feature.icon
                          aria-hidden="true"
                          className="size-8 text-primary-foreground"
                        />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg/8 font-semibold tracking-tight text-card-foreground">
                      {feature.name}
                    </h3>
                    <p className="mt-5 text-base/7 text-muted-foreground flex-grow">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
