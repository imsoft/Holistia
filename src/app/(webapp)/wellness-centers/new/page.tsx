import { WellnessCenterForm } from "@/components/wellness-center/wellness-center-form";

export default function NewWellnessCenterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-[#AC89FF] to-[#83C7FD] text-transparent bg-clip-text">
        Registrar Nuevo Centro Wellness
      </h1>
      <p className="text-white/70 mb-8">
        Completa el formulario para registrar tu centro wellness en nuestra
        plataforma
      </p>

      <WellnessCenterForm />
    </div>
  );
}
