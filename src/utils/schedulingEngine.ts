/**
 * Appointment Scheduling Engine
 * Real schedule calculations, conflict prevention, slot intervals, and validation.
 */

export interface ScheduleRule {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  breakStartTime?: string; // "13:00"
  breakEndTime?: string;   // "14:00"
  slotIntervalMinutes: number; // default 30
}

export interface ExistingBooking {
  id: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  status: string; // 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'rejected' | 'completed'
}

export interface DoctorTimeOff {
  doctorId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason?: string;
}

export interface ClinicHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}

/**
 * Converts HH:MM string to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts minutes since midnight to HH:MM string
 */
export function minutesToTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Checks if two time windows overlap [start1, start1 + dur1) and [start2, start2 + dur2)
 */
export function doIntervalsOverlap(
  start1: number,
  dur1: number,
  start2: number,
  dur2: number
): boolean {
  const end1 = start1 + dur1;
  const end2 = start2 + dur2;
  return Math.max(start1, start2) < Math.min(end1, end2);
}

/**
 * Checks if a given date string is in the past compared to reference date
 */
export function isDateInPast(dateStr: string, todayStr: string): boolean {
  return dateStr < todayStr;
}

/**
 * Checks if a given time slot on today's date is already past
 */
export function isSlotInPast(dateStr: string, timeStr: string, currentDateTime: Date): boolean {
  const [slotHours, slotMinutes] = timeStr.split(':').map(Number);
  const [year, month, day] = dateStr.split('-').map(Number);

  const slotDate = new Date(year, month - 1, day, slotHours, slotMinutes, 0);
  return slotDate.getTime() <= currentDateTime.getTime();
}

/**
 * Generates all candidate slots for a doctor on a specific date and checks their availability
 */
export function calculateDoctorAvailability(params: {
  date: string; // YYYY-MM-DD
  doctorId: string;
  serviceDuration: number;
  scheduleRule?: ScheduleRule;
  existingBookings: ExistingBooking[];
  doctorTimeOffList?: DoctorTimeOff[];
  clinicHolidays?: ClinicHoliday[];
  currentDateTime?: Date;
}): {
  isAvailable: boolean;
  reason?: string;
  slots: { time: string; available: boolean; reason?: string }[];
} {
  const {
    date,
    doctorId,
    serviceDuration,
    scheduleRule,
    existingBookings,
    doctorTimeOffList = [],
    clinicHolidays = [],
    currentDateTime = new Date()
  } = params;

  // 1. Check clinic holiday
  const holiday = clinicHolidays.find(h => h.date === date);
  if (holiday) {
    return {
      isAvailable: false,
      reason: `Clinic closed for ${holiday.name}`,
      slots: []
    };
  }

  // 2. Check doctor time off
  const isOnLeave = doctorTimeOffList.some(off => 
    off.doctorId === doctorId && date >= off.startDate && date <= off.endDate
  );
  if (isOnLeave) {
    return {
      isAvailable: false,
      reason: 'Doctor is on scheduled leave',
      slots: []
    };
  }

  // 3. Verify schedule for day of week
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  if (!scheduleRule || scheduleRule.dayOfWeek !== dayOfWeek) {
    return {
      isAvailable: false,
      reason: 'Doctor does not consult on this day of the week',
      slots: []
    };
  }

  const workStartMin = timeToMinutes(scheduleRule.startTime);
  const workEndMin = timeToMinutes(scheduleRule.endTime);
  const slotInterval = scheduleRule.slotIntervalMinutes || 30;
  const breakStartMin = scheduleRule.breakStartTime ? timeToMinutes(scheduleRule.breakStartTime) : -1;
  const breakEndMin = scheduleRule.breakEndTime ? timeToMinutes(scheduleRule.breakEndTime) : -1;

  // Active bookings on this day for this doctor (excluding cancelled/rejected)
  const activeBookings = existingBookings.filter(b => 
    b.doctorId === doctorId && 
    b.date === date && 
    b.status !== 'cancelled' && 
    b.status !== 'rejected'
  );

  const slots: { time: string; available: boolean; reason?: string }[] = [];
  const duration = Math.max(serviceDuration, slotInterval);

  for (let currentMin = workStartMin; currentMin + duration <= workEndMin; currentMin += slotInterval) {
    const timeStr = minutesToTime(currentMin);

    // Check break time
    if (breakStartMin !== -1 && breakEndMin !== -1) {
      if (doIntervalsOverlap(currentMin, duration, breakStartMin, breakEndMin - breakStartMin)) {
        slots.push({ time: timeStr, available: false, reason: 'Doctor lunch / rest break' });
        continue;
      }
    }

    // Check past time
    if (isSlotInPast(date, timeStr, currentDateTime)) {
      slots.push({ time: timeStr, available: false, reason: 'Time has passed' });
      continue;
    }

    // Check collision with existing active bookings
    const collision = activeBookings.find(b => {
      const bStart = timeToMinutes(b.time);
      const bDur = b.durationMinutes || slotInterval;
      return doIntervalsOverlap(currentMin, duration, bStart, bDur);
    });

    if (collision) {
      slots.push({ time: timeStr, available: false, reason: 'Reserved by another patient' });
    } else {
      slots.push({ time: timeStr, available: true });
    }
  }

  const hasAnyAvailable = slots.some(s => s.available);

  return {
    isAvailable: hasAnyAvailable,
    reason: hasAnyAvailable ? undefined : 'No available slots remaining for this date',
    slots
  };
}

