"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Brain, Sparkles, Activity, Users, Apple } from "lucide-react";
import { Filters } from "@/components/ui/filters";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { createClient } from "@/utils/supabase/client";

interface Professional {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  profession: string;
  specializations: string[];
  experience: string;
  certifications: string[];
  services: Array<{
    name: string;
    description: string;
    presencialCost: string;
    onlineCost: string;
  }>;
  address: string;
  city: string;
  state: string;
  country: string;
  biography?: string;
  profile_photo?: string;
  gallery: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}


const categories = [
  {
    name: "Salud mental",
    icon: Brain,
    href: "/mental-health",
  },
  {
    name: "Espiritualidad",
    icon: Sparkles,
    href: "/spirituality",
  },
  {
    name: "Actividad física",
    icon: Activity,
    href: "/physical-activity",
  },
  {
    name: "Social",
    icon: Users,
    href: "/social",
  },
  {
    name: "Alimentación",
    icon: Apple,
    href: "/nutrition",
  },
];

const HomeUserPage = () => {
  const params = useParams();
  const userId = params.id as string;
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Obtener profesionales aprobados desde la base de datos
  useEffect(() => {
    const getProfessionals = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('professional_applications')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching professionals:', error);
          return;
        }

        setProfessionals(data || []);
        setFilteredProfessionals(data || []);
      } catch (error) {
        console.error('Error fetching professionals:', error);
      } finally {
        setLoading(false);
      }
    };

    getProfessionals();
  }, [supabase]);

  const handleFilterChange = (filters: Record<string, string[]>) => {
    console.log("Filtros aplicados:", filters);
    
    let filtered = [...professionals];

    // Filtrar por especializaciones
    if (filters.specializations && filters.specializations.length > 0) {
      filtered = filtered.filter(professional =>
        professional.specializations.some(spec =>
          filters.specializations.includes(spec)
        )
      );
    }

    // Filtrar por tipo de servicio
    if (filters.serviceType && filters.serviceType.length > 0) {
      filtered = filtered.filter(professional => {
        // Determinar el tipo de servicio basado en los servicios
        const hasPresencial = professional.services.some(s => s.presencialCost && s.presencialCost !== '');
        const hasOnline = professional.services.some(s => s.onlineCost && s.onlineCost !== '');
        
        let serviceType = 'online';
        if (hasPresencial && hasOnline) {
          serviceType = 'both';
        } else if (hasPresencial) {
          serviceType = 'in-person';
        }

        return filters.serviceType.includes(serviceType);
      });
    }

    // Filtrar por ubicación
    if (filters.location && filters.location.length > 0) {
      filtered = filtered.filter(professional =>
        filters.location.some(loc => 
          professional.city.toLowerCase().includes(loc.toLowerCase()) ||
          professional.state.toLowerCase().includes(loc.toLowerCase())
        )
      );
    }

    // Filtrar por rango de precios
    if (filters.priceRange && filters.priceRange.length > 0) {
      filtered = filtered.filter(professional => {
        return filters.priceRange.some(range => {
          const [min, max] = range.split('-').map(Number);
          return professional.services.some(service => {
            const presencialPrice = parseInt(service.presencialCost) || 0;
            const onlinePrice = parseInt(service.onlineCost) || 0;
            const minPrice = Math.min(presencialPrice || Infinity, onlinePrice || Infinity);
            
            if (max === undefined) {
              return minPrice >= min; // Solo precio mínimo
            }
            return minPrice >= min && minPrice <= max;
          });
        });
      });
    }

    setFilteredProfessionals(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-lg">
          <div className="px-6 py-6 sm:py-12 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
                Profesionales de Salud Mental
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg/8 text-pretty text-muted-foreground">
                Encuentra el profesional adecuado para tu bienestar mental y emocional.
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group flex flex-col items-center p-4 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 min-w-[100px]"
              >
                <div className="mb-2 group-hover:scale-110 transition-transform duration-200">
                  <category.icon className="h-8 w-8 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
          {/* Sidebar with filters */}
          <aside className="lg:col-span-1">
            <Filters onFilterChange={handleFilterChange} />
          </aside>

          {/* Main content */}
          <div className="lg:col-span-2 xl:col-span-3">
            {/* Results counter */}
            {!loading && professionals.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  Mostrando {filteredProfessionals.length} de {professionals.length} profesionales
                  {filteredProfessionals.length !== professionals.length && ' (filtrados)'}
                </p>
              </div>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Cargando profesionales...</p>
                </div>
              </div>
            ) : filteredProfessionals.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron profesionales</h3>
                <p className="text-muted-foreground">
                  {professionals.length === 0 
                    ? "Aún no hay profesionales aprobados en la plataforma."
                    : "Intenta ajustar los filtros para ver más resultados."
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProfessionals.map((professional) => (
                  <ProfessionalCard 
                    key={professional.id}
                    userId={userId} 
                    professional={{
                      id: professional.id,
                      slug: `${professional.first_name.toLowerCase()}-${professional.last_name.toLowerCase()}`,
                      name: `${professional.first_name} ${professional.last_name}`,
                      email: professional.email,
                      whatsapp: professional.phone || '',
                      socialMedia: {
                        instagram: '',
                        linkedin: ''
                      },
                      profession: professional.profession,
                      therapyTypes: professional.specializations,
                      costs: {
                        presencial: professional.services.find(s => s.presencialCost)?.presencialCost 
                          ? parseInt(professional.services.find(s => s.presencialCost)?.presencialCost || '0')
                          : 0,
                        online: professional.services.find(s => s.onlineCost)?.onlineCost 
                          ? parseInt(professional.services.find(s => s.onlineCost)?.onlineCost || '0')
                          : 0
                      },
                      serviceType: (() => {
                        const hasPresencial = professional.services.some(s => s.presencialCost && s.presencialCost !== '');
                        const hasOnline = professional.services.some(s => s.onlineCost && s.onlineCost !== '');
                        if (hasPresencial && hasOnline) return 'both';
                        if (hasPresencial) return 'in-person';
                        return 'online';
                      })(),
                      location: {
                        city: professional.city,
                        state: professional.state,
                        country: professional.country,
                        address: professional.address
                      },
                      bookingOption: true,
                      serviceDescription: professional.services[0]?.description || professional.biography || '',
                      biography: professional.biography || '',
                      profilePhoto: professional.profile_photo || '',
                      gallery: professional.gallery
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomeUserPage;
