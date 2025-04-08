import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Users,
  Sparkles,
  Brain,
  Zap,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Menu,
  ChevronRight,
} from "lucide-react";

const HomePage = () => {
  return (
    <>
      <div className="min-h-screen bg-[#0D0D0D] text-white overflow-hidden">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <CommunitySection />
          <TestimonialsSection />
          <CtaSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default HomePage;

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 z-10">
          <Image
            src="/holistia-blanco.png"
            alt="Holistia"
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group"
          >
            Características
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link
            href="#community"
            className="text-sm font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group"
          >
            Comunidad
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link
            href="#testimonials"
            className="text-sm font-medium text-white/80 hover:text-[#AC89FF] transition-colors relative group"
          >
            Testimonios
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="hidden md:flex text-white hover:bg-gradient-to-r hover:from-[#AC89FF]/20 hover:to-[#83C7FD]/20 transition-all duration-300 hover:scale-105 group"
          >
            <span className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] bg-clip-text group-hover:text-transparent transition-all duration-300">
              Iniciar sesión
            </span>
          </Button>
          <Button className="bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AC89FF] text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#AC89FF]/20 relative overflow-hidden group">
            <span className="relative z-10">Registrarse</span>
            <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF]/0 via-white/20 to-[#AC89FF]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden text-white">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
      {/* Gradient blobs */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#AC89FF]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#83C7FD]/10 rounded-full blur-[100px] -z-10"></div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-[#AC89FF]/20 to-[#83C7FD]/20 text-[#AC89FF] text-sm font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5 mr-2" />
            <span>Descubre una nueva forma de bienestar</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-[#AC89FF] to-[#83C7FD] bg-clip-text text-transparent">
            Conecta con tu bienestar integral
          </h1>

          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Holistia es un ecosistema digital que conecta a quienes buscan
            mejorar su calidad de vida con profesionales especializados en
            terapias alternativas, nutrición, mindfulness y entrenamiento
            físico.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#AFF344] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AFF344] text-[#0D0D0D] font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#AFF344]/20 relative overflow-hidden group"
            >
              <span className="relative z-10">Comenzar ahora</span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#AFF344]/0 via-white/20 to-[#AFF344]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
            </Button>
            <Button
              size="lg"
              className="bg-transparent border-2 border-[#AC89FF] text-[#AC89FF] hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#AC89FF]/20 relative overflow-hidden group"
            >
              <span className="relative z-10">Conocer más</span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </Button>
          </div>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Decorative elements */}
          <div className="absolute -top-10 -left-10 w-20 h-20 bg-gradient-to-r from-[#AFF344] to-[#AC89FF] rounded-full blur-xl opacity-50"></div>
          <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-gradient-to-r from-[#83C7FD] to-[#FFE5BE] rounded-full blur-xl opacity-50"></div>

          {/* Main image */}
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-[#AC89FF]/10">
            <Image
              src="https://images.unsplash.com/photo-1595118709609-575ef33e3d4e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Holistia wellness platform"
              width={1200}
              height={600}
              className="w-full h-auto object-cover"
              priority
            />

            {/* Overlay with stats */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] to-transparent flex items-end">
              <div className="w-full p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
                  <p className="text-[#AFF344] text-3xl font-bold">1000+</p>
                  <p className="text-white/70 text-sm">Profesionales</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
                  <p className="text-[#AC89FF] text-3xl font-bold">15+</p>
                  <p className="text-white/70 text-sm">Especialidades</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
                  <p className="text-[#83C7FD] text-3xl font-bold">10K+</p>
                  <p className="text-white/70 text-sm">Usuarios activos</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
                  <p className="text-[#FF9900] text-3xl font-bold">5K+</p>
                  <p className="text-white/70 text-sm">Sesiones realizadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 relative">
      {/* Gradient blobs */}
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#AFF344]/5 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#AC89FF]/5 rounded-full blur-[100px] -z-10"></div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-[#AFF344]/20 to-[#83C7FD]/20 text-[#AFF344] text-sm font-medium mb-6">
            <Zap className="h-3.5 w-3.5 mr-2" />
            <span>Características principales</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Un ecosistema completo para tu bienestar
          </h2>

          <p className="text-lg text-white/70">
            Holistia va más allá de la conexión entre usuarios y especialistas:
            fomentamos comunidad, aprendizaje y experiencias compartidas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Brain className="h-6 w-6 text-[#AC89FF]" />}
            title="Salud mental"
            description="Conecta con profesionales especializados en terapias alternativas y mindfulness para cuidar tu bienestar emocional."
            gradient="from-[#AC89FF]/20 to-[#83C7FD]/20"
            hoverGradient="from-[#AC89FF]/30 to-[#83C7FD]/30"
          />

          <FeatureCard
            icon={<Heart className="h-6 w-6 text-[#AFF344]" />}
            title="Bienestar físico"
            description="Encuentra entrenadores personales, nutricionistas y especialistas en medicina alternativa para tu salud física."
            gradient="from-[#AFF344]/20 to-[#83C7FD]/20"
            hoverGradient="from-[#AFF344]/30 to-[#83C7FD]/30"
          />

          <FeatureCard
            icon={<Users className="h-6 w-6 text-[#83C7FD]" />}
            title="Comunidad activa"
            description="Forma parte de grupos con intereses similares, participa en eventos y comparte experiencias con otros usuarios."
            gradient="from-[#83C7FD]/20 to-[#FFE5BE]/20"
            hoverGradient="from-[#83C7FD]/30 to-[#FFE5BE]/30"
          />

          <FeatureCard
            icon={<Sparkles className="h-6 w-6 text-[#FFE5BE]" />}
            title="Contenido personalizado"
            description="Recibe recomendaciones de contenido educativo y prácticas adaptadas a tus necesidades e intereses."
            gradient="from-[#FFE5BE]/20 to-[#FF9900]/20"
            hoverGradient="from-[#FFE5BE]/30 to-[#FF9900]/30"
          />

          <FeatureCard
            icon={<Calendar className="h-6 w-6 text-[#FF9900]" />}
            title="Agenda inteligente"
            description="Programa sesiones con profesionales, recibe recordatorios y gestiona tu calendario de bienestar."
            gradient="from-[#FF9900]/20 to-[#AC89FF]/20"
            hoverGradient="from-[#FF9900]/30 to-[#AC89FF]/30"
          />

          <FeatureCard
            icon={<Zap className="h-6 w-6 text-[#AFF344]" />}
            title="Seguimiento de progreso"
            description="Visualiza tu evolución, establece metas y celebra tus logros en tu camino hacia el bienestar integral."
            gradient="from-[#AFF344]/20 to-[#AC89FF]/20"
            hoverGradient="from-[#AFF344]/30 to-[#AC89FF]/30"
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: // hoverGradient,
{
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  hoverGradient?: string;
}) {
  return (
    <div
      className={`p-6 rounded-2xl bg-gradient-to-br ${gradient} backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all hover:translate-y-[-4px] group`}
    >
      <div className="h-12 w-12 rounded-full bg-[#0D0D0D]/50 backdrop-blur-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-white/70">{description}</p>
    </div>
  );
}

function CommunitySection() {
  return (
    <section id="community" className="py-20 md:py-32 relative">
      {/* Gradient blobs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#83C7FD]/10 rounded-full blur-[100px] -z-10"></div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-[#83C7FD]/20 to-[#FFE5BE]/20 text-[#83C7FD] text-sm font-medium mb-6">
              <Users className="h-3.5 w-3.5 mr-2" />
              <span>Comunidad</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Profesionales y redes de networking
            </h2>

            <p className="text-lg text-white/70 mb-8">
              En Holistia, creemos que el bienestar es un viaje compartido.
              Nuestra comunidad está formada por personas como tú, buscando
              balance y crecimiento personal.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-[#AFF344]/30 to-[#83C7FD]/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <ChevronRight className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="text-white/80">
                  Conecta con mentores y compañeros en tu área
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-[#AFF344]/30 to-[#83C7FD]/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <ChevronRight className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="text-white/80">
                  Participa en desafíos grupales para mantener la motivación
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-[#AFF344]/30 to-[#83C7FD]/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <ChevronRight className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="text-white/80">
                  Comparte tus logros y celebra los de otros
                </p>
              </li>
            </ul>

            <Button className="bg-gradient-to-r from-[#83C7FD] to-[#FFE5BE] hover:from-[#FFE5BE] hover:to-[#83C7FD] text-[#0D0D0D] font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#83C7FD]/20 relative overflow-hidden group">
              <span className="relative z-10">Unirse a la comunidad</span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#83C7FD]/0 via-white/20 to-[#83C7FD]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
            </Button>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-r from-[#83C7FD] to-[#AFF344] rounded-full blur-xl opacity-50"></div>
              <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] rounded-full blur-xl opacity-50"></div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden border border-white/10 aspect-square">
                    <Image
                      src="https://images.unsplash.com/photo-1556760544-74068565f05c?q=80&w=2929&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      alt="Community member"
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video">
                    <Image
                      src="https://images.unsplash.com/photo-1483137140003-ae073b395549?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      alt="Wellness activity"
                      width={400}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-10">
                  <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video">
                    <Image
                      src="https://images.unsplash.com/photo-1619968987472-4d1b2784592e?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      alt="Group session"
                      width={400}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-white/10 aspect-square">
                    <Image
                      src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      alt="Meditation class"
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Floating card */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-[#0D0D0D]/80 backdrop-blur-md rounded-xl border border-white/10 p-4 w-3/4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Comunidad activa</p>
                    <p className="text-sm text-white/70">+10,000 miembros</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 md:py-32 relative">
      {/* Gradient blobs */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#FFE5BE]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#AC89FF]/5 rounded-full blur-[100px] -z-10"></div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-[#FFE5BE]/20 to-[#FF9900]/20 text-[#FFE5BE] text-sm font-medium mb-6">
            <Heart className="h-3.5 w-3.5 mr-2" />
            <span>Testimonios</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Lo que nuestra comunidad dice
          </h2>

          <p className="text-lg text-white/70">
            Descubre cómo Holistia ha transformado la vida de nuestros usuarios
            a través de conexiones significativas y experiencias de bienestar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <TestimonialCard
            name="María González"
            role="Miembro desde 2023"
            quote="Holistia me ha ayudado a encontrar un grupo de personas que comparten mi pasión por el yoga y la meditación. Ahora tengo amigos con quienes practicar y compartir experiencias."
            gradient="from-[#AC89FF]/20 to-[#83C7FD]/20"
            avatarGradient="from-[#AC89FF] to-[#83C7FD]"
          />

          <TestimonialCard
            name="Carlos Rodríguez"
            role="Miembro desde 2022"
            quote="Los grupos de apoyo en Holistia fueron fundamentales en mi proceso de adoptar hábitos más saludables. La motivación que recibo de la comunidad es invaluable."
            gradient="from-[#AFF344]/20 to-[#83C7FD]/20"
            avatarGradient="from-[#AFF344] to-[#83C7FD]"
          />

          <TestimonialCard
            name="Laura Martínez"
            role="Miembro desde 2023"
            quote="Gracias a Holistia encontré un mentor que me ha guiado en mi práctica de mindfulness. La plataforma hace que sea fácil conectar con personas que tienen conocimientos para compartir."
            gradient="from-[#FFE5BE]/20 to-[#FF9900]/20"
            avatarGradient="from-[#FFE5BE] to-[#FF9900]"
          />
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  name,
  role,
  quote,
  gradient,
  avatarGradient,
}: {
  name: string;
  role: string;
  quote: string;
  gradient: string;
  avatarGradient: string;
}) {
  return (
    <div
      className={`p-6 rounded-2xl bg-gradient-to-br ${gradient} backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all hover:translate-y-[-4px]`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`h-12 w-12 rounded-full bg-gradient-to-r ${avatarGradient} flex items-center justify-center`}
        >
          <span className="text-lg font-bold text-white">{name.charAt(0)}</span>
        </div>
        <div>
          <h4 className="font-medium">{name}</h4>
          <p className="text-sm text-white/70">{role}</p>
        </div>
      </div>
      <p className="italic text-white/80">{quote}</p>
    </div>
  );
}

function CtaSection() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D0D0D] via-[#0D0D0D] to-[#0D0D0D]/95 -z-20"></div>

      {/* Gradient blobs */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#AC89FF]/10 rounded-full blur-[150px] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#AFF344]/5 rounded-full blur-[150px] -z-10"></div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-3xl border border-white/10 p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#AFF344] via-[#AC89FF] to-[#83C7FD] bg-clip-text text-transparent">
              Comienza tu viaje de bienestar hoy
            </h2>

            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Únete a miles de personas que están transformando su bienestar a
              través de Holistia.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-1">
              <div className="flex flex-col sm:flex-row">
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  className="flex-1 bg-transparent px-4 py-2 h-[30px] text-white placeholder:text-white/50 focus:outline-none"
                />
                <Button className="bg-gradient-to-r from-[#AFF344] to-[#AC89FF] hover:from-[#AC89FF] hover:to-[#AFF344] text-[#0D0D0D] font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#AFF344]/20 relative overflow-hidden group sm:w-auto w-full">
                  <span className="relative z-10">Registrarse</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[#AFF344]/0 via-white/20 to-[#AFF344]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                </Button>
              </div>
            </div>
            <p className="text-xs text-white/50 text-center mt-3">
              Al registrarte, aceptas nuestros{" "}
              <Link
                href="#"
                className="text-[#AC89FF] hover:text-white transition-colors relative group inline-block"
              >
                Términos y Condiciones
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
              </Link>
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <div className="text-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#AC89FF]/30 to-[#83C7FD]/30 flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm text-white/80">Comunidad activa</p>
            </div>
            <div className="text-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#AFF344]/30 to-[#83C7FD]/30 flex items-center justify-center mx-auto mb-3">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm text-white/80">Bienestar integral</p>
            </div>
            <div className="text-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#83C7FD]/30 to-[#FFE5BE]/30 flex items-center justify-center mx-auto mb-3">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm text-white/80">Profesionales verificados</p>
            </div>
            <div className="text-center">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#FFE5BE]/30 to-[#FF9900]/30 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm text-white/80">
                Experiencias personalizadas
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 md:py-16 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/holistia-blanco.png"
                alt="Holistia"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-sm text-white/70">
              Holistia es un ecosistema digital que conecta a quienes buscan
              mejorar su calidad de vida con profesionales especializados.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-gradient-to-r hover:from-[#AC89FF] hover:to-[#83C7FD] transition-all duration-300 hover:scale-110 group"
              >
                <Instagram className="h-5 w-5 text-white/70 group-hover:text-white" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link
                href="#"
                className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-gradient-to-r hover:from-[#AFF344] hover:to-[#83C7FD] transition-all duration-300 hover:scale-110 group"
              >
                <Twitter className="h-5 w-5 text-white/70 group-hover:text-white" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="#"
                className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-gradient-to-r hover:from-[#83C7FD] hover:to-[#FFE5BE] transition-all duration-300 hover:scale-110 group"
              >
                <Facebook className="h-5 w-5 text-white/70 group-hover:text-white" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                href="#"
                className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-gradient-to-r hover:from-[#FFE5BE] hover:to-[#FF9900] transition-all duration-300 hover:scale-110 group"
              >
                <Linkedin className="h-5 w-5 text-white/70 group-hover:text-white" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-white mb-4">Plataforma</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Características
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Comunidad
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Profesionales
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Eventos
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-white mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Sobre nosotros
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Blog
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Carreras
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Contacto
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Términos de servicio
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Política de privacidad
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-white/70 hover:text-[#AC89FF] transition-colors relative group inline-block"
                >
                  Cookies
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] group-hover:w-full transition-all duration-300"></span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} Holistia. Todos los derechos
            reservados.
          </p>
          <div className="mt-4 md:mt-0">
            <p className="text-sm text-white/50">
              Diseñado con <span className="text-[#AFF344]">♥</span> para tu
              bienestar
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Calendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
