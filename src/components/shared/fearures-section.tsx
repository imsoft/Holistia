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
    name: "Profesionales Certificados",
    description:
      "Conecta con terapeutas, psicólogos y profesionales de la salud verificados y certificados para tu bienestar integral.",
    icon: Users,
  },
  {
    name: "Citas Fáciles",
    description:
      "Reserva tu cita en línea de manera rápida y segura. Agenda consultas presenciales o virtuales según tu preferencia.",
    icon: Calendar,
  },
  {
    name: "Privacidad Garantizada",
    description:
      "Tu información personal y de salud está protegida con los más altos estándares de seguridad y confidencialidad.",
    icon: Shield,
  },
  {
    name: "Salud Integral",
    description:
      "Accede a una amplia gama de servicios de salud mental, física y emocional en un solo lugar.",
    icon: Heart,
  },
  {
    name: "Soporte 24/7",
    description:
      "Recibe atención y soporte cuando lo necesites. Nuestro equipo está disponible para resolver tus dudas.",
    icon: MessageCircle,
  },
  {
    name: "Pagos Seguros",
    description:
      "Realiza pagos seguros con Stripe. Reserva tu cita con comodidad y transparencia en los precios.",
    icon: CreditCard,
  },
];

export const FeaturesSection = () => {
  return (
    <div className="relative bg-background py-24 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-md px-6 text-center sm:max-w-3xl lg:max-w-7xl lg:px-8">
        <h2 className="text-lg font-semibold text-primary">Tu bienestar es nuestra prioridad</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Todo lo que necesitas para cuidar tu salud integral
        </p>
        <p className="mx-auto mt-5 max-w-prose text-xl text-muted-foreground">
          Conectamos pacientes con profesionales de la salud certificados para brindarte 
          una experiencia completa de bienestar. Desde terapia psicológica hasta consultas 
          médicas, todo en una plataforma segura y confiable.
        </p>
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="pt-6">
                <div className="flow-root rounded-lg bg-card px-6 pb-8">
                  <div className="-mt-6">
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
                    <p className="mt-5 text-base/7 text-muted-foreground">
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
