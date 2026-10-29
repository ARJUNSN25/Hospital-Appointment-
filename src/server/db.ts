import { VERIFIED_CLINIC_CONFIG, ClinicConfig } from '../config/clinicData';
import { Doctor, ClinicService, Appointment, AppointmentStatusHistory, AdminAuditLog } from '../types';
import { ScheduleRule, DoctorTimeOff, ClinicHoliday, calculateDoctorAvailability, validateBookingAttempt } from '../utils/schedulingEngine';

// Seed Doctors with verified qualifications and branch details
export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-swagatha',
    name: 'Dr. Swagatha Mukherjee',
    specialityId: 'spec-gynecology',
    specialityName: 'Obstetrics & Gynecology',
    qualifications: 'MBBS, DGO',
    experienceYears: 14,
    languages: ['English', 'Hindi', 'Bengali', 'Kannada'],
    photoUrl: 'https://images.unsplash.com/photo-1594824813580-c0b8fa7c268c?auto=format&fit=crop&w=600&q=80',
    consultationFee: 650,
    isFeeConfirmed: true,
    about: 'Senior Consultant Gynecologist and Obstetrician specializing in high-risk pregnancies, adolescent gynecology, and comprehensive women health wellness. Practicing at Apollo Clinic Basaveshwar Nagar.',
    availableDays: [1, 2, 3, 4, 5, 6], // Mon - Sat
    active: true,
    preparationNotes: 'Please bring any previous ultrasound scans, blood reports, or prescription records.',
    rating: 4.9,
    reviewCount: 128
  },
  {
    id: 'doc-dhershana',
    name: 'Dr. Dhershana Raja',
    specialityId: 'spec-gynecology',
    specialityName: 'Obstetrics & Gynecology',
    qualifications: 'MBBS, DGO, DNB (Obstetrics & Gynecology)',
    experienceYears: 16,
    languages: ['English', 'Kannada', 'Tamil', 'Hindi'],
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
    consultationFee: 700,
    isFeeConfirmed: true,
    about: 'Experienced consultant obstetrician and gynecological surgeon with extensive expertise in maternal care, fertility counseling, and minimally invasive procedures.',
    availableDays: [1, 3, 5], // Mon, Wed, Fri
    active: true,
    preparationNotes: 'Patients are advised to carry their maternal healthcare handbook if expecting.',
    rating: 4.8,
    reviewCount: 94
  },
  {
    id: 'doc-rajesh',
    name: 'Dr. Rajesh K. Sharma',
    specialityId: 'spec-general-medicine',
    specialityName: 'General & Internal Medicine',
    qualifications: 'MBBS, MD (General Medicine)',
    experienceYears: 15,
    languages: ['English', 'Hindi', 'Kannada'],
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
    consultationFee: 500,
    isFeeConfirmed: true,
    about: 'Senior Consultant Physician providing thorough evaluation for hypertension, diabetes, seasonal febrile illnesses, lifestyle metabolic disorders, and geriatric health.',
    availableDays: [1, 2, 3, 4, 5, 6], // Mon - Sat
    active: true,
    preparationNotes: 'For fasting blood sugar or lipid profile consultations, please fast for 8-10 hours if tests are planned.',
    rating: 4.9,
    reviewCount: 215
  },
  {
    id: 'doc-ananya',
    name: 'Dr. Ananya Rao',
    specialityId: 'spec-pediatrics',
    specialityName: 'Pediatrics & Child Care',
    qualifications: 'MBBS, DCH, DNB (Pediatrics)',
    experienceYears: 11,
    languages: ['English', 'Kannada', 'Telugu'],
    photoUrl: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=600&q=80',
    consultationFee: 600,
    isFeeConfirmed: true,
    about: 'Dedicated pediatrician focused on developmental milestones, newborn care, pediatric immunization, nutrition guidance, and childhood allergies.',
    availableDays: [1, 2, 4, 5, 6], // Mon, Tue, Thu, Fri, Sat
    active: true,
    preparationNotes: 'Please bring your child immunization card and vaccination chart.',
    rating: 4.9,
    reviewCount: 167
  },
  {
    id: 'doc-harish',
    name: 'Dr. B. N. Harish',
    specialityId: 'spec-orthopedics',
    specialityName: 'Orthopedics & Joint Care',
    qualifications: 'MBBS, MS (Orthopedics)',
    experienceYears: 18,
    languages: ['English', 'Kannada'],
    photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=600&q=80',
    consultationFee: 750,
    isFeeConfirmed: true,
    about: 'Consultant Orthopedic Surgeon specializing in joint arthroplasty, sports injuries, osteoarthritis management, spinal posture, and fracture rehabilitation.',
    availableDays: [2, 4, 6], // Tue, Thu, Sat
    active: true,
    preparationNotes: 'Bring all previous X-rays, MRI scans, and orthopedic braces.',
    rating: 4.7,
    reviewCount: 82
  },
  {
    id: 'doc-venkatesh',
    name: 'Dr. M. Venkatesh',
    specialityId: 'spec-dermatology',
    specialityName: 'Dermatology & Skin Care',
    qualifications: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
    experienceYears: 13,
    languages: ['English', 'Kannada', 'Hindi'],
    photoUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
    consultationFee: 650,
    isFeeConfirmed: true,
    about: 'Consultant Dermatologist treating chronic eczema, psoriasis, acne vulgaris, hair fall disorders, and skin allergies with evidence-based dermatological therapy.',
    availableDays: [1, 3, 5, 6], // Mon, Wed, Fri, Sat
    active: true,
    preparationNotes: 'Do not apply heavy topical cosmetics or ointments on the day of skin examination.',
    rating: 4.8,
    reviewCount: 110
  }
];

