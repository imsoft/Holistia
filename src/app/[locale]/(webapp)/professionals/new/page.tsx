import { ProfessionalForm } from "@/components/webapp/professionals/professional-form";

export default function NewProfessionalPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Gradient blobs */}
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#AC89FF]/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#83C7FD]/10 rounded-full blur-[100px] -z-10"></div>

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Crear Nuevo Profesional</h1>
        <ProfessionalForm />
      </div>
    </main>
  );
}