/**
 * Validates whether an appointment slot can be booked or if there is a conflict
 */
export function validateBookingAttempt(params: {
  doctorId: string;
  date: string;
  time: string;
  durationMinutes: number;
  scheduleRule?: ScheduleRule;
  existingBookings: ExistingBooking[];
  doctorTimeOffList?: DoctorTimeOff[];
  clinicHolidays?: ClinicHoliday[];
  currentDateTime?: Date;
  excludeAppointmentId?: string; // used when rescheduling
  bypassPastCheck?: boolean; // used for clinic front desk walk-ins
}): { valid: boolean; error?: string } {
  const {
    doctorId,
    date,
    time,
    durationMinutes,
    scheduleRule,
    existingBookings,
    doctorTimeOffList = [],
    clinicHolidays = [],
    currentDateTime = new Date(),
    excludeAppointmentId,
    bypassPastCheck = false
  } = params;

  // 1. Holiday check
  if (clinicHolidays.some(h => h.date === date)) {
    return { valid: false, error: 'The clinic is closed on the selected date for a holiday.' };
  }

  // 2. Doctor leave check
  if (doctorTimeOffList.some(off => off.doctorId === doctorId && date >= off.startDate && date <= off.endDate)) {
    return { valid: false, error: 'The doctor is on leave on the selected date.' };
  }

  // 3. Past check
  if (!bypassPastCheck && isSlotInPast(date, time, currentDateTime)) {
    return { valid: false, error: 'Cannot book an appointment for a past date or time.' };
  }

  // 4. Schedule bounds check
  if (!scheduleRule) {
    return { valid: false, error: 'Doctor has no scheduled consulting hours on this day.' };
  }

  const slotStart = timeToMinutes(time);
  const workStart = timeToMinutes(scheduleRule.startTime);
  const workEnd = timeToMinutes(scheduleRule.endTime);

  if (slotStart < workStart || slotStart + durationMinutes > workEnd) {
    return { valid: false, error: 'Selected time is outside doctor consulting hours.' };
  }

  // 5. Break check
  if (scheduleRule.breakStartTime && scheduleRule.breakEndTime) {
    const bStart = timeToMinutes(scheduleRule.breakStartTime);
    const bEnd = timeToMinutes(scheduleRule.breakEndTime);
    if (doIntervalsOverlap(slotStart, durationMinutes, bStart, bEnd - bStart)) {
      return { valid: false, error: 'Selected time coincides with doctor clinic break.' };
    }
  }

  // 6. Concurrency / overlap check
  const activeBookings = existingBookings.filter(b => 
    b.id !== excludeAppointmentId &&
    b.doctorId === doctorId && 
    b.date === date && 
    b.status !== 'cancelled' && 
    b.status !== 'rejected'
  );

  const conflict = activeBookings.find(b => {
    const bStart = timeToMinutes(b.time);
    const bDur = b.durationMinutes || 30;
    return doIntervalsOverlap(slotStart, durationMinutes, bStart, bDur);
  });

  if (conflict) {
    return { valid: false, error: 'This appointment slot has just been reserved by another patient. Please select another time.' };
  }

  return { valid: true };
}
