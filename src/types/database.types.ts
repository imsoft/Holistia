/**
 * Tipos de base de datos para Holistia
 * Estos tipos representan la estructura de datos en Supabase
 */

// Tipos de usuario y perfil
export type Users  = {
  id: string;
  name: string;
  email: string;
};

export interface User {
  id: string;
  email?: string;
  app_metadata: {
    provider?: string;
    providers?: string[];
  };
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
    name?: string;
  };
  aud: string;
  created_at: string;
}

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
};

export type UserPreference = {
  user_id: string;
  categories: string[] | null;
  notification_email: boolean;
  notification_push: boolean;
  notification_sms: boolean;
  created_at: string;
  updated_at: string;
};

// Tipos para profesionales
export type Professional = {
  id: string;
  user_id: string | null;
  name: string;
  specialty: string;
  description: string | null;
  short_description: string | null;
  experience: string | null;
  education: string[] | null;
  languages: string[] | null;
  rating: number | null;
  review_count: number;
  location: string | null;
  image_url: string | null;
  cover_image_url: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfessionalContact = {
  professional_id: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  created_at: string;
  updated_at: string;
};

// Tipos para centros de bienestar
export type WellnessCenter = {
  id: string;
  user_id: string | null;
  name: string;
  type: string;
  short_description: string | null;
  description: string | null;
  established: string | null;
  rating: number | null;
  review_count: number;
  location: string | null;
  address: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  features: string[] | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
};

export type WellnessCenterContact = {
  center_id: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  created_at: string;
  updated_at: string;
};

export type WellnessCenterImage = {
  id: string;
  center_id: string;
  image_url: string;
  created_at: string;
};

export type OpeningHours = {
  id: string;
  center_id: string;
  day: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
};

// Tipos para categorías y servicios
export type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  price: number | null;
  price_currency: string;
  price_display: string | null;
  category: string | null;
  professional_id: string | null;
  center_id: string | null;
  created_at: string;
  updated_at: string;
};

// Tipos para citas
export type Appointment = {
  id: string;
  user_id: string;
  service_id: string | null;
  professional_id: string | null;
  center_id: string | null;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  services?: AppointmentService;
  professionals?: AppointmentProfessional;
  wellness_centers?: AppointmentWellnessCenter;
};

export type AppointmentService = {
  name: string;
  description?: string | null;
  duration?: string | null;
  price?: number | null;
};

export type AppointmentProfessional = {
  id: string;
  name: string;
  specialty: string;
  image_url: string | null;
};

export type AppointmentWellnessCenter = {
  id: string;
  name: string;
  type: string;
  logo_url: string | null;
};

// Tipos para favoritos
export type FavoriteProfessional = {
  user_id: string;
  professional_id: string;
  created_at: string;
  professionals?: Professional;
};

export type FavoriteCenter = {
  user_id: string;
  center_id: string;
  created_at: string;
  wellness_centers?: WellnessCenter;
};

// Tipos para respuestas de Supabase
export type SupabaseAppointmentResponse = {
  id: string;
  user_id: string;
  service_id: string | null;
  professional_id: string | null;
  center_id: string | null;
  date: string;
  time: string;
  status: string;
  created_at: string;
  updated_at: string;
  services?: {
    name: string;
    description?: string | null;
    duration?: string | null;
    price?: number | null;
  } | null;
  professionals?: {
    id: string;
    name: string;
    specialty: string;
    image_url: string | null;
  } | null;
  wellness_centers?: {
    id: string;
    name: string;
    type: string;
    logo_url: string | null;
  } | null;
};

export type FavoriteProfessionalResponse = {
  user_id: string;
  professional_id: string;
  created_at: string;
  professionals: {
    id: string;
    name: string;
    specialty: string;
    image_url: string | null;
    location: string | null;
    rating: number | null;
  };
};

export type FavoriteCenterResponse = {
  user_id: string;
  center_id: string;
  created_at: string;
  wellness_centers: {
    id: string;
    name: string;
    type: string;
    logo_url: string | null;
    location: string | null;
    rating: number | null;
  };
};

// Tipos para respuestas de Supabase con arrays
export type SupabaseFavoriteProfessionalResponse = {
  data: Array<{
    user_id: string;
    professional_id: string;
    created_at: string;
    professionals: {
      id: string;
      name: string;
      specialty: string;
      image_url: string | null;
      location: string | null;
      rating: number | null;
    };
  }>;
  error: Error | null;
};

export type SupabaseFavoriteCenterResponse = {
  data: Array<{
    user_id: string;
    center_id: string;
    created_at: string;
    wellness_centers: {
      id: string;
      name: string;
      type: string;
      logo_url: string | null;
      location: string | null;
      rating: number | null;
    };
  }>;
  error: Error | null;
};

// Tipos para reseñas
export type Review = {
  id: string;
  user_id: string;
  professional_id: string | null;
  center_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

// Tipos para notificaciones
export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'appointment' | 'system' | 'message';
  read: boolean;
  created_at: string;
};

// Tipos para mensajes
export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  receiver?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
};

// Tipos para errores de Supabase
export type SupabaseError = {
  message: string;
  details: string;
  hint: string;
  code: string;
};

// Tipos para respuestas genéricas de Supabase
export type SupabaseResponse<T> = {
  data: T | null;
  error: SupabaseError | null;
};

export type SupabaseArrayResponse<T> = {
  data: T[] | null;
  error: SupabaseError | null;
};
