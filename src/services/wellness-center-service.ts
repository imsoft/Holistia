import { supabase } from "@/lib/supabaseClient";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  WellnessCenter,
  WellnessCenterContact,
  WellnessCenterImage,
  OpeningHours,
} from "@/types/database.types";

// Función para obtener el cliente de Supabase en el servidor
const getServerClient = async () => {
  return getSupabaseServerClient();
};

export const wellnessCenterService = {
  // Obtener todos los centros wellness
  getWellnessCenters: async (): Promise<WellnessCenter[]> => {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("wellness_center_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching wellness centers:", error);
      return [];
    }

    return data || [];
  },

  // Obtener un centro wellness por ID
  getWellnessCenterById: async (id: string): Promise<WellnessCenter | null> => {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("wellness_center_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching wellness center:", error);
      return null;
    }

    return data;
  },

  // Obtener centros wellness por ID de usuario
  getWellnessCentersByUserId: async (
    userId: string
  ): Promise<WellnessCenter[]> => {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("wellness_center_profiles")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching wellness centers by user ID:", error);
      return [];
    }

    return data || [];
  },

  // Crear un nuevo centro wellness
  createWellnessCenter: async (
    center: Partial<WellnessCenter>
  ): Promise<WellnessCenter | null> => {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("wellness_center_profiles")
      .insert([center])
      .select()
      .single();

    if (error) {
      console.error("Error creating wellness center:", error);
      return null;
    }

    return data;
  },

  // Actualizar un centro wellness existente
  updateWellnessCenter: async (
    id: string,
    center: Partial<WellnessCenter>
  ): Promise<WellnessCenter | null> => {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("wellness_center_profiles")
      .update(center)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating wellness center:", error);
      return null;
    }

    return data;
  },

  // Eliminar un centro wellness
  deleteWellnessCenter: async (id: string): Promise<boolean> => {
    const supabase = await getServerClient();
    const { error } = await supabase
      .from("wellness_center_profiles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting wellness center:", error);
      return false;
    }

    return true;
  },

  // Obtener información de contacto de un centro wellness
  getWellnessCenterContact: async (
    centerId: string
  ): Promise<WellnessCenterContact | null> => {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("wellness_center_contacts")
      .select("*")
      .eq("center_id", centerId)
      .single();

    if (error && error.code !== "PGRST116") {
      // Ignorar error cuando no se encuentra el registro
      console.error("Error fetching wellness center contact:", error);
      return null;
    }

    return data || null;
  },

  // Crear información de contacto para un centro wellness
  createWellnessCenterContact: async (
    contact: Partial<WellnessCenterContact>
  ): Promise<WellnessCenterContact | null> => {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("wellness_center_contacts")
      .insert([contact])
      .select()
      .single();

    if (error) {
      console.error("Error creating wellness center contact:", error);
      return null;
    }

    return data;
  },

  // Actualizar información de contacto de un centro wellness
  updateWellnessCenterContact: async (
    centerId: string,
    contact: Partial<WellnessCenterContact>
  ): Promise<WellnessCenterContact | null> => {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("wellness_center_contacts")
      .update(contact)
      .eq("center_id", centerId)
      .select()
      .single();

    if (error) {
      console.error("Error updating wellness center contact:", error);
      return null;
    }

    return data;
  },

  // Obtener imágenes de un centro wellness
  getWellnessCenterImages: async (
    centerId: string
  ): Promise<WellnessCenterImage[]> => {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("wellness_center_images")
      .select("*")
      .eq("center_id", centerId);

    if (error) {
      console.error("Error fetching wellness center images:", error);
      return [];
    }

    return data || [];
  },

  // Añadir una imagen a un centro wellness
  addWellnessCenterImage: async (
    image: Partial<WellnessCenterImage>
  ): Promise<WellnessCenterImage | null> => {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("wellness_center_images")
      .insert([image])
      .select()
      .single();

    if (error) {
      console.error("Error adding wellness center image:", error);
      return null;
    }

    return data;
  },

  // Eliminar una imagen de un centro wellness
  deleteWellnessCenterImage: async (id: string): Promise<boolean> => {
    const supabase = await getServerClient();
    const { error } = await supabase
      .from("wellness_center_images")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting wellness center image:", error);
      return false;
    }

    return true;
  },

  // Obtener horarios de apertura de un centro wellness
  getOpeningHours: async (centerId: string): Promise<OpeningHours[]> => {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("opening_hours")
      .select("*")
      .eq("center_id", centerId);

    if (error) {
      console.error("Error fetching opening hours:", error);
      return [];
    }

    return data || [];
  },

  // Crear horarios de apertura para un centro wellness
  createOpeningHours: async (
    hours: Partial<OpeningHours>
  ): Promise<OpeningHours | null> => {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("opening_hours")
      .insert([hours])
      .select()
      .single();

    if (error) {
      console.error("Error creating opening hours:", error);
      return null;
    }

    return data;
  },

  // Actualizar horarios de apertura de un centro wellness
  updateOpeningHours: async (
    id: string,
    hours: Partial<OpeningHours>
  ): Promise<OpeningHours | null> => {
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("opening_hours")
      .update(hours)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating opening hours:", error);
      return null;
    }

    return data;
  },

  // Eliminar horarios de apertura de un centro wellness
  deleteOpeningHours: async (id: string): Promise<boolean> => {
    const supabase = await getServerClient();
    const { error } = await supabase
      .from("opening_hours")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting opening hours:", error);
      return false;
    }

    return true;
  },

  // Subir logo de un centro wellness
  uploadWellnessCenterLogo: async (
    centerId: string,
    file: File
  ): Promise<string | null> => {
    return wellnessCenterService.uploadWellnessCenterImage(
      centerId,
      file,
      "logo"
    );
  },

  // Subir imagen de portada de un centro wellness
  uploadWellnessCenterCoverImage: async (
    centerId: string,
    file: File
  ): Promise<string | null> => {
    return wellnessCenterService.uploadWellnessCenterImage(
      centerId,
      file,
      "cover"
    );
  },

  // Subir imagen de galería de un centro wellness
  uploadWellnessCenterGalleryImage: async (
    centerId: string,
    file: File
  ): Promise<string | null> => {
    return wellnessCenterService.uploadWellnessCenterImage(
      centerId,
      file,
      "gallery"
    );
  },

  // Función genérica para subir imágenes
  uploadWellnessCenterImage: async (
    id: string,
    file: File,
    type: "logo" | "cover" | "gallery"
  ): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${id}-${type}-${Math.random()}.${fileExt}`;
    const filePath = `wellness-centers/${fileName}`;

    const { error } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(filePath);

    return data.publicUrl;
  },
};