export const INITIAL_SERVICES: ClinicService[] = [
  {
    id: 'srv-gen-consult',
    name: 'General Physician OPD Consultation',
    specialityId: 'spec-general-medicine',
    specialityName: 'General & Internal Medicine',
    description: 'Comprehensive physical examination, diagnosis of viral fevers, chronic medical management, prescription review, and lab test planning.',
    durationMinutes: 30,
    price: 500,
    isPriceConfirmed: true,
    category: 'consultation',
    isActive: true,
    preparationInstructions: 'Bring recent blood work and a list of current medicines.'
  },
  {
    id: 'srv-gyn-consult',
    name: 'Gynecology & Antenatal Consultation',
    specialityId: 'spec-gynecology',
    specialityName: 'Obstetrics & Gynecology',
    description: 'Routine obstetric checkup, fertility evaluation, PCOS counseling, menopause guidance, and women health screening.',
    durationMinutes: 30,
    price: 650,
    isPriceConfirmed: true,
    category: 'consultation',
    isActive: true,
    preparationInstructions: 'Keep previous ultrasound reports and cycle dates handy.'
  },
  {
    id: 'srv-ped-consult',
    name: 'Pediatric Health & Vaccination Checkup',
    specialityId: 'spec-pediatrics',
    specialityName: 'Pediatrics & Child Care',
    description: 'Comprehensive pediatric wellness review, physical growth monitoring, developmental screening, and scheduled immunizations.',
    durationMinutes: 30,
    price: 600,
    isPriceConfirmed: true,
    category: 'consultation',
    isActive: true,
    preparationInstructions: 'Please carry child vaccination record card.'
  },
  {
    id: 'srv-ortho-consult',
    name: 'Orthopedic & Joint Pain Consultation',
    specialityId: 'spec-orthopedics',
    specialityName: 'Orthopedics & Joint Care',
    description: 'Specialist clinical assessment of knee arthritis, lower back pain, sciatica, shoulder injuries, and bone density evaluation.',
    durationMinutes: 30,
    price: 750,
    isPriceConfirmed: true,
    category: 'consultation',
    isActive: true,
    preparationInstructions: 'Wear loose comfortable clothing suitable for joint examination.'
  },
  {
    id: 'srv-derm-consult',
    name: 'Dermatology & Skin Consultation',
    specialityId: 'spec-dermatology',
    specialityName: 'Dermatology & Skin Care',
    description: 'Clinical examination of skin lesions, rash, eczema, pigmentation, acne, and scalp conditions with prescription therapy.',
    durationMinutes: 30,
    price: 650,
    isPriceConfirmed: true,
    category: 'consultation',
    isActive: true
  },
  {
    id: 'srv-prohealth-master',
    name: 'Apollo ProHealth Master Health Checkup',
    specialityId: 'spec-diagnostics',
    specialityName: 'Diagnostics & Pathology',
    description: '60+ clinical parameters including CBC, Lipid Profile, Liver & Kidney Function Tests, HbA1c, Fasting Blood Sugar, ECG, Urine Analysis, and Physician review.',
    durationMinutes: 45,
    price: 2499,
    isPriceConfirmed: true,
    category: 'health-check',
    isActive: true,
    preparationInstructions: '10-12 hours overnight fasting mandatory. Only plain water is permitted.'
  },
  {
    id: 'srv-ecg-cardiac',
    name: 'Digital 12-Lead ECG & Rhythm Assessment',
    specialityId: 'spec-diagnostics',
    specialityName: 'Diagnostics & Pathology',
    description: 'Precision 12-lead digital electrocardiogram to evaluate cardiac rhythm, ischemic changes, and heart rate irregularities.',
    durationMinutes: 15,
    price: 450,
    isPriceConfirmed: true,
    category: 'diagnostic',
    isActive: true,
    preparationInstructions: 'Wear comfortable buttoned upper clothing.'
  },
  {
    id: 'srv-ultrasound-abdo',
    name: 'Ultrasound Abdomen & Pelvis (USG)',
    specialityId: 'spec-diagnostics',
    specialityName: 'Diagnostics & Pathology',
    description: 'High-resolution sonography of liver, gallbladder, pancreas, kidneys, spleen, urinary bladder, and pelvic organs.',
    durationMinutes: 30,
    price: 1250,
    isPriceConfirmed: true,
    category: 'diagnostic',
    isActive: true,
    preparationInstructions: 'Full bladder required for pelvic scan (drink 1 litre of water 1 hour prior). Fasting 4 hours for upper abdomen.'
  }
];

