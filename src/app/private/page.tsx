import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export default async function PrivatePage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          Área Privada
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Hola {data.user.email}
        </p>
      </div>
    </div>
  );
}
