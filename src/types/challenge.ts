// Tipos para el sistema de retos

export interface Challenge {
  id: string;
  slug?: string;
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

export interface ChallengeMeeting {
  id: string;
  challenge_id: string;
  title: string;
  description?: string;
  platform: 'meet' | 'zoom' | 'teams' | 'other';
  meeting_url: string;
  meeting_id?: string | null;
  passcode?: string | null;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time: string; // HH:MM:SS
  duration_minutes: number;
  timezone: string;
  is_recurring: boolean;
  recurrence_pattern?: string | null;
  recurrence_end_date?: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  is_active: boolean;
  max_participants?: number | null;
  reminder_sent: boolean;
  reminder_sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChallengeMeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  attendance_status: 'invited' | 'confirmed' | 'attended' | 'no_show' | 'cancelled';
  joined_at?: string | null;
  left_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingFormData {
  title: string;
  description: string;
  platform: string;
  meeting_url: string;
  meeting_id: string;
  passcode: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: string;
  timezone: string;
  is_recurring: boolean;
  recurrence_pattern: string;
  recurrence_end_date: string;
  max_participants: string;
}

export const MEETING_PLATFORM_OPTIONS = [
  { value: 'meet', label: 'Google Meet', icon: 'Video' },
  { value: 'zoom', label: 'Zoom', icon: 'Video' },
  { value: 'teams', label: 'Microsoft Teams', icon: 'Video' },
  { value: 'other', label: 'Otra plataforma', icon: 'Video' },
] as const;

export const RECURRENCE_OPTIONS = [
  { value: '', label: 'No recurrente' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
] as const;

export const TIMEZONE_OPTIONS = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/Cancun', label: 'Cancún (GMT-5)' },
  { value: 'America/Tijuana', label: 'Tijuana (GMT-8)' },
  { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (GMT-8)' },
  { value: 'America/Chicago', label: 'Chicago (GMT-6)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
  { value: 'Europe/London', label: 'Londres (GMT+0)' },
] as const;
