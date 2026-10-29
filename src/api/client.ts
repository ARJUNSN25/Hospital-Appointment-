import { Appointment, ClinicService, Doctor, AdminDashboardStats, AdminAuditLog } from '../types';
import { ClinicConfig } from '../config/clinicData';

const BASE_URL = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }
  return json.data as T;
}

export const api = {
  getClinic: () => fetchJson<ClinicConfig>(`${BASE_URL}/clinic`),
  
  getServices: (params?: { category?: string; specialityId?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.specialityId) q.set('specialityId', params.specialityId);
    if (params?.search) q.set('search', params.search);
    return fetchJson<ClinicService[]>(`${BASE_URL}/services?${q.toString()}`);
  },

  getDoctors: (params?: { specialityId?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.specialityId) q.set('specialityId', params.specialityId);
    if (params?.search) q.set('search', params.search);
    return fetchJson<Doctor[]>(`${BASE_URL}/doctors?${q.toString()}`);
  },

  getDoctorById: (id: string) => fetchJson<Doctor>(`${BASE_URL}/doctors/${id}`),

  getAvailability: (doctorId: string, date: string, duration = 30) => {
    return fetchJson<{
      isAvailable: boolean;
      reason?: string;
      slots: { time: string; available: boolean; reason?: string }[];
    }>(`${BASE_URL}/availability?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}&duration=${duration}`);
  },

  createAppointment: (payload: {
    patientName: string;
    patientPhone: string;
    patientEmail: string;
    patientAge?: number;
    patientGender?: string;
    visitType: string;
    reasonForVisit?: string;
    doctorId: string;
    serviceId: string;
    appointmentDate: string;
    appointmentTime: string;
    paymentMode?: string;
    paymentStatus?: string;
    paymentId?: string;
    razorpayOrderId?: string;
    paymentMethod?: string;
  }) => fetchJson<Appointment>(`${BASE_URL}/appointments`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  createRazorpayOrder: (amount: number, receipt?: string) =>
    fetchJson<{ orderId: string; amount: number; currency: string; keyId: string; bookingRef: string }>(
      `${BASE_URL}/payments/razorpay/create-order`,
      {
        method: 'POST',
        body: JSON.stringify({ amount, receipt })
      }
    ),

  verifyRazorpayPayment: (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
    appointmentId?: string;
  }) =>
    fetchJson<{ verified: boolean; paymentId: string; orderId: string; status: string }>(
      `${BASE_URL}/payments/razorpay/verify`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    ),

  getAppointmentByRef: (refOrId: string) => fetchJson<Appointment>(`${BASE_URL}/appointments/${encodeURIComponent(refOrId)}`),

  rescheduleAppointment: (id: string, newDate: string, newTime: string, reason?: string) =>
    fetchJson<Appointment>(`${BASE_URL}/appointments/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ newDate, newTime, reason })
    }),

  cancelAppointment: (id: string, reason: string) =>
    fetchJson<Appointment>(`${BASE_URL}/appointments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  getPatientAppointments: (phone?: string) => {
    const q = phone ? `?phone=${encodeURIComponent(phone)}` : '';
    return fetchJson<Appointment[]>(`${BASE_URL}/me/appointments${q}`);
  },

  // Admin Authentication & APIs
  adminLogin: (credentials: { username: string; password: string }) =>
    fetchJson<{ token: string; user: { username: string; role: string; fullName: string; branch: string } }>(
      `${BASE_URL}/admin/login`,
      {
        method: 'POST',
        body: JSON.stringify(credentials)
      }
    ),

  createWalkinAppointment: (payload: {
    patientName: string;
    patientPhone: string;
    doctorId: string;
    serviceId: string;
    paymentMode?: string;
  }) =>
    fetchJson<Appointment>(`${BASE_URL}/admin/walkin`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getAdminStats: () => fetchJson<AdminDashboardStats>(`${BASE_URL}/admin/dashboard`),

  getAdminAppointments: (params?: { status?: string; doctorId?: string; date?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.doctorId) q.set('doctorId', params.doctorId);
    if (params?.date) q.set('date', params.date);
    if (params?.search) q.set('search', params.search);
    return fetchJson<Appointment[]>(`${BASE_URL}/admin/appointments?${q.toString()}`);
  },

  updateAppointmentStatus: (id: string, status: string, adminNotes?: string) =>
    fetchJson<Appointment>(`${BASE_URL}/admin/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes })
    }),

  updateDoctor: (id: string, updates: Partial<Doctor>) =>
    fetchJson<Doctor>(`${BASE_URL}/admin/doctors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),

  addDoctor: (doctor: Partial<Doctor>) =>
    fetchJson<Doctor>(`${BASE_URL}/admin/doctors`, {
      method: 'POST',
      body: JSON.stringify(doctor)
    }),

  updateClinicSettings: (settings: Partial<ClinicConfig>) =>
    fetchJson<ClinicConfig>(`${BASE_URL}/admin/clinic-settings`, {
      method: 'PATCH',
      body: JSON.stringify(settings)
    }),

  getAdminAuditLogs: () => fetchJson<AdminAuditLog[]>(`${BASE_URL}/admin/audit-logs`),

  getExportCsvUrl: () => `${BASE_URL}/admin/export-csv`,

  getSupabaseStatus: () => fetchJson<{
    connected: boolean;
    status: number;
    message: string;
    projectId: string;
    url: string;
    restApi: string;
    isKeyConfigured: boolean;
  }>(`${BASE_URL}/supabase/status`),

  syncAllToSupabase: () => fetchJson<{
    syncedCount: number;
    skippedCount: number;
    total: number;
    projectId: string;
    restApi: string;
    errors: string[];
  }>(`${BASE_URL}/supabase/sync-all`, {
    method: 'POST'
  })
};
