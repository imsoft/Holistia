// Tipos para el sistema de retos

export interface Challenge {
  id: string;
  professional_id?: string | null;
  created_by_user_id: string;
  created_by_type: 'professional' | 'patient' | 'admin';
  linked_patient_id?: string | null;
  linked_professional_id?: string | null;
  title: string;
  description: string;
  short_description?: string;
  cover_image_url?: string;
  duration_days?: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  wellness_areas?: string[];
  price?: number | null;
  currency?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  professional_applications?: {
    first_name: string;
    last_name: string;
    profile_photo?: string;
    is_verified?: boolean;
    profession?: string;
  };
}

export interface ChallengeResource {
  id: string;
  challenge_id: string;
  title: string;
  description?: string;
  resource_type: 'ebook' | 'audio' | 'video' | 'pdf' | 'link' | 'other';
  url: string;
  file_size_bytes?: number | null;
  duration_minutes?: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChallengeFormData {
  title: string;
  description: string;
  short_description: string;
  cover_image_url: string;
  duration_days: string;
  difficulty_level: string;
  category: string;
  wellness_areas: string[];
  linked_professional_id: string;
  price: string;
  currency: string;
  is_active: boolean;
}

export const RESOURCE_TYPE_OPTIONS = [
  { value: 'ebook', label: 'eBook/PDF', icon: 'BookOpen' },
  { value: 'audio', label: 'Audio', icon: 'Headphones' },
  { value: 'video', label: 'Video', icon: 'Video' },
  { value: 'pdf', label: 'Documento PDF', icon: 'FileText' },
  { value: 'link', label: 'Enlace externo', icon: 'ExternalLink' },
  { value: 'other', label: 'Otro', icon: 'File' },
] as const;
