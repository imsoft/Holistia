export interface AvailabilityBlock {
  id?: string;
  professional_id: string;
  user_id: string;
  title: string;
  description?: string;
  block_type: 'full_day' | 'time_range' | 'weekly_day' | 'weekly_range';
  start_date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD (para bloqueos de varios días)
  start_time?: string; // HH:MM (para bloqueos de rango de tiempo)
  end_time?: string; // HH:MM (para bloqueos de rango de tiempo)
  day_of_week?: number; // 1-7 (para bloqueos semanales de día completo)
  is_recurring: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AvailabilityBlockFormData {
  title: string;
  description?: string;
  block_type: 'full_day' | 'time_range' | 'weekly_day' | 'weekly_range';
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  day_of_week?: number;
  is_recurring: boolean;
}

export interface BlockedTimeSlot {
  date: string;
  start_time?: string;
  end_time?: string;
  title: string;
  description?: string;
  is_full_day: boolean;
}
