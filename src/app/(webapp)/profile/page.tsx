"use client";

import { supabase } from "@/lib/supabaseClient";
import { UserProfile } from "@/components/user-profile";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("No se pudo obtener el usuario");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error cargando perfil:", profileError);
      } else {
        setUserProfile(profile);
      }

      setLoading(false);
    };

    getUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <Loader className="animate-spin mr-2" /> Cargando perfil...
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center text-white py-20">
        <p>No se encontró el perfil.</p>
      </div>
    );
  }

  return <UserProfile user={userProfile} />;
}
