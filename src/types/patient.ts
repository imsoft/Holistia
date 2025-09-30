export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  status: "active" | "inactive" | "suspended";
  type: "user" | "professional" | "admin" | "patient";
  joinDate: string;
  lastLogin: string;
  appointments: number;
  avatar: string;
  age?: number;
  gender?: string;
  therapyType?: string;
  totalSessions?: number;
  nextSession?: string | null;
  lastSession?: string;
  notes?: string;
}

export interface PatientProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  bio?: string;
  location?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export interface PatientApplication {
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  reviewDate?: string;
  estimatedReviewTime: string;
  documents: Array<{
    name: string;
    status: "complete" | "pending" | "incomplete";
  }>;
  notes?: string;
}
