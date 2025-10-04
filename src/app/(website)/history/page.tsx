import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, Users, Shield, Lightbulb } from "lucide-react";

export const metadata: Metadata = {
  title: "Nuestra Historia - Holistia",
  description: "Conoce la historia de Holistia, cómo nació nuestra plataforma de salud integral y nuestra misión de conectar pacientes con profesionales de la salud.",
};

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/5 via-primary/3 to-background">
        <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
              Nuestra Historia
            </h1>
            <p className="mt-8 text-xl leading-8 text-muted-foreground max-w-3xl mx-auto">
              Una historia de pasión por la salud integral, innovación tecnológica y el compromiso 
              de hacer que el bienestar sea accesible para todos.
            </p>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="space-y-16">
            
            {/* The Beginning */}
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                El Comienzo de una Visión
              </h2>
              <div className="text-lg leading-8 text-muted-foreground space-y-6">
                <p>
                  Todo comenzó con una simple pero poderosa observación: millones de personas en México 
                  enfrentaban barreras significativas para acceder a servicios de salud de calidad. 
                  Ya fuera por limitaciones geográficas, económicas o simplemente por la falta de 
                  información sobre dónde encontrar el profesional adecuado.
                </p>
                <p>
                  En 2023, nuestro equipo fundador, compuesto por profesionales de la salud y 
                  tecnólogos apasionados, se propuso una misión ambiciosa: democratizar el acceso 
                  a la salud integral a través de la tecnología.
                </p>
              </div>
            </div>

            {/* The Vision */}
            <div className="bg-muted/30 rounded-3xl p-8 sm:p-12">
              <div className="text-center mb-8">
                <Heart className="w-16 h-16 text-primary mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Una Visión Integral
                </h2>
              </div>
              <div className="text-lg leading-8 text-muted-foreground space-y-6 max-w-3xl mx-auto">
                <p>
                  Creemos firmemente que la salud no se trata solo de tratar enfermedades, sino de 
                  promover el bienestar integral. Por eso, desde el primer día, nos enfocamos en 
                  crear un ecosistema que abarcara desde la salud mental y la terapia psicológica, 
                  hasta la nutrición y la medicina preventiva.
                </p>
                <p>
                  Nuestra plataforma fue diseñada no solo para conectar pacientes con profesionales, 
                  sino para crear relaciones duraderas basadas en la confianza, la calidad y el 
                  compromiso mutuo con el bienestar.
                </p>
              </div>
            </div>

            {/* The Journey */}
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                El Camino Recorrido
              </h2>
              <div className="text-lg leading-8 text-muted-foreground space-y-6">
                <p>
                  Los primeros meses fueron de aprendizaje constante. Trabajamos mano a mano con 
                  profesionales de la salud para entender sus necesidades, sus desafíos y sus 
                  aspiraciones. Cada conversación, cada feedback, cada sugerencia nos ayudó a 
                  moldear una plataforma verdaderamente útil.
                </p>
                <p>
                  En 2024, lanzamos oficialmente Holistia con un grupo selecto de profesionales 
                  especializados en psicología y terapia. La respuesta fue abrumadora: en solo 
                  unas semanas, cientos de pacientes encontraron el apoyo que necesitaban.
                </p>
                <p>
                  La expansión llegó naturalmente. Incorporamos especialistas en nutrición, 
                  medicina preventiva y bienestar integral. Cada nueva especialidad nos permitió 
                  ofrecer una experiencia más completa y satisfacer las necesidades diversas de 
                  nuestros usuarios.
                </p>
              </div>
            </div>

            {/* Values Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Users className="w-8 h-8 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Accesibilidad</h3>
                    <p className="text-muted-foreground">
                      Creemos que todos merecen acceso a servicios de salud de calidad, 
                      independientemente de su ubicación o situación económica.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Shield className="w-8 h-8 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Calidad</h3>
                    <p className="text-muted-foreground">
                      Trabajamos únicamente con profesionales certificados y verificados 
                      para garantizar la mejor atención posible.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Lightbulb className="w-8 h-8 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Innovación</h3>
                    <p className="text-muted-foreground">
                      Utilizamos tecnología de vanguardia para mejorar continuamente 
                      la experiencia de nuestros usuarios.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <Heart className="w-8 h-8 text-primary mt-1" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Compromiso</h3>
                    <p className="text-muted-foreground">
                      Estamos comprometidos con el bienestar integral de nuestros usuarios, 
                      no solo con tratar síntomas.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Future Vision */}
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-3xl p-8 sm:p-12 text-center">
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Mirando hacia el Futuro
              </h2>
              <div className="text-lg leading-8 text-muted-foreground max-w-3xl mx-auto space-y-4">
                <p>
                  Hoy, Holistia continúa evolucionando. Estamos implementando tecnologías 
                  avanzadas como inteligencia artificial para mejorar las recomendaciones 
                  de profesionales y hacer que el proceso de encontrar el apoyo adecuado 
                  sea aún más personalizado y efectivo.
                </p>
                <p>
                  Nuestra visión sigue siendo la misma: crear un mundo donde el acceso a 
                  la salud integral sea universal, donde cada persona pueda encontrar el 
                  apoyo que necesita para vivir una vida plena y saludable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
