"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Specialty {
  name: string;
  count: number;
  slug: string;
}

export function SpecialtiesBadgesSection() {
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
      <section className="py-16 px-4 bg-background">
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
    <section className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Especialidades
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explora nuestras especialidades y encuentra al profesional ideal para ti
          </p>
        </div>

        {/* Grid de badges */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4">
          {specialties.map((specialty) => (
            <Link
              key={specialty.slug}
              href={`/specialties/${specialty.slug}`}
              className="group"
            >
              <div className="px-5 py-2.5 bg-white rounded-lg border border-[#8080FF] text-[#4A4AFF] font-medium text-sm md:text-base shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-[#F5F5FF]">
                {specialty.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
