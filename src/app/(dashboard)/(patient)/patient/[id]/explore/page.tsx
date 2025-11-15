"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const HomeUserPage = () => {
  const params = useParams();
  const userId = params.id as string;


  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="space-y-12">
          {/* Sección de Eventos y Talleres */}
          <div>
            <Link 
              href={`/patient/${userId}/explore/events`}
              className="block group"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 group-hover:text-primary transition-colors">
                Eventos y Talleres
              </h2>
            </Link>
          </div>

          {/* Sección de Expertos */}
          <div>
            <Link 
              href={`/patient/${userId}/explore/professionals`}
              className="block group"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 group-hover:text-primary transition-colors">
                Expertos
              </h2>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomeUserPage;
