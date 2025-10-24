export interface EventWorkshop {
  id?: string;
  name: string;
  duration_hours: number;
  duration_unit?: "hours" | "days"; // Unidad de duración: horas o días
  session_type: "unique" | "recurring";
  price: number;
  is_free: boolean;
  max_capacity: number;
  has_parking: boolean;
  event_date: string; // ISO date string - Fecha de inicio
  event_time: string; // HH:MM format - Hora de inicio
  end_date?: string; // ISO date string - Fecha de finalización (opcional)
  end_time?: string; // HH:MM format - Hora de finalización (opcional)
  category: "espiritualidad" | "salud_mental" | "salud_fisica" | "alimentacion" | "social";
  location: string;
  description?: string;
  participant_level: "todos" | "principiante" | "medio" | "avanzado";
  professional_id?: string;
  owner_id: string; // ID del dueño del evento
  owner_type: "admin" | "professional" | "patient"; // Tipo de dueño
  image_url?: string; // URL de la imagen principal del evento
  gallery_images: string[];
  image_position?: string; // Posición de la imagen en la card (ej: 'center center', 'top left')
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  stripe_account_id?: string;
  stripe_account_status?: string;
  stripe_onboarding_completed?: boolean;
  stripe_charges_enabled?: boolean;
  stripe_payouts_enabled?: boolean;
}

export interface EventFormData {
  name: string;
  duration_hours: number;
  duration_unit: "hours" | "days"; // Unidad de duración: horas o días
  session_type: "unique" | "recurring";
  price: number;
  is_free: boolean;
  max_capacity: number;
  has_parking: boolean;
  event_date: string;
  event_time: string;
  end_date: string;
  end_time: string;
  category: "espiritualidad" | "salud_mental" | "salud_fisica" | "alimentacion" | "social";
  location: string;
  description: string;
  participant_level: "todos" | "principiante" | "medio" | "avanzado";
  professional_id: string;
  owner_id: string;
  owner_type: "admin" | "professional" | "patient";
  image_url?: string; // URL de la imagen principal del evento
  gallery_images: string[];
  image_position?: string;
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
  { value: "unique", label: "Experiencia Única" },
  { value: "recurring", label: "Experiencia Recurrente" },
] as const;

export const PARTICIPANT_LEVELS = [
  { value: "todos", label: "Todos los niveles" },
  { value: "principiante", label: "Principiante" },
  { value: "medio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
] as const;

export const OWNER_TYPES = [
  { value: "admin", label: "Administrador" },
  { value: "professional", label: "Profesional" },
  { value: "patient", label: "Usuario" },
] as const;

export const DURATION_UNITS = [
  { value: "hours", label: "Horas" },
  { value: "days", label: "Días" },
] as const;

export interface EventOwner {
  id: string;
  name: string;
  email: string;
  type: "admin" | "professional" | "patient";
}
