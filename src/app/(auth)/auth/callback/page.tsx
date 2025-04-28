"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const AuthCallbackPage = () => {
  const router = useRouter();

  useEffect(() => {
    const finishSignIn = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const userId = session.user.id;

        // Validar si el usuario ya está en la tabla `users`
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("id", userId)
          .single();

        // Si no está, lo agregamos con rol 'user' por defecto (o lo que decidas)
        if (!existingUser) {
          await supabase.from("users").insert([
            {
              id: userId,
              role: "user",
            },
          ]);
        }

        // Redirigir al explore o a completar perfil
        router.push("/explore");
      }
    };

    finishSignIn();
  }, [router]);

  return (
    <p className="text-white text-center mt-20">Autenticando con Google...</p>
  );
};

export default AuthCallbackPage;
