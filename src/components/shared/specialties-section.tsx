"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  Apple,
  Sparkles,
  Users,
  Flower2,
  Stethoscope,
  Loader2
} from "lucide-react";

interface Specialty {
  name: string;
  count: number;
  slug: string;
}

// Iconos por especialidad
const SPECIALTY_ICONS: Record<string, React.ElementType> = {
  "Psicología": Brain,
  "Psicólogo": Brain,
  "Nutrición": Apple,
  "Nutriólogo": Apple,
  "Coaching": Sparkles,
  "Coach": Sparkles,
  "Terapia": Users,
  "Terapeuta": Users,
  "Yoga": Flower2,
  "Instructor de Yoga": Flower2,
  "Medicina": Stethoscope,
  "Médico": Stethoscope,
};

// Función para obtener el icono apropiado
function getIconForSpecialty(profession: string): React.ElementType {
  // Buscar coincidencia exacta
  if (SPECIALTY_ICONS[profession]) {
    return SPECIALTY_ICONS[profession];
  }

  // Buscar coincidencia parcial
  const key = Object.keys(SPECIALTY_ICONS).find(k =>
    profession.toLowerCase().includes(k.toLowerCase())
  );

  return key ? SPECIALTY_ICONS[key] : Sparkles;
}

// Función para generar slug
function generateSlug(profession: string): string {
  return profession
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remover acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function SpecialtiesSection() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpecialties() {
      try {
        const response = await fetch("/api/specialties");
        const data = await response.json();

        if (response.ok) {
          setSpecialties(data.specialties || []);
        }
      } catch (error) {
        console.error("Error fetching specialties:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSpecialties();
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (specialties.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Explora por{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
              Especialidad
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Encuentra al experto ideal para tus necesidades de bienestar
          </motion.p>
        </div>

        {/* Grid de especialidades */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {specialties.map((specialty, index) => {
            const Icon = getIconForSpecialty(specialty.name);

            return (
              <motion.div
                key={specialty.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/specialties/${specialty.slug}`}>
                  <div className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 p-6 h-full hover:shadow-lg hover:-translate-y-1">
                    {/* Icono */}
                    <div className="mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>

                    {/* Nombre */}
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                      {specialty.name}
                    </h3>

                    {/* Contador */}
                    <p className="text-sm text-muted-foreground">
                      {specialty.count} {specialty.count === 1 ? "experto" : "expertos"}
                    </p>

                    {/* Efecto de brillo al hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* CTA para ver todos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
          >
            Ver todos los expertos
            <Users className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
