export interface EventWorkshop {
  id?: string;
  name: string;
  duration_hours: number;
  session_type: "unique" | "recurring";
  price: number;
  is_free: boolean;
  max_capacity: number;
  has_parking: boolean;
  event_date: string; // ISO date string
  event_time: string; // HH:MM format
  category: "espiritualidad" | "salud_mental" | "salud_fisica" | "alimentacion" | "social";
  location: string;
  description?: string;
  participant_level: "principiante" | "medio" | "avanzado";
  professional_id?: string;
  gallery_images: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface EventFormData {
  name: string;
  duration_hours: number;
  session_type: "unique" | "recurring";
  price: number;
  is_free: boolean;
  max_capacity: number;
  has_parking: boolean;
  event_date: string;
  event_time: string;
  category: "espiritualidad" | "salud_mental" | "salud_fisica" | "alimentacion" | "social";
  location: string;
  description: string;
  participant_level: "principiante" | "medio" | "avanzado";
  professional_id: string;
  gallery_images: string[];
}

export interface Professional {
  id: string;
  first_name: string;
  last_name: string;
  profession: string;
}

export const EVENT_CATEGORIES = [
  { value: "espiritualidad", label: "Espiritualidad" },
  { value: "salud_mental", label: "Salud Mental" },
  { value: "salud_fisica", label: "Salud Física" },
  { value: "alimentacion", label: "Alimentación" },
  { value: "social", label: "Social" },
] as const;

export const SESSION_TYPES = [
  { value: "unique", label: "Sesión Única" },
  { value: "recurring", label: "Sesión Recurrente" },
] as const;

export const PARTICIPANT_LEVELS = [
  { value: "principiante", label: "Principiante" },
  { value: "medio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
] as const;
