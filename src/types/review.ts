export interface Review {
  id: string;
  professional_id: string;
  patient_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  patient?: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface ReviewStats {
  professional_id: string;
  total_reviews: number;
  average_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
}

export interface CreateReviewData {
  professional_id: string;
  patient_id: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

