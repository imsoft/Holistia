import { Metadata } from "next";
import { generateStaticMetadata } from "@/lib/seo";

export const metadata: Metadata = generateStaticMetadata({
  title: "Nuestra Historia - Holistia",
  description: "Conoce la historia de Holistia, cómo nació nuestra plataforma de salud integral y nuestra misión de conectar pacientes con expertos en México.",
  keywords: [
    "historia Holistia",
    "plataforma salud integral",
    "bienestar México",
    "misión Holistia",
    "salud mental",
    "conectar pacientes expertos",
  ],
  path: "/history",
});

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/5 via-primary/3 to-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 lg:pt-32 lg:px-8 pb-8 sm:pb-12">
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-foreground">
              Nuestra Historia
            </h1>
            <p className="mt-4 sm:mt-6 lg:mt-8 text-base sm:text-lg lg:text-xl leading-7 sm:leading-8 text-muted-foreground max-w-3xl mx-auto">
              Una historia de pasión por la salud integral, innovación tecnológica y el compromiso 
              de hacer que el bienestar sea accesible para todos.
            </p>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-8 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-10 sm:space-y-16">
            
            {/* The Beginning */}
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8">
                El Comienzo de una Visión
              </h2>
              <div className="text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground space-y-4 sm:space-y-6">
                <p>
                  Todo comenzó con una simple pero poderosa observación: millones de personas en México 
                  enfrentaban barreras significativas para acceder a servicios de salud de calidad. 
                  Ya fuera por limitaciones geográficas, económicas o simplemente por la falta de 
                  información sobre dónde encontrar el profesional adecuado.
                </p>
                <p>
                  En 2023, nuestro equipo fundador, compuesto por expertos y 
                  tecnólogos apasionados, se propuso una misión ambiciosa: democratizar el acceso 
                  a la salud integral a través de la tecnología.
                </p>
              </div>
            </div>

            {/* The Vision */}
            <div className="bg-muted/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8">
                Una Visión Integral
              </h2>
              <div className="text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground space-y-4 sm:space-y-6">
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
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 sm:mb-8">
                El Camino Recorrido
              </h2>
              <div className="text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground space-y-4 sm:space-y-6">
                <p>
                  Los primeros meses fueron de aprendizaje constante. Trabajamos mano a mano con 
                  expertos para entender sus necesidades, sus desafíos y sus 
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-10 sm:mt-16">
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Accesibilidad</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Creemos que todos merecen acceso a servicios de salud de calidad, 
                    independientemente de su ubicación o situación económica.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Calidad</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Trabajamos únicamente con profesionales certificados y verificados 
                    para garantizar la mejor atención posible.
                  </p>
                </div>
              </div>
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Innovación</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Utilizamos tecnología de vanguardia para mejorar continuamente 
                    la experiencia de nuestros usuarios.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Compromiso</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Estamos comprometidos con el bienestar integral de nuestros usuarios, 
                    no solo con tratar síntomas.
                  </p>
                </div>
              </div>
            </div>

            {/* Future Vision */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-border shadow-sm">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">
                Mirando hacia el Futuro
              </h2>
              <div className="text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground space-y-4">
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
