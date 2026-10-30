export type UserRole = 'patient' | 'admin' | 'staff' | 'doctor';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected' | 'rescheduled' | 'waiting' | 'in-consultation' | 'no-show';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export interface Speciality {
  id: string;
  name: string;
  description: string;
  iconName: string;
  active: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialityId: string;
  specialityName: string;
  qualifications: string;
  experienceYears: number;
  languages: string[];
  photoUrl: string;
  consultationFee: number;
  isFeeConfirmed: boolean;
  about: string;
  availableDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  active: boolean;
  opdStatus?: 'available' | 'in-consultation' | 'break' | 'off-duty';
  preparationNotes?: string;
  rating?: number;
  reviewCount?: number;
}

export interface ClinicService {
  id: string;
  name: string;
  specialityId: string;
  specialityName: string;
  description: string;
  durationMinutes: number;
  price: number;
  isPriceConfirmed: boolean;
  category: 'consultation' | 'diagnostic' | 'health-check' | 'procedure';
  isActive: boolean;
  preparationInstructions?: string;
}

export interface TimeSlot {
  time: string; // e.g. "09:00", "09:30"
  available: boolean;
  reason?: string; // e.g. "Booked", "Past", "Break"
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  isAvailable: boolean;
  slots: TimeSlot[];
  reason?: string; // e.g. "Clinic Holiday", "Doctor On Leave"
}

export interface Appointment {
  id: string;
  bookingReference: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other';
  visitType: 'first-visit' | 'follow-up';
  reasonForVisit?: string;
  doctorId: string;
  doctorName: string;
  doctorSpeciality: string;
  serviceId: string;
  serviceName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  durationMinutes: number;
  status: AppointmentStatus;
  fee: number;
  paymentMode: 'cash-at-clinic' | 'razorpay' | 'phonepe' | 'paytm' | 'card' | 'online' | 'pay-at-clinic';
  paymentStatus: 'pending' | 'paid' | 'waived' | 'failed';
  paymentId?: string;
  razorpayOrderId?: string;
  paymentMethod?: string;
  adminNotes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  bookingRef: string;
}

export interface RazorpayVerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  appointmentId?: string;
}

export interface AppointmentStatusHistory {
  id: string;
  appointmentId: string;
  previousStatus: AppointmentStatus;
  newStatus: AppointmentStatus;
  changedBy: string;
  reason?: string;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  pendingRequests: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  completedAppointments: number;
  waitingCount?: number;
  inConsultationCount?: number;
  noShowCount?: number;
  revenueEstimated: number;
  todayRevenueEstimated?: number;
  revenueOnline?: number;
  revenueCash?: number;
  onlineCount?: number;
  cashCount?: number;
  activeDoctorsCount: number;
  activeServicesCount: number;
  specialityBreakdown?: { speciality: string; count: number; percentage: number }[];
  hourlyDistribution?: { hour: string; count: number }[];
  doctorWorkload?: { doctorId: string; doctorName: string; speciality: string; bookedCount: number; active: boolean; opdStatus?: string }[];
}

export interface AdminAuditLog {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  performedBy: string;
  details: string;
  createdAt: string;
}

export interface ClinicBroadcast {
  message: string;
  type: 'info' | 'warning' | 'urgent';
  active: boolean;
  updatedAt: string;
  updatedBy: string;
}