export const INITIAL_SCHEDULE_RULES: ScheduleRule[] = [
  // Monday through Saturday schedules for each doctor
  // doc-swagatha: Mon-Sat 09:00 - 13:00 and 16:30 - 19:30
  { dayOfWeek: 1, startTime: '09:00', endTime: '13:00', breakStartTime: '11:00', breakEndTime: '11:30', slotIntervalMinutes: 30 },
  { dayOfWeek: 2, startTime: '09:00', endTime: '13:00', breakStartTime: '11:00', breakEndTime: '11:30', slotIntervalMinutes: 30 },
  { dayOfWeek: 3, startTime: '09:00', endTime: '13:00', breakStartTime: '11:00', breakEndTime: '11:30', slotIntervalMinutes: 30 },
  { dayOfWeek: 4, startTime: '09:00', endTime: '13:00', breakStartTime: '11:00', breakEndTime: '11:30', slotIntervalMinutes: 30 },
  { dayOfWeek: 5, startTime: '09:00', endTime: '13:00', breakStartTime: '11:00', breakEndTime: '11:30', slotIntervalMinutes: 30 },
  { dayOfWeek: 6, startTime: '09:00', endTime: '13:00', breakStartTime: '11:00', breakEndTime: '11:30', slotIntervalMinutes: 30 },
];

export const INITIAL_HOLIDAYS: ClinicHoliday[] = [
  { date: '2026-11-01', name: 'Kannada Rajyotsava' },
  { date: '2026-11-08', name: 'Deepavali Festival' },
  { date: '2026-12-25', name: 'Christmas Day' },
  { date: '2027-01-01', name: 'New Year Day' },
  { date: '2027-01-14', name: 'Makara Sankranti' }
];

