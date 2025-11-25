"use client";

import { ExploreSection } from "@/components/shared/explore-section";

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Explora Nuestros Servicios
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre profesionales certificados, comercios holísticos, restaurantes saludables y eventos
          </p>
        </div>
        <ExploreSection hideHeader={true} />
      </div>
    </div>
  );
}

