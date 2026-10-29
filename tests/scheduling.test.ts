import test from 'node:test';
import assert from 'node:assert/strict';
import {
  timeToMinutes,
  minutesToTime,
  doIntervalsOverlap,
  calculateDoctorAvailability,
  validateBookingAttempt,
  ScheduleRule,
  ExistingBooking
} from '../src/utils/schedulingEngine';

test('time conversions work correctly', () => {
  assert.equal(timeToMinutes('00:00'), 0);
  assert.equal(timeToMinutes('09:30'), 570);
  assert.equal(timeToMinutes('17:45'), 1065);
  assert.equal(minutesToTime(570), '09:30');
  assert.equal(minutesToTime(1065), '17:45');
});

test('interval overlap detection functions accurately', () => {
  // Overlapping intervals: 10:00 (600) + 30 vs 10:15 (615) + 30
  assert.equal(doIntervalsOverlap(600, 30, 615, 30), true);
  // Identical intervals: 10:00 + 30 vs 10:00 + 30
  assert.equal(doIntervalsOverlap(600, 30, 600, 30), true);
  // Back-to-back intervals: 10:00 + 30 (ends 10:30) vs 10:30 + 30 (does not overlap)
  assert.equal(doIntervalsOverlap(600, 30, 630, 30), false);
  // Disjoint intervals
  assert.equal(doIntervalsOverlap(600, 30, 700, 30), false);
});

test('calculateDoctorAvailability respects work hours, lunch breaks and bookings', () => {
  // Monday 2026-11-02 (day of week 1)
  const schedule: ScheduleRule = {
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '12:00',
    breakStartTime: '10:30',
    breakEndTime: '11:00',
    slotIntervalMinutes: 30
  };

  const existingBookings: ExistingBooking[] = [
    {
      id: 'b1',
      doctorId: 'doc-1',
      date: '2026-11-02',
      time: '09:30',
      durationMinutes: 30,
      status: 'confirmed'
    },
    {
      id: 'b2',
      doctorId: 'doc-1',
      date: '2026-11-02',
      time: '11:00',
      durationMinutes: 30,
      status: 'cancelled' // cancelled should NOT block slot!
    }
  ];

  // Frozen future time relative to slot
  const testTime = new Date('2026-11-01T08:00:00Z');

  const result = calculateDoctorAvailability({
    date: '2026-11-02',
    doctorId: 'doc-1',
    serviceDuration: 30,
    scheduleRule: schedule,
    existingBookings,
    currentDateTime: testTime
  });

  assert.equal(result.isAvailable, true);
  const slotMap = new Map(result.slots.map(s => [s.time, s]));

  // 09:00 should be available
  assert.equal(slotMap.get('09:00')?.available, true);
  // 09:30 should be unavailable (booked)
  assert.equal(slotMap.get('09:30')?.available, false);
  assert.match(slotMap.get('09:30')?.reason || '', /reserved/i);
  // 10:00 should be available
  assert.equal(slotMap.get('10:00')?.available, true);
  // 10:30 should be unavailable (lunch break)
  assert.equal(slotMap.get('10:30')?.available, false);
  assert.match(slotMap.get('10:30')?.reason || '', /break/i);
  // 11:00 was cancelled, so it should be available
  assert.equal(slotMap.get('11:00')?.available, true);
  // 11:30 should be available
  assert.equal(slotMap.get('11:30')?.available, true);
});

test('calculateDoctorAvailability blocks on clinic holiday and doctor leave', () => {
  const schedule: ScheduleRule = {
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '12:00',
    slotIntervalMinutes: 30
  };

  // Holiday test
  const holidayResult = calculateDoctorAvailability({
    date: '2026-11-02',
    doctorId: 'doc-1',
    serviceDuration: 30,
    scheduleRule: schedule,
    existingBookings: [],
    clinicHolidays: [{ date: '2026-11-02', name: 'Diwali Festival' }],
    currentDateTime: new Date('2026-11-01T08:00:00Z')
  });

  assert.equal(holidayResult.isAvailable, false);
  assert.match(holidayResult.reason || '', /Diwali Festival/);

  // Doctor leave test
  const leaveResult = calculateDoctorAvailability({
    date: '2026-11-02',
    doctorId: 'doc-1',
    serviceDuration: 30,
    scheduleRule: schedule,
    existingBookings: [],
    doctorTimeOffList: [{ doctorId: 'doc-1', startDate: '2026-11-01', endDate: '2026-11-05' }],
    currentDateTime: new Date('2026-11-01T08:00:00Z')
  });

  assert.equal(leaveResult.isAvailable, false);
  assert.match(leaveResult.reason || '', /scheduled leave/i);
});

test('validateBookingAttempt detects collision and rejects double-booking', () => {
  const schedule: ScheduleRule = {
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    slotIntervalMinutes: 30
  };

  const existingBookings: ExistingBooking[] = [
    {
      id: 'existing-1',
      doctorId: 'doc-1',
      date: '2026-11-02',
      time: '10:00',
      durationMinutes: 30,
      status: 'confirmed'
    }
  ];

  // Try to book exactly the same slot: should fail
  const attemptConflict = validateBookingAttempt({
    doctorId: 'doc-1',
    date: '2026-11-02',
    time: '10:00',
    durationMinutes: 30,
    scheduleRule: schedule,
    existingBookings,
    currentDateTime: new Date('2026-11-01T08:00:00Z')
  });
  assert.equal(attemptConflict.valid, false);
  assert.match(attemptConflict.error || '', /reserved/i);

  // Try to book non-conflicting slot: should succeed
  const attemptSuccess = validateBookingAttempt({
    doctorId: 'doc-1',
    date: '2026-11-02',
    time: '10:30',
    durationMinutes: 30,
    scheduleRule: schedule,
    existingBookings,
    currentDateTime: new Date('2026-11-01T08:00:00Z')
  });
  assert.equal(attemptSuccess.valid, true);

  // Rescheduling own appointment to same time slot should exclude self and pass
  const rescheduleSelf = validateBookingAttempt({
    doctorId: 'doc-1',
    date: '2026-11-02',
    time: '10:00',
    durationMinutes: 30,
    scheduleRule: schedule,
    existingBookings,
    excludeAppointmentId: 'existing-1',
    currentDateTime: new Date('2026-11-01T08:00:00Z')
  });
  assert.equal(rescheduleSelf.valid, true);
});