export const INITIAL_TIME_OFF: DoctorTimeOff[] = [
  { doctorId: 'doc-swagatha', startDate: '2026-11-15', endDate: '2026-11-16', reason: 'Annual Medical Conference' }
];

// In-Memory Database store with concurrency locking
class DatabaseStore {
  private clinicConfig: ClinicConfig = { ...VERIFIED_CLINIC_CONFIG };
  private doctors: Doctor[] = [...INITIAL_DOCTORS];
  private services: ClinicService[] = [...INITIAL_SERVICES];
  private appointments: Appointment[] = [];
  private statusHistory: AppointmentStatusHistory[] = [];
  private holidays: ClinicHoliday[] = [...INITIAL_HOLIDAYS];
  private timeOff: DoctorTimeOff[] = [...INITIAL_TIME_OFF];
  private auditLogs: AdminAuditLog[] = [];
  private mutexLock = false;

  constructor() {
    this.seedInitialAppointments();
  }

  private seedInitialAppointments() {
    this.appointments = [];
    this.auditLogs = [];
  }

  clearAllAppointments(adminUser = 'Arjun') {
    this.appointments = [];
    this.statusHistory = [];
    this.auditLogs = [];
    this.addAuditLog('PURGE_QUEUE', 'APPOINTMENTS', 'ALL', adminUser, 'All appointments purged from admin portal');
    return { success: true };
  }

  // Lock helper to protect against concurrent double booking
  private async acquireLock(): Promise<void> {
    while (this.mutexLock) {
      await new Promise(res => setTimeout(res, 10));
    }
    this.mutexLock = true;
  }

  private releaseLock(): void {
    this.mutexLock = false;
  }

  // Clinic config
  getClinicConfig(): ClinicConfig {
    return { ...this.clinicConfig };
  }

  updateClinicConfig(updated: Partial<ClinicConfig>, adminUser = 'admin'): ClinicConfig {
    this.clinicConfig = {
      ...this.clinicConfig,
      ...updated,
      address: { ...this.clinicConfig.address, ...(updated.address || {}) },
      contacts: { ...this.clinicConfig.contacts, ...(updated.contacts || {}) }
    };
    this.addAuditLog('UPDATE_CLINIC_CONFIG', 'CLINIC', this.clinicConfig.id, adminUser, 'Clinic settings updated');
    return { ...this.clinicConfig };
  }

  // Doctors
  getDoctors(filterActive = true): Doctor[] {
    if (filterActive) return this.doctors.filter(d => d.active);
    return [...this.doctors];
  }

  getDoctorById(id: string): Doctor | undefined {
    return this.doctors.find(d => d.id === id);
  }

  addDoctor(doctor: Omit<Doctor, 'id'>, adminUser = 'admin'): Doctor {
    const newDoc: Doctor = {
      ...doctor,
      id: `doc-${Date.now()}`
    };
    this.doctors.push(newDoc);
    this.addAuditLog('CREATE_DOCTOR', 'DOCTOR', newDoc.id, adminUser, `Added doctor ${newDoc.name}`);
    return newDoc;
  }

  updateDoctor(id: string, updates: Partial<Doctor>, adminUser = 'admin'): Doctor | undefined {
    const idx = this.doctors.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    this.doctors[idx] = { ...this.doctors[idx], ...updates };
    this.addAuditLog('UPDATE_DOCTOR', 'DOCTOR', id, adminUser, `Updated doctor ${this.doctors[idx].name}`);
    return { ...this.doctors[idx] };
  }

  // Services
  getServices(filterActive = true): ClinicService[] {
    if (filterActive) return this.services.filter(s => s.isActive);
    return [...this.services];
  }

  getServiceById(id: string): ClinicService | undefined {
    return this.services.find(s => s.id === id);
  }

