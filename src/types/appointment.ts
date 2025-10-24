export interface Appointment {
  id: string;
  patient: {
    name: string;
    email: string;
    phone: string;
  };
  professional?: {
    name: string;
    profession: string;
    avatar: string;
  };
  date: string;
  time: string;
  duration: number;
  type: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  notes?: string;
  location: string;
  service?: string;
  cost?: number;
  isPaid?: boolean; // Nuevo campo para indicar si el pago fue exitoso
}

export interface AppointmentForm {
  name: string;
  email: string;
  phone: string;
  service: string;
  notes?: string;
}

export interface Availability {
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  sessionDuration: number;
  breakTime: number;
  bookedSlots: string[];
}
