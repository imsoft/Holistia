import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Nuestra Historia - Holistia",
  description: "Conoce la historia de Holistia, cómo nació nuestra plataforma de salud integral y nuestra misión de conectar pacientes con profesionales de la salud.",
};

const milestones = [
  {
    year: "2023",
    title: "El Inicio",
    description: "Holistia nace de la visión de crear una plataforma que democratice el acceso a servicios de salud integral de calidad.",
    image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop&crop=center"
  },
  {
    year: "2024",
    title: "Primeros Pasos",
    description: "Lanzamos la plataforma con los primeros profesionales de psicología y terapia, estableciendo las bases de nuestro ecosistema de salud.",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop&crop=center"
  },
  {
    year: "2024",
    title: "Expansión",
    description: "Incorporamos especialidades en nutrición, medicina preventiva y bienestar, ampliando nuestra oferta de servicios de salud integral.",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop&crop=center"
  },
  {
    year: "2025",
    title: "Innovación",
    description: "Implementamos tecnología avanzada para mejorar la experiencia del usuario y facilitar las conexiones entre pacientes y profesionales.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop&crop=center"
  }
];

const values = [
  {
    title: "Accesibilidad",
    description: "Creemos que todos merecen acceso a servicios de salud de calidad, independientemente de su ubicación o situación económica."
  },
  {
    title: "Calidad",
    description: "Trabajamos únicamente con profesionales certificados y verificados para garantizar la mejor atención posible."
  },
  {
    title: "Innovación",
    description: "Utilizamos tecnología de vanguardia para mejorar continuamente la experiencia de nuestros usuarios."
  },
  {
    title: "Compromiso",
    description: "Estamos comprometidos con el bienestar integral de nuestros usuarios, no solo con tratar síntomas."
  }
];

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Nuestra Historia
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Descubre cómo Holistia se convirtió en la plataforma líder en salud integral, 
              conectando a miles de pacientes con profesionales de la salud certificados.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Nuestra Misión
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Transformar la manera en que las personas acceden y experimentan los servicios de salud, 
              creando un ecosistema donde el bienestar integral sea accesible, personalizado y de la más alta calidad.
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="py-24 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Nuestro Camino
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Desde nuestros humildes comienzos hasta convertirnos en la plataforma de referencia en salud integral.
            </p>
          </div>
          
          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div key={index} className={`flex flex-col lg:flex-row items-center gap-8 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm font-semibold text-primary mb-2">
                        {milestone.year}
                      </div>
                      <h3 className="text-2xl font-bold text-foreground mb-4">
                        {milestone.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {milestone.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex-1">
                  <div className="relative h-64 w-full rounded-lg overflow-hidden">
                    <Image
                      src={milestone.image}
                      alt={milestone.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Nuestros Valores
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Los principios que guían cada decisión que tomamos y cada servicio que ofrecemos.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 sm:py-32 bg-primary/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Únete a Nuestra Historia
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Sé parte de la transformación en la manera en que experimentamos la salud y el bienestar.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/signup">
                  Comenzar Ahora
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">
                  Contáctanos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