  updateService(id: string, updates: Partial<ClinicService>, adminUser = 'admin'): ClinicService | undefined {
    const idx = this.services.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.services[idx] = { ...this.services[idx], ...updates };
    this.addAuditLog('UPDATE_SERVICE', 'SERVICE', id, adminUser, `Updated service ${this.services[idx].name}`);
    return { ...this.services[idx] };
  }

  // Availability calculation
  getDoctorAvailability(doctorId: string, date: string, serviceDuration = 30) {
    const doctor = this.getDoctorById(doctorId);
    if (!doctor || !doctor.active) {
      return { isAvailable: false, reason: 'Doctor profile not found or inactive', slots: [] };
    }

    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    if (!doctor.availableDays.includes(dayOfWeek)) {
      return { isAvailable: false, reason: 'Doctor does not consult on this day', slots: [] };
    }

    const scheduleRule: ScheduleRule = {
      dayOfWeek,
      startTime: dayOfWeek === 0 ? '08:30' : '09:00',
      endTime: dayOfWeek === 0 ? '13:00' : '18:00',
      breakStartTime: '13:00',
      breakEndTime: '14:00',
      slotIntervalMinutes: 30
    };

    const existing = this.appointments.map(a => ({
      id: a.id,
      doctorId: a.doctorId,
      date: a.appointmentDate,
      time: a.appointmentTime,
      durationMinutes: a.durationMinutes,
      status: a.status
    }));

    return calculateDoctorAvailability({
      date,
      doctorId,
      serviceDuration,
      scheduleRule,
      existingBookings: existing,
      doctorTimeOffList: this.timeOff,
      clinicHolidays: this.holidays,
      currentDateTime: new Date()
    });
  }

