"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "../ui/button";

export const UnderConstruction = () => {
  return (
    <>
      <style jsx global>{`
        .animated-gradient-text {
          background: linear-gradient(
            to right,
            #ffffff,
            #ac89ff,
            #83c7fd,
            #aff344,
            #ffe5be,
            #ac89ff,
            #83c7fd,
            #ffffff
          );
          background-size: 200% auto;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: flow 10s linear infinite;
        }

        @keyframes flow {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>

      <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#AC89FF]/10 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#83C7FD]/10 rounded-full blur-[100px] -z-10"></div>

        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-[#AC89FF]/20 to-[#83C7FD]/20 text-[#AC89FF] text-sm font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              <span>Estamos trabajando en algo especial</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animated-gradient-text leading-tight py-2">
              ¡Muy pronto estaremos en línea!
            </h1>

            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              Nuestro sitio web está en construcción. Estamos creando una
              experiencia transformadora para conectar contigo y tu bienestar
              integral. <br /> ¡Gracias por tu paciencia!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="mailto:hola@holistia.io?subject=Notificarme%20cuando%20lancen&body=Hola%2C%20me%20gustar%C3%ADa%20recibir%20notificaciones%20cuando%20el%20sitio%20est%C3%A9%20en%20l%C3%ADnea."
                passHref
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#AFF344] to-[#83C7FD] hover:from-[#83C7FD] hover:to-[#AFF344] text-[#0D0D0D] font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#AFF344]/20 relative overflow-hidden group cursor-pointer"
                >
                  <span className="relative z-10">Notificarme al lanzar</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[#AFF344]/0 via-white/20 to-[#AFF344]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                </Button>
              </Link>

              <Link
                href="https://wa.me/523339550061?text=Hola%2C%20me%20gustar%C3%ADa%20recibir%20notificaciones%20cuando%20el%20sitio%20de%20Holistia%20est%C3%A9%20en%20l%C3%ADnea."
                passHref
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="bg-transparent border-2 border-[#AC89FF] text-[#AC89FF] hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#AC89FF]/20 relative overflow-hidden group cursor-pointer"
                >
                  <span className="relative z-10">Contáctanos</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
