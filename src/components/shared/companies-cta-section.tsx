import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Smile, TrendingUp, ArrowRight, ThumbsUp } from "lucide-react";

export function CompaniesCtaSection() {
  return (
    <section className="relative py-24 overflow-hidden bg-white">
      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Briefcase className="w-4 h-4" />
              <span>Holistia para Empresas</span>
            </div>

            <h2 className="text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
              Bienestar integral para tu equipo
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Mejora la productividad y el ambiente laboral con nuestros programas de bienestar
              corporativo. Sesiones de yoga, mindfulness, terapia y más para tus colaboradores.
            </p>

            {/* Benefits */}
            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Equipo más saludable</h3>
                  <p className="text-sm text-muted-foreground">
                    Reduce el estrés y mejora el bienestar
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Mayor productividad</h3>
                  <p className="text-sm text-muted-foreground">
                    Colaboradores motivados y enfocados
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Smile className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Cultura positiva</h3>
                  <p className="text-sm text-muted-foreground">
                    Fomenta un ambiente de trabajo saludable
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Planes flexibles</h3>
                  <p className="text-sm text-muted-foreground">
                    Adaptados a las necesidades de tu empresa
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button asChild size="lg" className="gap-2">
                <Link href="/companies">
                  Solicitar cotización
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/companies">
                  Conocer más
                </Link>
              </Button>
            </div>
          </div>

          {/* Right side - Image/Stats */}
          <div className="relative">
            <div className="relative rounded-2xl bg-gray-50 border border-gray-200 p-8 lg:p-12">
              {/* Stats Cards */}
              <div className="space-y-6">
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Satisfacción
                      </p>
                      <p className="text-3xl font-bold text-foreground mt-1">98%</p>
                    </div>
                    <div className="rounded-full bg-green-100 p-3">
                      <ThumbsUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    De los colaboradores reportan mejoras
                  </p>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Empresas atendidas
                      </p>
                      <p className="text-3xl font-bold text-foreground mt-1">50+</p>
                    </div>
                    <div className="rounded-full bg-blue-100 p-3">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Confían en nuestros servicios
                  </p>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Sesiones realizadas
                      </p>
                      <p className="text-3xl font-bold text-foreground mt-1">2,500+</p>
                    </div>
                    <div className="rounded-full bg-purple-100 p-3">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    De bienestar corporativo
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