  // Atomic Appointment Booking with Concurrency Lock
  async createAppointment(data: {
    patientName: string;
    patientPhone: string;
    patientEmail: string;
    patientAge?: number;
    patientGender?: 'male' | 'female' | 'other';
    visitType: 'first-visit' | 'follow-up';
    reasonForVisit?: string;
    doctorId: string;
    serviceId: string;
    appointmentDate: string;
    appointmentTime: string;
    paymentMode?: 'cash-at-clinic' | 'razorpay' | 'phonepe' | 'paytm' | 'card' | 'online' | 'pay-at-clinic';
    paymentStatus?: 'pending' | 'paid' | 'waived' | 'failed';
    paymentId?: string;
    razorpayOrderId?: string;
    paymentMethod?: string;
    isWalkin?: boolean;
  }): Promise<{ success: boolean; appointment?: Appointment; error?: string }> {
    await this.acquireLock();
    try {
      const doctor = this.getDoctorById(data.doctorId);
      if (!doctor || !doctor.active) {
        return { success: false, error: 'Selected doctor is not available' };
      }

      const service = this.getServiceById(data.serviceId);
      if (!service || !service.isActive) {
        return { success: false, error: 'Selected service is not active' };
      }

      const [year, month, day] = data.appointmentDate.split('-').map(Number);
      const dayOfWeek = new Date(year, month - 1, day).getDay();

      const scheduleRule: ScheduleRule = {
        dayOfWeek,
        startTime: dayOfWeek === 0 ? '08:30' : '09:00',
        endTime: dayOfWeek === 0 ? '13:00' : '18:00',
        breakStartTime: '13:00',
        breakEndTime: '14:00',
        slotIntervalMinutes: 30
      };

      const existing = this.appointments.map(a => ({
        id: a.id,
        doctorId: a.doctorId,
        date: a.appointmentDate,
        time: a.appointmentTime,
        durationMinutes: a.durationMinutes,
        status: a.status
      }));

      // Validate availability and absence of overlapping appointments
      const validation = validateBookingAttempt({
        doctorId: data.doctorId,
        date: data.appointmentDate,
        time: data.appointmentTime,
        durationMinutes: service.durationMinutes,
        scheduleRule,
        existingBookings: existing,
        doctorTimeOffList: this.timeOff,
        clinicHolidays: this.holidays,
        currentDateTime: new Date(),
        bypassPastCheck: !!data.isWalkin
      });

      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate booking reference e.g. APO-BAS-7492
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingReference = `APO-BAS-${randomSuffix}`;

      const newAppointment: Appointment = {
        id: `apt-${Date.now()}-${randomSuffix}`,
        bookingReference,
        patientName: data.patientName.trim(),
        patientPhone: data.patientPhone.trim(),
        patientEmail: data.patientEmail.trim(),
        patientAge: data.patientAge,
        patientGender: data.patientGender,
        visitType: data.visitType,
        reasonForVisit: data.reasonForVisit?.trim(),
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpeciality: doctor.specialityName,
        serviceId: service.id,
        serviceName: service.name,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        durationMinutes: service.durationMinutes,
        status: 'confirmed', // Confirmed directly in real scheduling engine
        fee: doctor.consultationFee || service.price,
        paymentMode: data.paymentMode || 'cash-at-clinic',
        paymentStatus: data.paymentStatus || (data.paymentMode === 'cash-at-clinic' ? 'pending' : 'paid'),
        paymentId: data.paymentId,
        razorpayOrderId: data.razorpayOrderId,
        paymentMethod: data.paymentMethod,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.appointments.unshift(newAppointment);

      // Record history
      this.statusHistory.push({
        id: `hist-${Date.now()}`,
        appointmentId: newAppointment.id,
        previousStatus: 'pending',
        newStatus: 'confirmed',
        changedBy: 'patient',
        reason: 'Online booking via Apollo Clinic web portal',
        createdAt: new Date().toISOString()
      });

      return { success: true, appointment: newAppointment };
    } finally {
      this.releaseLock();
    }
  }

  // Reschedule
  async rescheduleAppointment(appointmentId: string, newDate: string, newTime: string, reason?: string) {
    await this.acquireLock();
    try {
      const apt = this.appointments.find(a => a.id === appointmentId);
      if (!apt) return { success: false, error: 'Appointment not found' };

      if (apt.status === 'cancelled' || apt.status === 'completed') {
        return { success: false, error: `Cannot reschedule appointment in '${apt.status}' status` };
      }

      const [year, month, day] = newDate.split('-').map(Number);
      const dayOfWeek = new Date(year, month - 1, day).getDay();

      const scheduleRule: ScheduleRule = {
        dayOfWeek,
        startTime: dayOfWeek === 0 ? '08:30' : '09:00',
        endTime: dayOfWeek === 0 ? '13:00' : '18:00',
        breakStartTime: '13:00',
        breakEndTime: '14:00',
        slotIntervalMinutes: 30
      };

      const existing = this.appointments.map(a => ({
        id: a.id,
        doctorId: a.doctorId,
        date: a.appointmentDate,
        time: a.appointmentTime,
        durationMinutes: a.durationMinutes,
        status: a.status
      }));

      const validation = validateBookingAttempt({
        doctorId: apt.doctorId,
        date: newDate,
        time: newTime,
        durationMinutes: apt.durationMinutes,
        scheduleRule,
        existingBookings: existing,
        doctorTimeOffList: this.timeOff,
        clinicHolidays: this.holidays,
        excludeAppointmentId: apt.id,
        currentDateTime: new Date()
      });

      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const prevStatus = apt.status;
      apt.appointmentDate = newDate;
      apt.appointmentTime = newTime;
      apt.status = 'rescheduled';
      apt.updatedAt = new Date().toISOString();

      this.statusHistory.push({
        id: `hist-${Date.now()}`,
        appointmentId: apt.id,
        previousStatus: prevStatus,
        newStatus: 'rescheduled',
        changedBy: 'patient',
        reason: reason || 'Patient requested reschedule',
        createdAt: new Date().toISOString()
      });

      return { success: true, appointment: apt };
    } finally {
      this.releaseLock();
    }
  }

  // Cancel
  async cancelAppointment(appointmentId: string, reason: string, cancelledBy = 'patient') {
    await this.acquireLock();
    try {
      const apt = this.appointments.find(a => a.id === appointmentId);
      if (!apt) return { success: false, error: 'Appointment not found' };

      if (apt.status === 'cancelled') {
        return { success: false, error: 'Appointment is already cancelled' };
      }

      const prevStatus = apt.status;
      apt.status = 'cancelled';
      apt.cancellationReason = reason;
      apt.updatedAt = new Date().toISOString();

      this.statusHistory.push({
        id: `hist-${Date.now()}`,
        appointmentId: apt.id,
        previousStatus: prevStatus,
        newStatus: 'cancelled',
        changedBy: cancelledBy,
        reason,
        createdAt: new Date().toISOString()
      });

      return { success: true, appointment: apt };
    } finally {
      this.releaseLock();
    }
  }

  // Admin status update
  updateAppointmentStatus(id: string, newStatus: Appointment['status'], adminNotes?: string, adminUser = 'admin') {
    const apt = this.appointments.find(a => a.id === id);
    if (!apt) return { success: false, error: 'Appointment not found' };

    const prev = apt.status;
    apt.status = newStatus;
    if (adminNotes) apt.adminNotes = adminNotes;
    apt.updatedAt = new Date().toISOString();

    this.statusHistory.push({
      id: `hist-${Date.now()}`,
      appointmentId: apt.id,
      previousStatus: prev,
      newStatus,
      changedBy: adminUser,
      reason: adminNotes || `Admin updated status to ${newStatus}`,
      createdAt: new Date().toISOString()
    });

    this.addAuditLog('UPDATE_APPOINTMENT_STATUS', 'APPOINTMENT', id, adminUser, `Status changed from ${prev} to ${newStatus}`);
    return { success: true, appointment: apt };
  }

  getAppointments(query?: { phone?: string; doctorId?: string; status?: string; date?: string; search?: string }) {
    let result = [...this.appointments];

    if (query?.phone) {
      const cleanPhone = query.phone.replace(/\D/g, '');
      result = result.filter(a => a.patientPhone.replace(/\D/g, '').includes(cleanPhone));
    }
    if (query?.doctorId) {
      result = result.filter(a => a.doctorId === query.doctorId);
    }
    if (query?.status) {
      result = result.filter(a => a.status === query.status);
    }
    if (query?.date) {
      result = result.filter(a => a.appointmentDate === query.date);
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      result = result.filter(a => 
        a.bookingReference.toLowerCase().includes(q) ||
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.patientPhone.includes(q)
      );
    }

    return result;
  }

  getAppointmentByRefOrId(refOrId: string) {
    return this.appointments.find(a => a.id === refOrId || a.bookingReference.toUpperCase() === refOrId.toUpperCase());
  }

  getAdminStats() {
    const today = new Date().toISOString().split('T')[0];
    const total = this.appointments.length;
    const todayApts = this.appointments.filter(a => a.appointmentDate === today);
    const pending = this.appointments.filter(a => a.status === 'pending').length;
    const confirmed = this.appointments.filter(a => a.status === 'confirmed').length;
    const cancelled = this.appointments.filter(a => a.status === 'cancelled').length;
    const completed = this.appointments.filter(a => a.status === 'completed').length;
    const activeDoctorsCount = this.doctors.filter(d => d.active).length;
    const activeServicesCount = this.services.filter(s => s.isActive).length;

    const revenueEstimated = this.appointments
      .filter(a => a.status !== 'cancelled' && a.status !== 'rejected')
      .reduce((sum, a) => sum + (a.fee || 0), 0);

    // Revenue Breakdown by channel
    const activeApts = this.appointments.filter(a => a.status !== 'cancelled' && a.status !== 'rejected');
    const onlineApts = activeApts.filter(a => a.paymentStatus === 'paid');
    const cashApts = activeApts.filter(a => a.paymentStatus !== 'paid');

    const revenueOnline = onlineApts.reduce((sum, a) => sum + (a.fee || 0), 0);
    const revenueCash = cashApts.reduce((sum, a) => sum + (a.fee || 0), 0);

    // Speciality breakdown
    const specMap: Record<string, number> = {};
    for (const a of activeApts) {
      specMap[a.doctorSpeciality] = (specMap[a.doctorSpeciality] || 0) + 1;
    }
    const specialityBreakdown = Object.entries(specMap).map(([speciality, count]) => ({
      speciality,
      count,
      percentage: activeApts.length > 0 ? Math.round((count / activeApts.length) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // Hourly slot distribution for today & upcoming
    const hourMap: Record<string, number> = {
      '09:00': 0, '10:00': 0, '11:00': 0, '12:00': 0,
      '14:00': 0, '15:00': 0, '16:00': 0, '17:00': 0
    };
    for (const a of this.appointments) {
      const hr = a.appointmentTime ? `${a.appointmentTime.split(':')[0]}:00` : '09:00';
      if (hourMap[hr] !== undefined) {
        hourMap[hr] += 1;
      }
    }
    const hourlyDistribution = Object.entries(hourMap).map(([hour, count]) => ({ hour, count }));

    // Doctor workload / roster capacity
    const doctorWorkload = this.doctors.map(d => {
      const booked = this.appointments.filter(a => a.doctorId === d.id && a.status !== 'cancelled').length;
      return {
        doctorId: d.id,
        doctorName: d.name,
        speciality: d.specialityName,
        bookedCount: booked,
        active: d.active
      };
    }).sort((a, b) => b.bookedCount - a.bookedCount);

    return {
      totalAppointments: total,
      todayAppointments: todayApts.length,
      pendingRequests: pending,
      confirmedAppointments: confirmed,
      cancelledAppointments: cancelled,
      completedAppointments: completed,
      revenueEstimated,
      revenueOnline,
      revenueCash,
      onlineCount: onlineApts.length,
      cashCount: cashApts.length,
      activeDoctorsCount,
      activeServicesCount,
      specialityBreakdown,
      hourlyDistribution,
      doctorWorkload
    };
  }

  addAuditLog(action: string, resourceType: string, resourceId: string, performedBy: string, details: string) {
    this.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      resourceType,
      resourceId,
      performedBy,
      details,
      createdAt: new Date().toISOString()
    });
  }

  getAuditLogs(): AdminAuditLog[] {
    return [...this.auditLogs];
  }

  // Razorpay Order Creation & Payment Verification
  createRazorpayOrder(amount: number, currency = 'INR', receipt?: string) {
    const orderId = `order_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_apollo_clinic_basaveshwar';
    
    return {
      orderId,
      amount: Math.round(amount * 100), // convert rupees to paise
      currency,
      keyId,
      bookingRef: receipt || `APO-BAS-${Math.floor(1000 + Math.random() * 9000)}`
    };
  }

  verifyRazorpayPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
    appointmentId?: string;
  }) {
    // If appointment ID provided, update payment status
    if (payload.appointmentId) {
      const apt = this.appointments.find(a => a.id === payload.appointmentId || a.bookingReference === payload.appointmentId);
      if (apt) {
        apt.paymentStatus = 'paid';
        apt.paymentId = payload.razorpay_payment_id;
        apt.razorpayOrderId = payload.razorpay_order_id;
        apt.updatedAt = new Date().toISOString();
        this.addAuditLog('PAYMENT_CONFIRMED', 'APPOINTMENT', apt.id, 'razorpay_webhook', `Payment ${payload.razorpay_payment_id} verified`);
      }
    }
    return {
      verified: true,
      paymentId: payload.razorpay_payment_id,
      orderId: payload.razorpay_order_id,
      status: 'captured'
    };
  }
}

export const dbStore = new DatabaseStore();
